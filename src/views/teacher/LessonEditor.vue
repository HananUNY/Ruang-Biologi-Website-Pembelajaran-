<script setup>
import { ref, onMounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import draggable from 'vuedraggable'
import { getLessonDetails, saveLessonBlocks } from '../../services/builder.service'
import { uploadMediaFile, getPublicUrl } from '../../services/media.service'
import { user } from '../../services/auth.service'

const route = useRoute()
const router = useRouter()
const courseId = route.params.id
const lessonId = route.params.lessonId

const lesson = ref(null)
const blocks = ref([])
const loading = ref(true)
const saving = ref(false)

// UI State
const showAddMenu = ref(false)
const addMenuIndex = ref(-1)

const isPreview = ref(false)

// Quiz Preview State
const quizState = ref({
  answers: [],
  submitted: false,
  score: 0
})

watch(isPreview, (newVal) => {
  if (newVal && lesson.value?.type === 'quiz') {
    const questionsCount = blocks.value[0]?.content?.questions?.length || 0
    quizState.value = {
      answers: new Array(questionsCount).fill(null),
      submitted: false,
      score: 0
    }
  }
})

const submitQuiz = () => {
  const questions = blocks.value[0].content.questions
  let correct = 0
  questions.forEach((q, idx) => {
    if (quizState.value.answers[idx] === q.answer) {
      correct++
    }
  })
  quizState.value.score = Math.round((correct / questions.length) * 100)
  quizState.value.submitted = true
}

// Init fetch
const fetchLesson = async () => {
  loading.value = true
  try {
    lesson.value = await getLessonDetails(lessonId)
    blocks.value = lesson.value.lesson_blocks.map(b => ({
      ...b,
      _uid: Math.random().toString(36).substr(2, 9),
      content: b.content || { text: '', url: '', questions: [] }
    }))
    
    if (blocks.value.length === 0) {
      if (lesson.value.type === 'lab') {
        blocks.value.push({ _uid: 'init', type: 'experiment', content: { text: '' } })
      } else if (lesson.value.type === 'quiz') {
        blocks.value.push({ _uid: 'init', type: 'quiz', content: { questions: [] } })
      } else {
        addBlock('text', 0)
      }
    }
  } catch (error) {
    console.error('Error fetching lesson:', error)
    alert('Gagal memuat materi: ' + error.message)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLesson()
})

const saveContent = async () => {
  saving.value = true
  try {
    await saveLessonBlocks(lessonId, blocks.value)
    // Notifikasi berhasil (opsional)
    const btn = document.getElementById('saveBtn')
    const originalText = btn.innerHTML
    btn.innerHTML = '<span class="material-symbols-outlined text-[20px]">check</span> Tersimpan'
    setTimeout(() => { btn.innerHTML = originalText }, 2000)
  } catch (error) {
    alert('Gagal menyimpan: ' + error.message)
  } finally {
    saving.value = false
  }
}

const isUploadingLkpd = ref(false)
const handleLkpdUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  const allowedTypes = [
    'application/pdf', 
    'application/msword', 
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
  if (!allowedTypes.includes(file.type)) {
    alert('Hanya file PDF atau Word (.doc, .docx) yang diperbolehkan.')
    return
  }

  isUploadingLkpd.value = true
  try {
    const uploaded = await uploadMediaFile(file, user.value.id)
    const publicUrl = getPublicUrl(uploaded.storage_path)
    if (blocks.value.length > 0) {
      blocks.value[0].content.url = publicUrl
    }
  } catch (error) {
    console.error('LKPD Upload Error:', error)
    alert('Gagal mengupload file LKPD.')
  } finally {
    isUploadingLkpd.value = false
    event.target.value = ''
  }
}

const addBlock = (type, index) => {
  const newBlock = {
    _uid: Math.random().toString(36).substr(2, 9),
    type: type,
    content: type === 'table' ? { text: '', tableData: [['', ''], ['', '']] } : { text: '', url: '' }
  }
  
  if (index === -1) {
    blocks.value.push(newBlock)
  } else {
    blocks.value.splice(index + 1, 0, newBlock)
  }
  
  showAddMenu.value = false
  
  // Focus logic (basic implementation)
  if (type === 'text' || type === 'heading') {
    nextTick(() => {
      const inputs = document.querySelectorAll('.block-input')
      if (inputs[index + 1]) {
        inputs[index + 1].focus()
      }
    })
  }
}

const removeBlock = (index) => {
  blocks.value.splice(index, 1)
  if (blocks.value.length === 0) {
    addBlock('text', -1) // Selalu sisakan minimal 1 blok
  }
}

const execCmd = (command, value = null) => {
  document.execCommand(command, false, value)
}

const handleKeydown = (e, index, type) => {
  // Enter creates a new text block below
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    addBlock('text', index)
  }
  // Backspace on empty block deletes it
  if (e.key === 'Backspace' && blocks.value[index].content.text === '') {
    e.preventDefault()
    removeBlock(index)
    // Focus previous block
    nextTick(() => {
      const inputs = document.querySelectorAll('.block-input')
      if (inputs[index - 1]) {
        inputs[index - 1].focus()
      }
    })
  }
}

