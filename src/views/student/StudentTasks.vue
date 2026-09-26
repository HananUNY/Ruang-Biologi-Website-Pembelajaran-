<script setup>
import { ref, onMounted, computed } from 'vue'
import { getStudentSession, getMyAssessments } from '../../services/student.service'

const tasks = ref([])
const loading = ref(true)

onMounted(async () => {
  try {
    const session = getStudentSession()
    if (!session) return
    tasks.value = await getMyAssessments(session.user.id)
  } catch (error) {
    console.error('Gagal memuat tugas:', error)
  } finally {
    loading.value = false
  }
})

const formatDate = (dateStr) => {
  if (!dateStr) return '-'
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'long', timeStyle: 'short' }).format(new Date(dateStr))
}

const getStatusInfo = (task) => {
  const now = new Date()
  const start = task.start_time ? new Date(task.start_time) : null
  const end = task.end_time ? new Date(task.end_time) : null

  if (end && now > end) return { label: 'Selesai', class: 'bg-surface-container text-outline' }
  if (start && now >= start) return { label: 'Berlangsung', class: 'bg-primary/10 text-primary font-bold' }
  return { label: 'Akan Datang', class: 'bg-secondary/10 text-secondary font-bold' }
}
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 lg:px-12 py-10 w-full flex flex-col gap-8">
    <!-- Header -->
    <div class="flex flex-col gap-2">
      <h1 class="font-display text-headline-lg text-on-surface font-extrabold tracking-tight">Tugas & Penilaian</h1>
      <p class="font-body-md text-on-surface-variant max-w-2xl">Daftar ujian dan kuis yang dijadwalkan oleh guru untuk kelas Anda.</p>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="flex flex-col gap-4 animate-pulse">
      <div v-for="i in 3" :key="i" class="bg-surface-container-low h-24 rounded-2xl border border-outline-variant/20"></div>
    </div>

    <!-- Empty State -->
    <div v-else-if="tasks.length === 0" class="flex flex-col items-center justify-center py-20 bg-surface-container-lowest rounded-3xl border border-surface-container-high/60 text-center px-4">
      <div class="w-20 h-20 bg-surface-container-low rounded-full flex items-center justify-center mb-6 text-outline">
        <span class="material-symbols-outlined text-[40px]">assignment</span>
      </div>
      <h2 class="text-xl font-bold text-on-surface mb-2">Belum Ada Tugas</h2>
      <p class="text-on-surface-variant max-w-md">Belum ada ujian atau kuis yang dijadwalkan untuk kelas Anda. Selamat bersantai!</p>
    </div>

    <!-- Tasks List -->
    <div v-else class="flex flex-col gap-4">
      <div
        v-for="task in tasks" :key="task.id"
        class="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
      >
        <div class="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <span class="material-symbols-outlined text-[24px]">{{ task.assessments?.type === 'quiz' ? 'quiz' : 'assignment' }}</span>
        </div>

        <div class="flex-1 min-w-0">
          <div class="flex items-center gap-2 flex-wrap mb-1">
            <h3 class="font-bold text-on-surface text-base leading-snug">{{ task.assessments?.title || 'Ujian' }}</h3>
            <span :class="['text-xs px-2 py-0.5 rounded-full uppercase tracking-wide', getStatusInfo(task).class]">{{ getStatusInfo(task).label }}</span>
          </div>
          <div class="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-on-surface-variant">
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]">class</span>
              {{ task.classes?.name || 'Kelas' }}
            </span>
            <span class="flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]">schedule</span>
              Mulai: {{ formatDate(task.start_time) }}
            </span>
            <span v-if="task.end_time" class="flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]">event_busy</span>
              Berakhir: {{ formatDate(task.end_time) }}
            </span>
          </div>
        </div>

        <span class="px-2 py-0.5 text-xs uppercase tracking-wide rounded bg-surface-container text-on-surface-variant font-bold shrink-0">
          {{ task.assessments?.type === 'quiz' ? 'Kuis' : 'Ujian' }}
        </span>
      </div>
    </div>
  </div>
</template>
