<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import draggable from 'vuedraggable'
import { getCourseDetails, createModule, createLesson, updateModulesOrder, updateLessonsOrder, updateCourseStatus, updateCourseDetails, getIndependentVirtualLabs } from '../../services/builder.service'
import { getClasses } from '../../services/class.service'
import { user } from '../../services/auth.service'

const route = useRoute()
const router = useRouter()
const courseId = route.params.id

const course = ref(null)
const loading = ref(true)

// State for expanding/collapsing modules
const expandedModules = ref(new Set())

const toggleModule = (moduleId) => {
  if (expandedModules.value.has(moduleId)) {
    expandedModules.value.delete(moduleId)
  } else {
    expandedModules.value.add(moduleId)
  }
}

// Fetch Data
const fetchData = async () => {
  loading.value = true
  try {
    course.value = await getCourseDetails(courseId)
    // Expand first module by default if exists
    if (course.value.modules && course.value.modules.length > 0) {
      expandedModules.value.add(course.value.modules[0].id)
    }
  } catch (error) {
    console.error('Error fetching course builder data:', error)
    alert('Gagal memuat builder: ' + error.message)
    router.push('/teacher/courses')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchData()
})

// Modals State
const showModuleModal = ref(false)
const showLessonModal = ref(false)
const showSettingsModal = ref(false)
const newTitle = ref('')
const newLessonType = ref('material')
const activeModuleId = ref(null)
const isSubmitting = ref(false)

const settingsForm = ref({
  title: '',
  description: '',
  visibility: 'public',
  selectedClasses: [],
  cover_url: '',
  syllabus_url: '',
  syllabus_name: ''
})
const availableClasses = ref([])
const loadingClasses = ref(false)

const independentLabs = ref([])
const labSource = ref('new') // 'new' | 'import'
const selectedIndependentLab = ref('')


const openSettings = async () => {
  if (!course.value) return
  settingsForm.value.title = course.value.title
  settingsForm.value.description = course.value.description || ''
  settingsForm.value.visibility = course.value.visibility || 'public'
  settingsForm.value.cover_url = course.value.cover_url || ''
  settingsForm.value.syllabus_url = course.value.syllabus_url || ''
  settingsForm.value.syllabus_name = course.value.syllabus_name || 'Dokumen Silabus'
  settingsForm.value.selectedClasses = course.value.course_classes 
    ? course.value.course_classes.map(c => c.class_id) 
    : []
  showSettingsModal.value = true

  if (availableClasses.value.length === 0) {
    loadingClasses.value = true
    try {
      availableClasses.value = await getClasses(user.value.id)
    } catch (e) {
      console.error('Failed to fetch classes', e)
    } finally {
      loadingClasses.value = false
    }
  }
}

const handleUpdateSettings = async () => {
  if (!settingsForm.value.title) return
  isSubmitting.value = true
  try {
    const updated = await updateCourseDetails(course.value.id, {
      title: settingsForm.value.title,
      description: settingsForm.value.description,
      visibility: settingsForm.value.visibility,
      cover_url: settingsForm.value.cover_url,
      syllabus_url: settingsForm.value.syllabus_url,
      syllabus_name: settingsForm.value.syllabus_name
    }, settingsForm.value.visibility === 'class' ? settingsForm.value.selectedClasses : [])
    
    course.value.title = updated.title
    course.value.description = updated.description
    course.value.visibility = updated.visibility
    course.value.cover_url = updated.cover_url
    course.value.syllabus_url = updated.syllabus_url
    course.value.syllabus_name = updated.syllabus_name
    if (settingsForm.value.visibility === 'class') {
      course.value.course_classes = settingsForm.value.selectedClasses.map(id => ({ class_id: id }))
    } else {
      course.value.course_classes = []
    }
    
    showSettingsModal.value = false
    alert('Pengaturan berhasil disimpan!')
  } catch (error) {
    alert('Gagal menyimpan pengaturan: ' + error.message)
  } finally {
    isSubmitting.value = false
  }
}

