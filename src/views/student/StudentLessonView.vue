<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { supabase } from '../../supabase'
import { markLessonComplete, getStudentSession } from '../../services/student.service'

const route = useRoute()
const router = useRouter()
const courseId = route.params.id
const lessonId = route.params.lessonId

const lesson = ref(null)
const course = ref(null)
const loading = ref(true)

const fetchLessonDetails = async () => {
  try {
    // Fetch course briefly for breadcrumbs
    const { data: courseData } = await supabase.from('courses').select('id, title').eq('id', courseId).single()
    course.value = courseData

    const { data, error } = await supabase
      .from('lessons')
      .select(`
        *,
        lesson_blocks (
          id,
          type,
          content,
          order_index
        )
      `)
      .eq('id', lessonId)
      .single()

    if (error) throw error

    if (data.lesson_blocks) {
      data.lesson_blocks.sort((a, b) => a.order_index - b.order_index)
    } else {
      data.lesson_blocks = []
    }

    lesson.value = data
  } catch (error) {
    console.error('Error fetching lesson:', error)
    alert('Gagal memuat materi pembelajaran.')
    router.push(`/student/courses/${courseId}`)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLessonDetails()
})

const goBack = () => {
  router.push(`/student/courses/${courseId}`)
}

const finishLesson = () => {
  const session = getStudentSession()
  if (session && session.user) {
    markLessonComplete(session.user.id, lessonId)
  }
  
  // Find next lesson or go back
  // For simplicity, we just go back to the course view for now
  router.push(`/student/courses/${courseId}`)
}
</script>

