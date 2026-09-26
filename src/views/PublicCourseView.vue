<script setup>
import PublicHeader from '../components/PublicHeader.vue'
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../supabase'

const route = useRoute()
const router = useRouter()
const courseId = route.params.id

const course = ref(null)
const loading = ref(true)

const fetchCourseDetails = async () => {
  try {
    const { data, error } = await supabase
      .from('courses')
      .select(`
        *,
        profiles (full_name),
        modules (
          id,
          title,
          order_index,
          lessons (
            id,
            title,
            type,
            status,
            order_index
          )
        )
      `)
      .eq('id', courseId)
      .eq('status', 'published')
      .or('visibility.eq.public,visibility.is.null') // pastikan bisa diakses jika public
      .single()

    if (error) throw error

    if (data.modules) {
      data.modules.sort((a, b) => a.order_index - b.order_index)
      data.modules.forEach(module => {
        if (module.lessons) {
          module.lessons.sort((a, b) => a.order_index - b.order_index)
        }
      })
    }

    course.value = data
  } catch (error) {
    console.error('Error fetching course:', error)
    alert('Materi tidak ditemukan atau bersifat privat (hanya untuk siswa yang login).')
    router.push('/')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchCourseDetails()
})

const getLessonIcon = (type) => {
  switch(type) {
    case 'video': return 'play_circle'
    case 'pdf': return 'picture_as_pdf'
    case 'quiz': return 'quiz'
    case '3d_model': return 'view_in_ar'
    case 'experiment': return 'science'
    default: return 'menu_book'
  }
}

const getLessonColor = (type) => {
  switch(type) {
    case 'video': return 'text-primary'
    case 'pdf': return 'text-error'
    case 'quiz': return 'text-tertiary'
    case '3d_model': return 'text-secondary'
    case 'experiment': return 'text-secondary'
    default: return 'text-on-surface'
  }
}

const openLesson = (lessonId) => {
  router.push(`/public/courses/${courseId}/lessons/${lessonId}`)
}
</script>

<template>
  <PublicHeader backLink="/public/courses" />

  <div class="bg-surface min-h-screen pb-20">
    <div v-if="loading" class="py-24 flex justify-center w-full">
      <span class="material-symbols-outlined text-[48px] text-primary animate-spin">progress_activity</span>
    </div>

    <div v-else-if="course" class="max-w-4xl mx-auto px-6 py-10 w-full flex flex-col gap-8">
      
      <!-- Course Header -->
      <div class="bg-surface-container-lowest rounded-3xl p-8 border border-outline-variant/30 shadow-sm relative overflow-hidden">
        <div class="absolute -right-10 -top-10 opacity-5 pointer-events-none">
          <span class="material-symbols-outlined text-[200px]">menu_book</span>
        </div>
        
        <div class="flex items-center gap-4 mb-6">
          <router-link to="/public/courses" class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors text-on-surface">
            <span class="material-symbols-outlined">arrow_back</span>
          </router-link>
          <span class="px-3 py-1 bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider rounded-lg">Materi Publik</span>
        </div>
        
        <h1 class="text-3xl font-bold text-on-surface mb-4">{{ course.title }}</h1>
        <p class="text-on-surface-variant leading-relaxed mb-6">{{ course.description || 'Tidak ada deskripsi untuk course ini.' }}</p>
        
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-full bg-surface-variant flex items-center justify-center text-on-surface-variant font-bold text-xs">
            {{ course.profiles?.full_name ? course.profiles.full_name.charAt(0).toUpperCase() : 'G' }}
          </div>
          <span class="text-sm font-medium text-on-surface-variant">Oleh: {{ course.profiles?.full_name || 'Guru' }}</span>
        </div>
      </div>

      <!-- Modules List -->
      <div class="flex flex-col gap-6">
        <h2 class="text-xl font-bold text-on-surface">Daftar Modul & Materi</h2>
        
        <div v-if="!course.modules || course.modules.length === 0" class="p-8 text-center bg-surface-container-lowest rounded-2xl border border-outline-variant/20">
          <span class="material-symbols-outlined text-4xl text-outline mb-2">inbox</span>
          <p class="text-on-surface-variant">Belum ada modul di course ini.</p>
        </div>

        <div v-for="(mod, mIndex) in course.modules" :key="mod.id" class="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden shadow-sm">
          <div class="p-5 bg-surface-container-low/50 border-b border-outline-variant/30 flex items-center gap-4">
            <div class="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              {{ mIndex + 1 }}
            </div>
            <h3 class="font-bold text-lg text-on-surface">{{ mod.title }}</h3>
          </div>
          
          <div class="p-2 flex flex-col">
            <div v-if="!mod.lessons || mod.lessons.length === 0" class="p-4 text-sm text-on-surface-variant text-center italic">
              Belum ada materi di modul ini.
            </div>
            
            <button 
              v-for="lesson in mod.lessons" 
              :key="lesson.id"
              @click="openLesson(lesson.id)"
              class="flex items-center gap-4 p-4 hover:bg-surface-container-low transition-colors text-left group rounded-xl m-1"
            >
              <div class="w-8 h-8 rounded-full bg-surface-container flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                <span class="material-symbols-outlined text-[18px] transition-colors" :class="getLessonColor(lesson.type)">{{ getLessonIcon(lesson.type) }}</span>
              </div>
              
              <div class="flex-1">
                <div class="font-bold text-on-surface group-hover:text-primary transition-colors flex items-center gap-2">
                  {{ lesson.title }}
                </div>
                <div class="text-xs text-on-surface-variant uppercase tracking-wide mt-1">{{ lesson.type === 'material' ? 'Materi Teks' : lesson.type }}</div>
              </div>
              
              <span class="material-symbols-outlined text-outline group-hover:text-primary transition-colors">chevron_right</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
