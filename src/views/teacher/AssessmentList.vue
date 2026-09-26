<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getSession } from '../../services/auth.service'
import { getAssessments, createAssessment, deleteAssessment } from '../../services/assessment.service'

const router = useRouter()
const currentUser = ref(null)
const assessments = ref([])
const loading = ref(true)

const fetchAssessments = async () => {
  loading.value = true
  try {
    const session = await getSession()
    if (session?.user) {
      currentUser.value = session.user
      assessments.value = await getAssessments(session.user.id)
    }
  } catch (error) {
    console.error('Failed to load assessments:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchAssessments()
})

const handleCreate = async () => {
  try {
    const newDoc = {
      teacher_id: currentUser.value.id,
      title: 'Lembar Soal Tanpa Judul',
      description: '',
      questions: []
    }
    const created = await createAssessment(newDoc)
    router.push(`/teacher/assessments/${created.id}`)
  } catch (error) {
    alert('Gagal membuat lembar soal baru: ' + error.message)
  }
}

const handleDelete = async (id) => {
  if (confirm('Yakin ingin menghapus Lembar Soal ini? Semua pertanyaan di dalamnya akan hilang.')) {
    try {
      await deleteAssessment(id)
      fetchAssessments()
    } catch (error) {
      alert('Gagal menghapus: ' + error.message)
    }
  }
}

const openBuilder = (id) => {
  router.push(`/teacher/assessments/${id}`)
}
</script>

<template>
  <div class="max-w-7xl mx-auto py-8 px-4">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-extrabold text-on-surface mb-2 tracking-tight">Assessments (Lembar Soal)</h1>
        <p class="text-on-surface-variant text-sm">Buat dan kelola kumpulan soal layaknya menggunakan Google Forms.</p>
      </div>
      <button @click="handleCreate" class="bg-primary text-on-primary hover:bg-primary/90 px-5 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm whitespace-nowrap">
        <span class="material-symbols-outlined text-[20px]">add</span>
        Buat Lembar Soal
      </button>
    </div>

    <!-- Empty State -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
    </div>
    
    <div v-else-if="assessments.length === 0" class="text-center py-20 bg-surface-container-lowest border border-dashed border-outline-variant/50 rounded-3xl">
      <span class="material-symbols-outlined text-5xl text-outline-variant mb-4">assignment</span>
      <h3 class="text-xl font-bold text-on-surface mb-2">Belum ada Lembar Soal</h3>
      <p class="text-on-surface-variant">Mulai buat lembar soal pertama Anda dengan menekan tombol di atas.</p>
    </div>

    <!-- Grid List -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div 
        v-for="assessment in assessments" 
        :key="assessment.id"
        class="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all group flex flex-col cursor-pointer"
        @click="openBuilder(assessment.id)"
      >
        <div class="h-32 bg-primary/5 border-b border-outline-variant/20 flex items-center justify-center relative">
          <span class="material-symbols-outlined text-[64px] text-primary/20">assignment</span>
          
          <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button @click.stop="handleDelete(assessment.id)" class="bg-surface text-error hover:bg-error/10 w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
              <span class="material-symbols-outlined text-[18px]">delete</span>
            </button>
          </div>
        </div>
        
        <div class="p-4 flex flex-col flex-1">
          <h3 class="font-bold text-on-surface mb-1 truncate">{{ assessment.title }}</h3>
          <p class="text-sm text-on-surface-variant line-clamp-2 mb-4 flex-1">
            {{ assessment.description || 'Tidak ada deskripsi' }}
          </p>
          <div class="flex items-center justify-between text-xs font-bold text-on-surface-variant">
            <span class="flex items-center gap-1"><span class="material-symbols-outlined text-[14px]">format_list_bulleted</span> {{ assessment.questions?.length || 0 }} Soal</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
