<script setup>
import PublicHeader from '../components/PublicHeader.vue'
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getIndependentVirtualLab } from '../services/builder.service'

const route = useRoute()
const router = useRouter()
const labId = route.params.id

const currentLab = ref(null)
const loading = ref(true)

// State for simulation (if using JSON engine)
const simulationState = ref({})
const isRunning = ref(false)
const result = ref(null)

const fetchLab = async () => {
  try {
    loading.value = true
    const data = await getIndependentVirtualLab(labId)
    
    // Parse JSON config if string
    if (data.engine_type === 'json' && typeof data.engine_config === 'string') {
      try {
        data.engine_config = JSON.parse(data.engine_config)
      } catch (e) {
        console.error("Invalid JSON engine config")
      }
    }

    // Fetch HTML content if it's an uploaded file to prevent forced download in iframe
    if (data.engine_type === 'html_upload' && data.html_file_url) {
      try {
        const response = await fetch(data.html_file_url)
        if (response.ok) {
          const text = await response.text()
          data.html_content = text
          data.engine_type = 'html_raw' // switch to raw to render via srcdoc
        }
      } catch (e) {
        console.error("Failed to fetch HTML content from URL", e)
      }
    }
    
    currentLab.value = data
    
    // Initialize mock controls for JSON engine if empty (for backward compatibility / preview)
    if (currentLab.value.engine_type === 'json') {
      if (!currentLab.value.engine_config || !currentLab.value.engine_config.variables) {
         // Mock
         currentLab.value.mockControls = [
           { id: 'temp', label: 'Suhu (°C)', type: 'range', min: 0, max: 100, step: 1, default: 37 },
           { id: 'ph', label: 'pH Larutan', type: 'range', min: 1, max: 14, step: 1, default: 7 }
         ]
         currentLab.value.mockControls.forEach(ctrl => {
           simulationState.value[ctrl.id] = ctrl.default
         })
      }
    }

  } catch (error) {
    console.error('Error fetching lab:', error)
    alert('Gagal memuat lab virtual.')
    router.push('/public/labs')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLab()
})

const goBack = () => {
  router.push('/public/labs')
}

