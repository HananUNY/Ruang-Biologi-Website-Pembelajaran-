<script setup>
import PublicHeader from '../components/PublicHeader.vue'
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'

const publicCourses = ref([])
const loadingCourses = ref(true)

const fetchPublicCourses = async () => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select('*, profiles (full_name), modules(id, lessons(id))')
      .eq('status', 'published')
      .or('visibility.eq.public,visibility.is.null')
    
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
</script>

<template>
  <PublicHeader />

  <main class="w-full min-h-screen bg-surface py-12">
    <div class="max-w-7xl mx-auto px-6 lg:px-12">
      <div class="flex flex-col gap-8">
        <div class="flex flex-col gap-2">
          <h1 class="text-3xl font-bold text-on-surface">Semua Materi Publik</h1>
          <p class="text-on-surface-variant">Kumpulan modul dan materi biologi interaktif yang dapat diakses secara gratis.</p>
        </div>

        <div v-if="loadingCourses" class="py-12 flex justify-center w-full">
          <span class="material-symbols-outlined text-[48px] text-primary animate-spin">progress_activity</span>
        </div>

        <div v-else-if="publicCourses.length === 0" class="py-12 text-center flex flex-col items-center">
          <span class="material-symbols-outlined text-[64px] text-outline mb-4">menu_book</span>
          <p class="text-on-surface-variant">Belum ada materi publik yang tersedia saat ini.</p>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div v-for="course in publicCourses" :key="course.id" class="bg-surface-container-lowest rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col justify-between">
            <div class="flex flex-col">
              <div class="relative h-44 w-full bg-surface-container overflow-hidden">
                <img v-if="course.cover_url" :src="course.cover_url" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt="Cover" />
                <div v-else class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-secondary/20">
                  <span class="material-symbols-outlined text-[64px] text-primary/30">menu_book</span>
                </div>
                <div class="absolute top-3 left-3 bg-surface-container-lowest/90 backdrop-blur-md px-3 py-0.5 rounded-full text-xs text-primary font-bold uppercase">
                  Terbuka
                </div>
              </div>
              <div class="p-6 flex flex-col gap-2">
                <div class="flex items-center gap-2 text-outline text-xs uppercase">
                  <span class="">{{ course.moduleCount }} Modul</span><span class="">•</span><span class="font-semibold">{{ course.lessonCount }} Materi</span>
                </div>
                <h3 class="text-xl text-on-surface font-bold leading-snug">{{ course.title }}</h3>
                <p class="text-sm text-on-surface-variant line-clamp-2 pt-1">
                  {{ course.description || 'Tidak ada deskripsi.' }}
                </p>
                <p class="text-xs text-on-surface-variant mt-2">Oleh: {{ course.profiles?.full_name || 'Guru' }}</p>
              </div>
            </div>
            <div class="p-6 pt-0 flex items-center justify-between mt-auto">
              <router-link :to="`/public/courses/${course.id}`" class="inline-flex items-center gap-1 text-primary text-sm font-bold hover:underline w-full justify-center bg-primary/10 py-2 rounded-lg">
                <span class="">Buka Materi</span>
                <span class="material-symbols-outlined text-[16px]">chevron_right</span>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>
