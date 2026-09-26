<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getPublicVirtualLabs } from '../../services/builder.service'

const router = useRouter()
const labs = ref([])
const loading = ref(true)

const fetchLabs = async () => {
  try {
    loading.value = true
    const data = await getPublicVirtualLabs()
    const colors = [
      { color: 'from-blue-500/20 to-cyan-500/20', iconColor: 'text-blue-600', icon: 'science' },
      { color: 'from-emerald-500/20 to-teal-500/20', iconColor: 'text-emerald-600', icon: 'water_drop' },
      { color: 'from-purple-500/20 to-pink-500/20', iconColor: 'text-purple-600', icon: 'biotech' },
      { color: 'from-orange-500/20 to-yellow-500/20', iconColor: 'text-orange-600', icon: 'genetics' }
    ]
    labs.value = data.map((lab, index) => {
      const theme = colors[index % colors.length]
      return { ...lab, icon: theme.icon, color: theme.color, iconColor: theme.iconColor }
    })
  } catch (error) {
    console.error('Gagal memuat lab virtual:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLabs()
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 lg:px-12 py-10 w-full flex flex-col gap-8">
    <!-- Header -->
    <div class="flex flex-col gap-2">
      <h1 class="font-display text-headline-lg text-on-surface font-extrabold tracking-tight">Laboratorium Virtual</h1>
      <p class="font-body-md text-on-surface-variant max-w-2xl">Lakukan eksperimen biologi secara virtual langsung dari peramban Anda. Tanpa alat, tanpa batas.</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      <div v-for="i in 3" :key="i" class="bg-surface-container-low h-64 rounded-2xl border border-outline-variant/20"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="labs.length === 0" class="flex flex-col items-center justify-center py-20 bg-surface-container-lowest rounded-3xl border border-surface-container-high/60 text-center px-4">
      <div class="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mb-6 text-outline">
        <span class="material-symbols-outlined text-[40px]">science</span>
      </div>
      <h2 class="text-xl font-bold text-on-surface mb-2">Belum Ada Lab Virtual</h2>
      <p class="text-on-surface-variant max-w-md">Guru belum mempublikasikan lab virtual. Cek kembali nanti!</p>
    </div>

    <!-- Labs Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div
        v-for="lab in labs" :key="lab.id"
        class="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl overflow-hidden flex flex-col shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer"
        @click="router.push('/public/labs/' + lab.id)"
      >
        <!-- Card Image -->
        <div :class="['h-40 relative overflow-hidden flex items-center justify-center bg-gradient-to-br', lab.color]">
          <span :class="['material-symbols-outlined text-[80px] group-hover:scale-110 transition-transform duration-500', lab.iconColor]">{{ lab.icon }}</span>
          <div class="absolute top-3 left-3 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-0.5 rounded-full text-xs text-primary font-bold uppercase">
            {{ lab.engine_type === 'json' ? 'Simulasi' : lab.engine_type?.replace('_', ' ').toUpperCase() || 'Lab' }}
          </div>
        </div>

        <!-- Card Content -->
        <div class="p-6 flex flex-col flex-1 gap-3">
          <h3 class="font-bold text-lg text-on-surface leading-snug group-hover:text-primary transition-colors line-clamp-2">{{ lab.title }}</h3>
          <p class="text-sm text-on-surface-variant line-clamp-2">{{ lab.description || 'Tidak ada deskripsi.' }}</p>
          <div class="mt-auto pt-2">
            <span class="inline-flex items-center gap-1.5 text-primary text-sm font-bold group-hover:gap-2.5 transition-all">
              <span class="material-symbols-outlined text-[18px]">play_circle</span>
              Mulai Eksperimen
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