const handleHtmlUpload = (event, block) => {
  const file = event.target.files[0]
  if (!file) return
  
  const reader = new FileReader()
  reader.onload = (e) => {
    block.content.text = e.target.result
  }
  reader.readAsText(file)
}

const toggleFullscreen = (e) => {
  const container = e.currentTarget.closest('.embed-container')
  if (!document.fullscreenElement) {
    container.requestFullscreen().catch(err => {
      console.error(`Error attempting to enable fullscreen mode: ${err.message}`)
    })
  } else {
    document.exitFullscreen()
  }
}

// Quiz Helpers
const addQuizQuestion = () => {
  const quizBlock = blocks.value[0]
  if (!quizBlock.content.questions) quizBlock.content.questions = []
  quizBlock.content.questions.push({
    text: '',
    options: ['', '', '', ''],
    answer: 0
  })
}

const removeQuizQuestion = (index) => {
  blocks.value[0].content.questions.splice(index, 1)
}

const adjustHeight = (e) => {
  const el = e.target
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}
</script>

<template>
  <div class="fixed inset-0 z-50 bg-surface flex flex-col">
    <!-- Navbar -->
    <header class="h-16 border-b border-outline-variant/30 flex items-center justify-between px-6 bg-surface-container-lowest shrink-0">
      <div class="flex items-center gap-4">
        <router-link :to="`/teacher/courses/${courseId}`" class="w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center transition-colors text-on-surface">
          <span class="material-symbols-outlined">arrow_back</span>
        </router-link>
        <div>
          <p class="text-xs text-on-surface-variant font-bold uppercase tracking-wider">Lesson Editor</p>
          <h1 class="font-headline-sm text-sm font-bold text-on-surface line-clamp-1" v-if="lesson">{{ lesson.title }}</h1>
        </div>
      </div>
      
      <div class="flex items-center gap-3">
        <!-- Preview Toggle -->
        <button @click="isPreview = !isPreview" class="flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all"
          :class="isPreview ? 'bg-secondary-container text-on-secondary-container' : 'bg-surface-container-low text-on-surface hover:bg-surface-container'">
          <span class="material-symbols-outlined text-[20px]">{{ isPreview ? 'visibility_off' : 'visibility' }}</span>
          {{ isPreview ? 'Tutup Preview' : 'Preview' }}
        </button>
        
        <span v-if="saving" class="text-sm font-semibold text-on-surface-variant animate-pulse mr-2">Menyimpan...</span>
        <button v-if="!isPreview" id="saveBtn" @click="saveContent" class="bg-primary text-on-primary px-5 py-2 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center gap-2 shadow-sm">
          Simpan Draft
        </button>
      </div>
    </header>

    <!-- Editor Canvas -->
    <main class="flex-1 overflow-y-auto bg-surface pb-64">
      <div v-if="loading" class="py-24 flex justify-center">
        <span class="material-symbols-outlined text-[48px] text-primary animate-spin">progress_activity</span>
      </div>

      <div v-else class="max-w-3xl mx-auto pt-16 px-4 sm:px-8">
        <!-- Document Title -->
        <h1 class="text-4xl sm:text-5xl font-extrabold text-on-surface mb-12 font-headline-md tracking-tight outline-none" 
            :contenteditable="!isPreview" 
            @blur="lesson.title = $event.target.innerText"
            v-text="lesson.title">
        </h1>

        <!-- EDITOR CONDITIONALS BASED ON LESSON TYPE -->

        <!-- 1. LAB VIRTUAL EDITOR -->
        <div v-if="lesson.type === 'lab'" class="mt-8">
          <div class="border border-outline-variant/50 rounded-2xl p-6 bg-surface-container-lowest flex flex-col gap-4">
            <div class="flex items-center justify-between">
              <div>
                <h2 class="font-bold text-on-surface text-lg">Konfigurasi Lab Virtual</h2>
                <p class="text-sm text-on-surface-variant">Paste kode HTML simulasi atau upload file HTML Anda di sini.</p>
              </div>
              <label class="cursor-pointer bg-tertiary/10 text-tertiary hover:bg-tertiary/20 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px]">upload_file</span>
                Upload File .HTML
                <input type="file" accept=".html" class="hidden" @change="handleHtmlUpload($event, blocks[0])" />
              </label>
            </div>
            
            <textarea
              v-model="blocks[0].content.text"
              @input="adjustHeight"
              class="w-full resize-none outline-none bg-surface-container-lowest text-sm text-on-surface-variant font-mono p-4 rounded-xl border border-outline-variant/50 focus:border-tertiary/50 transition-colors min-h-[200px]"
              placeholder="<!-- Paste kode HTML Anda di sini atau link eksternal -->"
            ></textarea>
            
            <div v-if="blocks[0].content.text" class="mt-4 pt-6 border-t border-outline-variant/30">
              <p class="text-sm font-bold text-on-surface mb-4">Preview Simulasi Lab:</p>
              <div class="embed-container relative bg-white rounded-2xl overflow-hidden border border-outline-variant/30 group/embed">
                <iframe v-if="blocks[0].content.text.trim().startsWith('http')" class="w-full min-h-[70vh] border-0" :src="blocks[0].content.text.trim()" allowfullscreen></iframe>
                <iframe v-else class="w-full min-h-[70vh] border-0" :srcdoc="blocks[0].content.text" allowfullscreen></iframe>
                <button @click="toggleFullscreen" class="absolute top-4 right-4 bg-black/60 text-white w-12 h-12 flex items-center justify-center rounded-xl opacity-0 group-hover/embed:opacity-100 transition-opacity backdrop-blur hover:bg-black/80 shadow-lg" title="Fullscreen">
                  <span class="material-symbols-outlined">fullscreen</span>
                </button>
              </div>
            </div>

            <div class="mt-4 pt-6 border-t border-outline-variant/30">
              <div class="flex items-center justify-between mb-4">
                <div>
                  <h3 class="font-bold text-on-surface text-md">Lembar Kerja Peserta Didik (LKPD)</h3>
                  <p class="text-sm text-on-surface-variant">Tautkan atau upload file LKPD untuk lab virtual ini.</p>
                </div>
                <label class="cursor-pointer bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2" :class="{'opacity-50 pointer-events-none': isUploadingLkpd}">
                  <span v-if="isUploadingLkpd" class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                  <span v-else class="material-symbols-outlined text-[18px]">upload_file</span>
                  {{ isUploadingLkpd ? 'Mengupload...' : 'Upload File (PDF/Word)' }}
                  <input type="file" accept=".pdf,.doc,.docx" class="hidden" @change="handleLkpdUpload" :disabled="isUploadingLkpd" />
                </label>
              </div>
              <input 
                v-model="blocks[0].content.url" 
                type="url" 
                class="w-full px-4 py-3 rounded-xl border border-outline-variant/50 bg-surface-container-lowest focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-on-surface text-sm" 
                placeholder="https://link-ke-file-lkpd-anda.com/... atau hasil upload file" 
              />
            </div>
          </div>
        </div>

        <!-- 2. QUIZ EDITOR -->
        <div v-else-if="lesson.type === 'quiz'" class="mt-8 flex flex-col gap-6">
          <template v-if="!isPreview">
            <div class="flex items-center justify-between mb-2">
              <h2 class="font-bold text-on-surface text-lg">Daftar Pertanyaan Quiz</h2>
              <button @click="addQuizQuestion" class="bg-secondary/10 text-secondary hover:bg-secondary/20 px-4 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px]">add</span>
                Tambah Pertanyaan
              </button>
            </div>

            <div v-if="blocks[0] && blocks[0].content.questions && blocks[0].content.questions.length === 0" class="text-center py-12 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/50">
              <span class="material-symbols-outlined text-[48px] text-outline-variant mb-4">quiz</span>
              <p class="text-on-surface-variant font-medium">Belum ada pertanyaan quiz.</p>
            </div>

            <div v-for="(question, qIndex) in blocks[0].content.questions" :key="qIndex" class="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 relative group">
              <div class="flex items-start justify-between gap-4 mb-4">
                <div class="flex-1">
                  <label class="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2 block">Pertanyaan {{ qIndex + 1 }}</label>
                  <textarea
                    v-model="question.text"
                    @input="adjustHeight"
                    class="w-full resize-none outline-none bg-surface p-4 rounded-xl border border-outline-variant/50 focus:border-secondary/50 transition-colors text-on-surface"
                    placeholder="Ketik pertanyaan di sini..."
                    rows="2"
                  ></textarea>
                </div>
                <button @click="removeQuizQuestion(qIndex)" class="w-8 h-8 rounded-full bg-error/10 text-error flex items-center justify-center hover:bg-error/20 transition-colors shrink-0 mt-6 opacity-0 group-hover:opacity-100">
                  <span class="material-symbols-outlined text-[18px]">delete</span>
                </button>
              </div>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4 pl-4 border-l-2 border-outline-variant/30">
                <div v-for="(opt, oIndex) in question.options" :key="oIndex" class="flex items-center gap-3 bg-surface p-2 rounded-xl border" :class="question.answer === oIndex ? 'border-success bg-success/5' : 'border-outline-variant/30'">
                  <input type="radio" :name="`q-${qIndex}`" :value="oIndex" v-model="question.answer" class="w-5 h-5 accent-success shrink-0" />
                  <input 
                    v-model="question.options[oIndex]" 
                    type="text" 
                    class="w-full bg-transparent outline-none text-sm text-on-surface"
                    :placeholder="`Opsi ${String.fromCharCode(65 + oIndex)}`"
                  />
                </div>
              </div>
            </div>
          </template>
          
          <template v-else>
            <div class="bg-surface-container-lowest rounded-3xl p-6 sm:p-8 border border-outline-variant/30 shadow-sm relative overflow-hidden">
              <!-- Header -->
              <div class="flex items-center gap-3 mb-8 pb-4 border-b border-outline-variant/30">
                <div class="w-10 h-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                  <span class="material-symbols-outlined text-[24px]">quiz</span>
                </div>
                <div>
                  <h2 class="font-bold text-xl text-on-surface">Quiz: {{ lesson.title }}</h2>
                  <p class="text-sm text-on-surface-variant">Jawablah pertanyaan-pertanyaan berikut dengan tepat.</p>
                </div>
              </div>

              <!-- Score Result Display -->
              <div v-if="quizState.submitted" class="mb-8 p-6 rounded-2xl flex flex-col items-center justify-center text-center animate-fade-in" :class="quizState.score >= 70 ? 'bg-success/10 border border-success/30' : 'bg-error/10 border border-error/30'">
                <p class="text-sm font-bold uppercase tracking-wider mb-2" :class="quizState.score >= 70 ? 'text-success' : 'text-error'">
                  {{ quizState.score >= 70 ? 'Selamat! Nilai Anda Bagus' : 'Jangan Menyerah, Coba Lagi' }}
                </p>
                <div class="text-5xl font-extrabold mb-2" :class="quizState.score >= 70 ? 'text-success' : 'text-error'">
                  {{ quizState.score }}<span class="text-2xl text-on-surface-variant">/100</span>
                </div>
              </div>

              <div v-if="blocks[0] && blocks[0].content.questions && blocks[0].content.questions.length === 0" class="text-center py-12">
                <p class="text-on-surface-variant font-medium">Belum ada pertanyaan quiz.</p>
              </div>

              <!-- Question List -->
              <div v-for="(question, qIndex) in blocks[0].content.questions" :key="'preview-'+qIndex" class="mb-8">
                <p class="font-semibold text-lg text-on-surface mb-4 leading-relaxed">
                  <span class="text-secondary mr-2">{{ qIndex + 1 }}.</span> {{ question.text }}
                </p>
                <div class="flex flex-col gap-3 pl-2 sm:pl-6 relative">
                  <!-- Feedback indicator for each question -->
                  <div v-if="quizState.submitted" class="absolute -left-2 top-0 bottom-0 flex flex-col justify-center">
                    <span v-if="quizState.answers[qIndex] === question.answer" class="material-symbols-outlined text-success">check_circle</span>
                    <span v-else class="material-symbols-outlined text-error">cancel</span>
                  </div>
                  
                  <label 
                    v-for="(opt, oIndex) in question.options" 
                    :key="'preview-opt-'+oIndex" 
                    class="flex items-center gap-3 p-4 border rounded-xl transition-all"
                    :class="[
                      quizState.submitted && oIndex === question.answer ? 'border-success bg-success/10 shadow-sm' : '',
                      quizState.submitted && quizState.answers[qIndex] === oIndex && oIndex !== question.answer ? 'border-error bg-error/10' : '',
                      !quizState.submitted ? 'border-outline-variant/40 bg-surface hover:border-secondary/50 hover:bg-secondary/5 cursor-pointer group' : (oIndex !== question.answer && quizState.answers[qIndex] !== oIndex ? 'border-outline-variant/20 bg-surface/50 opacity-60' : '')
                    ]"
                  >
                    <input 
                      type="radio" 
                      :name="`preview-q-${qIndex}`" 
                      :value="oIndex"
                      v-model="quizState.answers[qIndex]"
                      :disabled="quizState.submitted"
                      class="w-5 h-5 accent-secondary shrink-0" 
                    />
                    <span class="font-medium" :class="[
                      quizState.submitted && oIndex === question.answer ? 'text-success font-bold' : '',
                      quizState.submitted && quizState.answers[qIndex] === oIndex && oIndex !== question.answer ? 'text-error line-through' : '',
                      !quizState.submitted ? 'text-on-surface-variant group-hover:text-on-surface' : ''
                    ]">{{ opt }}</span>
                    
                    <!-- Correct Answer Indicator badge -->
                    <span v-if="quizState.submitted && oIndex === question.answer" class="ml-auto text-[10px] font-bold uppercase tracking-wider text-success bg-success/20 px-2 py-0.5 rounded">Jawaban Benar</span>
                  </label>
                </div>
              </div>

              <!-- Submit Button -->
              <button 
                v-if="!quizState.submitted && blocks[0] && blocks[0].content.questions && blocks[0].content.questions.length > 0"
                @click="submitQuiz"
                :disabled="quizState.answers.includes(null)"
                class="bg-secondary text-on-secondary px-8 py-3.5 rounded-xl font-bold w-full max-w-xs mx-auto block hover:bg-secondary/90 transition-colors mt-12 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Kirim Jawaban
              </button>
              
              <button 
                v-if="quizState.submitted"
                @click="quizState.submitted = false; quizState.answers = new Array(blocks[0].content.questions.length).fill(null)"
                class="bg-surface-container-high text-on-surface px-8 py-3.5 rounded-xl font-bold w-full max-w-xs mx-auto block hover:bg-surface-container-highest transition-colors mt-12 border border-outline-variant/30"
              >
                Ulangi Quiz
              </button>
            </div>
          </template>
        </div>

        <!-- 3. MATERIAL (BLOCK) EDITOR -->
        <div v-else class="mt-4">
          <draggable 
            v-model="blocks" 
            group="blocks" 
            item-key="_uid"
            handle=".drag-handle"
            ghost-class="opacity-30"
            animation="200"
            class="flex flex-col gap-2"
            :disabled="isPreview"
          >
            <template #item="{ element: block, index }">
              <div class="group relative flex items-start gap-2" :class="!isPreview ? '-ml-24 pl-24 py-1 hover:bg-surface-container-lowest/50 rounded-xl transition-colors' : 'py-2'">
                
                <!-- Left Controls (Hover) - Hidden in Preview -->
                <div v-if="!isPreview" class="absolute left-0 top-1.5 opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                  <!-- Add Menu Trigger -->
                  <div class="relative">
                    <button @click="showAddMenu = true; addMenuIndex = index" class="w-6 h-6 rounded flex items-center justify-center text-outline hover:bg-surface-container hover:text-on-surface transition-colors" title="Tambah block baru">
                      <span class="material-symbols-outlined text-[20px]">add</span>
                    </button>
                    
                    <!-- Add Block Popover Menu -->
                    <div v-if="showAddMenu && addMenuIndex === index" class="absolute left-0 top-8 bg-surface-container-lowest border border-outline-variant/50 rounded-xl shadow-xl w-56 p-2 z-50 flex flex-col gap-1">
                      <div class="fixed inset-0 z-[-1]" @click="showAddMenu = false"></div>
                      <p class="text-xs font-bold text-on-surface-variant px-2 py-1 uppercase tracking-wider">Basic</p>
                      <button @click="addBlock('text', index)" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-container text-sm font-semibold text-left transition-colors">
                        <span class="material-symbols-outlined text-on-surface-variant text-[20px]">notes</span> Teks Biasa
                      </button>
                      <button @click="addBlock('heading', index)" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-container text-sm font-semibold text-left transition-colors">
                        <span class="material-symbols-outlined text-on-surface-variant text-[20px]">title</span> Judul Besar
                      </button>
                      <button @click="addBlock('table', index)" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-container text-sm font-semibold text-left transition-colors">
                        <span class="material-symbols-outlined text-on-surface-variant text-[20px]">table_chart</span> Tabel
                      </button>
                      <div class="h-px bg-outline-variant/30 my-1"></div>
                      <p class="text-xs font-bold text-on-surface-variant px-2 py-1 uppercase tracking-wider">Media & Interaktif</p>
                      <button @click="addBlock('image', index)" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-container text-sm font-semibold text-left transition-colors">
                        <span class="material-symbols-outlined text-primary text-[20px]">image</span> Gambar
                      </button>
                      <button @click="addBlock('video', index)" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-container text-sm font-semibold text-left transition-colors">
                        <span class="material-symbols-outlined text-secondary text-[20px]">smart_display</span> Video (URL)
                      </button>
                      <button @click="addBlock('experiment', index)" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-container text-sm font-semibold text-left transition-colors">
                        <span class="material-symbols-outlined text-tertiary text-[20px]">html</span> Embed HTML
                      </button>
                    </div>
                  </div>

                  <!-- Drag Handle -->
                  <div class="drag-handle w-6 h-6 rounded flex items-center justify-center text-outline hover:bg-surface-container hover:text-on-surface transition-colors cursor-grab active:cursor-grabbing" title="Geser block">
                    <span class="material-symbols-outlined text-[18px]">drag_indicator</span>
                  </div>
                  
                  <!-- Delete Button -->
                  <button @click="removeBlock(index)" class="w-6 h-6 rounded flex items-center justify-center text-outline hover:bg-error/10 hover:text-error transition-colors" title="Hapus block">
                    <span class="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>

                <!-- Block Content Renderer -->
                <div class="flex-1 min-w-0 py-0.5">
                  
                  <!-- HEADING BLOCK -->
                  <template v-if="block.type === 'heading'">
                    <h2 v-if="isPreview" class="font-headline-md text-2xl font-bold text-on-surface mt-4 mb-2">
                      {{ block.content.text }}
                    </h2>
                    <textarea v-else
                      v-model="block.content.text"
                      @keydown="handleKeydown($event, index, 'heading')"
                      @input="adjustHeight"
                      class="block-input w-full resize-none overflow-hidden outline-none bg-transparent font-headline-md text-2xl font-bold text-on-surface placeholder:text-outline-variant/50"
                      placeholder="Ketik judul sub-materi..."
                      rows="1"
                    ></textarea>
                  </template>
                  
                  <!-- TEXT BLOCK -->
                  <template v-else-if="block.type === 'text'">
                    <div v-if="isPreview" class="text-lg text-on-surface-variant leading-relaxed font-body prose-sm" v-html="block.content.text"></div>
                    <div v-else class="relative w-full group/editor mt-2">
                      <!-- Toolbar -->
                      <div class="absolute -top-12 left-0 bg-surface-container-highest rounded-lg shadow-md flex items-center p-1 gap-1 opacity-0 group-hover/editor:opacity-100 transition-opacity z-10 border border-outline-variant/30">
                        <button @mousedown.prevent="execCmd('bold')" class="w-8 h-8 flex items-center justify-center hover:bg-surface-container rounded font-bold text-on-surface" title="Bold">B</button>
                        <button @mousedown.prevent="execCmd('italic')" class="w-8 h-8 flex items-center justify-center hover:bg-surface-container rounded italic text-on-surface font-serif" title="Italic">I</button>
                        <button @mousedown.prevent="execCmd('underline')" class="w-8 h-8 flex items-center justify-center hover:bg-surface-container rounded underline text-on-surface" title="Underline">U</button>
                        <div class="w-px h-5 bg-outline-variant/50 mx-1"></div>
                        <button @mousedown.prevent="execCmd('justifyLeft')" class="w-8 h-8 flex items-center justify-center hover:bg-surface-container rounded text-on-surface" title="Rata Kiri"><span class="material-symbols-outlined text-[18px]">format_align_left</span></button>
                        <button @mousedown.prevent="execCmd('justifyCenter')" class="w-8 h-8 flex items-center justify-center hover:bg-surface-container rounded text-on-surface" title="Rata Tengah"><span class="material-symbols-outlined text-[18px]">format_align_center</span></button>
                        <button @mousedown.prevent="execCmd('justifyRight')" class="w-8 h-8 flex items-center justify-center hover:bg-surface-container rounded text-on-surface" title="Rata Kanan"><span class="material-symbols-outlined text-[18px]">format_align_right</span></button>
                        <button @mousedown.prevent="execCmd('justifyFull')" class="w-8 h-8 flex items-center justify-center hover:bg-surface-container rounded text-on-surface" title="Rata Kanan Kiri"><span class="material-symbols-outlined text-[18px]">format_align_justify</span></button>
                      </div>
                      <div
                        contenteditable="true"
                        @blur="block.content.text = $event.target.innerHTML"
                        @keydown="handleKeydown($event, index, 'text')"
                        class="block-input w-full min-h-[1.5em] outline-none bg-transparent text-lg text-on-surface-variant leading-relaxed font-body prose-sm focus:bg-surface-container-lowest/30 rounded p-1"
                        v-html="block.content.text || '<p><br></p>'"
                      ></div>
                    </div>
                  </template>

                  <!-- TABLE BLOCK -->
                  <div v-else-if="block.type === 'table'" class="my-4 overflow-x-auto">
                    <table class="w-full border-collapse border border-outline-variant/30 text-left text-sm rounded-lg overflow-hidden">
                      <tbody>
                        <tr v-for="(row, rIndex) in (block.content.tableData || [['','']])" :key="rIndex" class="border-b border-outline-variant/30">
                          <td v-for="(col, cIndex) in row" :key="cIndex" class="border-r border-outline-variant/30 p-0 last:border-r-0 relative">
                            <span v-if="isPreview" class="block p-3 font-body text-on-surface-variant whitespace-pre-wrap">{{ col }}</span>
                            <textarea v-else
                              v-model="block.content.tableData[rIndex][cIndex]"
                              @input="adjustHeight"
                              class="w-full p-3 resize-none outline-none bg-transparent text-on-surface-variant font-body min-h-[44px]"
                              placeholder="..."
                              rows="1"
                            ></textarea>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                    <div v-if="!isPreview" class="mt-2 flex flex-wrap gap-2">
                      <button @click="block.content.tableData.push(new Array(block.content.tableData[0].length).fill(''))" class="px-3 py-1 bg-surface-container hover:bg-surface-container-high rounded text-xs font-bold text-on-surface-variant transition-colors">+ Baris</button>
                      <button @click="block.content.tableData.forEach(r => r.push(''))" class="px-3 py-1 bg-surface-container hover:bg-surface-container-high rounded text-xs font-bold text-on-surface-variant transition-colors">+ Kolom</button>
                      <button v-if="block.content.tableData.length > 1" @click="block.content.tableData.pop()" class="px-3 py-1 text-error hover:bg-error/10 rounded text-xs font-bold transition-colors">- Baris</button>
                      <button v-if="block.content.tableData[0].length > 1" @click="block.content.tableData.forEach(r => r.pop())" class="px-3 py-1 text-error hover:bg-error/10 rounded text-xs font-bold transition-colors">- Kolom</button>
                    </div>
                  </div>

                  <!-- IMAGE BLOCK -->
                  <div v-else-if="block.type === 'image'" class="my-4">
                    <div v-if="!block.content.url && !isPreview" class="border-2 border-dashed border-outline-variant/50 rounded-2xl p-6 bg-surface-container-lowest flex flex-col items-center justify-center gap-3 hover:border-primary/50 transition-colors">
                      <span class="material-symbols-outlined text-[32px] text-primary">image</span>
                      <input 
                        v-model="block.content.text" 
                        type="url" 
                        placeholder="Tempel link URL Gambar di sini, lalu tekan Enter"
                        class="w-full max-w-md px-4 py-2 rounded-lg border border-outline-variant/50 bg-surface text-sm outline-none focus:border-primary text-center"
                        @keyup.enter="block.content.url = block.content.text"
                      />
                      <button @click="block.content.url = block.content.text" class="text-xs font-bold text-primary hover:underline">Atau klik Embed Gambar</button>
                    </div>
                    <div v-else-if="block.content.url" class="relative group/img rounded-2xl overflow-hidden border border-outline-variant/30">
                      <img :src="block.content.url" alt="Lesson Image" class="w-full h-auto object-contain max-h-[500px]" />
                      <button v-if="!isPreview" @click="block.content.url = ''" class="absolute top-3 right-3 bg-surface-container-highest/80 backdrop-blur text-on-surface w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity">
                        <span class="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    </div>
                  </div>
                  
                  <!-- VIDEO BLOCK -->
                  <div v-else-if="block.type === 'video'" class="my-4">
                    <div v-if="!block.content.url && !isPreview" class="border-2 border-dashed border-outline-variant/50 rounded-2xl p-6 bg-surface-container-lowest flex flex-col items-center justify-center gap-3 hover:border-secondary/50 transition-colors">
                      <span class="material-symbols-outlined text-[32px] text-secondary">smart_display</span>
                      <input 
                        v-model="block.content.text" 
                        type="url" 
                        placeholder="Tempel link YouTube (Embed) di sini, lalu tekan Enter"
                        class="w-full max-w-md px-4 py-2 rounded-lg border border-outline-variant/50 bg-surface text-sm outline-none focus:border-secondary text-center"
                        @keyup.enter="block.content.url = block.content.text"
                      />
                    </div>
                    <div v-else-if="block.content.url" class="relative group/vid rounded-2xl overflow-hidden border border-outline-variant/30 aspect-video bg-black">
                      <iframe :src="block.content.url" class="w-full h-full" frameborder="0" allowfullscreen></iframe>
                      <button v-if="!isPreview" @click="block.content.url = ''" class="absolute -top-12 right-3 group-hover/vid:top-3 bg-surface-container-highest/80 backdrop-blur text-on-surface px-3 py-1.5 rounded-lg text-xs font-bold transition-all z-10">
                        Ganti Video
                      </button>
                    </div>
                  </div>

                  <!-- HTML EMBED BLOCK (Untuk sisipan lab di materi biasa) -->
                  <div v-else-if="block.type === 'experiment'" class="my-4">
                    <div v-if="!isPreview" class="border border-outline-variant/50 rounded-2xl p-4 bg-surface-container-lowest flex flex-col gap-3">
                      <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center gap-2 text-tertiary">
                          <span class="material-symbols-outlined">html</span>
                          <span class="font-bold text-sm">Embed Kode HTML</span>
                        </div>
                        <label class="cursor-pointer bg-tertiary/10 text-tertiary hover:bg-tertiary/20 px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-2">
                          <span class="material-symbols-outlined text-[16px]">upload_file</span>
                          Upload File HTML
                          <input type="file" accept=".html" class="hidden" @change="handleHtmlUpload($event, block)" />
                        </label>
                      </div>
                      <textarea
                        v-model="block.content.text"
                        @input="adjustHeight"
                        class="w-full resize-none outline-none bg-surface-container-lowest text-sm text-on-surface-variant font-mono p-4 rounded-xl border border-outline-variant/30 focus:border-tertiary/50 transition-colors"
                        placeholder="Tempel (paste) kode HTML atau Link URL Eksternal (https://...) di sini..."
                        rows="4"
                      ></textarea>
                      <div v-if="block.content.text" class="mt-2 pt-4 border-t border-outline-variant/30">
                        <p class="text-xs font-bold text-on-surface-variant uppercase tracking-wider mb-2">Live Preview (Khusus Area Edit)</p>
                        <div class="embed-container relative bg-white rounded-xl overflow-hidden border border-outline-variant/30 group/embed">
                          <iframe v-if="block.content.text.trim().startsWith('http')" class="w-full min-h-[60vh] border-0" :src="block.content.text.trim()" allowfullscreen></iframe>
                          <iframe v-else class="w-full min-h-[60vh] border-0" :srcdoc="block.content.text" allowfullscreen></iframe>
                          <button @click="toggleFullscreen" class="absolute top-3 right-3 bg-black/60 text-white w-10 h-10 flex items-center justify-center rounded-lg opacity-0 group-hover/embed:opacity-100 transition-opacity backdrop-blur hover:bg-black/80" title="Toggle Fullscreen">
                            <span class="material-symbols-outlined">fullscreen</span>
                          </button>
                        </div>
                      </div>
                    </div>
                    <div v-else class="w-full bg-transparent overflow-hidden rounded-xl border border-outline-variant/30">
                      <div class="embed-container relative bg-white w-full group/embed">
                        <iframe v-if="block.content.text.trim().startsWith('http')" class="w-full min-h-[70vh] border-0" :src="block.content.text.trim()" allowfullscreen></iframe>
                        <iframe v-else class="w-full min-h-[70vh] border-0" :srcdoc="block.content.text" allowfullscreen></iframe>
                        <button @click="toggleFullscreen" class="absolute top-3 right-3 bg-black/60 text-white w-10 h-10 flex items-center justify-center rounded-lg opacity-0 group-hover/embed:opacity-100 transition-opacity backdrop-blur hover:bg-black/80" title="Toggle Fullscreen">
                          <span class="material-symbols-outlined">fullscreen</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
              </div>
            </template>
          </draggable>

          <!-- Final empty area to click to add block at the bottom -->
          <div v-if="!isPreview" class="h-32 mt-4 cursor-text" @click="addBlock('text', -1)"></div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
/* Fix iframe height when the container is in fullscreen mode */
.embed-container:fullscreen iframe {
  height: 100vh !important;
}
.embed-container:-webkit-full-screen iframe {
  height: 100vh !important;
}
</style>

<style scoped>
/* Transisi untuk list draggable */
.blocks-move,
.blocks-enter-active,
.blocks-leave-active {
  transition: all 0.3s ease;
}
.blocks-enter-from,
.blocks-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
