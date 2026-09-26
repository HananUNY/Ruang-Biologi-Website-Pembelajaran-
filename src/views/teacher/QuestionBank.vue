<script setup>
import { ref, onMounted, computed } from 'vue'
import { getSession } from '../../services/auth.service'
import { getQuestions, createQuestion, deleteQuestion } from '../../services/question.service'

const currentUser = ref(null)
const questions = ref([])
const loading = ref(true)
const showModal = ref(false)

// Form State
const newQuestion = ref({
  question_text: '',
  topic: '',
  cognitive_level: 'C1',
  difficulty: 'easy',
  explanation: '',
  options: [
    { text: '', is_correct: true },
    { text: '', is_correct: false },
    { text: '', is_correct: false },
    { text: '', is_correct: false }
  ]
})

// Filters
const searchTopic = ref('')
const filterCognitive = ref('')
const filterDifficulty = ref('')

const fetchQuestions = async () => {
  loading.value = true
  try {
    const session = await getSession()
    if (session?.user) {
      currentUser.value = session.user
      questions.value = await getQuestions(session.user.id)
    }
  } catch (error) {
    console.error('Error fetching questions:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchQuestions()
})

const filteredQuestions = computed(() => {
  return questions.value.filter(q => {
    const matchTopic = q.topic.toLowerCase().includes(searchTopic.value.toLowerCase()) || q.question_text.toLowerCase().includes(searchTopic.value.toLowerCase())
    const matchCognitive = filterCognitive.value ? q.cognitive_level === filterCognitive.value : true
    const matchDifficulty = filterDifficulty.value ? q.difficulty === filterDifficulty.value : true
    return matchTopic && matchCognitive && matchDifficulty
  })
})

const setCorrectOption = (index) => {
  newQuestion.value.options.forEach((opt, i) => {
    opt.is_correct = i === index
  })
}

const addOption = () => {
  if (newQuestion.value.options.length < 5) {
    newQuestion.value.options.push({ text: '', is_correct: false })
  }
}

const removeOption = (index) => {
  if (newQuestion.value.options.length > 2) {
    const wasCorrect = newQuestion.value.options[index].is_correct
    newQuestion.value.options.splice(index, 1)
    if (wasCorrect) newQuestion.value.options[0].is_correct = true
  }
}

const saveQuestion = async () => {
  if (!newQuestion.value.question_text || !newQuestion.value.topic) {
    alert('Mohon isi teks soal dan topik!')
    return
  }
  
  const hasEmptyOptions = newQuestion.value.options.some(o => !o.text.trim())
  if (hasEmptyOptions) {
    alert('Mohon isi semua pilihan jawaban!')
    return
  }

  try {
    const dataToSave = {
      ...newQuestion.value,
      teacher_id: currentUser.value.id
    }
    
    await createQuestion(dataToSave)
    showModal.value = false
    
    // Reset form
    newQuestion.value = {
      question_text: '',
      topic: '',
      cognitive_level: 'C1',
      difficulty: 'easy',
      explanation: '',
      options: [
        { text: '', is_correct: true },
        { text: '', is_correct: false },
        { text: '', is_correct: false },
        { text: '', is_correct: false }
      ]
    }
    
    fetchQuestions()
  } catch (error) {
    alert('Gagal menyimpan soal: ' + error.message)
  }
}

const handleDelete = async (id) => {
  if (confirm('Yakin ingin menghapus soal ini?')) {
    try {
      await deleteQuestion(id)
      fetchQuestions()
    } catch (error) {
      alert('Gagal menghapus soal: ' + error.message)
    }
  }
}

// Helpers
const getDifficultyColor = (diff) => {
  switch (diff) {
    case 'easy': return 'bg-green-100 text-green-700'
    case 'medium': return 'bg-yellow-100 text-yellow-700'
    case 'hard': return 'bg-red-100 text-red-700'
    default: return 'bg-gray-100 text-gray-700'
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto py-8 px-4">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-extrabold text-on-surface mb-2 tracking-tight">Bank Soal</h1>
        <p class="text-on-surface-variant text-sm">Kelola kumpulan soal berdasarkan Topik, Tingkat Kesulitan, dan Level Kognitif.</p>
      </div>
      <button @click="showModal = true" class="bg-primary text-on-primary hover:bg-primary/90 px-5 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm whitespace-nowrap">
        <span class="material-symbols-outlined text-[20px]">add_circle</span>
        Tambah Soal Baru
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-surface-container-lowest border border-outline-variant/30 p-4 rounded-2xl flex flex-col md:flex-row gap-4 mb-8">
      <div class="relative flex-1">
        <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
        <input 
          v-model="searchTopic" 
          type="text" 
          placeholder="Cari topik atau teks soal..." 
          class="w-full pl-11 pr-4 py-3 bg-surface rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface text-sm"
        >
      </div>
      <div class="flex gap-4">
        <select v-model="filterCognitive" class="px-4 py-3 bg-surface rounded-xl border border-outline-variant/50 focus:border-primary outline-none transition-all text-on-surface text-sm appearance-none">
          <option value="">Semua Kognitif</option>
          <option value="C1">C1 (Mengingat)</option>
          <option value="C2">C2 (Memahami)</option>
          <option value="C3">C3 (Mengaplikasikan)</option>
          <option value="C4">C4 (Menganalisis)</option>
          <option value="C5">C5 (Mengevaluasi)</option>
          <option value="C6">C6 (Mencipta)</option>
        </select>
        <select v-model="filterDifficulty" class="px-4 py-3 bg-surface rounded-xl border border-outline-variant/50 focus:border-primary outline-none transition-all text-on-surface text-sm appearance-none">
          <option value="">Semua Kesulitan</option>
          <option value="easy">Mudah</option>
          <option value="medium">Sedang</option>
          <option value="hard">Sulit</option>
        </select>
      </div>
    </div>

    <!-- Questions List -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
    </div>
    
    <div v-else-if="filteredQuestions.length === 0" class="text-center py-20 bg-surface-container-lowest border border-dashed border-outline-variant/50 rounded-3xl">
      <span class="material-symbols-outlined text-5xl text-outline-variant mb-4">quiz</span>
      <h3 class="text-xl font-bold text-on-surface mb-2">Belum ada soal</h3>
      <p class="text-on-surface-variant">Tambahkan soal baru atau ubah kata kunci pencarian Anda.</p>
    </div>

    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="q in filteredQuestions" :key="q.id" class="bg-surface-container-lowest border border-outline-variant/30 p-6 rounded-2xl flex flex-col hover:border-primary/40 transition-colors shadow-sm">
        <div class="flex justify-between items-start mb-3 gap-4">
          <div class="flex flex-wrap gap-2">
            <span class="px-2 py-1 rounded-md text-xs font-bold bg-primary-container text-on-primary-container">{{ q.topic }}</span>
            <span class="px-2 py-1 rounded-md text-xs font-bold bg-tertiary-container text-on-tertiary-container">{{ q.cognitive_level }}</span>
            <span :class="['px-2 py-1 rounded-md text-xs font-bold uppercase', getDifficultyColor(q.difficulty)]">{{ q.difficulty }}</span>
          </div>
          <button @click="handleDelete(q.id)" class="text-outline-variant hover:text-error transition-colors">
            <span class="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
        
        <p class="text-on-surface font-medium text-sm mb-4 flex-1 line-clamp-3">{{ q.question_text }}</p>
        
        <div class="space-y-2 mt-auto pt-4 border-t border-outline-variant/20">
          <div v-for="(opt, i) in q.options" :key="i" class="flex items-start gap-2">
            <span class="material-symbols-outlined text-[16px] mt-0.5" :class="opt.is_correct ? 'text-green-500' : 'text-outline-variant/40'">
              {{ opt.is_correct ? 'check_circle' : 'radio_button_unchecked' }}
            </span>
            <span class="text-xs text-on-surface-variant line-clamp-1" :class="opt.is_correct ? 'font-bold text-on-surface' : ''">{{ opt.text }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Question Modal -->
    <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div class="bg-surface rounded-3xl w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl">
        <div class="flex items-center justify-between p-6 border-b border-outline-variant/20">
          <h2 class="text-xl font-bold text-on-surface">Tambah Soal Baru</h2>
          <button @click="showModal = false" class="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto flex-1 custom-scrollbar">
          <div class="space-y-6">
            <!-- Topik -->
            <div>
              <label class="block text-sm font-bold text-on-surface mb-2">Topik Soal <span class="text-error">*</span></label>
              <input v-model="newQuestion.topic" type="text" placeholder="Contoh: Sistem Pencernaan" class="w-full px-4 py-3 bg-surface-container-lowest rounded-xl border border-outline-variant/50 focus:border-primary outline-none transition-all">
            </div>

            <!-- Kategori (Kognitif & Kesulitan) -->
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-bold text-on-surface mb-2">Level Kognitif</label>
                <select v-model="newQuestion.cognitive_level" class="w-full px-4 py-3 bg-surface-container-lowest rounded-xl border border-outline-variant/50 focus:border-primary outline-none transition-all">
                  <option value="C1">C1 (Mengingat)</option>
                  <option value="C2">C2 (Memahami)</option>
                  <option value="C3">C3 (Mengaplikasikan)</option>
                  <option value="C4">C4 (Menganalisis)</option>
                  <option value="C5">C5 (Mengevaluasi)</option>
                  <option value="C6">C6 (Mencipta)</option>
                </select>
              </div>
              <div>
                <label class="block text-sm font-bold text-on-surface mb-2">Tingkat Kesulitan</label>
                <select v-model="newQuestion.difficulty" class="w-full px-4 py-3 bg-surface-container-lowest rounded-xl border border-outline-variant/50 focus:border-primary outline-none transition-all">
                  <option value="easy">Mudah</option>
                  <option value="medium">Sedang</option>
                  <option value="hard">Sulit</option>
                </select>
              </div>
            </div>

            <!-- Teks Soal -->
            <div>
              <label class="block text-sm font-bold text-on-surface mb-2">Pertanyaan <span class="text-error">*</span></label>
              <textarea v-model="newQuestion.question_text" rows="4" placeholder="Tuliskan pertanyaan di sini..." class="w-full px-4 py-3 bg-surface-container-lowest rounded-xl border border-outline-variant/50 focus:border-primary outline-none transition-all resize-none"></textarea>
            </div>

            <!-- Pilihan Jawaban -->
            <div>
              <label class="block text-sm font-bold text-on-surface mb-2">Pilihan Jawaban (Pilih 1 yang Benar) <span class="text-error">*</span></label>
              <div class="space-y-3">
                <div v-for="(opt, index) in newQuestion.options" :key="index" class="flex items-center gap-3 bg-surface-container-lowest p-3 rounded-xl border" :class="opt.is_correct ? 'border-primary/50 bg-primary/5' : 'border-outline-variant/50'">
                  <button @click="setCorrectOption(index)" class="shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors" :class="opt.is_correct ? 'border-primary bg-primary' : 'border-outline-variant'">
                    <span v-if="opt.is_correct" class="w-2.5 h-2.5 bg-white rounded-full"></span>
                  </button>
                  <input v-model="opt.text" type="text" :placeholder="`Pilihan ${String.fromCharCode(65 + index)}`" class="flex-1 bg-transparent outline-none text-sm font-medium">
                  <button v-if="newQuestion.options.length > 2" @click="removeOption(index)" class="text-outline-variant hover:text-error">
                    <span class="material-symbols-outlined text-[18px]">close</span>
                  </button>
                </div>
              </div>
              <button v-if="newQuestion.options.length < 5" @click="addOption" class="mt-3 text-sm font-bold text-primary hover:text-primary/80 flex items-center gap-1">
                <span class="material-symbols-outlined text-[18px]">add</span> Tambah Pilihan
              </button>
            </div>

            <!-- Pembahasan -->
            <div>
              <label class="block text-sm font-bold text-on-surface mb-2">Pembahasan (Opsional)</label>
              <textarea v-model="newQuestion.explanation" rows="3" placeholder="Jelaskan mengapa jawaban tersebut benar..." class="w-full px-4 py-3 bg-surface-container-lowest rounded-xl border border-outline-variant/50 focus:border-primary outline-none transition-all resize-none"></textarea>
            </div>
          </div>
        </div>
        
        <div class="p-6 border-t border-outline-variant/20 flex justify-end gap-3 bg-surface-container-lowest">
          <button @click="showModal = false" class="px-5 py-2.5 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container transition-colors">Batal</button>
          <button @click="saveQuestion" class="px-5 py-2.5 rounded-xl font-bold bg-primary text-on-primary hover:bg-primary/90 transition-colors shadow-sm">Simpan Soal</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}
.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
  background-color: rgb(var(--color-outline-variant) / 0.5);
  border-radius: 20px;
}
</style>
