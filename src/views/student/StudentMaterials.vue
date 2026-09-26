<script setup>
import { ref, onMounted, computed } from 'vue'
import { getStudentSession, getMyCourses } from '../../services/student.service'
import { useRouter, useRoute } from 'vue-router'

const myCourses = ref([])
const loading = ref(true)
const router = useRouter()
const route = useRoute()

const filteredCourses = computed(() => {
  const q = route.query.q?.toLowerCase() || ''
  if (!q) return myCourses.value
  return myCourses.value.filter(c =>
    c.title?.toLowerCase().includes(q) ||
    c.description?.toLowerCase().includes(q) ||
    c.teacherName?.toLowerCase().includes(q)
  )
})

onMounted(async () => {
  try {
    const session = await getStudentSession()
    if (!session) {
      router.push('/student/login')
      return
    }
    
    // Fetch courses the student is allowed to see (public + assigned classes)
    myCourses.value = await getMyCourses(session.user.id)
    
  } catch (error) {
    console.error('Failed to load classes:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 lg:px-12 py-10 w-full flex flex-col gap-8">
    <!-- Header -->
    <div class="flex flex-col gap-2">
      <h1 class="font-display text-headline-lg text-on-surface font-extrabold tracking-tight">Materi Pembelajaran</h1>
      <p class="font-body-md text-on-surface-variant max-w-2xl">Akses modul pembelajaran dari kelas yang Anda ikuti. Mulai dari konsep dasar hingga eksplorasi laboratorium tingkat lanjut.</p>
      <div v-if="route.query.q" class="flex items-center gap-2 mt-1">
        <span class="text-sm text-on-surface-variant">Hasil pencarian untuk:</span>
        <span class="px-2 py-0.5 bg-primary/10 text-primary text-sm font-bold rounded-lg">{{ route.query.q }}</span>
        <router-link :to="{ name: 'StudentMaterials' }" class="text-sm text-outline hover:text-error transition-colors flex items-center gap-0.5">
          <span class="material-symbols-outlined text-[16px]">close</span>
          Hapus
        </router-link>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
      <div v-for="i in 3" :key="i" class="bg-surface-container-low h-64 rounded-2xl border border-outline-variant/20"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredCourses.length === 0" class="flex flex-col items-center justify-center py-20 bg-surface-container-lowest rounded-3xl border border-surface-container-high/60 shadow-sm text-center px-4">
      <div class="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mb-6 text-outline">
        <span class="material-symbols-outlined text-[40px]">search_off</span>
      </div>
      <h2 class="text-xl font-bold text-on-surface mb-2">{{ route.query.q ? 'Tidak Ditemukan' : 'Belum Ada Materi' }}</h2>
      <p class="text-on-surface-variant max-w-md">{{ route.query.q ? `Tidak ada materi yang cocok dengan "${route.query.q}".` : 'Saat ini tidak ada materi yang tersedia untuk kelas Anda.' }}</p>
    </div>

    <!-- Courses Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <router-link :to="`/student/courses/${c.id}`" v-for="c in filteredCourses" :key="c.id" class="bg-surface-container-lowest border border-outline-variant/30 rounded-3xl overflow-hidden flex flex-col shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group cursor-pointer block">
        <!-- Card Image Placeholder -->
        <div class="h-40 bg-surface-container-low relative overflow-hidden flex items-center justify-center">
          <img v-if="c.cover_url" :src="c.cover_url" class="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Course Cover">
          <div v-else class="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20"></div>
          <span v-if="!c.cover_url" class="material-symbols-outlined text-[80px] text-primary/30 z-10 group-hover:scale-110 transition-transform duration-500">menu_book</span>
        </div>
        
        <!-- Card Content -->
        <div class="p-6 flex flex-col flex-1 gap-4">
          <div class="flex items-start justify-between gap-4">
            <div>
              <h3 class="font-bold text-lg text-on-surface leading-snug group-hover:text-primary transition-colors line-clamp-2">{{ c.title }}</h3>
              <p class="text-sm text-on-surface-variant mt-1 line-clamp-2">{{ c.description || 'Tidak ada deskripsi' }}</p>
            </div>
          </div>
          
          <div class="flex items-center gap-2 mt-auto">
            <div class="w-6 h-6 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant font-bold text-[10px]">
              {{ c.teacherName ? c.teacherName.charAt(0).toUpperCase() : 'G' }}
            </div>
            <span class="text-sm font-medium text-on-surface-variant truncate">Guru: {{ c.teacherName }}</span>
          </div>
        </div>
      </router-link>
    </div>

  </div>
</template>
