<script setup>
import PublicHeader from '../components/PublicHeader.vue'
import { ref, computed, onMounted } from 'vue'
import { supabase } from '../supabase'

// V-Lab State
const currentTemp = ref('optimum')
const isHeroMenuRotate = ref(false)

const publicCourses = ref([])
const loadingCourses = ref(true)

const fetchPublicCourses = async () => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*, profiles (full_name), modules(id, lessons(id))')
      .eq('status', 'published')
      .or('visibility.eq.public,visibility.is.null')
      .limit(3)
    
    if (error) throw error
    
    // Count lessons and modules
    publicCourses.value = data.map(course => {
      let moduleCount = course.modules?.length || 0
      let lessonCount = 0
      if (course.modules) {
        course.modules.forEach(m => {
          lessonCount += m.lessons?.length || 0
        })
      }
      return {
        ...course,
        moduleCount,
        lessonCount
      }
    })
  } catch (error) {
    console.error('Error fetching public courses:', error)
  } finally {
    loadingCourses.value = false
  }
}

onMounted(() => {
  fetchPublicCourses()
})

const vLabState = computed(() => {
  if (currentTemp.value === 'cold') {
    return {
      statusText: "LAJU SANGAT LAMBAT",
      statusClass: "text-secondary font-bold",
      rateText: "Laju Pelepasan O₂: Rendah (Gelembung Langka)",
      rateClass: "font-body-sm text-body-sm text-secondary font-bold mt-1",
      bubbleOpacity: "0.2",
      foamHeight: "2px",
      explanationHtml: "<strong>Suhu Rendah (10°C):</strong> Energi kinetik molekul enzim dan substrat sangat minim sehingga frekuensi tumbukan efektif sangat rendah. Enzim tidak rusak, namun reaksi melambat secara signifikan.",
      coldBtnClass: "p-space-sm rounded-lg bg-secondary text-on-secondary text-center transition-all flex flex-col items-center shadow-md",
      optBtnClass: "p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-center transition-all flex flex-col items-center",
      hotBtnClass: "p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-center transition-all flex flex-col items-center",
    }
  } else if (currentTemp.value === 'optimum') {
    return {
      statusText: "REAKSI OPTIMAL",
      statusClass: "text-primary font-bold",
      rateText: "Laju Pelepasan O₂: Sangat Tinggi (Busa Tebal)",
      rateClass: "font-body-sm text-body-sm text-primary font-bold mt-1",
      bubbleOpacity: "1",
      foamHeight: "16px",
      explanationHtml: "<strong>Suhu Optimum (37°C):</strong> Enzim katalase bekerja pada efisiensi puncak. Ikatan aktif fleksibel dan menguraikan substrat H₂O₂ menjadi oksigen dengan sangat pesat.",
      coldBtnClass: "p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-center transition-all flex flex-col items-center",
      optBtnClass: "p-space-sm rounded-lg bg-primary text-on-primary text-center transition-all flex flex-col items-center shadow-md",
      hotBtnClass: "p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-center transition-all flex flex-col items-center",
    }
  } else {
    // hot
    return {
      statusText: "ENZIM TERDENATURASI",
      statusClass: "text-error font-bold",
      rateText: "Laju Pelepasan O₂: 0% (Tidak Ada Gelembung)",
      rateClass: "font-body-sm text-body-sm text-error font-bold mt-1",
      bubbleOpacity: "0",
      foamHeight: "0px",
      explanationHtml: "<strong>Suhu Tinggi (75°C):</strong> Terjadi denaturasi protein enzim katalase. Struktur tersier dan sisi aktif rusak permanen sehingga tidak mampu lagi mengikat molekul hidrogen peroksida.",
      coldBtnClass: "p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-center transition-all flex flex-col items-center",
      optBtnClass: "p-space-sm rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface text-center transition-all flex flex-col items-center",
      hotBtnClass: "p-space-sm rounded-lg bg-error text-on-error text-center transition-all flex flex-col items-center shadow-md",
    }
  }
})

const setExperimentTemp = (type) => {
  currentTemp.value = type
}
</script>

