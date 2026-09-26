<script setup>
import PublicHeader from '../components/PublicHeader.vue'
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../supabase'

const activeSemester = ref('ganjil')
const activeFormat = ref('all') // 'all', 'article', 'video', 'pdf', 'lab'
const searchQuery = ref('')
const loading = ref(true)
const courses = ref([])

const fetchSyllabus = async () => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*, profiles (full_name), modules(id, title, order_index, lessons(id, title, type, status, order_index))')
      .eq('status', 'published')

    if (error) throw error

    // Sort modules and lessons
    data.forEach(course => {
      if (course.modules) {
        course.modules.sort((a, b) => a.order_index - b.order_index)
        course.modules.forEach(module => {
          if (module.lessons) {
            module.lessons.sort((a, b) => a.order_index - b.order_index)
          }
        })
      }
    })

    courses.value = data
  } catch (error) {
    console.error('Error fetching syllabus:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchSyllabus()
})

const setSemester = (sem) => {
  activeSemester.value = sem
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const getFilteredModules = (course) => {
  if (!course.modules) return []
  let mods = course.modules

  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    mods = mods.filter(m => m.title.toLowerCase().includes(q) || (m.description && m.description.toLowerCase().includes(q)))
  }
  
  // Optionally filter lessons within modules based on format
  return mods.map(m => {
    let filteredLessons = m.lessons || []
    if (activeFormat.value !== 'all') {
      filteredLessons = filteredLessons.filter(l => {
        if (activeFormat.value === 'article' && l.type === 'material') return true
        if (activeFormat.value === 'video' && l.type === 'video') return true
        if (activeFormat.value === 'pdf' && l.type === 'pdf') return true
        if (activeFormat.value === 'lab' && l.type === 'experiment') return true
        return false
      })
    }
    return { ...m, displayLessons: filteredLessons }
  }).filter(m => activeFormat.value === 'all' || m.displayLessons.length > 0)
}

const getLessonIcon = (type) => {
  switch(type) {
    case 'video': return 'play_circle'
    case 'pdf': return 'description'
    case 'quiz': return 'quiz'
    case '3d_model': return 'view_in_ar'
    case 'experiment': return 'science'
    case 'material': return 'menu_book'
    default: return 'article'
  }
}

const getLessonIconColor = (type) => {
  switch(type) {
    case 'video': return 'text-secondary'
    case 'pdf': return 'text-outline'
    case 'experiment': return 'text-primary'
    case 'material': return 'text-primary'
    default: return 'text-on-surface-variant'
  }
}

const getLessonPillClass = (type) => {
  if (type === 'experiment') {
    return 'bg-primary-fixed/40 text-on-primary-fixed font-semibold'
  }
  return 'bg-surface-container-low text-on-surface-variant'
}
</script>

