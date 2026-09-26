<script setup>
import { ref, onMounted } from 'vue'
import { getStudentSession, getMyClasses, getMyAssessments, getMyCourses } from '../../services/student.service'

const userName = ref('')
const loading = ref(true)

const myClasses = ref([])
const myTasks = ref([])
const nextCourse = ref(null)

onMounted(async () => {
  try {
    const session = await getStudentSession()
    if (session?.user) {
      // Dapatkan nama dari session user metadata
      userName.value = session.user.user_metadata?.full_name || 'Siswa'
      
      // Nantinya bisa ditambahkan logika ambil kelas dan tugas spesifik siswa
      // myClasses.value = await getMyClasses(session.user.id)
      // myTasks.value = await getMyAssessments(session.user.id)
      const courses = await getMyCourses(session.user.id)
      if (courses.length > 0) {
        nextCourse.value = courses[0]
      }
    }
  } catch (error) {
    console.error('Failed to load student dashboard:', error)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="max-w-6xl mx-auto px-6 lg:px-12 py-10 flex flex-col gap-10 w-full">
    
    <!-- Welcome Banner -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-surface-container-lowest p-8 rounded-2xl shadow-sm border border-surface-container-high/60 transition-all hover:shadow-md">
      <div class="flex flex-col gap-2 max-w-2xl">
        <div class="flex items-center gap-2">
          <span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-label-sm font-bold uppercase tracking-wider"><span class="w-2 h-2 rounded-full bg-primary animate-pulse"></span>Fase F • Kelas XI MIPA</span>
          <span class="text-outline text-body-sm">•</span>
          <span class="text-on-surface-variant font-label-md text-label-md">Kurikulum Merdeka</span>
        </div>
        <h1 class="font-sf-rounded text-3xl lg:text-4xl text-on-surface font-extrabold tracking-tight">
          Selamat datang di Kelas Biologi, {{ userName.split(' ')[0] }}! <span class="inline-block animate-bounce" style="animation-duration: 2s;">👋</span>
        </h1>
        <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed">Ini adalah ruang belajar pribadi Anda. Pelajari materi melalui Video Konsep, Bacaan Ilmiah terstruktur, Unduhan PDF, serta simulasi praktikum Lab Virtual.</p>
      </div>
      <div class="flex items-center gap-4 bg-surface-container-low p-4 rounded-xl self-start md:self-auto border border-outline-variant/10 shadow-sm">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary-container flex items-center justify-center text-on-primary shadow-sm"><span class="material-symbols-outlined text-[26px]">flag</span></div>
        <div class="flex flex-col">
          <span class="font-label-sm text-label-sm uppercase font-bold text-on-surface-variant">Status Belajar</span>
          <span class="font-headline-sm text-body-md text-on-surface font-bold">Langkah Awal • 0%</span>
        </div>
      </div>
    </div>
    
    <!-- Hero / Next Action Block -->
    <router-link :to="nextCourse ? `/student/courses/${nextCourse.id}` : '#'" class="relative overflow-hidden bg-gradient-to-br from-surface-container-lowest to-surface-container-low rounded-2xl shadow-md border border-surface-container-high/60 p-8 lg:p-10 flex flex-col lg:flex-row gap-8 items-center justify-between transition-all hover:shadow-lg hover:-translate-y-1 duration-300 group block cursor-pointer">
      <!-- Background Element -->
      <div class="absolute -right-20 -bottom-20 opacity-[0.03] text-primary pointer-events-none transition-transform duration-700 group-hover:scale-110 group-hover:-rotate-12">
        <span class="material-symbols-outlined" style="font-size: 300px;">science</span>
      </div>

      <div class="flex flex-col gap-4 flex-1 relative z-10">
        <div class="flex flex-wrap items-center gap-2">
          <span class="px-3 py-1 rounded bg-secondary-fixed text-on-secondary-fixed-variant font-label-sm text-label-sm font-bold uppercase tracking-wider shadow-sm">Materi Terbaru</span>
          <span class="text-outline text-body-sm">•</span>
          <span class="font-label-md text-label-md text-on-surface-variant flex items-center gap-1 bg-surface-container px-2 py-1 rounded"><span class="material-symbols-outlined text-[16px] text-primary">menu_book</span> Course</span>
        </div>
        <h2 class="font-sf-rounded text-2xl lg:text-3xl text-on-surface font-extrabold group-hover:text-primary transition-colors">
          {{ nextCourse ? nextCourse.title : 'Bab 01: Struktur & Organisasi Kehidupan Sel' }}
        </h2>
        <p class="font-body-md text-body-md text-on-surface-variant leading-relaxed max-w-2xl line-clamp-3">
          {{ nextCourse ? (nextCourse.description || 'Pelajari materi ini sekarang.') : 'Pahami dasar-dasar organel sel eukariotik dan prokariotik, membran semipermeabel, serta transport molekul sebagai pondasi utama seluruh bab biologi berikutnya.' }}
        </p>
        <div class="flex flex-wrap items-center gap-2.5 pt-2">
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/20 text-on-surface font-label-md text-body-sm shadow-sm"><span class="material-symbols-outlined text-[18px] text-primary" style="font-variation-settings: 'FILL' 1;">play_circle</span> Video Penjelasan</span>
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/20 text-on-surface font-label-md text-body-sm shadow-sm"><span class="material-symbols-outlined text-[18px] text-secondary">menu_book</span> Artikel Bacaan</span>
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/20 text-on-surface font-label-md text-body-sm shadow-sm"><span class="material-symbols-outlined text-[18px] text-outline">picture_as_pdf</span> Handout PDF</span>
          <span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface-container-low border border-outline-variant/20 text-on-surface font-label-md text-body-sm shadow-sm"><span class="material-symbols-outlined text-[18px] text-tertiary">science</span> Lab Virtual</span>
        </div>
      </div>
      <div class="w-full lg:w-auto flex flex-col items-start lg:items-end justify-center relative z-10">
        <button class="w-full sm:w-auto px-8 py-4 rounded-xl bg-primary hover:bg-primary-container text-on-primary font-headline-sm text-body-md font-bold transition-all duration-300 shadow-md hover:shadow-lg flex items-center justify-center gap-2 group/btn" type="button">
          <span>Mulai Belajar Sekarang</span>
          <span class="material-symbols-outlined text-[20px] transition-transform group-hover/btn:translate-x-1">arrow_forward</span>
        </button>
      </div>
    </router-link>
    
    <!-- Instructions -->
    <div class="mt-4">
      <div class="pb-6 text-center max-w-2xl mx-auto">
        <h3 class="font-sf-rounded text-2xl lg:text-3xl text-on-surface font-bold">3 Langkah Mudah Belajar di EduPlatform</h3>
        <p class="font-body-sm text-body-sm text-on-surface-variant mt-2">Format multimodal terarah untuk pengalaman belajar yang lebih mendalam dan menyenangkan.</p>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="bg-surface-container-lowest p-8 rounded-2xl border border-surface-container-high/60 shadow-sm flex flex-col gap-4 hover:shadow-md hover:border-primary/30 transition-all duration-300 group hover:-translate-y-1">
          <div class="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all">
            <span class="material-symbols-outlined text-[24px]">play_circle</span>
          </div>
          <h4 class="font-sf-rounded text-xl text-on-surface font-bold group-hover:text-primary transition-colors">Tonton & Pahami</h4>
          <p class="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Simak video konsep animasi interaktif dan modul teks bergaya artikel ilmiah terpercaya.</p>
        </div>
        <div class="bg-surface-container-lowest p-8 rounded-2xl border border-surface-container-high/60 shadow-sm flex flex-col gap-4 hover:shadow-md hover:border-secondary/30 transition-all duration-300 group hover:-translate-y-1 delay-75">
          <div class="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:bg-secondary group-hover:text-white transition-all">
            <span class="material-symbols-outlined text-[24px]">picture_as_pdf</span>
          </div>
          <h4 class="font-sf-rounded text-xl text-on-surface font-bold group-hover:text-secondary transition-colors">Unduh Ringkasan PDF</h4>
          <p class="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Simpan lembar rangkuman rumus dan infografis sains untuk persiapan belajar mandiri.</p>
        </div>
        <div class="bg-surface-container-lowest p-8 rounded-2xl border border-surface-container-high/60 shadow-sm flex flex-col gap-4 hover:shadow-md hover:border-tertiary/30 transition-all duration-300 group hover:-translate-y-1 delay-150">
          <div class="w-12 h-12 rounded-xl bg-tertiary/10 text-tertiary flex items-center justify-center shadow-inner group-hover:scale-110 group-hover:bg-tertiary group-hover:text-white transition-all">
            <span class="material-symbols-outlined text-[24px]">science</span>
          </div>
          <h4 class="font-sf-rounded text-xl text-on-surface font-bold group-hover:text-tertiary transition-colors">Praktikum Lab Virtual</h4>
          <p class="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Lakukan eksperimen virtual interaktif langsung dari peramban Anda.</p>
        </div>
      </div>
    </div>
    
    <!-- Teacher Message -->
    <div class="bg-gradient-to-r from-surface-container-low to-surface-container-lowest p-8 rounded-2xl border border-outline-variant/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm hover:shadow transition-shadow">
      <div class="flex items-start sm:items-center gap-5">
        <div class="w-12 h-12 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center shrink-0 shadow-md">
          <span class="material-symbols-outlined text-[24px]">campaign</span>
        </div>
        <div class="flex flex-col gap-1">
          <span class="font-label-sm text-label-sm font-bold text-primary uppercase tracking-wider">Pesan Guru Pengampu • Drs. Bambang H., M.Biotech</span>
          <p class="font-body-sm text-body-sm md:text-body-md text-on-surface italic mt-0.5 max-w-3xl">"Selamat bergabung di semester baru, {{ userName.split(' ')[0] }}! Silakan pelajari Bab 1 santai saja sebelum jadwal praktikum kita minggu depan."</p>
        </div>
      </div>
      <button @click="alert('Fitur Chat Guru segera hadir di pembaruan berikutnya!')" class="px-6 py-3 rounded-xl bg-surface-container-lowest hover:bg-surface-container text-on-surface font-label-md text-body-sm font-bold transition-colors shrink-0 shadow-sm border border-outline-variant/30">Tanya Guru (Segera Hadir)</button>
    </div>
  </div>
</template>