const handleAddModule = async () => {
  if (!newTitle.value) return
  isSubmitting.value = true
  try {
    const nextIndex = course.value.modules ? course.value.modules.length + 1 : 1
    const newModule = await createModule(course.value.id, newTitle.value, nextIndex)
    if (!course.value.modules) course.value.modules = []
    course.value.modules.push(newModule)
    
    // Automatically expand the new module
    expandedModules.value.add(newModule.id)
    
    showModuleModal.value = false
    newTitle.value = ''
  } catch (error) {
    alert('Gagal membuat modul: ' + error.message)
  } finally {
    isSubmitting.value = false
  }
}

const openLessonModal = async (moduleId) => {
  activeModuleId.value = moduleId
  newTitle.value = ''
  newLessonType.value = 'material'
  labSource.value = 'new'
  selectedIndependentLab.value = ''
  showLessonModal.value = true
  
  if (independentLabs.value.length === 0) {
    try {
      independentLabs.value = await getIndependentVirtualLabs()
    } catch (e) {
      console.error('Error fetching independent labs', e)
    }
  }
}

const handleAddLesson = async () => {
  if (!activeModuleId.value) return
  
  let finalTitle = newTitle.value
  
  if (newLessonType.value === 'lab' && labSource.value === 'import') {
    if (!selectedIndependentLab.value) {
      alert('Pilih lab mandiri terlebih dahulu')
      return
    }
    const labObj = independentLabs.value.find(l => l.id === selectedIndependentLab.value)
    if (labObj) finalTitle = labObj.title
  }
  
  if (!finalTitle) return
  
  isSubmitting.value = true
  try {
    const targetModule = course.value.modules.find(m => m.id === activeModuleId.value)
    const nextIndex = targetModule.lessons ? targetModule.lessons.length + 1 : 1
    
    // Create new lesson
    const newLesson = await createLesson(targetModule.id, finalTitle, nextIndex, newLessonType.value)
    
    if (!targetModule.lessons) targetModule.lessons = []
    targetModule.lessons.push(newLesson)
    
    showLessonModal.value = false
    newTitle.value = ''
    newLessonType.value = 'material'
  } catch (error) {
    alert('Gagal membuat lesson: ' + error.message)
  } finally {
    isSubmitting.value = false
  }
}

// Drag & Drop Handlers
const onModulesReordered = async () => {
  try {
    // Update local order indices based on new array position
    course.value.modules.forEach((mod, index) => {
      mod.order_index = index + 1
    })
    // Save to DB
    await updateModulesOrder(course.value.modules)
  } catch (error) {
    console.error('Reorder error:', error)
    alert('Gagal menyimpan urutan modul baru')
  }
}

const onLessonsReordered = async (evt, module) => {
  try {
    // Note: vuedraggable handles moving items between modules automatically if group is identical.
    // However, the `evt` object tells us if an item was added, moved, or removed.
    // The simplest robust approach is to update order_indices for ALL modules if a drag-and-drop occurs,
    // or just the affected module(s).
    
    // For MVP, we update the indices of the specific module whose list changed.
    if (module && module.lessons) {
       module.lessons.forEach((l, index) => {
         l.order_index = index + 1
       })
       await updateLessonsOrder(module.lessons, module.id)
    }
  } catch (error) {
    console.error('Reorder error:', error)
    alert('Gagal menyimpan urutan lesson')
  }
}

const openEditor = (lessonId) => {
  router.push(`/teacher/courses/${courseId}/lessons/${lessonId}/edit`)
}

const isPublishing = ref(false)
const handlePublishCourse = async () => {
  const isPublished = course.value.status === 'published'
  const actionText = isPublished ? 'menyembunyikan (jadikan draft)' : 'mem-publish'
  const newStatus = isPublished ? 'draft' : 'published'
  
  if (!confirm(`Apakah Anda yakin ingin ${actionText} materi ini?`)) return
  
  isPublishing.value = true
  try {
    const updatedCourse = await updateCourseStatus(course.value.id, newStatus)
    course.value.status = updatedCourse.status
    if (newStatus === 'published') {
      alert('Course berhasil dipublikasikan dan akan tampil di silabus publik/siswa!')
    } else {
      alert('Course disembunyikan (Draft) dan tidak lagi tampil di silabus publik/siswa.')
    }
  } catch (error) {
    console.error('Failed to change course status:', error)
    alert(`Gagal ${actionText} course: ` + error.message)
  } finally {
    isPublishing.value = false
  }
}
</script>

