<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getAssessmentById, updateAssessment, getModulesForTeacher, getClasses, createSchedule } from '../../services/assessment.service'
import { getSession } from '../../services/auth.service'

const route = useRoute()
const router = useRouter()
const assessmentId = route.params.id

const currentUser = ref(null)
const loading = ref(true)
const saving = ref(false)
const publishing = ref(false)
const showPublishModal = ref(false)

const assessment = ref({
  title: 'Lembar Soal Tanpa Judul',
  description: '',
  module_id: null,
  questions: []
})

const modules = ref([])
const classes = ref([])
const scheduleData = ref({
  class_id: '',
  start_time: '',
  end_time: ''
})

const fetchAssessment = async () => {
  loading.value = true
  try {
    const session = await getSession()
    if (session?.user) {
      currentUser.value = session.user
      // Load supporting data
      const [modulesData, classesData] = await Promise.all([
        getModulesForTeacher(session.user.id),
        getClasses(session.user.id)
      ])
      modules.value = modulesData
      classes.value = classesData
    }

    const data = await getAssessmentById(assessmentId)
    if (!data.questions) data.questions = []
    assessment.value = data
  } catch (error) {
    alert('Gagal memuat Lembar Soal.')
    router.push('/teacher/assessments')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAssessment()
})

const saveAssessment = async (silent = false) => {
  saving.value = true
  try {
    await updateAssessment(assessmentId, {
      title: assessment.value.title,
      description: assessment.value.description,
      module_id: assessment.value.module_id,
      questions: assessment.value.questions
    })
    if (!silent) alert('Lembar Soal berhasil disimpan!')
  } catch (error) {
    if (!silent) alert('Gagal menyimpan: ' + error.message)
    throw error
  } finally {
    saving.value = false
  }
}

const handlePublish = async () => {
  if (!scheduleData.value.class_id || !scheduleData.value.start_time || !scheduleData.value.end_time) {
    alert('Harap isi Kelas, Waktu Mulai, dan Waktu Selesai.')
    return
  }

  publishing.value = true
  try {
    // 1. Simpan lembar soal terbaru dulu
    await saveAssessment(true)
    
    // 2. Buat jadwal
    await createSchedule({
      assessment_id: assessmentId,
      class_id: scheduleData.value.class_id,
      start_time: scheduleData.value.start_time,
      end_time: scheduleData.value.end_time,
      status: 'published'
    })

    alert('Lembar Soal berhasil dijadwalkan dan di-publish ke Kelas!')
    showPublishModal.value = false
  } catch (error) {
    alert('Gagal mem-publish: ' + error.message)
  } finally {
    publishing.value = false
  }
}

const addQuestion = (type) => {
  const newQuestion = {
    id: Date.now().toString(),
    type: type, // 'multiple_choice', 'short_answer', 'true_false'
    question_text: '',
    points: 10,
    explanation: ''
  }

  if (type === 'multiple_choice') {
    newQuestion.options = [
      { text: '', is_correct: true },
      { text: '', is_correct: false },
      { text: '', is_correct: false },
      { text: '', is_correct: false }
    ]
  } else if (type === 'true_false') {
    newQuestion.correct_answer = 'true'
  } else if (type === 'short_answer') {
    newQuestion.correct_answer = ''
  }

  assessment.value.questions.push(newQuestion)
}

const removeQuestion = (index) => {
  if (confirm('Hapus soal ini?')) {
    assessment.value.questions.splice(index, 1)
  }
}

// Multiple Choice Helpers
const setCorrectOption = (qIndex, optIndex) => {
  assessment.value.questions[qIndex].options.forEach((opt, i) => {
    opt.is_correct = i === optIndex
  })
}

const addOption = (qIndex) => {
  if (assessment.value.questions[qIndex].options.length < 5) {
    assessment.value.questions[qIndex].options.push({ text: '', is_correct: false })
  }
}