<template>
  <div class="w-full bg-surface min-h-screen pb-20">
    <PublicHeader />

    <div v-if="loading" class="py-24 flex justify-center w-full">
      <span class="material-symbols-outlined text-[48px] text-primary animate-spin">progress_activity</span>
    </div>

    <div v-else-if="courses.length === 0" class="py-24 flex flex-col items-center w-full">
      <span class="material-symbols-outlined text-[64px] text-outline mb-4">menu_book</span>
      <p class="font-body-md text-body-md text-on-surface-variant">Belum ada silabus yang diterbitkan.</p>
    </div>

    <div v-else class="flex flex-col w-full">
      <template v-for="(course, cIndex) in courses" :key="course.id">
        <!-- Top Navigation Sub-bar / Breadcrumb & Meta Hero for each course -->
        <section class="w-full bg-surface-container-lowest shadow-sm mb-10">
          <div class="max-w-7xl mx-auto px-6 py-8">
            <!-- Breadcrumb -->
            <nav aria-label="Breadcrumb" class="flex items-center gap-2 mb-4 text-outline font-label-md text-label-md">
              <router-link to="/" class="hover:text-primary transition-colors flex items-center gap-1">
                <span class="material-symbols-outlined text-base">home</span>
                <span>Beranda</span>
              </router-link>
              <span class="material-symbols-outlined text-[16px] text-outline-variant">chevron_right</span>
              <span class="text-on-surface font-semibold">Silabus & Materi</span>
            </nav>
            
            <!-- Header Title & Badges -->
            <div class="flex flex-col lg:flex-row lg:items-end justify-between gap-8">
              <div class="space-y-4 max-w-3xl">
                <div class="flex flex-wrap items-center gap-2">
                  <span class="bg-primary-fixed text-on-primary-fixed font-label-sm text-label-sm px-3 py-1 rounded-full uppercase tracking-wider font-bold">
                    Kurikulum Merdeka
                  </span>
                  <span class="bg-secondary-fixed text-on-secondary-fixed font-label-sm text-label-sm px-3 py-1 rounded-full font-bold">
                    Publik
                  </span>
                </div>
                <h1 class="font-display text-display font-sf-rounded font-extrabold text-on-surface tracking-tight">
                  {{ course.title }}
                </h1>
                <p class="font-body-lg text-body-lg text-on-surface-variant">
                  {{ course.description || 'Eksplorasi mendalam biologi yang didukung oleh simulasi laboratorium virtual.' }}
                </p>
              </div>
              <!-- Quick Document Actions -->
              <div class="flex flex-wrap sm:flex-nowrap items-center gap-4 flex-shrink-0">
                <router-link :to="`/public/courses/${course.id}`" class="flex items-center gap-2 bg-primary hover:bg-primary-container text-on-primary px-4 py-2 rounded-lg transition-colors font-label-md text-label-md font-semibold shadow-sm">
                  <span class="material-symbols-outlined text-lg">menu_book</span>
                  <span>Buka Materi Pembelajaran</span>
                </router-link>
              </div>
            </div>
            
          </div>
        </section>

        <!-- Main Grid Section: Catalog (8 Cols) vs Scientific Sidebar (4 Cols) -->
        <div class="max-w-7xl mx-auto w-full px-6 pb-20">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
            
            <!-- Primary Column -->
            <section class="lg:col-span-8 flex flex-col gap-8">
              <!-- Filter Bar -->
              <div class="bg-surface-container-lowest rounded-xl p-4 shadow-sm space-y-4">
                <!-- Semester Toggle Tabs (Visual Only for now) -->
                <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                  <div class="inline-flex p-1 bg-surface-container-low rounded-lg">
                    <button @click="setSemester('ganjil')" :class="['px-4 py-1.5 font-label-md text-label-md rounded-md transition-all', activeSemester === 'ganjil' ? 'bg-surface-container-lowest text-primary shadow-sm font-semibold' : 'text-on-surface-variant hover:text-on-surface']">
                      Semua Modul
                    </button>
                  </div>
                  <div class="text-outline font-label-md text-label-md flex items-center gap-1.5 self-end sm:self-center">
                    <span class="material-symbols-outlined text-[16px] text-primary">auto_stories</span>
                    <span>Menampilkan <strong>{{ course.modules?.length || 0 }} Bab</strong></span>
                  </div>
                </div>
                
                <!-- Format Filters -->
                <div class="flex flex-col md:flex-row items-center justify-between gap-4 pt-2">
                  <div class="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none">
                    <button @click="activeFormat = 'all'" :class="['px-3 py-1.5 rounded-full font-label-sm text-label-sm font-bold transition-colors whitespace-nowrap', activeFormat === 'all' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container']">
                      Semua Format
                    </button>
                    <button @click="activeFormat = 'article'" :class="['px-3 py-1.5 rounded-full font-label-sm text-label-sm font-bold transition-colors whitespace-nowrap', activeFormat === 'article' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container']">
                      📖 Artikel Sains
                    </button>
                    <button @click="activeFormat = 'video'" :class="['px-3 py-1.5 rounded-full font-label-sm text-label-sm font-bold transition-colors whitespace-nowrap', activeFormat === 'video' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container']">
                      🎬 Video Konsep
                    </button>
                    <button @click="activeFormat = 'pdf'" :class="['px-3 py-1.5 rounded-full font-label-sm text-label-sm font-bold transition-colors whitespace-nowrap', activeFormat === 'pdf' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container']">
                      📄 Catatan PDF
                    </button>
                    <button @click="activeFormat = 'lab'" :class="['px-3 py-1.5 rounded-full font-label-sm text-label-sm font-bold transition-colors whitespace-nowrap', activeFormat === 'lab' ? 'bg-primary text-on-primary shadow-sm' : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container']">
                      🧪 Lab Virtual
                    </button>
                  </div>
                  <div class="relative w-full md:w-56 flex-shrink-0">
                    <span class="material-symbols-outlined absolute left-3 top-2 text-outline text-[18px]">search</span>
                    <input v-model="searchQuery" class="w-full bg-surface-container-low text-on-surface font-body-sm text-body-sm pl-9 pr-3 py-1.5 rounded-lg focus:outline-none focus:bg-surface-container-lowest focus:ring-1 focus:ring-primary shadow-sm" placeholder="Cari konsep, bab..." type="text"/>
                  </div>
                </div>
              </div>

              <!-- Empty state for filters -->
              <div v-if="getFilteredModules(course).length === 0" class="py-12 text-center text-on-surface-variant">
                <span class="material-symbols-outlined text-[48px] mb-2 opacity-50">search_off</span>
                <p class="font-body-md text-body-md">Tidak ada modul atau materi yang cocok dengan filter Anda.</p>
              </div>

              <!-- DYNAMIC CHAPTERS -->
              <article v-for="(mod, index) in getFilteredModules(course)" :key="mod.id" class="bg-surface-container-lowest rounded-xl shadow-sm p-6 transition-all duration-200 hover:shadow-md border border-outline-variant/30">
                <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-outline font-label-sm text-label-sm uppercase font-bold tracking-wider">Bab {{ String(index + 1).padStart(2, '0') }}</span>
                    </div>
                    <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold">
                      {{ mod.title }}
                    </h3>
                    <p class="font-body-sm text-body-sm text-on-surface-variant">
                      {{ mod.description || 'Tidak ada deskripsi.' }}
                    </p>
                  </div>
                  <div class="flex items-center gap-2 flex-shrink-0">
                    <router-link :to="`/public/courses/${course.id}`" class="px-4 py-2 rounded-lg bg-surface-container-low hover:bg-surface-container text-on-surface font-label-md text-label-md font-semibold transition-colors">
                      Pelajari Bab
                    </router-link>
                  </div>
                </div>
                <div class="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t border-outline-variant/20">
                  <div v-if="!mod.displayLessons || mod.displayLessons.length === 0" class="font-body-sm text-body-sm text-outline italic w-full">
                    Belum ada materi.
                  </div>
                  <router-link
                    v-for="lesson in mod.displayLessons" 
                    :key="lesson.id"
                    :to="`/public/courses/${course.id}/lessons/${lesson.id}`"
                    :class="['font-label-md text-label-md px-3 py-1 rounded-full flex items-center gap-1 hover:brightness-95 transition-all', getLessonPillClass(lesson.type)]"
                  >
                    <span class="material-symbols-outlined text-[16px]" :class="getLessonIconColor(lesson.type)">{{ getLessonIcon(lesson.type) }}</span> 
                    {{ lesson.title }}
                  </router-link>
                </div>
              </article>
            </section>

            <!-- Sidebar -->
            <aside class="lg:col-span-4 flex flex-col gap-8">
              <!-- Pedagogical Widget -->
              <div class="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/20">
                <div class="flex items-center gap-2 text-primary mb-4">
                  <span class="material-symbols-outlined text-[20px]">school</span>
                  <span class="font-label-sm text-label-sm uppercase font-bold tracking-wider">Metode Efektif Belajar</span>
                </div>
                <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold mb-2">
                  Pedoman 4 Format EduPlatform
                </h3>
                <p class="font-body-sm text-body-sm text-on-surface-variant mb-6">
                  Dirancang selaras dengan teori retensi sains: dari pemahaman teks konseptual hingga validasi empiris di simulator.
                </p>
                <div class="space-y-4">
                  <div class="flex items-start gap-3">
                    <div class="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">1</div>
                    <div>
                      <div class="font-body-sm text-body-sm font-bold text-on-surface">Artikel Sains Terbuka</div>
                      <p class="font-label-md text-label-md text-on-surface-variant font-normal mt-1 leading-relaxed">Dibaca paling awal untuk membangun skema mental, definisi taksonomi, dan terminologi baku.</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <div class="w-7 h-7 rounded-full bg-secondary/10 text-secondary flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">2</div>
                    <div>
                      <div class="font-body-sm text-body-sm font-bold text-on-surface">Video Konsep Mikro</div>
                      <p class="font-label-md text-label-md text-on-surface-variant font-normal mt-1 leading-relaxed">Tonton animasi 3D pergerakan molekuler dinamis (seperti transfer elektron atau transpor membran).</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <div class="w-7 h-7 rounded-full bg-outline/10 text-outline flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">3</div>
                    <div>
                      <div class="font-body-sm text-body-sm font-bold text-on-surface">Handout Ringkasan PDF</div>
                      <p class="font-label-md text-label-md text-on-surface-variant font-normal mt-1 leading-relaxed">Gunakan untuk review offline cepat, skema alur siklus, tabel perbandingan, dan catatan belajar.</p>
                    </div>
                  </div>
                  <div class="flex items-start gap-3">
                    <div class="w-7 h-7 rounded-full bg-tertiary-container/10 text-tertiary flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">4</div>
                    <div>
                      <div class="font-body-sm text-body-sm font-bold text-on-surface">Eksperimen Lab Virtual</div>
                      <p class="font-label-md text-label-md text-on-surface-variant font-normal mt-1 leading-relaxed">Uji hipotesis mandiri dengan memanipulasi variabel suhu, pH, atau konsentrasi secara virtual.</p>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Instructor Profile -->
              <div class="bg-surface-container-lowest rounded-xl p-6 shadow-sm border border-outline-variant/20">
                <div class="flex items-center gap-4 mb-4">
                  <div class="w-12 h-12 rounded-full bg-surface-container flex items-center justify-center text-outline">
                    <span class="material-symbols-outlined text-[24px]">person</span>
                  </div>
                  <div>
                    <p class="font-body-md text-body-md font-bold text-on-surface">{{ course.profiles?.full_name || 'Instruktur' }}</p>
                    <p class="font-label-sm text-label-sm text-outline uppercase tracking-wider mt-1">Guru Pengampu</p>
                  </div>
                </div>
                <p class="font-body-sm text-body-sm text-on-surface-variant mb-4">
                  Konsultasikan kendala alur tujuan pembelajaran, topik penelitian ilmiah mandiri, atau penyesuaian asesmen kuis.
                </p>
              </div>

              <!-- Download Official Document -->
              <div class="bg-gradient-to-br from-primary-fixed/20 to-surface-container-low rounded-xl p-6 shadow-sm">
                <div class="flex items-start gap-3">
                  <div class="w-10 h-10 rounded-lg bg-surface-container-lowest text-primary flex items-center justify-center shadow-sm flex-shrink-0">
                    <span class="material-symbols-outlined text-[20px]">picture_as_pdf</span>
                  </div>
                  <div>
                    <h4 class="font-body-sm text-body-sm font-bold text-on-surface">Dokumen Terkait</h4>
                    <p class="font-label-md text-label-md text-on-surface-variant mt-1 font-normal">
                      Unduh pedoman pembelajaran dan deskripsi materi.
                    </p>
                    <a v-if="course.syllabus_url" :href="course.syllabus_url" target="_blank" rel="noopener noreferrer" class="inline-flex items-center gap-1 text-primary hover:text-primary-container font-label-sm text-label-sm font-bold mt-3 underline underline-offset-4">
                      <span>{{ course.syllabus_name || 'Unduh Berkas Lengkap' }}</span>
                      <span class="material-symbols-outlined text-[16px]">download</span>
                    </a>
                    <span v-else class="inline-flex items-center gap-1 text-outline font-label-sm text-label-sm font-bold mt-3">
                      <span>Belum ada dokumen</span>
                    </span>
                  </div>
                </div>
              </div>
            </aside>
            
          </div>
        </div>
      </template>
    </div>
  </div>
</template>