<template>
  <div v-if="loading" class="py-24 flex justify-center">
    <span class="material-symbols-outlined text-[48px] text-primary animate-spin">progress_activity</span>
  </div>

  <div v-else-if="course" class="max-w-4xl mx-auto flex flex-col gap-8 pb-24">
    <!-- Header -->
    <div class="flex items-center gap-4 mb-2">
      <router-link to="/teacher/courses" class="w-10 h-10 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors text-on-surface">
        <span class="material-symbols-outlined">arrow_back</span>
      </router-link>
      <div>
        <h1 class="font-headline-sm text-2xl font-bold text-on-surface line-clamp-1">{{ course.title }}</h1>
        <p class="text-sm text-on-surface-variant font-medium">Builder Kerangka Materi</p>
      </div>
      <div class="ml-auto flex gap-3">
        <button 
          @click="openSettings"
          class="bg-surface-container-lowest text-on-surface px-4 py-2 rounded-xl border border-outline-variant/30 font-bold hover:bg-surface-container transition-colors">
          Pengaturan
        </button>
        <button 
          @click="handlePublishCourse" 
          :disabled="isPublishing"
          :class="[
            'px-4 py-2 rounded-xl font-bold transition-colors shadow-sm disabled:opacity-50 flex items-center gap-2',
            course?.status === 'published' ? 'bg-warning/10 text-warning hover:bg-warning/20' : 'bg-primary text-on-primary hover:bg-primary/90'
          ]"
        >
          <span v-if="isPublishing" class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
          {{ course?.status === 'published' ? 'Jadikan Draft (Sembunyikan)' : 'Publikasikan' }}
        </button>
      </div>
    </div>

    <!-- Builder Area -->
    <div class="bg-surface-container-lowest rounded-3xl border border-outline-variant/30 p-6 shadow-sm">
      <div class="flex items-center justify-between mb-8">
        <h2 class="font-headline-sm font-bold text-on-surface">Struktur Modul & Lesson</h2>
        <button @click="showModuleModal = true; newTitle = ''" class="text-primary font-bold hover:bg-primary/10 px-4 py-2 rounded-xl transition-colors flex items-center gap-2">
          <span class="material-symbols-outlined">add</span> Tambah Modul Baru
        </button>
      </div>

      <div v-if="!course.modules || course.modules.length === 0" class="text-center py-16 bg-surface-container-lowest border border-dashed border-outline-variant/50 rounded-2xl">
        <div class="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-4">
          <span class="material-symbols-outlined text-primary text-[32px]">view_agenda</span>
        </div>
        <h3 class="font-bold text-on-surface mb-2">Mulai Susun Kerangka</h3>
        <p class="text-sm text-on-surface-variant max-w-sm mx-auto mb-6">Course Anda belum memiliki materi. Tambahkan Modul (Bab) pertama untuk mulai mengelompokkan materi belajar Anda.</p>
        <button @click="showModuleModal = true; newTitle = ''" class="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-colors shadow-sm">
          + Tambah Modul Pertama
        </button>
      </div>

      <div v-else class="flex flex-col gap-4">
        <draggable 
          v-model="course.modules" 
          group="modules" 
          item-key="id"
          handle=".drag-handle-module"
          ghost-class="opacity-50"
          @end="onModulesReordered"
          class="flex flex-col gap-4"
        >
          <template #item="{ element: module, index: mIndex }">
            <div class="border border-outline-variant/40 rounded-2xl overflow-hidden bg-surface transition-all">
              <!-- Module Header -->
              <div 
                class="flex items-center gap-4 p-4 hover:bg-surface-container-lowest transition-colors cursor-pointer"
                @click="toggleModule(module.id)"
              >
                <div class="drag-handle-module cursor-grab active:cursor-grabbing text-outline hover:text-on-surface p-1" @click.stop>
                  <span class="material-symbols-outlined">drag_indicator</span>
                </div>
                
                <div class="w-8 h-8 rounded-full bg-secondary-container text-on-secondary-container flex items-center justify-center font-bold text-sm shrink-0">
                  {{ mIndex + 1 }}
                </div>
                
                <h3 class="font-bold text-on-surface flex-1">{{ module.title }}</h3>
                
                <div class="flex items-center gap-2">
                  <span class="text-xs font-semibold text-outline px-2 bg-surface-container rounded-full">
                    {{ module.lessons ? module.lessons.length : 0 }} Lesson
                  </span>
                  <button class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-surface-container transition-colors text-outline">
                    <span class="material-symbols-outlined transition-transform duration-300" :class="{ 'rotate-180': expandedModules.has(module.id) }">
                      keyboard_arrow_down
                    </span>
                  </button>
                </div>
              </div>

              <!-- Module Content (Lessons) -->
              <div v-show="expandedModules.has(module.id)" class="border-t border-outline-variant/30 bg-surface-container-lowest p-4">
                <draggable 
                  v-if="module.lessons"
                  v-model="module.lessons" 
                  group="lessons" 
                  item-key="id"
                  handle=".drag-handle-lesson"
                  ghost-class="bg-surface-container"
                  @end="(evt) => onLessonsReordered(evt, module)"
                  class="flex flex-col gap-2 mb-4 min-h-[10px]"
                >
                  <template #item="{ element: lesson }">
                    <div class="group flex items-center gap-3 p-3 rounded-xl border border-outline-variant/30 hover:border-primary/30 hover:shadow-sm bg-surface transition-all">
                      <div class="drag-handle-lesson cursor-grab active:cursor-grabbing text-outline hover:text-on-surface opacity-50 group-hover:opacity-100 transition-opacity">
                        <span class="material-symbols-outlined text-[20px]">drag_indicator</span>
                      </div>
                      
                      <div class="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                           :class="{
                             'bg-primary/10 text-primary': !lesson.type || lesson.type === 'material',
                             'bg-secondary/10 text-secondary': lesson.type === 'quiz',
                             'bg-tertiary/10 text-tertiary': lesson.type === 'lab'
                           }">
                        <span class="material-symbols-outlined text-[18px]">
                          {{ lesson.type === 'quiz' ? 'quiz' : (lesson.type === 'lab' ? 'science' : 'menu_book') }}
                        </span>
                      </div>
                      
                      <div class="flex-1 flex items-center gap-2">
                        <p class="font-semibold text-sm text-on-surface group-hover:text-primary transition-colors">{{ lesson.title }}</p>
                        <span v-if="lesson.type === 'quiz'" class="text-[9px] font-bold px-1.5 py-0.5 rounded border border-secondary/30 text-secondary bg-secondary/5 uppercase">Quiz</span>
                        <span v-if="lesson.type === 'lab'" class="text-[9px] font-bold px-1.5 py-0.5 rounded border border-tertiary/30 text-tertiary bg-tertiary/5 uppercase">Lab</span>
                      </div>

                      <div class="text-[10px] font-bold px-2 py-0.5 rounded uppercase" :class="lesson.status === 'draft' ? 'bg-surface-variant text-on-surface-variant' : 'bg-success/20 text-success'">
                        {{ lesson.status }}
                      </div>

                      <button @click.stop="openEditor(lesson.id)" class="opacity-0 group-hover:opacity-100 bg-primary/10 hover:bg-primary text-primary hover:text-on-primary px-3 py-1.5 rounded-lg text-xs font-bold transition-all ml-2 flex items-center gap-1">
                        <span class="material-symbols-outlined text-[14px]">edit_document</span>
                        Edit Konten
                      </button>
                    </div>
                  </template>
                </draggable>

                <button @click.stop="openLessonModal(module.id)" class="w-full py-3 rounded-xl border border-dashed border-outline-variant/60 hover:border-primary hover:bg-primary/5 hover:text-primary text-on-surface-variant text-sm font-semibold transition-colors flex items-center justify-center gap-2">
                  <span class="material-symbols-outlined text-[18px]">add_circle</span>
                  Tambah Lesson
                </button>
              </div>
            </div>
          </template>
        </draggable>
      </div>
    </div>
  </div>

  <!-- Modal Tambah Modul -->
  <div v-if="showModuleModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-surface-container-highest/50 backdrop-blur-sm" @click="showModuleModal = false"></div>
    <div class="bg-surface-container-lowest rounded-3xl shadow-xl border border-outline-variant/30 w-full max-w-md relative z-10 overflow-hidden flex flex-col p-6">
      <h2 class="font-headline-sm font-bold text-on-surface mb-4">Tambah Modul (Bab) Baru</h2>
      <input 
        v-model="newTitle" 
        type="text" 
        placeholder="Contoh: Bab 1: Ruang Lingkup Biologi"
        class="w-full px-4 py-3 rounded-xl border border-outline-variant/50 bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface mb-6"
        @keyup.enter="handleAddModule"
      />
      <div class="flex gap-3 justify-end">
        <button @click="showModuleModal = false" class="px-5 py-2.5 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container transition-colors">Batal</button>
        <button @click="handleAddModule" :disabled="isSubmitting" class="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center gap-2">
          <span v-if="isSubmitting" class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
          Simpan Modul
        </button>
      </div>
    </div>
  </div>

  <!-- Modal Tambah Lesson -->
  <div v-if="showLessonModal" class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="absolute inset-0 bg-surface-container-highest/50 backdrop-blur-sm" @click="showLessonModal = false"></div>
    <div class="bg-surface-container-lowest rounded-3xl shadow-xl border border-outline-variant/30 w-full max-w-md relative z-10 overflow-hidden flex flex-col p-6">
      <h2 class="font-headline-sm font-bold text-on-surface mb-4">Tambah Lesson (Materi) Baru</h2>
      
      <div class="flex flex-col gap-4 mb-6">
        <div>
          <label class="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Tipe Lesson</label>
          <select 
            v-model="newLessonType"
            class="w-full px-4 py-3 rounded-xl border border-outline-variant/50 bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface appearance-none cursor-pointer mb-4"
          >
            <option value="material">Materi (Teks / Video)</option>
            <option value="table">Tabel Data / Referensi</option>
            <option value="quiz">Quiz Interaktif</option>
            <option value="lab">Lab Virtual (HTML / Simulasi)</option>
          </select>
        </div>

        <template v-if="newLessonType === 'lab'">
          <div class="flex items-center gap-4 mb-2">
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" v-model="labSource" value="new" class="text-primary focus:ring-primary w-4 h-4">
              <span class="text-sm font-bold text-on-surface">Buat Baru</span>
            </label>
            <label class="flex items-center gap-2 cursor-pointer">
              <input type="radio" v-model="labSource" value="import" class="text-primary focus:ring-primary w-4 h-4">
              <span class="text-sm font-bold text-on-surface">Pilih dari Lab Mandiri</span>
            </label>
          </div>
          
          <div v-if="labSource === 'import'">
            <label class="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Pilih Lab Mandiri</label>
            <select v-model="selectedIndependentLab" class="w-full px-4 py-3 rounded-xl border border-outline-variant/50 bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface appearance-none cursor-pointer">
              <option value="" disabled>-- Pilih Lab --</option>
              <option v-for="lab in independentLabs" :key="lab.id" :value="lab.id">{{ lab.title }}</option>
            </select>
          </div>
        </template>
        
        <div v-if="newLessonType !== 'lab' || labSource === 'new'">
          <label class="block text-xs font-bold text-on-surface-variant mb-1 uppercase tracking-wider">Judul</label>
          <input 
            v-model="newTitle" 
            type="text" 
            placeholder="Contoh: Pengertian dan Ciri Makhluk Hidup"
            class="w-full px-4 py-3 rounded-xl border border-outline-variant/50 bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface"
            @keyup.enter="handleAddLesson"
          />
        </div>
      </div>

      <div class="flex gap-3 justify-end">
        <button @click="showLessonModal = false" class="px-5 py-2.5 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container transition-colors">Batal</button>
        <button @click="handleAddLesson" :disabled="isSubmitting" class="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all flex items-center gap-2">
          <span v-if="isSubmitting" class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
          Simpan Lesson
        </button>
      </div>
    </div>
  </div>

  <!-- Settings Modal -->
  <div v-if="showSettingsModal" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
    <div class="bg-surface-container-lowest rounded-3xl w-full max-w-md overflow-hidden shadow-xl flex flex-col max-h-[90vh]">
      <div class="p-6 border-b border-outline-variant/20">
        <h2 class="text-2xl font-bold text-on-surface">Pengaturan Course</h2>
      </div>
      <div class="p-6 flex flex-col gap-4 overflow-y-auto">
        <div class="flex flex-col gap-2">
          <label class="text-sm font-bold text-on-surface">Judul Course</label>
          <input v-model="settingsForm.title" type="text" class="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="Masukkan judul..." />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-bold text-on-surface">Deskripsi (Opsional)</label>
          <textarea v-model="settingsForm.description" rows="3" class="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none" placeholder="Tuliskan deskripsi singkat..."></textarea>
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-bold text-on-surface">Gambar/Foto (URL)</label>
          <input v-model="settingsForm.cover_url" type="url" class="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="https://contoh.com/gambar.jpg" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-bold text-on-surface">Dokumen Silabus/Materi (URL PDF/File)</label>
          <input v-model="settingsForm.syllabus_url" type="url" class="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="https://contoh.com/silabus.pdf" />
        </div>
        <div class="flex flex-col gap-2">
          <label class="text-sm font-bold text-on-surface">Nama Dokumen Silabus</label>
          <input v-model="settingsForm.syllabus_name" type="text" class="w-full px-4 py-2.5 bg-surface-container-lowest border border-outline-variant/50 rounded-xl focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="Misal: Pedoman Belajar Bab 1" />
        </div>
        
        <div class="flex flex-col gap-2 pt-2 border-t border-outline-variant/30">
          <label class="text-sm font-bold text-on-surface">Akses Course</label>
          <div class="flex flex-col gap-2">
            <label class="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/30 cursor-pointer hover:bg-surface-container-low transition-colors" :class="{'border-primary bg-primary/5': settingsForm.visibility === 'public'}">
              <input type="radio" v-model="settingsForm.visibility" value="public" class="w-4 h-4 text-primary focus:ring-primary">
              <div>
                <div class="font-bold text-on-surface text-sm">Publik (Semua Siswa)</div>
                <div class="text-xs text-on-surface-variant">Course ini dapat dilihat oleh semua siswa tanpa perlu login (kecuali isi materi).</div>
              </div>
            </label>
            
            <label class="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/30 cursor-pointer hover:bg-surface-container-low transition-colors" :class="{'border-primary bg-primary/5': settingsForm.visibility === 'class'}">
              <input type="radio" v-model="settingsForm.visibility" value="class" class="w-4 h-4 text-primary focus:ring-primary">
              <div>
                <div class="font-bold text-on-surface text-sm">Privat (Hanya Kelas Tertentu)</div>
                <div class="text-xs text-on-surface-variant">Course hanya akan muncul di dashboard siswa yang terdaftar pada kelas yang Anda pilih.</div>
              </div>
            </label>
          </div>
        </div>
        
        <div v-if="settingsForm.visibility === 'class'" class="flex flex-col gap-2">
          <label class="text-sm font-bold text-on-surface">Pilih Kelas</label>
          <div v-if="loadingClasses" class="text-sm text-outline flex items-center gap-2">
            <span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> Memuat kelas...
          </div>
          <div v-else-if="availableClasses.length === 0" class="text-sm text-error font-medium p-3 bg-error/10 rounded-xl">
            Anda belum membuat satupun kelas. Buat kelas terlebih dahulu di menu Kelas.
          </div>
          <div v-else class="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2">
            <label v-for="cls in availableClasses" :key="cls.id" class="flex items-center gap-3 p-2 hover:bg-surface-container-low rounded-lg cursor-pointer transition-colors">
              <input type="checkbox" :value="cls.id" v-model="settingsForm.selectedClasses" class="w-4 h-4 rounded text-primary focus:ring-primary">
              <span class="text-sm font-medium text-on-surface">{{ cls.name }}</span>
            </label>
          </div>
        </div>
      </div>
      <div class="p-4 bg-surface-container/50 border-t border-outline-variant/20 flex justify-end gap-2 shrink-0">
        <button @click="showSettingsModal = false" class="px-5 py-2.5 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container transition-colors">Batal</button>
        <button @click="handleUpdateSettings" :disabled="!settingsForm.title || isSubmitting" class="bg-primary text-on-primary hover:bg-primary/90 px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50">
          {{ isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan' }}
        </button>
      </div>
    </div>
  </div>

</template>

