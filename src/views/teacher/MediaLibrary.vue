<script setup>
import { ref, onMounted, computed } from 'vue'
import { getSession } from '../../services/auth.service'
import { uploadMediaFile, getTeacherMedia, getPublicUrl, deleteMedia } from '../../services/media.service'

const mediaList = ref([])
const loading = ref(true)
const uploading = ref(false)
const dragOver = ref(false)
const searchQuery = ref('')
const filterType = ref('all') // all, image, video, document, lab
const currentUser = ref(null)
const fileInput = ref(null)

const fetchMedia = async () => {
  loading.value = true
  try {
    const session = await getSession()
    if (session?.user) {
      currentUser.value = session.user
      mediaList.value = await getTeacherMedia(session.user.id)
    }
  } catch (error) {
    console.error('Failed to load media:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchMedia()
})

const handleFileUpload = async (event) => {
  const files = event.target.files || event.dataTransfer?.files
  if (!files || files.length === 0) return
  
  dragOver.value = false
  uploading.value = true
  
  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (file.size > 50 * 1024 * 1024) {
        alert(`File ${file.name} terlalu besar. Maksimal 50MB.`)
        continue
      }
      await uploadMediaFile(file, currentUser.value.id)
    }
    await fetchMedia()
  } catch (error) {
    alert('Gagal mengupload file: ' + error.message)
  } finally {
    uploading.value = false
    if (fileInput.value) fileInput.value.value = ''
  }
}

const removeMedia = async (media) => {
  if (confirm(`Yakin ingin menghapus ${media.file_name}?`)) {
    try {
      await deleteMedia(media.id, media.storage_path)
      mediaList.value = mediaList.value.filter(m => m.id !== media.id)
    } catch (error) {
      alert('Gagal menghapus file: ' + error.message)
    }
  }
}

const copyLink = (media) => {
  const url = getPublicUrl(media.storage_path)
  navigator.clipboard.writeText(url)
  alert('Link berhasil disalin!')
}

const getCategory = (fileType) => {
  if (fileType.startsWith('image/')) return 'image'
  if (fileType.startsWith('video/')) return 'video'
  if (fileType === 'text/html') return 'lab'
  return 'document'
}

const filteredMedia = computed(() => {
  return mediaList.value.filter(media => {
    const matchesSearch = media.file_name.toLowerCase().includes(searchQuery.value.toLowerCase())
    const cat = getCategory(media.file_type)
    const matchesType = filterType.value === 'all' || cat === filterType.value
    return matchesSearch && matchesType
  })
})

const groupedMedia = computed(() => {
  const groups = {
    image: { title: 'Gambar', icon: 'image', color: 'text-primary', items: [] },
    video: { title: 'Video', icon: 'smart_display', color: 'text-secondary', items: [] },
    lab: { title: 'Lab Virtual (HTML)', icon: 'science', color: 'text-tertiary', items: [] },
    document: { title: 'Dokumen', icon: 'description', color: 'text-outline', items: [] }
  }
  
  filteredMedia.value.forEach(media => {
    const cat = getCategory(media.file_type)
    if (groups[cat]) {
      groups[cat].items.push(media)
    } else {
      groups.document.items.push(media)
    }
  })
  
  return groups
})

