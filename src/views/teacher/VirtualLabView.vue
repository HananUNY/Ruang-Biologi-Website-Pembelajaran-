<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { getIndependentVirtualLabs, createIndependentVirtualLab, getAllVirtualLabs, updateIndependentVirtualLab } from '../../services/builder.service'

const router = useRouter()
const independentLabs = ref([])
const courseLabs = ref([])
const loading = ref(true)
const showCreateModal = ref(false)
const newLabTitle = ref('')
const isCreating = ref(false)
const activeFilter = ref('all') // 'all' | 'published' | 'draft'
const togglingId = ref(null) // lab ID yang sedang diproses toggle

const fetchLabs = async () => {
  try {
    loading.value = true
    const [indepData, courseData] = await Promise.all([
      getIndependentVirtualLabs(),
      getAllVirtualLabs()
    ])
    independentLabs.value = indepData || []
    courseLabs.value = courseData || []
  } catch (error) {
    console.error('Error fetching labs:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLabs()
})

const combinedLabs = computed(() => {
  const indep = independentLabs.value.map(lab => ({
    ...lab,
    isIndependent: true,
    sourceLabel: 'Lab Mandiri'
  }))
  const cLabs = courseLabs.value.map(lab => ({
    ...lab,
    isIndependent: false,
    sourceLabel: `Course: ${lab.modules?.courses?.title || 'Unknown'}`
  }))
  return [...indep, ...cLabs].sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
})

const filteredLabs = computed(() => {
  if (activeFilter.value === 'all') return combinedLabs.value
  return combinedLabs.value.filter(lab => lab.status === activeFilter.value)
})

const filterCounts = computed(() => ({
  all: combinedLabs.value.length,
  published: combinedLabs.value.filter(l => l.status === 'published').length,
  draft: combinedLabs.value.filter(l => l.status !== 'published').length,
}))

const getLabThumbnail = (lab) => {
  return lab.thumbnail_url || 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?q=80&w=400&auto=format&fit=crop'
}

const goToEdit = (lab) => {
  if (lab.isIndependent) {
    router.push(`/teacher/labs/${lab.id}/edit`)
  } else {
    if (lab.modules && lab.modules.courses) {
      router.push(`/teacher/courses/${lab.modules.courses.id}/lessons/${lab.id}/edit`)
    }
  }
}

const toggleStatus = async (lab) => {
  if (!lab.isIndependent) return // Hanya lab mandiri yang bisa diubah statusnya di sini
  const newStatus = lab.status === 'published' ? 'draft' : 'published'
  togglingId.value = lab.id
  try {
    await updateIndependentVirtualLab(lab.id, { status: newStatus })
    // Update lokal tanpa refetch
    const idx = independentLabs.value.findIndex(l => l.id === lab.id)
    if (idx !== -1) independentLabs.value[idx].status = newStatus
  } catch (error) {
    console.error('Gagal mengubah status lab:', error)
    alert('Gagal mengubah status. Coba lagi.')
  } finally {
    togglingId.value = null
  }
}

const handleCreateLab = async () => {
  if (!newLabTitle.value.trim()) return
  try {
    isCreating.value = true
    const newLab = await createIndependentVirtualLab(newLabTitle.value.trim())
    showCreateModal.value = false
    newLabTitle.value = ''
    router.push(`/teacher/labs/${newLab.id}/edit`)
  } catch (error) {
    console.error('Error creating lab:', error)
    alert('Gagal membuat lab.')
  } finally {
    isCreating.value = false
  }
}
</script>


<template>
  <div class="max-w-6xl mx-auto flex flex-col gap-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="font-headline-md text-2xl font-bold text-on-surface">Koleksi Virtual Lab</h1>
        <p class="text-on-surface-variant text-sm mt-1">Kelola simulasi mandiri maupun eksperimen di dalam modul Course Anda.</p>
      </div>
      <button @click="showCreateModal = true" class="bg-primary text-on-primary px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-all shadow-sm font-semibold flex items-center gap-2">
        <span class="material-symbols-outlined text-[20px]">add</span>
        Buat Lab Mandiri
      </button>
    </div>

    <!-- Stats/Filter Bar -->
    <div class="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
      <div class="flex items-center gap-2 text-sm font-semibold">
        <button @click="activeFilter = 'all'" :class="['px-4 py-2 rounded-lg transition-colors', activeFilter === 'all' ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container-low text-on-surface-variant']">Semua <span class="text-xs opacity-60">({{ filterCounts.all }})</span></button>
        <button @click="activeFilter = 'published'" :class="['px-4 py-2 rounded-lg transition-colors', activeFilter === 'published' ? 'bg-primary/10 text-primary' : 'hover:bg-surface-container-low text-on-surface-variant']">Published <span class="text-xs opacity-60">({{ filterCounts.published }})</span></button>
        <button @click="activeFilter = 'draft'" :class="['px-4 py-2 rounded-lg transition-colors', activeFilter === 'draft' ? 'bg-surface-container text-on-surface' : 'hover:bg-surface-container-low text-on-surface-variant']">Draft <span class="text-xs opacity-60">({{ filterCounts.draft }})</span></button>
      </div>
      <div class="relative w-full sm:w-72">
        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
        <input 
          type="text" 
          placeholder="Cari simulasi lab..." 
          class="w-full pl-10 pr-4 py-2 rounded-xl border border-outline-variant/50 bg-surface focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
        />
      </div>
    </div>

    <div v-if="loading" class="py-12 flex justify-center">
      <span class="material-symbols-outlined text-[48px] text-primary animate-spin">progress_activity</span>
    </div>

    <!-- Virtual Labs Grid -->
    <div v-else-if="filteredLabs.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="lab in filteredLabs" :key="lab.id" class="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/30 overflow-hidden group hover:shadow-md transition-shadow flex flex-col relative">
        
        <div class="h-40 relative overflow-hidden bg-surface-container-high">
          <img :src="getLabThumbnail(lab)" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="thumbnail" />
          
          <div class="absolute top-3 left-3 flex gap-2">
            <span v-if="lab.isIndependent" class="bg-secondary/90 backdrop-blur text-white text-[10px] font-bold uppercase px-2 py-1 rounded-md tracking-wider flex items-center gap-1">
              <span class="material-symbols-outlined text-[12px]">science</span> Mandiri
            </span>
            <span v-else class="bg-tertiary/90 backdrop-blur text-white text-[10px] font-bold uppercase px-2 py-1 rounded-md tracking-wider flex items-center gap-1">
              <span class="material-symbols-outlined text-[12px]">book</span> Course
            </span>
          </div>

          <div class="absolute top-3 right-3">
            <span v-if="lab.status === 'published'" class="bg-primary/90 backdrop-blur text-white text-[10px] font-bold uppercase px-2 py-1 rounded-md tracking-wider">
              Published
            </span>
            <span v-else class="bg-surface-variant/90 backdrop-blur text-on-surface-variant text-[10px] font-bold uppercase px-2 py-1 rounded-md tracking-wider">
              Draft
            </span>
          </div>
        </div>
        
        <div class="p-5 flex-1 flex flex-col">
          <div class="text-xs font-bold text-primary uppercase tracking-wider mb-2 flex items-center gap-1">
             {{ lab.sourceLabel }}
          </div>
          <h3 class="font-headline-sm font-bold text-on-surface mb-2 leading-tight group-hover:text-primary transition-colors line-clamp-1">{{ lab.title }}</h3>
          <p class="text-sm text-on-surface-variant line-clamp-2 mb-4 flex-1">
            {{ lab.isIndependent ? (lab.description || 'Belum ada deskripsi') : `Modul: ${lab.modules?.title}` }}
          </p>
          
          <div class="pt-4 border-t border-outline-variant/30 flex items-center justify-between gap-2">
            <button @click="goToEdit(lab)" class="text-primary font-bold text-sm hover:underline flex items-center gap-1">
              Buka Editor
              <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
            </button>
            <!-- Toggle Status — hanya untuk Lab Mandiri -->
            <button
              v-if="lab.isIndependent"
              @click="toggleStatus(lab)"
              :disabled="togglingId === lab.id"
              :class="[
                'flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold transition-all disabled:opacity-60',
                lab.status === 'published'
                  ? 'bg-surface-container-high text-on-surface-variant hover:bg-error/10 hover:text-error'
                  : 'bg-primary/10 text-primary hover:bg-primary/20'
              ]"
            >
              <span v-if="togglingId === lab.id" class="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
              <span v-else class="material-symbols-outlined text-[14px]">{{ lab.status === 'published' ? 'unpublished' : 'publish' }}</span>
              {{ lab.status === 'published' ? 'Jadikan Draft' : 'Publish' }}
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <div v-else class="py-12 flex flex-col items-center justify-center text-center">
      <span class="material-symbols-outlined text-[48px] text-outline mb-4">science</span>
      <p class="text-on-surface-variant text-sm max-w-sm">
        {{ activeFilter !== 'all' ? `Tidak ada lab dengan status ${activeFilter}.` : 'Anda belum memiliki Virtual Lab. Buat Lab Mandiri sekarang atau tambahkan di dalam Course.' }}
      </p>
    </div>
    
    <!-- Modal Buat Lab Baru -->
    <div v-if="showCreateModal" class="fixed inset-0 z-50 flex items-center justify-center bg-on-surface/50 backdrop-blur-sm p-4">
      <div class="bg-surface-container-lowest w-full max-w-md rounded-2xl p-6 shadow-xl relative">
        <h2 class="text-xl font-bold text-on-surface mb-4">Buat Virtual Lab Mandiri</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-bold text-on-surface mb-1">Judul Lab</label>
            <input v-model="newLabTitle" type="text" placeholder="Misal: Uji Enzim Katalase" class="w-full px-4 py-2.5 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm bg-surface" @keyup.enter="handleCreateLab">
          </div>
        </div>
        
        <div class="flex justify-end gap-3 mt-8">
          <button @click="showCreateModal = false" class="px-4 py-2 text-sm font-bold text-on-surface-variant hover:bg-surface-container rounded-lg transition-colors">Batal</button>
          <button @click="handleCreateLab" :disabled="!newLabTitle.trim() || isCreating" class="px-5 py-2 text-sm font-bold bg-primary text-on-primary rounded-lg hover:bg-primary-container hover:text-on-primary-container disabled:opacity-50 transition-colors flex items-center gap-2">
            <span v-if="isCreating" class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
            Buat Lab
          </button>
        </div>
      </div>
    </div>

  </div>
</template>