const removeOption = (qIndex, optIndex) => {
  const q = assessment.value.questions[qIndex]
  if (q.options.length > 2) {
    const wasCorrect = q.options[optIndex].is_correct
    q.options.splice(optIndex, 1)
    if (wasCorrect) q.options[0].is_correct = true
  }
}

// UI Helpers
const getQuestionTypeLabel = (type) => {
  switch(type) {
    case 'multiple_choice': return 'Pilihan Ganda'
    case 'true_false': return 'Benar / Salah'
    case 'short_answer': return 'Isian Singkat'
    default: return 'Soal'
  }
}
</script>

<template>
  <div v-if="loading" class="flex h-full items-center justify-center">
    <span class="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
  </div>
  
  <div v-else class="max-w-4xl mx-auto py-8 px-4 pb-32">
    <!-- Header Controls -->
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <button @click="router.push('/teacher/assessments')" class="text-on-surface-variant hover:bg-surface-container px-3 py-2 rounded-xl flex items-center gap-2 font-bold transition-colors self-start">
        <span class="material-symbols-outlined">arrow_back</span>
        Kembali
      </button>
      
      <div class="flex items-center gap-3 self-end sm:self-auto">
        <button @click="saveAssessment(false)" :disabled="saving" class="bg-surface-container-high text-on-surface hover:bg-surface-container-highest px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2 disabled:opacity-50">
          <span class="material-symbols-outlined text-[20px]" v-if="!saving">save</span>
          <span class="material-symbols-outlined text-[20px] animate-spin" v-else>progress_activity</span>
          Simpan
        </button>
        <button @click="showPublishModal = true" class="bg-primary text-on-primary hover:bg-primary/90 px-6 py-2.5 rounded-xl font-bold transition-all shadow-sm flex items-center gap-2">
          <span class="material-symbols-outlined text-[20px]">send</span>
          Publish & Jadwalkan
        </button>
      </div>
    </div>

    <!-- Title & Description Card (Google Forms Style) -->
    <div class="bg-surface-container-lowest border-t-8 border-t-primary border border-outline-variant/30 rounded-2xl p-8 mb-6 shadow-sm relative overflow-hidden">
      
      <!-- Module Select -->
      <div class="mb-6 flex items-center gap-2 bg-primary/5 p-3 rounded-lg border border-primary/20 w-fit">
        <span class="material-symbols-outlined text-primary text-[20px]">folder_open</span>
        <select v-model="assessment.module_id" class="bg-transparent text-primary font-bold outline-none cursor-pointer">
          <option :value="null">Pilih Bab / Modul (Opsional)</option>
          <option v-for="mod in modules" :key="mod.id" :value="mod.id">
            {{ mod.course_title }} - {{ mod.title }}
          </option>
        </select>
      </div>

      <input 
        v-model="assessment.title" 
        type="text" 
        class="w-full text-3xl font-extrabold bg-transparent outline-none border-b border-transparent focus:border-outline-variant transition-colors pb-2 mb-4"
        placeholder="Judul Lembar Soal"
      >
      <textarea 
        v-model="assessment.description" 
        rows="2" 
        class="w-full text-sm text-on-surface-variant bg-transparent outline-none border-b border-transparent focus:border-outline-variant transition-colors resize-none pb-2"
        placeholder="Deskripsi atau instruksi pengerjaan..."
      ></textarea>
    </div>

    <!-- Questions Loop -->
    <div class="space-y-6">
      <div 
        v-for="(q, qIndex) in assessment.questions" 
        :key="q.id"
        class="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm group focus-within:border-primary/50 focus-within:shadow-md transition-all relative"
      >
        <!-- Top bar of question -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div class="flex items-center gap-2 text-primary font-bold text-sm bg-primary/10 px-3 py-1.5 rounded-lg">
            <span class="material-symbols-outlined text-[18px]">
              {{ q.type === 'multiple_choice' ? 'radio_button_checked' : q.type === 'true_false' ? 'rule' : 'short_text' }}
            </span>
            {{ getQuestionTypeLabel(q.type) }}
          </div>
          
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="text-sm font-bold text-on-surface-variant">Poin:</span>
              <input v-model.number="q.points" type="number" min="1" class="w-16 bg-surface-container px-2 py-1 rounded border border-outline-variant/30 outline-none focus:border-primary text-center font-bold">
            </div>
            <button @click="removeQuestion(qIndex)" class="text-outline-variant hover:text-error transition-colors" title="Hapus Soal">
              <span class="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>

        <!-- Question Text -->
        <textarea 
          v-model="q.question_text" 
          rows="2" 
          class="w-full text-lg font-medium bg-surface-container-low px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none mb-6"
          placeholder="Ketik pertanyaan Anda di sini..."
        ></textarea>

        <!-- Question Options depending on type -->
        
        <!-- Multiple Choice -->
        <div v-if="q.type === 'multiple_choice'" class="space-y-3">
          <div v-for="(opt, optIndex) in q.options" :key="optIndex" class="flex items-center gap-3">
            <button @click="setCorrectOption(qIndex, optIndex)" class="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors" :class="opt.is_correct ? 'border-primary bg-primary' : 'border-outline-variant hover:border-primary/50'">
              <span v-if="opt.is_correct" class="material-symbols-outlined text-white text-[16px]">check</span>
            </button>
            <input 
              v-model="opt.text" 
              type="text" 
              :placeholder="`Opsi ${optIndex + 1}`" 
              class="flex-1 bg-surface-container-low px-4 py-2 rounded-lg outline-none border border-transparent focus:border-primary/50 transition-colors text-sm font-medium"
              :class="opt.is_correct ? 'border-primary/30 bg-primary/5' : ''"
            >
            <button v-if="q.options.length > 2" @click="removeOption(qIndex, optIndex)" class="text-outline-variant hover:text-error w-8 h-8 flex items-center justify-center rounded-full hover:bg-surface-container transition-colors">
              <span class="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
          <button v-if="q.options.length < 5" @click="addOption(qIndex)" class="mt-2 text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-primary/10 transition-colors">
            <span class="material-symbols-outlined text-[18px]">add</span> Tambah Opsi
          </button>
        </div>

        <!-- True / False -->
        <div v-if="q.type === 'true_false'" class="flex items-center gap-4">
          <label class="flex items-center gap-3 bg-surface-container-low px-4 py-3 rounded-xl border border-transparent has-[:checked]:border-primary has-[:checked]:bg-primary/5 cursor-pointer transition-all flex-1">
            <input type="radio" v-model="q.correct_answer" value="true" class="w-5 h-5 accent-primary cursor-pointer">
            <span class="font-bold">Benar (True)</span>
          </label>
          <label class="flex items-center gap-3 bg-surface-container-low px-4 py-3 rounded-xl border border-transparent has-[:checked]:border-primary has-[:checked]:bg-primary/5 cursor-pointer transition-all flex-1">
            <input type="radio" v-model="q.correct_answer" value="false" class="w-5 h-5 accent-primary cursor-pointer">
            <span class="font-bold">Salah (False)</span>
          </label>
        </div>

        <!-- Short Answer -->
        <div v-if="q.type === 'short_answer'" class="space-y-2">
          <label class="text-sm font-bold text-on-surface-variant flex items-center gap-2">
            <span class="material-symbols-outlined text-[16px]">key</span> Kunci Jawaban (Auto-correct)
          </label>
          <input 
            v-model="q.correct_answer" 
            type="text" 
            placeholder="Ketik jawaban singkat yang benar..." 
            class="w-full bg-surface-container-low px-4 py-3 rounded-xl outline-none border border-transparent focus:border-primary/50 transition-colors font-medium text-primary"
          >
          <p class="text-[11px] text-on-surface-variant mt-1 italic">* Sistem akan memeriksa jawaban siswa apakah persis sama (tidak case-sensitive) dengan kunci jawaban ini.</p>
        </div>

        <!-- Explanation (Optional) -->
        <div class="mt-6 pt-4 border-t border-outline-variant/20">
          <details class="group/details">
            <summary class="text-sm font-bold text-primary cursor-pointer select-none flex items-center gap-1 mb-2 hover:opacity-80">
              <span class="material-symbols-outlined text-[18px] group-open/details:rotate-90 transition-transform">chevron_right</span>
              Pembahasan (Opsional)
            </summary>
            <textarea 
              v-model="q.explanation" 
              rows="2" 
              class="w-full text-sm bg-surface-container-low px-4 py-3 rounded-xl outline-none border border-transparent focus:border-primary/30 transition-colors resize-none mt-2"
              placeholder="Jelaskan alasan mengapa jawaban tersebut benar untuk ditampilkan kepada siswa setelah kuis selesai..."
            ></textarea>
          </details>
        </div>
      </div>
    </div>

    <!-- Add Question Floating Menu -->
    <div class="fixed bottom-8 left-1/2 -translate-x-1/2 bg-surface-container-highest shadow-2xl rounded-full px-6 py-3 flex items-center gap-6 border border-outline-variant/20 z-10">
      <div class="text-sm font-bold text-on-surface whitespace-nowrap hidden md:block mr-2">Tambah Soal:</div>
      
      <button @click="addQuestion('multiple_choice')" class="flex flex-col items-center justify-center gap-1 text-on-surface-variant hover:text-primary transition-colors group" title="Pilihan Ganda">
        <div class="w-10 h-10 rounded-full bg-surface-container group-hover:bg-primary/10 flex items-center justify-center transition-colors">
          <span class="material-symbols-outlined">radio_button_checked</span>
        </div>
      </button>
      
      <button @click="addQuestion('short_answer')" class="flex flex-col items-center justify-center gap-1 text-on-surface-variant hover:text-primary transition-colors group" title="Isian Singkat">
        <div class="w-10 h-10 rounded-full bg-surface-container group-hover:bg-primary/10 flex items-center justify-center transition-colors">
          <span class="material-symbols-outlined">short_text</span>
        </div>
      </button>
      
      <button @click="addQuestion('true_false')" class="flex flex-col items-center justify-center gap-1 text-on-surface-variant hover:text-primary transition-colors group" title="Benar / Salah">
        <div class="w-10 h-10 rounded-full bg-surface-container group-hover:bg-primary/10 flex items-center justify-center transition-colors">
          <span class="material-symbols-outlined">rule</span>
        </div>
      </button>
    </div>

    <!-- Publish Modal -->
    <div v-if="showPublishModal" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div class="bg-surface-container-lowest rounded-3xl w-full max-w-md p-6 shadow-2xl">
        <h2 class="text-2xl font-bold text-on-surface mb-2">Publish ke Kelas</h2>
        <p class="text-on-surface-variant text-sm mb-6">Atur jadwal pengerjaan Lembar Soal ini untuk siswa.</p>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-bold text-on-surface-variant mb-1">Pilih Kelas</label>
            <select v-model="scheduleData.class_id" class="w-full bg-surface-container-low px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary">
              <option value="" disabled>-- Pilih Kelas --</option>
              <option v-for="c in classes" :key="c.id" :value="c.id">{{ c.name }}</option>
            </select>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-bold text-on-surface-variant mb-1">Mulai</label>
              <input v-model="scheduleData.start_time" type="datetime-local" class="w-full bg-surface-container-low px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary text-sm">
            </div>
            <div>
              <label class="block text-sm font-bold text-on-surface-variant mb-1">Selesai</label>
              <input v-model="scheduleData.end_time" type="datetime-local" class="w-full bg-surface-container-low px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary text-sm">
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-8">
          <button @click="showPublishModal = false" class="px-5 py-2.5 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container transition-colors">Batal</button>
          <button @click="handlePublish" :disabled="publishing" class="bg-primary text-on-primary hover:bg-primary/90 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all">
            <span v-if="publishing" class="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
            {{ publishing ? 'Memproses...' : 'Publish Sekarang' }}
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
