<script setup>
import PublicHeader from '../components/PublicHeader.vue'
import { ref, onMounted } from 'vue'
import { getPublicVirtualLabs } from '../services/builder.service'

const publicLabs = ref([])
const loading = ref(true)

const fetchLabs = async () => {
  try {
    loading.value = true
    const data = await getPublicVirtualLabs()
    
    // Map the database structure to include color/icon logic
    publicLabs.value = data.map((lab, index) => {
      // Dynamic colors and icons based on index just to make it look nice
      const colors = [
        { color: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-blue-600', icon: 'science' },
        { color: 'from-emerald-500/20 to-teal-500/20', iconColor: 'text-emerald-600', icon: 'water_drop' },
        { color: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-600', icon: 'biotech' },
        { color: 'from-orange-500/20 to-yellow-500/20', iconColor: 'text-orange-600', icon: 'genetics' }
      ]
      
      const theme = colors[index % colors.length]
      
      return {
        ...lab,
        icon: theme.icon,
        color: theme.color,
        iconColor: theme.iconColor,
      }
    })
  } catch (error) {
    console.error("Gagal mengambil data lab virtual", error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLabs()
})
</script>

<template>
  <PublicHeader />

  <main class="w-full min-h-screen bg-surface py-12">
    <div class="max-w-7xl mx-auto px-6 lg:px-12">
      <div class="flex flex-col gap-8">
        <div class="flex flex-col gap-2">
          <h1 class="text-3xl font-bold text-on-surface font-headline-md tracking-tight">Laboratorium Virtual Publik</h1>
          <p class="text-on-surface-variant font-body">Eksplorasi dan lakukan eksperimen biologi secara virtual tanpa batas ruang dan alat.</p>
        </div>
        
        <div v-if="loading" class="flex justify-center py-20">
          <span class="material-symbols-outlined text-[48px] text-primary animate-spin">progress_activity</span>
        </div>
        
        <div v-else-if="publicLabs.length === 0" class="flex flex-col items-center justify-center py-20 bg-surface-container-lowest rounded-2xl border border-dashed border-outline-variant/50">
           <span class="material-symbols-outlined text-[64px] text-outline mb-4">science</span>
           <h3 class="text-xl font-bold text-on-surface">Belum Ada Lab</h3>
           <p class="text-on-surface-variant text-center max-w-md mt-2">Daftar lab virtual publik masih kosong. Guru dapat membuatnya melalui Dashboard Guru.</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div v-for="lab in publicLabs" :key="lab.id" class="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between border border-outline-variant/30 group">
            <div class="flex flex-col">
              <div :class="['relative h-44 w-full overflow-hidden flex items-center justify-center bg-gradient-to-br', lab.color]">
                <span :class="['material-symbols-outlined text-[80px] group-hover:scale-110 transition-transform duration-500', lab.iconColor]">{{ lab.icon }}</span>
                <div class="absolute top-3 left-3 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-0.5 rounded-full text-xs text-primary font-bold uppercase">
                  {{ lab.engine_type === 'json' ? 'Simulasi' : lab.engine_type.replace('_', ' ').toUpperCase() }}
                </div>
              </div>
              <div class="p-6 flex flex-col gap-2">
                <h3 class="text-xl text-on-surface font-bold leading-snug">{{ lab.title }}</h3>
                <p class="text-sm text-on-surface-variant line-clamp-3 pt-1">
                  {{ lab.description || 'Tidak ada deskripsi.' }}
                </p>
              </div>
            </div>
            <div class="p-6 pt-0 mt-auto">
              <router-link :to="'/public/labs/' + lab.id" class="inline-flex items-center gap-1 text-primary text-sm font-bold hover:underline w-full justify-center bg-primary/10 py-2.5 rounded-lg transition-colors hover:bg-primary/20">
                <span class="">Buka Lab Virtual</span>
                <span class="material-symbols-outlined text-[16px]">play_arrow</span>
              </router-link>
            </div>
            </div>
          </div>
      </div>
    </div>
  </main>
</template>