<template>
  <PublicHeader />

  <main class="w-full pt-20 bg-surface">
    <div class="flex flex-col w-full">
      <!-- Top Subtle Ambient Light Glow -->
      <div class="relative w-full overflow-hidden">
        <div class="absolute -top-40 left-1/2 -translate-x-1/2 w-[720px] h-[380px] bg-primary-fixed-dim/20 rounded-full blur-[120px] pointer-events-none -z-10"></div>
        <div class="absolute top-72 right-12 w-[380px] h-[280px] bg-secondary-fixed-dim/15 rounded-full blur-[100px] pointer-events-none -z-10"></div>
        
        <!-- 1. HERO SECTION -->
        <section class="max-w-7xl mx-auto px-6 lg:px-12 pt-8 pb-20 lg:pt-14 lg:pb-28">
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-space-xl items-center">
            <!-- Hero Text Column -->
            <div class="lg:col-span-7 flex flex-col items-start gap-space-md">
              <div class="inline-flex items-center gap-space-xs px-space-md py-space-xs rounded-full bg-surface-container-low shadow-sm">
                <span class="w-2.5 h-2.5 rounded-full bg-primary animate-pulse"></span>
                <span class="font-label-md text-label-md text-primary font-bold tracking-tight">Platform Belajar Biologi Interaktif SMA</span>
                <span class="text-outline text-label-sm">•</span>
                <span class="font-label-sm text-label-sm text-on-surface-variant uppercase font-semibold">Kurikulum Merdeka</span>
              </div>
              <h1 class="font-display text-display text-on-surface tracking-tight leading-tight">
                Belajar Biologi Bukan Sekadar Menghafal, <span class="text-primary italic">Tapi Membuktikan.</span>
              </h1>
              <p class="font-body-lg text-body-lg text-on-surface-variant max-w-2xl leading-relaxed">
                Jelajahi keajaiban kehidupan lewat praktikum laboratorium virtual, modul bacaan ilmiah mendalam, video penjelasan terpadu, dan e-book PDF yang bikin konsep biologi paling rumit jadi intuitif dan menyenangkan.
              </p>
              <div class="flex flex-col sm:flex-row items-stretch sm:items-center gap-space-md w-full sm:w-auto pt-space-xs">
                <router-link class="inline-flex items-center justify-center gap-space-xs px-space-xl py-space-md rounded-lg font-headline-sm text-headline-sm bg-primary text-on-primary hover:bg-primary-container transition-all shadow-md hover:shadow-lg active:scale-[0.98]" to="/public/courses">
                  <span class="">Mulai Eksplorasi Gratis</span>
                  <span class="material-symbols-outlined text-[20px]">arrow_forward</span>
                </router-link>
                <router-link class="inline-flex items-center justify-center gap-space-xs px-space-lg py-space-md rounded-lg font-headline-sm text-headline-sm text-secondary bg-surface-container hover:bg-surface-container-high transition-colors" to="/public/labs">
                  <span class="material-symbols-outlined text-[20px]">science</span>
                  <span class="">Coba Simulasi Tanpa Login</span>
                </router-link>
              </div>
            </div>

            <!-- Hero Visual Preview Stage -->
            <div class="lg:col-span-5 relative">
              <div class="absolute inset-0 bg-gradient-to-tr from-primary-fixed-dim/30 to-secondary-fixed/30 rounded-2xl filter blur-xl transform scale-105 -z-10"></div>
              <div class="bg-surface-container-lowest rounded-2xl shadow-xl overflow-hidden p-space-md flex flex-col gap-space-md relative">
                <div class="flex items-center justify-between pb-space-xs">
                  <div class="flex items-center gap-space-xs">
                    <span class="w-3 h-3 rounded-full bg-error"></span>
                    <span class="w-3 h-3 rounded-full bg-amber-400"></span>
                    <span class="w-3 h-3 rounded-full bg-primary-fixed-dim"></span>
                    <span class="ml-space-xs font-label-sm text-label-sm uppercase tracking-wider text-outline">Portal Belajar Ilmiah v2.4</span>
                  </div>
                  <span class="inline-flex items-center gap-1.5 px-space-sm py-0.5 rounded-full bg-primary/10 text-primary font-label-sm text-label-sm font-semibold">
                    <span class="w-1.5 h-1.5 rounded-full bg-primary animate-ping"></span> Live Engine
                  </span>
                </div>
                
                <div class="relative w-full h-72 sm:h-80 bg-surface-container-low rounded-xl overflow-hidden flex flex-col items-center justify-center p-space-md group">
                  <img class="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" data-alt="High-resolution, medical-grade scientific 3D anatomical visualization" src="https://lh3.googleusercontent.com/aida-public/AB6AXuAijahwBfEgBfH9nrzydx8G7YdCu61YjQBFM92gnf1jObXrGf-kQ5fkuWPJoTkoaBguvnPr1edyKM1sZrNGKo-jazw8esYK0WuMlzDkJy7qa5ld_hKKRydVxrSzn70yf8cx2PuE1j4EUxWeCCeXBr_sTPAhw1SHsy_QJtz9cBBkjnp17i9AHzmgHgsiduFdIP7I6DZ0tgb0SuoE9tVsQkg7FAPsnXsJ2aV5Ljw8t7IZmo7PylNvtm4wew">
                  <div class="absolute top-6 left-6 bg-surface-container-lowest/90 backdrop-blur-md px-space-md py-space-xs rounded-lg shadow-md flex items-center gap-space-xs pointer-events-none">
                    <span class="material-symbols-outlined text-primary text-[18px]">biotech</span>
                    <div class="flex flex-col">
                      <span class="font-label-sm text-label-sm text-on-surface font-bold">Pulmo &amp; Alveolus</span>
                      <span class="font-label-sm text-label-sm text-outline">Luas Difusi: ±70 m²</span>
                    </div>
                  </div>
                  
                  <div class="absolute bottom-4 inset-x-4 bg-surface/95 backdrop-blur-lg rounded-xl p-space-sm shadow-md flex items-center justify-between gap-space-sm">
                    <div class="flex items-center gap-space-xs">
                      <button @click="isHeroMenuRotate = !isHeroMenuRotate" :class="{'bg-primary text-on-primary': isHeroMenuRotate}" class="px-space-sm py-space-xs rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-1 transition-colors">
                        <span class="material-symbols-outlined text-[16px]">menu_book</span>
                        <span class="">Baca Modul</span>
                      </button>
                      <button class="px-space-sm py-space-xs rounded-lg bg-surface-container hover:bg-surface-container-high text-on-surface font-label-md text-label-md flex items-center gap-1 transition-colors">
                        <span class="material-symbols-outlined text-[16px]">play_circle</span>
                        <span class="">Video &amp; E-Book</span>
                      </button>
                    </div>
                    <span class="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider hidden sm:inline-block">Status: Siap Uji</span>
                  </div>
                </div>
                
                <div class="grid grid-cols-3 gap-space-sm pt-space-xs text-center">
                  <div class="p-space-xs rounded-lg bg-surface-container-low">
                    <p class="font-label-sm text-label-sm text-outline">Modul Terkait</p>
                    <p class="font-headline-sm text-headline-sm text-on-surface font-bold">Fisiologi XI</p>
                  </div>
                  <div class="p-space-xs rounded-lg bg-surface-container-low">
                    <p class="font-label-sm text-label-sm text-outline">Resolusi Sel</p>
                    <p class="font-headline-sm text-headline-sm text-primary font-bold">Ultra-HD</p>
                  </div>
                  <div class="p-space-xs rounded-lg bg-surface-container-low">
                    <p class="font-label-sm text-label-sm text-outline">Metode Belajar</p>
                    <p class="font-headline-sm text-headline-sm text-secondary font-bold">Eksploratif</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- 2. JELAJAHI MATERI PER KELAS (Public Courses) -->
      <section class="w-full bg-surface-container-low py-space-xl lg:py-24">
        <div class="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col gap-space-xl">
          <div class="flex flex-col md:flex-row md:items-end justify-between gap-space-md">
            <div class="flex flex-col gap-space-xs max-w-xl">
              <span class="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">Metode Pembelajaran Saintifik</span>
              <h2 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">
                Dirancang untuk Membakar Rasa Ingin Tahu, Bukan Kejenuhan.
              </h2>
            </div>
            <p class="font-body-md text-body-md text-on-surface-variant max-w-md">
              Kami memadukan akurasi silabus biologi dengan teknologi interaktif modern agar siswa memahami logika alam semesta secara nyata.
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-space-md">
            <!-- Card 1 -->
            <div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div class="flex flex-col gap-space-md">
                <div class="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-on-primary transition-colors">
                  <span class="material-symbols-outlined text-[26px]">science</span>
                </div>
                <div class="flex flex-col gap-space-xs">
                  <h3 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Laboratorium Virtual Tanpa Batas</h3>
                  <p class="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Uji reaksi enzim katalase, osmosis sel darah, dan hukum genetika Mendel kapan pun di browser tanpa risiko kecelakaan laboratorium.
                  </p>
                </div>
              </div>
              <div class="pt-space-md mt-space-md flex items-center gap-space-xs text-primary font-label-md text-label-md font-semibold">
                <span class="">Jelajahi Lab Digital</span>
                <span class="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </div>
            <!-- Card 2 -->
            <div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div class="flex flex-col gap-space-md">
                <div class="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center group-hover:bg-secondary group-hover:text-on-secondary transition-colors">
                  <span class="material-symbols-outlined text-[26px]">article</span>
                </div>
                <div class="flex flex-col gap-space-xs">
                  <h3 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Materi Lengkap Multi-Format</h3>
                  <p class="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">Video penjelasan konsep, rangkuman PDF siap unduh, serta artikel bacaan ilmiah terstruktur ala OpenStax untuk pemahaman mendalam.</p>
                </div>
              </div>
              <div class="pt-space-md mt-space-md flex items-center gap-space-xs text-secondary font-label-md text-label-md font-semibold">
                <span class="">Baca Artikel Sains</span>
                <span class="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </div>
            <!-- Card 3 -->
            <div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div class="flex flex-col gap-space-md">
                <div class="w-12 h-12 rounded-xl bg-tertiary-container/20 text-tertiary flex items-center justify-center group-hover:bg-tertiary-container group-hover:text-on-tertiary-container transition-colors">
                  <span class="material-symbols-outlined text-[26px]">account_tree</span>
                </div>
                <div class="flex flex-col gap-space-xs">
                  <h3 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Alur Silabus Berkesinambungan</h3>
                  <p class="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Tersusun runut per bab fase Kurikulum Merdeka (Kelas X, XI, XII SMA) sehingga pemahaman materi tidak melompat-lompat.
                  </p>
                </div>
              </div>
              <div class="pt-space-md mt-space-md flex items-center gap-space-xs text-tertiary font-label-md text-label-md font-semibold">
                <span class="">Lihat Peta Konsep</span>
                <span class="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </div>
            <!-- Card 4 -->
            <div class="bg-surface-container-lowest p-space-lg rounded-xl shadow-sm hover:shadow-md transition-all flex flex-col justify-between group">
              <div class="flex flex-col gap-space-md">
                <div class="w-12 h-12 rounded-xl bg-primary-fixed-dim/30 text-on-primary-fixed-variant flex items-center justify-center group-hover:bg-primary-container group-hover:text-on-primary transition-colors">
                  <span class="material-symbols-outlined text-[26px]">psychology_alt</span>
                </div>
                <div class="flex flex-col gap-space-xs">
                  <h3 class="font-headline-sm text-headline-sm text-on-surface font-semibold">Umpan Balik &amp; Kuis Cerdas</h3>
                  <p class="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                    Setiap latihan dan kuis langsung memberikan pembahasan logis berbasis bukti ilmiah, bukan sekadar kunci jawaban benar/salah.
                  </p>
                </div>
              </div>
              <div class="pt-space-md mt-space-md flex items-center gap-space-xs text-primary font-label-md text-label-md font-semibold">
                <span class="">Cek Bank Soal</span>
                <span class="material-symbols-outlined text-[16px] group-hover:translate-x-1 transition-transform">arrow_forward</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="max-w-7xl mx-auto px-6 lg:px-12 py-space-xl lg:py-24 w-full">
        <div class="flex flex-col gap-space-lg">
          <div class="flex flex-col sm:flex-row sm:items-end justify-between gap-space-md">
            <div class="flex flex-col gap-space-xs">
              <span class="font-label-sm text-label-sm text-secondary font-bold uppercase tracking-wider">Materi Belajar Publik</span>
              <h2 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Materi Terstruktur Sesuai Jenjangmu</h2>
              <p class="font-body-md text-body-md text-on-surface-variant">Kumpulan materi gratis terpilih yang disusun khusus untuk memperdalam pemahaman biologi.</p>
            </div>
            <div class="inline-flex">
              <router-link to="/public/courses" class="px-space-md py-space-sm rounded-lg font-label-md text-label-md bg-primary/10 text-primary font-bold shadow-sm hover:bg-primary hover:text-on-primary transition-all flex items-center gap-2">
                <span>Lihat Semua Materi</span>
                <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
              </router-link>
            </div>
          </div>

          <div v-if="loadingCourses" class="py-12 flex justify-center w-full">
            <span class="material-symbols-outlined text-[48px] text-primary animate-spin">progress_activity</span>
          </div>

          <div v-else-if="publicCourses.length === 0" class="py-12 text-center flex flex-col items-center">
            <span class="material-symbols-outlined text-[64px] text-outline mb-4">menu_book</span>
            <p class="text-on-surface-variant">Belum ada materi publik yang tersedia saat ini.</p>
          </div>

          <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-space-lg pt-space-xs">
            <div v-for="course in publicCourses" :key="course.id" class="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between">
              <div class="flex flex-col">
                <div class="relative h-44 w-full bg-surface-container overflow-hidden">
                  <img v-if="course.cover_url" :src="course.cover_url" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Cover" />
                  <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                    <span class="material-symbols-outlined text-[64px] text-primary/30">menu_book</span>
                  </div>
                  <div class="absolute top-3 left-3 bg-surface-container-lowest/90 backdrop-blur-md px-space-sm py-0.5 rounded-full font-label-sm text-label-sm text-primary font-bold uppercase">
                    Terbuka
                  </div>
                </div>
                <div class="p-space-lg flex flex-col gap-space-xs">
                  <div class="flex items-center gap-space-xs text-outline font-label-sm text-label-sm uppercase">
                    <span class="">{{ course.moduleCount }} Modul</span><span class="">•</span><span class="font-semibold">{{ course.lessonCount }} Materi</span>
                  </div>
                  <h3 class="font-headline-sm text-headline-sm text-on-surface font-bold leading-snug">{{ course.title }}</h3>
                  <p class="font-body-sm text-body-sm text-on-surface-variant line-clamp-2 pt-1">
                    {{ course.description || 'Tidak ada deskripsi.' }}
                  </p>
                  <p class="font-label-sm text-xs text-on-surface-variant mt-2">Oleh: {{ course.profiles?.full_name || 'Guru' }}</p>
                </div>
              </div>
              <div class="p-space-lg pt-0 flex items-center justify-between mt-auto">
                <router-link :to="`/public/courses/${course.id}`" class="inline-flex items-center gap-1 text-primary font-label-md text-label-md font-bold hover:underline w-full justify-center bg-primary/10 py-2 rounded-lg">
                  <span class="">Buka Materi</span>
                  <span class="material-symbols-outlined text-[16px]">chevron_right</span>
                </router-link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. CUPLIKAN PRAKTIKUM VIRTUAL -->
      <section class="w-full bg-surface-container py-space-xl lg:py-24" id="demo-praktikum">
        <div class="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col gap-space-xl">
          <div class="text-center max-w-2xl mx-auto flex flex-col gap-space-xs">
            <span class="font-label-sm text-label-sm text-primary font-bold uppercase tracking-wider">Praktikum Mandiri Langsung Dari Browser</span>
            <h2 class="font-headline-lg text-headline-lg text-on-surface tracking-tight">Coba Sekarang: Simulasi Enzim Katalase H₂O₂</h2>
            <p class="font-body-md text-body-md text-on-surface-variant">
              Gerakkan suhu larutan di bawah untuk mengamati perubahan laju penguraian hidrogen peroksida menjadi air dan oksigen secara langsung.
            </p>
          </div>

          <div class="bg-surface-container-lowest rounded-2xl shadow-xl p-6 lg:p-10 max-w-4xl mx-auto w-full">
            <div class="grid grid-cols-1 md:grid-cols-12 gap-space-xl items-center">
              <!-- Visual Simulation Display -->
              <div class="md:col-span-6 bg-surface-container-low rounded-xl p-space-lg flex flex-col items-center justify-center relative min-h-[300px] overflow-hidden">
                <div class="absolute top-3 left-3 bg-surface-container-lowest px-space-sm py-0.5 rounded text-outline font-label-sm text-label-sm font-mono">
                  STATUS: <span :class="vLabState.statusClass">{{ vLabState.statusText }}</span>
                </div>
                
                <div class="relative w-28 h-56 flex flex-col items-center justify-end pb-3">
                  <div class="absolute inset-0 border-b-4 border-l-4 border-r-4 border-outline-variant/60 rounded-b-full pointer-events-none"></div>
                  <div class="w-24 h-32 bg-primary-fixed-dim/40 rounded-b-full transition-all duration-500 relative flex items-center justify-center overflow-hidden">
                    <svg :style="{ opacity: vLabState.bubbleOpacity }" class="w-full h-full absolute inset-0 text-primary transition-opacity duration-300" fill="currentColor" viewBox="0 0 100 100">
                      <circle class="opacity-80 transition-all duration-300" cx="30" cy="80" r="4"></circle>
                      <circle class="opacity-80 transition-all duration-300" cx="55" cy="65" r="5"></circle>
                      <circle class="opacity-80 transition-all duration-300" cx="40" cy="45" r="3"></circle>
                      <circle class="opacity-80 transition-all duration-300" cx="70" cy="50" r="4.5"></circle>
                      <circle class="opacity-80 transition-all duration-300" cx="45" cy="25" r="5"></circle>
                    </svg>
                    <div :style="{ height: vLabState.foamHeight }" class="absolute top-0 inset-x-0 bg-primary-fixed/80 rounded-full transition-all duration-500"></div>
                  </div>
                </div>
                
                <div class="mt-space-md text-center">
                  <span class="font-label-md text-label-md text-on-surface font-semibold">2 H₂O₂ ➔ 2 H₂O + O₂ ↑</span>
                  <p :class="vLabState.rateClass">{{ vLabState.rateText }}</p>
                </div>
              </div>

              <!-- Interactive Controls -->
              <div class="md:col-span-6 flex flex-col gap-space-md">
                <div>
                  <span class="font-label-sm text-label-sm text-outline uppercase font-semibold">Kontrol Variabel Eksperimen</span>
                  <h4 class="font-headline-sm text-headline-sm text-on-surface font-bold">Atur Suhu Ekstrak Hati</h4>
                  <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    Katalase bekerja maksimal pada suhu tubuh makhluk hidup. Uji efek denaturasi atau perlambatan kinetik dengan tombol suhu:
                  </p>
                </div>
                
                <div class="grid grid-cols-3 gap-space-xs pt-space-xs">
                  <button @click="setExperimentTemp('cold')" :class="vLabState.coldBtnClass">
                    <span class="font-label-sm text-label-sm opacity-80">Dingin</span>
                    <span class="font-headline-sm text-headline-sm font-bold">10°C</span>
                  </button>
                  <button @click="setExperimentTemp('optimum')" :class="vLabState.optBtnClass">
                    <span class="font-label-sm text-label-sm opacity-80">Fisiologis</span>
                    <span class="font-headline-sm text-headline-sm font-bold">37°C</span>
                  </button>
                  <button @click="setExperimentTemp('hot')" :class="vLabState.hotBtnClass">
                    <span class="font-label-sm text-label-sm opacity-80">Panas</span>
                    <span class="font-headline-sm text-headline-sm font-bold">75°C</span>
                  </button>
                </div>
                
                <div class="p-space-md rounded-xl bg-surface-container-low flex items-start gap-space-xs text-on-surface-variant">
                  <span class="material-symbols-outlined text-primary text-[20px] shrink-0 mt-0.5">info</span>
                  <p class="font-body-sm text-body-sm" v-html="vLabState.explanationHtml"></p>
                </div>
                
                <div class="pt-space-xs flex flex-col gap-2">
                  <router-link to="/public/labs/ed3de8a0-dde4-4198-a696-9af29b69eca7" class="w-full inline-flex items-center justify-center gap-space-xs px-space-md py-space-sm rounded-lg bg-primary text-on-primary font-headline-sm text-headline-sm hover:bg-primary-container transition-all">
                    <span class="material-symbols-outlined text-[18px]">science</span>
                    <span>Buka Lab Virtual Enzim Katalase</span>
                    <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </router-link>
                  <router-link to="/public/labs" class="w-full inline-flex items-center justify-center gap-1 text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">
                    <span>Lihat Semua Lab Virtual</span>
                    <span class="material-symbols-outlined text-[16px]">chevron_right</span>
                  </router-link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 4. PROFIL PENGEMBANG (SIMPLE & ELEGANT) -->
      <section class="max-w-5xl mx-auto px-6 lg:px-12 pb-space-xl w-full" id="profil-pengembang">
        <div class="relative bg-surface-container-lowest rounded-[2rem] overflow-hidden border border-outline-variant/40 shadow-xl p-8 sm:p-12 flex flex-col md:flex-row items-center gap-8 md:gap-12 text-center md:text-left">
          
          <!-- Subtle Glow Overlay -->
          <div class="absolute -top-24 -right-24 w-64 h-64 bg-primary/5 rounded-full blur-[80px] pointer-events-none"></div>
          
          <!-- Left: Developer Avatar -->
          <div class="shrink-0 flex flex-col items-center gap-4 relative z-10">
            <div class="w-24 h-24 sm:w-32 sm:h-32 rounded-full p-[3px] bg-gradient-to-tr from-primary via-secondary to-primary-fixed shadow-md">
              <div class="w-full h-full rounded-full bg-surface-container-lowest flex items-center justify-center relative overflow-hidden border border-outline-variant/30">
                <img src="https://via.placeholder.com/800" alt="[Author Name]" class="w-full h-full object-cover">
              </div>
            </div>
            <div class="flex flex-col items-center">
              <h3 class="font-headline-md text-xl sm:text-2xl text-on-surface font-extrabold tracking-tight">[Author Name]</h3>
              <p class="font-label-sm text-xs text-primary font-bold uppercase tracking-widest mt-1">Lead Creator &amp; Educator</p>
            </div>
          </div>

          <!-- Right: Short Quote & Closed Access Notice -->
          <div class="flex flex-col gap-6 w-full relative z-10">
            <div class="relative">
              <span class="material-symbols-outlined text-3xl text-outline-variant/30 absolute -top-3 -left-3">format_quote</span>
              <p class="font-body-lg text-on-surface-variant italic leading-relaxed text-sm sm:text-base relative z-10 pl-4">
                "Dibangun murni untuk memfasilitasi guru dan siswa dalam mengeksplorasi sains biologi secara interaktif, mendalam, dan tanpa sekat keterbatasan alat praktikum."
              </p>
            </div>

            <!-- Simple Closed Registration Banner -->
            <div class="bg-surface-container-low border border-outline-variant/50 rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-5 shadow-sm hover:border-primary/30 transition-colors">
              <div class="flex flex-col text-center sm:text-left gap-1.5">
                <div class="flex items-center justify-center sm:justify-start gap-2">
                  <span class="w-2 h-2 rounded-full bg-error animate-pulse"></span>
                  <span class="font-label-md text-error font-bold uppercase tracking-wider text-xs">Pendaftaran Ditutup</span>
                </div>
                <p class="text-sm text-on-surface-variant leading-relaxed">
                  Demi kualitas server, pembuatan akun baru ditutup sementara. Jika Anda guru atau perwakilan sekolah mitra, silakan hubungi kami.
                </p>
              </div>
              <a href="mailto:contact@example.com?subject=Permohonan%20Akses%20Ruang%20Biologi" class="shrink-0 w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-on-primary font-semibold text-sm hover:bg-primary-container transition-all shadow-sm hover:shadow transform hover:-translate-y-0.5">
                <span class="material-symbols-outlined text-[18px]">mail</span>
                Hubungi Admin
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  </main>

  <footer class="w-full bg-surface-container-lowest border-t border-outline-variant/30 mt-space-xl pt-16 pb-8 relative overflow-hidden">
    <!-- Ambient subtle background -->
    <div class="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[300px] bg-primary/5 blur-[120px] rounded-full pointer-events-none"></div>
    
    <div class="max-w-7xl mx-auto px-6 lg:px-12 relative z-10">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-12">
        
        <!-- Column 1: Brand & Desc -->
        <div class="lg:col-span-2 flex flex-col gap-5">
          <div class="flex items-center gap-3">
            <img src="/logo-template.png" alt="Logo EduPlatform" class="h-10 w-auto shrink-0" />
            <div class="flex flex-col">
              <span class="font-sf-rounded text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary tracking-tight font-extrabold">EduPlatform</span>
              <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-widest text-[10px]">Biologi SMA</span>
            </div>
          </div>
          <p class="font-body-sm text-body-sm text-on-surface-variant max-w-md leading-relaxed">
            Platform pembelajaran biologi modern untuk tingkat SMA dengan laboratorium virtual, artikel saintifik terstruktur, dan simulasi interaktif yang didesain khusus secara independen untuk mendukung Kurikulum Merdeka.
          </p>
        </div>

        <!-- Column 2: Navigasi Utama -->
        <div class="flex flex-col gap-4">
          <span class="font-label-md text-label-md text-on-surface font-bold uppercase tracking-widest text-xs">Navigasi Utama</span>
          <ul class="flex flex-col gap-3 font-body-sm text-body-sm text-on-surface-variant">
            <li><a href="#" class="hover:text-primary transition-colors inline-flex items-center gap-2"><span class="w-1 h-1 rounded-full bg-outline-variant"></span> Beranda</a></li>
            <li><router-link to="/public/syllabus" class="hover:text-primary transition-colors inline-flex items-center gap-2"><span class="w-1 h-1 rounded-full bg-outline-variant"></span> Materi &amp; Silabus</router-link></li>
            <li><router-link to="/public/courses" class="hover:text-primary transition-colors inline-flex items-center gap-2"><span class="w-1 h-1 rounded-full bg-outline-variant"></span> Materi Belajar Publik</router-link></li>
            <li><router-link to="/public/labs" class="hover:text-primary transition-colors inline-flex items-center gap-2"><span class="w-1 h-1 rounded-full bg-outline-variant"></span> Laboratorium Virtual</router-link></li>
          </ul>
        </div>

        <!-- Column 3: Akses Platform -->
        <div class="flex flex-col gap-4">
          <span class="font-label-md text-label-md text-on-surface font-bold uppercase tracking-widest text-xs">Akses Platform</span>
          <ul class="flex flex-col gap-3 font-body-sm text-body-sm text-on-surface-variant">
            <li><router-link to="/teacher/login" class="hover:text-secondary transition-colors inline-flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">school</span> Login Guru</router-link></li>
            <li><router-link to="/student/login" class="hover:text-secondary transition-colors inline-flex items-center gap-2"><span class="material-symbols-outlined text-[16px]">face</span> Login Siswa</router-link></li>
            <li>
              <a href="mailto:contact@example.com" class="hover:text-primary transition-colors inline-flex items-center gap-2 mt-2">
                <span class="material-symbols-outlined text-[16px]">mail</span> Hubungi Admin
              </a>
            </li>
          </ul>
        </div>
      </div>

      <!-- Bottom Copyright & Links -->
      <div class="pt-8 border-t border-outline-variant/30 flex flex-col md:flex-row items-center justify-between gap-4 text-on-surface-variant font-label-md text-xs">
        <p class="text-center md:text-left flex flex-col sm:flex-row sm:gap-1">
          <span>&copy; {{ new Date().getFullYear() }} EduPlatform. Hak cipta dilindungi.</span>
          <span class="hidden sm:inline">|</span>
          <span>Inisiator &amp; Pengembang: <strong class="text-primary">[Author Name]</strong></span>
        </p>
        <div class="flex items-center gap-6">
          <span class="hover:text-primary cursor-pointer transition-colors">Kebijakan Privasi</span>
          <span class="hover:text-primary cursor-pointer transition-colors">Syarat &amp; Ketentuan</span>
        </div>
      </div>
    </div>
  </footer>
</template>