<template>
  <div v-if="loading" class="py-24 flex justify-center w-full">
    <span class="material-symbols-outlined text-[48px] text-primary animate-spin">progress_activity</span>
  </div>

  <div v-else-if="lesson" class="w-full flex flex-col min-h-screen bg-surface">
    <!-- Header Navbar -->
    <header class="sticky top-0 z-40 bg-surface-container-lowest/80 backdrop-blur-xl border-b border-outline-variant/30">
      <div class="max-w-4xl mx-auto px-6 h-16 flex items-center gap-4">
        <button @click="goBack" class="w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface transition-colors">
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <div class="flex flex-col">
          <div class="text-xs font-bold text-primary uppercase tracking-wider line-clamp-1">{{ course?.title || 'Materi' }}</div>
          <h1 class="font-bold text-on-surface line-clamp-1">{{ lesson.title }}</h1>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="flex-1 max-w-3xl mx-auto w-full px-6 py-10 flex flex-col gap-8">
      
      <div v-if="lesson.lesson_blocks.length === 0" class="py-20 text-center flex flex-col items-center">
        <span class="material-symbols-outlined text-[64px] text-outline mb-4">hourglass_empty</span>
        <h2 class="text-xl font-bold text-on-surface mb-2">Materi Masih Kosong</h2>
        <p class="text-on-surface-variant">Guru belum menambahkan konten untuk materi ini.</p>
      </div>
      
      <!-- Render Blocks -->
      <div v-for="block in lesson.lesson_blocks" :key="block.id" class="w-full">
        
        <!-- TEXT / MATERIAL BLOCK -->
        <div v-if="block.type === 'text' || block.type === 'material' || block.type === 'heading'" class="prose prose-lg dark:prose-invert max-w-none text-on-surface">
          <!-- If it's a heading, render an h2, else render html text -->
          <h2 v-if="block.type === 'heading'" class="font-bold text-2xl mt-6 mb-2">{{ block.content.text }}</h2>
          <div v-else v-html="block.content.text"></div>
        </div>

        <!-- IMAGE BLOCK -->
        <div v-else-if="block.type === 'image'" class="flex flex-col items-center my-6">
          <img :src="block.content.url || block.content.text" class="rounded-2xl max-h-[500px] object-contain bg-surface-container-low" alt="Image material" />
        </div>

        <!-- VIDEO BLOCK -->
        <div v-else-if="block.type === 'video'" class="w-full aspect-video rounded-2xl overflow-hidden bg-black my-6 shadow-md">
          <iframe 
            v-if="(block.content.url || block.content.text)?.includes('youtube.com') || (block.content.url || block.content.text)?.includes('youtu.be')"
            :src="(block.content.url || block.content.text)?.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')" 
            class="w-full h-full" 
            frameborder="0" 
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
            allowfullscreen>
          </iframe>
          <video v-else :src="block.content.url || block.content.text" controls class="w-full h-full object-contain"></video>
        </div>

        <!-- PDF BLOCK -->
        <div v-else-if="block.type === 'pdf'" class="w-full h-[600px] rounded-2xl overflow-hidden bg-surface-container-low my-6 border border-outline-variant/30">
          <iframe :src="block.content.url || block.content.text" class="w-full h-full" frameborder="0"></iframe>
        </div>

        <!-- EXPERIMENT BLOCK (Html preview) -->
        <div v-else-if="block.type === 'experiment'" class="w-full rounded-2xl overflow-hidden bg-surface-container-low my-6 shadow-md border border-outline-variant/30 relative" style="min-height: 500px">
          <iframe 
            v-if="(block.content.text || '').trim().startsWith('http')" 
            :src="block.content.text.trim()" 
            class="w-full h-[600px] bg-white" 
            frameborder="0"
            allowfullscreen
          ></iframe>
          <iframe 
            v-else-if="block.content.text" 
            :srcdoc="block.content.text" 
            class="w-full h-[600px] bg-white" 
            frameborder="0"
            allowfullscreen
          ></iframe>
        </div>

        <!-- QUIZ BLOCK -->
        <div v-else-if="block.type === 'quiz'" class="w-full p-6 rounded-2xl bg-surface-container-low my-6 shadow-md border border-outline-variant/30">
          <h3 class="font-bold text-xl mb-4 text-on-surface">Kuis Interaktif</h3>
          <div class="space-y-4">
            <div v-for="(q, i) in block.content?.questions || []" :key="i" class="p-4 bg-surface-container-lowest rounded-xl border border-outline-variant/30">
              <p class="font-bold mb-3">{{ i + 1 }}. {{ q.text || q.question }}</p>
              <div class="space-y-2">
                <div v-for="(opt, oIdx) in q.options" :key="oIdx" class="flex items-center gap-3">
                  <input type="radio" :name="`q_${block.id}_${i}`" :id="`q_${block.id}_${i}_${oIdx}`" class="w-4 h-4 text-primary">
                  <label :for="`q_${block.id}_${i}_${oIdx}`">{{ opt }}</label>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- OTHER TYPES... -->
        <div v-else class="p-6 bg-surface-container-low rounded-2xl my-4 text-center text-on-surface-variant italic">
          [Blok {{ block.type }} belum didukung di tampilan siswa]
        </div>

      </div>

    </main>

    <!-- Footer Action -->
    <footer class="bg-surface-container-lowest border-t border-outline-variant/30 py-6 mt-auto">
      <div class="max-w-3xl mx-auto px-6 flex justify-between items-center">
        <button @click="goBack" class="px-5 py-2.5 rounded-xl font-bold text-on-surface hover:bg-surface-container transition-colors">
          Kembali ke Daftar Modul
        </button>
        <button @click="finishLesson" class="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2">
          <span>Selesai & Lanjut</span>
          <span class="material-symbols-outlined text-[20px]">check_circle</span>
        </button>
      </div>
    </footer>
  </div>
</template>

<style>
/* Styling for prose (text blocks) since we don't have tailwind typography plugin configured */
.prose h1, .prose h2, .prose h3 {
  font-weight: 700;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  line-height: 1.3;
}
.prose h1 { font-size: 2.25rem; }
.prose h2 { font-size: 1.875rem; border-bottom: 1px solid var(--md-sys-color-outline-variant); padding-bottom: 0.3em; }
.prose h3 { font-size: 1.5rem; }
.prose p {
  margin-top: 1em;
  margin-bottom: 1em;
  line-height: 1.75;
}
.prose ul {
  list-style-type: disc;
  padding-left: 1.5em;
  margin-top: 1em;
  margin-bottom: 1em;
}
.prose ol {
  list-style-type: decimal;
  padding-left: 1.5em;
  margin-top: 1em;
  margin-bottom: 1em;
}
.prose li {
  margin-top: 0.5em;
  margin-bottom: 0.5em;
}
.prose a {
  color: var(--md-sys-color-primary);
  text-decoration: underline;
}
</style>