const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes'
  const k = 1024
  const dm = decimals < 0 ? 0 : decimals
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`
}

const showHtmlPreview = ref(false)
const htmlPreviewContent = ref('')

const openPreview = async (media) => {
  if (getCategory(media.file_type) === 'lab') {
    try {
      const url = getPublicUrl(media.storage_path)
      const response = await fetch(url)
      htmlPreviewContent.value = await response.text()
      showHtmlPreview.value = true
    } catch (e) {
      alert('Gagal memuat preview HTML.')
    }
  } else {
    window.open(getPublicUrl(media.storage_path), '_blank')
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto py-8 px-4">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-extrabold text-on-surface mb-2 tracking-tight">Media Library</h1>
        <p class="text-on-surface-variant text-sm">Kelola semua file gambar, video, dan file lab (HTML) Anda di satu tempat.</p>
      </div>
      <button @click="fileInput.click()" class="bg-primary text-on-primary hover:bg-primary/90 px-5 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm whitespace-nowrap">
        <span class="material-symbols-outlined text-[20px]">cloud_upload</span>
        Upload File
      </button>
      <input type="file" ref="fileInput" class="hidden" multiple @change="handleFileUpload" accept="image/*,video/*,text/html,application/pdf" />
    </div>

    <!-- Dropzone Area -->
    <div 
      class="border-2 border-dashed rounded-3xl p-12 text-center transition-all duration-300 mb-8"
      :class="dragOver ? 'border-primary bg-primary/5' : 'border-outline-variant/40 bg-surface-container-lowest hover:bg-surface'"
      @dragover.prevent="dragOver = true"
      @dragleave.prevent="dragOver = false"
      @drop.prevent="handleFileUpload"
    >
      <div v-if="uploading" class="flex flex-col items-center justify-center">
        <span class="material-symbols-outlined text-4xl text-primary animate-spin mb-4">progress_activity</span>
        <p class="text-on-surface font-bold">Sedang mengupload...</p>
      </div>
      <div v-else>
        <div class="w-16 h-16 bg-primary-container text-on-primary-container rounded-2xl flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-3xl">upload_file</span>
        </div>
        <h3 class="text-lg font-bold text-on-surface mb-2">Tarik dan lepas file di sini</h3>
        <p class="text-on-surface-variant text-sm mb-4">atau klik tombol upload di kanan atas (Maks. 50MB per file)</p>
        <p class="text-xs text-on-surface-variant font-medium uppercase tracking-wider">Mendukung: JPG, PNG, MP4, PDF, HTML (Lab)</p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-surface-container-lowest border border-outline-variant/30 p-4 rounded-2xl flex flex-col sm:flex-row gap-4 mb-8">
      <div class="relative flex-1">
        <span class="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
        <input 
          v-model="searchQuery" 
          type="text" 
          placeholder="Cari nama file..." 
          class="w-full pl-11 pr-4 py-3 bg-surface rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface text-sm"
        >
      </div>
      <div class="sm:w-48 shrink-0">
        <select v-model="filterType" class="w-full px-4 py-3 bg-surface rounded-xl border border-outline-variant/50 focus:border-primary outline-none transition-all text-on-surface text-sm appearance-none">
          <option value="all">Semua Tipe</option>
          <option value="image">Gambar</option>
          <option value="video">Video</option>
          <option value="lab">File Lab (HTML)</option>
          <option value="document">Dokumen / PDF</option>
        </select>
      </div>
    </div>

    <!-- Media Grid -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
    </div>
    
    <div v-else-if="filteredMedia.length === 0" class="text-center py-20 bg-surface-container-lowest border border-dashed border-outline-variant/50 rounded-3xl">
      <span class="material-symbols-outlined text-5xl text-outline-variant mb-4">folder_open</span>
      <h3 class="text-xl font-bold text-on-surface mb-2">Media Kosong</h3>
      <p class="text-on-surface-variant">Belum ada file media yang sesuai dengan pencarian Anda.</p>
    </div>

    <div v-else class="flex flex-col gap-10">
      <div v-for="(group, key) in groupedMedia" :key="key">
        <div v-if="group.items.length > 0">
          <div class="flex items-center gap-2 mb-4 border-b border-outline-variant/30 pb-2">
            <span class="material-symbols-outlined" :class="group.color">{{ group.icon }}</span>
            <h2 class="text-xl font-bold text-on-surface">{{ group.title }} <span class="text-on-surface-variant text-sm font-normal">({{ group.items.length }})</span></h2>
          </div>
          <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            <div 
              v-for="media in group.items" 
              :key="media.id"
              class="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden group/item flex flex-col hover:shadow-md hover:border-primary/30 transition-all"
            >
              <!-- Preview Box -->
              <div class="aspect-square bg-surface-container relative overflow-hidden flex items-center justify-center">
                <img 
                  v-if="key === 'image'" 
                  :src="getPublicUrl(media.storage_path)" 
                  class="w-full h-full object-cover"
                >
                <span v-else-if="key === 'video'" class="material-symbols-outlined text-[64px] text-secondary/40">smart_display</span>
                <span v-else-if="key === 'lab'" class="material-symbols-outlined text-[64px] text-tertiary/40">science</span>
                <span v-else class="material-symbols-outlined text-[64px] text-outline-variant/40">description</span>
                
                <!-- Hover Actions -->
                <div class="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-3 opacity-0 group-hover/item:opacity-100 transition-opacity backdrop-blur-sm">
                  <button @click="openPreview(media)" class="bg-white/20 hover:bg-white/30 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors" title="Lihat">
                    <span class="material-symbols-outlined text-[20px]">visibility</span>
                  </button>
                  <button @click="copyLink(media)" class="bg-primary hover:bg-primary/90 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg" title="Salin URL">
                    <span class="material-symbols-outlined text-[20px]">link</span>
                  </button>
                  <button @click="removeMedia(media)" class="bg-error hover:bg-error/90 text-white w-10 h-10 rounded-full flex items-center justify-center transition-colors shadow-lg" title="Hapus File">
                    <span class="material-symbols-outlined text-[20px]">delete</span>
                  </button>
                </div>
              </div>
              
              <!-- Info -->
              <div class="p-3">
                <p class="font-bold text-sm text-on-surface truncate mb-1" :title="media.file_name">{{ media.file_name }}</p>
                <div class="flex items-center justify-between text-xs text-on-surface-variant font-medium">
                  <span class="uppercase tracking-wider">{{ formatBytes(media.size_bytes) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- HTML Preview Modal -->
    <div v-if="showHtmlPreview" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div class="bg-surface rounded-3xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-outline-variant/20">
        <div class="flex items-center justify-between p-4 border-b border-outline-variant/30 bg-surface-container-lowest shrink-0">
          <div class="flex items-center gap-3">
            <span class="material-symbols-outlined text-tertiary">science</span>
            <h3 class="font-bold text-lg text-on-surface">Preview Lab Virtual (HTML)</h3>
          </div>
          <button @click="showHtmlPreview = false" class="w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface-variant transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="flex-1 bg-white relative">
          <iframe :srcdoc="htmlPreviewContent" class="w-full h-full border-0 absolute inset-0" allowfullscreen></iframe>
        </div>
      </div>
    </div>
  </div>
</template>
