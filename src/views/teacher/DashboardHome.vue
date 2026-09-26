<script setup>
import { ref, onMounted } from 'vue'
import { getDashboardStats, getCourses } from '../../services/course.service'
import { ensureProfileExists } from '../../services/profile.service'

const stats = ref([
  { label: 'Courses', value: 0, icon: 'book', color: 'text-primary' },
  { label: 'Lessons', value: 0, icon: 'description', color: 'text-secondary' },
  { label: 'Questions', value: 0, icon: 'quiz', color: 'text-tertiary' }
])

const recentDrafts = ref([])
const loading = ref(true)

const fetchDashboardData = async () => {
  loading.value = true
  try {
    await ensureProfileExists()
    
    // Fetch stats
    const metrics = await getDashboardStats()
    stats.value[0].value = metrics.courses
    stats.value[1].value = metrics.lessons
    stats.value[2].value = metrics.questions

    // Fetch recent drafts (limit to top 3 newest drafts)
    const allCourses = await getCourses()
    recentDrafts.value = allCourses
      .filter(c => c.status === 'draft')
      .slice(0, 3)
      
  } catch (error) {
    console.error('Error fetching dashboard data:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(date)
}
</script>

<template>
  <div class="flex flex-col gap-8 max-w-6xl mx-auto">
    <!-- Header Greeting -->
    <div>
      <h1 class="font-headline-md text-2xl font-bold text-on-surface">Selamat datang kembali, Guru!</h1>
      <p class="text-on-surface-variant text-sm mt-1">Berikut adalah ringkasan aktivitas authoring Anda hari ini.</p>
    </div>

    <!-- Loading Skeleton (Optional, for now just a spinner) -->
    <div v-if="loading" class="py-12 flex justify-center">
      <span class="material-symbols-outlined text-[48px] text-primary animate-spin">progress_activity</span>
    </div>

    <div v-else class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      <!-- Stats Overview Column -->
      <div class="lg:col-span-2 flex flex-col gap-6">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div v-for="stat in stats" :key="stat.label" class="bg-surface-container-lowest p-5 rounded-2xl shadow-sm border border-outline-variant/20 flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl bg-surface-container flex items-center justify-center">
              <span class="material-symbols-outlined text-[24px]" :class="stat.color">{{ stat.icon }}</span>
            </div>
            <div>
              <p class="text-3xl font-bold text-on-surface tracking-tight">{{ stat.value }}</p>
              <p class="text-sm font-semibold text-outline uppercase tracking-wider">{{ stat.label }}</p>
            </div>
          </div>
        </div>

        <!-- Recent Work Section -->
        <div class="bg-surface-container-lowest rounded-2xl shadow-sm border border-outline-variant/20 overflow-hidden">
          <div class="px-6 py-4 border-b border-outline-variant/20 flex items-center justify-between">
            <h3 class="font-headline-sm font-semibold text-on-surface">Recent Drafts</h3>
            <router-link to="/teacher/courses" class="text-sm font-semibold text-primary hover:underline">Lihat Semua</router-link>
          </div>
          <div class="p-0">
            <div v-if="recentDrafts.length === 0" class="p-8 text-center text-on-surface-variant text-sm">
              Belum ada draft course yang sedang dikerjakan.
            </div>
            <div v-else class="divide-y divide-outline-variant/20">
              <router-link v-for="draft in recentDrafts" :key="draft.id" :to="`/teacher/courses/${draft.id}`" class="px-6 py-4 hover:bg-surface/50 transition-colors flex items-center justify-between group cursor-pointer">
                <div class="flex items-center gap-4">
                  <div class="w-10 h-10 rounded bg-primary/10 flex items-center justify-center text-primary">
                    <span class="material-symbols-outlined">edit_document</span>
                  </div>
                  <div>
                    <h4 class="font-semibold text-on-surface group-hover:text-primary transition-colors">{{ draft.title }}</h4>
                    <p class="text-xs text-on-surface-variant flex items-center gap-1 mt-0.5">
                      <span class="material-symbols-outlined text-[12px]">schedule</span>
                      Diubah pada {{ formatDate(draft.updated_at || draft.created_at) }}
                    </p>
                  </div>
                </div>
                <div class="flex items-center gap-4">
                  <button class="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline group-hover:text-primary transition-colors">
                    <span class="material-symbols-outlined text-[18px]">chevron_right</span>
                  </button>
                </div>
              </router-link>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions Sidebar -->
      <div class="flex flex-col gap-6">
        <div class="bg-primary-container/10 rounded-2xl p-6 border border-primary/20">
          <h3 class="font-headline-sm font-semibold text-on-surface-variant mb-4">Aksi Cepat</h3>
          <div class="flex flex-col gap-3">
            <router-link to="/teacher/courses" class="flex items-center gap-3 w-full bg-primary text-on-primary p-3 rounded-xl hover:bg-primary/90 transition-all shadow-sm font-semibold hover:shadow justify-center">
              <span class="material-symbols-outlined">menu_book</span>
              <span>Kelola Materi (Courses)</span>
            </router-link>
            <router-link to="/teacher/questions" class="flex items-center justify-center gap-3 w-full bg-surface-container-lowest text-on-surface p-3 rounded-xl border border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-low transition-all font-semibold">
              <span class="material-symbols-outlined text-tertiary">quiz</span>
              <span>Bank Soal & Ujian</span>
            </router-link>
            <router-link to="/teacher/classes" class="flex items-center justify-center gap-3 w-full bg-surface-container-lowest text-on-surface p-3 rounded-xl border border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-low transition-all font-semibold">
              <span class="material-symbols-outlined text-secondary">groups</span>
              <span>Manajemen Kelas</span>
            </router-link>
            <router-link to="/teacher/media" class="flex items-center justify-center gap-3 w-full bg-surface-container-lowest text-on-surface p-3 rounded-xl border border-outline-variant/30 hover:border-outline-variant hover:bg-surface-container-low transition-all font-semibold">
              <span class="material-symbols-outlined text-primary">perm_media</span>
              <span>Media Library</span>
            </router-link>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>