const runSimulation = () => {
  isRunning.value = true
  result.value = null
  
  // Fake delay for JSON engine processing
  setTimeout(() => {
    isRunning.value = false
    result.value = `Hasil Simulasi (Mock)`
  }, 1500)
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
</script>

<template>
  <div class="w-full flex flex-col min-h-screen bg-surface">
    <!-- Header Navbar -->
    <PublicHeader backLink="/public/labs" />

    <div v-if="loading" class="py-24 flex justify-center w-full">
      <span class="material-symbols-outlined text-[48px] text-primary animate-spin">progress_activity</span>
    </div>

    <!-- Main Content -->
    <main v-else-if="currentLab" class="flex-1 max-w-6xl mx-auto w-full px-6 py-8 flex flex-col lg:flex-row gap-8">
      
      <!-- Canvas Area (Left) -->
      <div class="flex-1 flex flex-col gap-4">
      
        <!-- Deskripsi / Tujuan (Collapsible) -->
        <details class="bg-surface-container-low rounded-2xl border border-outline-variant/30 group [&_summary::-webkit-details-marker]:hidden" open>
          <summary class="font-bold text-lg p-5 cursor-pointer flex items-center justify-between select-none">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">flag</span>
              Tujuan Praktikum
            </div>
            <span class="material-symbols-outlined transition-transform duration-300 group-open:-rotate-180 text-on-surface-variant">expand_more</span>
          </summary>
          <div class="px-5 pb-5 pt-2 border-t border-outline-variant/30 hidden group-open:block animate-fade-in">
            <p class="text-on-surface-variant text-sm leading-relaxed whitespace-pre-wrap">{{ currentLab?.description }}</p>
          </div>
        </details>
        
        <!-- ENGINE VIEW: IFRAME / HTML_RAW / HTML_UPLOAD -->
        <div v-if="['iframe', 'html_raw', 'html_upload'].includes(currentLab.engine_type)" class="w-full bg-white border border-outline-variant/30 rounded-2xl shadow-sm overflow-hidden flex flex-col embed-container relative group/embed">
          <iframe v-if="currentLab.engine_type === 'iframe' || currentLab.engine_type === 'html_upload'" 
                  class="w-full min-h-[65vh] border-0" 
                  :src="currentLab.engine_type === 'iframe' ? currentLab.iframe_url : currentLab.html_file_url" 
                  allowfullscreen>
          </iframe>
          <iframe v-else-if="currentLab.engine_type === 'html_raw'" 
                  class="w-full min-h-[65vh] border-0" 
                  :srcdoc="currentLab.html_content" 
                  allowfullscreen>
          </iframe>
          
          <button @click="toggleFullscreen" class="absolute top-4 right-4 bg-black/60 text-white w-12 h-12 flex items-center justify-center rounded-xl opacity-0 group-hover/embed:opacity-100 transition-opacity backdrop-blur hover:bg-black/80 shadow-lg" title="Fullscreen">
            <span class="material-symbols-outlined">fullscreen</span>
          </button>
        </div>

        <!-- ENGINE VIEW: JSON (MOCKUP/NATIVE) -->
        <div v-else class="w-full aspect-video bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm relative overflow-hidden flex flex-col items-center justify-center">
          <!-- Animated Background Grid -->
          <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
          
          <div v-if="isRunning" class="relative z-10 flex flex-col items-center gap-4">
            <span class="material-symbols-outlined text-[64px] text-primary animate-spin">science</span>
            <p class="font-bold text-primary animate-pulse">Menjalankan Simulasi...</p>
          </div>
          
          <div v-else-if="result" class="relative z-10 flex flex-col items-center gap-4 p-8 text-center bg-surface/80 backdrop-blur-sm rounded-2xl border border-primary/20 shadow-lg">
            <span class="material-symbols-outlined text-[64px] text-secondary">check_circle</span>
            <h3 class="text-2xl font-bold text-on-surface">Eksperimen Selesai</h3>
            <p class="text-lg text-on-surface-variant font-medium">{{ result }}</p>
            <button @click="result = null" class="mt-4 px-6 py-2 bg-surface-container-high rounded-full font-bold hover:bg-surface-container transition-colors">Reset Canvas</button>
          </div>
          
          <div v-else class="relative z-10 flex flex-col items-center gap-4 opacity-50">
            <span class="material-symbols-outlined text-[80px] text-outline">science</span>
            <p class="font-medium text-outline">Kanvas Simulasi Siap (JSON Engine)</p>
          </div>
        </div>
      </div>

      <!-- Sidebar Area (Right) -->
      <div class="w-full lg:w-80 flex flex-col gap-6 shrink-0">
      
        <!-- Petunjuk Praktikum (Sidebar Collapsible) -->
        <details v-if="currentLab?.instructions" class="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm group [&_summary::-webkit-details-marker]:hidden" open>
          <summary class="font-bold text-lg p-5 cursor-pointer flex items-center justify-between select-none transition-colors">
            <div class="flex items-center gap-2">
              <span class="material-symbols-outlined text-primary">list_alt</span>
              Petunjuk Praktikum
            </div>
            <span class="material-symbols-outlined transition-transform duration-300 group-open:-rotate-180 text-on-surface-variant">expand_more</span>
          </summary>
          <div class="px-5 pb-5 pt-2 border-t border-outline-variant/30 hidden group-open:block animate-fade-in">
            <p class="text-on-surface-variant text-sm leading-relaxed whitespace-pre-wrap">{{ currentLab.instructions }}</p>
          </div>
        </details>
        
        <!-- Control Panel (Only for JSON engine) -->
        <div v-if="currentLab.engine_type === 'json' && currentLab.mockControls" class="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
          <div class="flex items-center gap-2 mb-6 border-b border-outline-variant/30 pb-4">
            <span class="material-symbols-outlined text-primary">tune</span>
            <h2 class="font-bold text-lg text-on-surface">Panel Kontrol</h2>
          </div>

          <div class="flex flex-col gap-6">
            <div v-for="ctrl in currentLab?.mockControls" :key="ctrl.id" class="flex flex-col gap-2">
              <label :for="ctrl.id" class="text-sm font-bold text-on-surface flex justify-between">
                {{ ctrl.label }}
                <span v-if="ctrl.type === 'range'" class="text-primary font-mono bg-primary/10 px-2 rounded">{{ simulationState[ctrl.id] }}</span>
              </label>
              
              <input 
                v-if="ctrl.type === 'range'" 
                :id="ctrl.id"
                type="range" 
                :min="ctrl.min" 
                :max="ctrl.max" 
                :step="ctrl.step" 
                v-model.number="simulationState[ctrl.id]"
                class="w-full accent-primary h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            <button 
              @click="runSimulation" 
              :disabled="isRunning"
              class="w-full mt-4 py-3 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-all active:scale-95 shadow-md disabled:opacity-50 disabled:active:scale-100"
            >
              <span class="material-symbols-outlined text-[20px]">{{ isRunning ? 'hourglass_empty' : 'play_arrow' }}</span>
              {{ isRunning ? 'Memproses...' : 'Mulai Reaksi' }}
            </button>
          </div>
        </div>

        <div v-else class="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
           <div class="flex items-center gap-2 mb-4 border-b border-outline-variant/30 pb-4">
            <span class="material-symbols-outlined text-primary">data_info_alert</span>
            <h2 class="font-bold text-lg text-on-surface">Info Lab</h2>
          </div>
          <div class="flex items-center gap-2 text-sm text-on-surface-variant">
            <span class="material-symbols-outlined text-[18px]">verified</span>
            <span>Didukung oleh: <strong>{{ currentLab.engine_type.replace('_', ' ').toUpperCase() }} Engine</strong></span>
          </div>
          <p class="text-xs text-outline mt-4 leading-relaxed">
            Eksperimen ini dijalankan secara interaktif. Silakan gunakan kontrol yang tersedia di dalam kanvas simulasi.
          </p>
        </div>
        
        <!-- Call to Action for more feature -->
        <div class="bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 rounded-2xl p-5">
          <div class="flex items-start gap-3">
            <span class="material-symbols-outlined text-primary mt-0.5">info</span>
            <div>
              <h4 class="font-bold text-sm text-on-surface mb-1">Versi Lengkap</h4>
              <p class="text-xs text-on-surface-variant leading-relaxed mb-3">Login sebagai siswa untuk menyimpan log laporan eksperimen dan kuis analisis data.</p>
              <router-link to="/student/login" class="text-xs font-bold text-primary hover:underline">Login Sekarang &rarr;</router-link>
            </div>
          </div>
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
