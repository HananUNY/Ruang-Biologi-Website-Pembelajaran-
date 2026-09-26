<script setup>
import { ref, computed, onMounted } from 'vue'
import { getCourses, createCourse } from '../../services/course.service'
import { updateCourseDetails, deleteCourse, updateCourseStatus } from '../../services/builder.service'
import { ensureProfileExists } from '../../services/profile.service'
import { getClasses } from '../../services/class.service'
import { user } from '../../services/auth.service'

const courses = ref([])
const filter = ref('all') // all, published, draft
const loading = ref(true)

// Modal State
const isModalOpen = ref(false)
const isSubmitting = ref(false)
const newCourse = ref({
  title: '',
  description: ''
})

const filteredCourses = computed(() => {
  if (filter.value === 'all') return courses.value
  return courses.value.filter(c => c.status === filter.value)
})

const fetchCourses = async () => {
  loading.value = true
  try {
    await ensureProfileExists()
    courses.value = await getCourses()
  } catch (error) {
    console.error('Failed to fetch courses:', error)
  } finally {
    loading.value = false
  }
}

const openModal = () => {
  newCourse.value = { title: '', description: '' }
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
}

const handleCreateCourse = async () => {
  if (!newCourse.value.title) return

  isSubmitting.value = true
  try {
    await createCourse(newCourse.value.title, newCourse.value.description)
    closeModal()
    await fetchCourses() // Refresh the list
  } catch (error) {
    console.error('Error creating course:', error)
    alert('Gagal membuat course: ' + error.message)
  } finally {
    isSubmitting.value = false
  }
}

const handleHideCourse = async (courseId) => {
  if (!confirm('Sembunyikan course ini? (Akan menjadi Draft)')) return
  try {
    await updateCourseStatus(courseId, 'draft')
    const index = courses.value.findIndex(c => c.id === courseId)
    if (index !== -1) {
      courses.value[index].status = 'draft'
    }
  } catch (error) {
    console.error('Failed to hide course:', error)
    alert('Gagal menyembunyikan course: ' + error.message)
  }
}

const handleDeleteCourse = async (courseId) => {
  if (!confirm('Anda yakin ingin menghapus course ini? Semua materi di dalamnya akan ikut terhapus secara permanen.')) return
  try {
    await deleteCourse(courseId)
    courses.value = courses.value.filter(c => c.id !== courseId)
  } catch (error) {
    console.error('Failed to delete course:', error)
    alert('Gagal menghapus course: ' + error.message)
  }
}

// Edit Modal State
const isEditModalOpen = ref(false)
const editingCourse = ref({
  id: null,
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

const openEditModal = async (course) => {
  editingCourse.value.id = course.id
  editingCourse.value.title = course.title
  editingCourse.value.description = course.description || ''
  editingCourse.value.visibility = course.visibility || 'public'
  editingCourse.value.cover_url = course.cover_url || ''
  editingCourse.value.syllabus_url = course.syllabus_url || ''
  editingCourse.value.syllabus_name = course.syllabus_name || 'Dokumen Silabus'
  editingCourse.value.selectedClasses = course.course_classes 
    ? course.course_classes.map(c => c.class_id) 
    : []
  isEditModalOpen.value = true

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

const closeEditModal = () => {
  isEditModalOpen.value = false
}

const handleUpdateCourse = async () => {
  if (!editingCourse.value.title || !editingCourse.value.id) return

  isSubmitting.value = true
  try {
    const updated = await updateCourseDetails(editingCourse.value.id, {
      title: editingCourse.value.title,
      description: editingCourse.value.description,
      visibility: editingCourse.value.visibility,
      cover_url: editingCourse.value.cover_url,
      syllabus_url: editingCourse.value.syllabus_url,
      syllabus_name: editingCourse.value.syllabus_name
    }, editingCourse.value.visibility === 'class' ? editingCourse.value.selectedClasses : [])
    
    // Update local state directly
    const index = courses.value.findIndex(c => c.id === updated.id)
    if (index !== -1) {
      courses.value[index].title = updated.title
      courses.value[index].description = updated.description
      courses.value[index].visibility = updated.visibility
      courses.value[index].cover_url = updated.cover_url
      courses.value[index].syllabus_url = updated.syllabus_url
      courses.value[index].syllabus_name = updated.syllabus_name
      if (editingCourse.value.visibility === 'class') {
        courses.value[index].course_classes = editingCourse.value.selectedClasses.map(id => ({ class_id: id }))
      } else {
        courses.value[index].course_classes = []
      }
    }
    
    closeEditModal()
  } catch (error) {
    console.error('Error updating course:', error)
    alert('Gagal menyimpan perubahan: ' + error.message)
  } finally {
    isSubmitting.value = false
  }
}

onMounted(() => {
  fetchCourses()
})

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium' }).format(date)
}
</script>

<template>
  <div class="flex flex-col gap-6 max-w-6xl mx-auto relative">
    <!-- Header -->
    <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
      <div>
        <h1 class="font-headline-md text-2xl font-bold text-on-surface">Courses</h1>
        <p class="text-on-surface-variant text-sm mt-1">Kelola seluruh mata pelajaran dan modul kelas Anda.</p>
      </div>
      
      <button @click="openModal" class="bg-primary text-on-primary px-4 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2">
        <span class="material-symbols-outlined text-[20px]">add</span>
        Buat Course Baru
      </button>
    </div>

    <!-- Filters -->
    <div class="flex items-center gap-2 border-b border-outline-variant/30 pb-4">
      <button 
        @click="filter = 'all'" 
        class="px-4 py-2 rounded-full text-sm font-semibold transition-colors"
        :class="filter === 'all' ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-surface-container'"
      >
        Semua Course
      </button>
      <button 
        @click="filter = 'published'" 
        class="px-4 py-2 rounded-full text-sm font-semibold transition-colors"
        :class="filter === 'published' ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-surface-container'"
      >
        Dipublikasikan
      </button>
      <button 
        @click="filter = 'draft'" 
        class="px-4 py-2 rounded-full text-sm font-semibold transition-colors"
        :class="filter === 'draft' ? 'bg-secondary-container text-on-secondary-container' : 'text-on-surface-variant hover:bg-surface-container'"
      >
        Draft
      </button>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="py-24 flex justify-center">
      <span class="material-symbols-outlined text-[48px] text-primary animate-spin">progress_activity</span>
    </div>

    <!-- Empty State -->
    <div v-else-if="filteredCourses.length === 0" class="bg-surface-container-lowest rounded-3xl p-12 text-center border border-outline-variant/30 flex flex-col items-center justify-center py-24">
      <div class="w-24 h-24 bg-primary-container rounded-full flex items-center justify-center mb-6">
        <span class="material-symbols-outlined text-[48px] text-primary">book</span>
      </div>
      <h3 class="font-headline-sm font-bold text-on-surface mb-2">Belum ada course di sini</h3>
      <p class="text-on-surface-variant max-w-md mx-auto mb-8">Anda belum membuat mata pelajaran dengan status ini. Mulai buat course pertama Anda untuk membagikan materi ke siswa.</p>
      <button @click="openModal" class="bg-primary text-on-primary px-6 py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-sm">
        Buat Course Pertama
      </button>
    </div>

    <!-- Courses Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="course in filteredCourses" :key="course.id" class="bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden hover:shadow-md transition-shadow group flex flex-col">
        <!-- Cover Image -->
        <div class="h-40 bg-surface-container relative overflow-hidden">
          <img :src="course.cover_url" alt="Cover" class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
          
          <!-- Status Badge -->
          <div class="absolute top-3 right-3 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider backdrop-blur-md"
               :class="{
                 'bg-success/90 text-on-primary': course.status === 'published',
                 'bg-surface-variant/90 text-on-surface-variant': course.status === 'draft',
                 'bg-error/90 text-on-primary': course.status === 'archived'
               }">
            {{ course.status }}
          </div>
        </div>

        <!-- Content -->
        <div class="p-5 flex-1 flex flex-col">
          <h3 class="font-headline-sm text-lg font-bold text-on-surface mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors cursor-pointer">
            {{ course.title }}
          </h3>
          <p class="text-sm text-on-surface-variant line-clamp-2 mb-4 flex-1">
            {{ course.description || 'Tidak ada deskripsi.' }}
          </p>

          <!-- Meta Info -->
          <div class="flex items-center gap-4 text-xs font-semibold text-outline mb-4">
            <div class="flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]">folder</span>
              {{ course.modulesCount }} Modul
            </div>
            <div class="flex items-center gap-1">
              <span class="material-symbols-outlined text-[16px]">description</span>
              {{ course.lessonsCount }} Lesson
            </div>
          </div>

          <!-- Footer Actions -->
          <div class="pt-4 border-t border-outline-variant/30 flex items-center justify-between">
            <span class="text-xs text-outline font-medium">Diubah {{ formatDate(course.updated_at) }}</span>
            <div class="flex gap-1">
              <button @click="openEditModal(course)" class="w-8 h-8 rounded-full hover:bg-surface-container flex items-center justify-center text-outline hover:text-on-surface transition-colors" title="Pengaturan">
                <span class="material-symbols-outlined text-[18px]">settings</span>
              </button>
              <button v-if="course.status === 'published'" @click="handleHideCourse(course.id)" class="w-8 h-8 rounded-full hover:bg-warning/10 flex items-center justify-center text-warning transition-colors" title="Sembunyikan (Jadikan Draft)">
                <span class="material-symbols-outlined text-[18px]">visibility_off</span>
              </button>
              <button @click="handleDeleteCourse(course.id)" class="w-8 h-8 rounded-full hover:bg-error/10 flex items-center justify-center text-error transition-colors" title="Hapus Course">
                <span class="material-symbols-outlined text-[18px]">delete</span>
              </button>
              <router-link :to="`/teacher/courses/${course.id}`" class="w-8 h-8 rounded-full hover:bg-primary/10 flex items-center justify-center text-primary transition-colors" title="Buka Builder">
                <span class="material-symbols-outlined text-[18px]">edit</span>
              </router-link>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Course Modal -->
    <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-surface-container-highest/50 backdrop-blur-sm" @click="closeModal"></div>
      
      <div class="bg-surface-container-lowest rounded-3xl shadow-xl border border-outline-variant/30 w-full max-w-md relative z-10 overflow-hidden flex flex-col animate-scale-in">
        <div class="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center">
          <h2 class="font-headline-sm font-bold text-on-surface">Buat Course Baru</h2>
          <button @click="closeModal" class="text-outline hover:text-on-surface transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div class="p-6">
          <form @submit.prevent="handleCreateCourse" class="flex flex-col gap-4">
            <div>
              <label class="block text-sm font-bold text-on-surface mb-1.5" for="title">Judul Mata Pelajaran</label>
              <input 
                id="title" 
                v-model="newCourse.title" 
                type="text" 
                required 
                placeholder="Contoh: Biologi Kelas X"
                class="w-full px-4 py-3 rounded-xl border border-outline-variant/50 bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface"
              />
            </div>
            
            <div>
              <label class="block text-sm font-bold text-on-surface mb-1.5" for="description">Deskripsi Singkat (Opsional)</label>
              <textarea 
                id="description" 
                v-model="newCourse.description" 
                rows="3"
                placeholder="Tuliskan gambaran singkat tentang materi yang diajarkan..."
                class="w-full px-4 py-3 rounded-xl border border-outline-variant/50 bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface resize-none"
              ></textarea>
            </div>
            
            <div class="mt-4 flex gap-3 justify-end">
              <button 
                type="button" 
                @click="closeModal"
                class="px-5 py-2.5 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                :disabled="isSubmitting"
              >
                Batal
              </button>
              <button 
                type="submit" 
                class="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2"
                :disabled="isSubmitting"
              >
                <span v-if="isSubmitting" class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                {{ isSubmitting ? 'Menyimpan...' : 'Simpan Course' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>

    <!-- Edit Course Modal -->
    <div v-if="isEditModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-surface-container-highest/50 backdrop-blur-sm" @click="closeEditModal"></div>
      
      <div class="bg-surface-container-lowest rounded-3xl shadow-xl border border-outline-variant/30 w-full max-w-md relative z-10 overflow-hidden flex flex-col animate-scale-in max-h-[90vh]">
        <div class="px-6 py-5 border-b border-outline-variant/30 flex justify-between items-center shrink-0">
          <h2 class="font-headline-sm font-bold text-on-surface">Pengaturan Course</h2>
          <button @click="closeEditModal" class="text-outline hover:text-on-surface transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div class="p-6 overflow-y-auto">
          <form @submit.prevent="handleUpdateCourse" class="flex flex-col gap-4">
            <div>
              <label class="block text-sm font-bold text-on-surface mb-1.5">Judul Mata Pelajaran</label>
              <input 
                v-model="editingCourse.title" 
                type="text" 
                required 
                class="w-full px-4 py-3 rounded-xl border border-outline-variant/50 bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface"
              />
            </div>
            
            <div>
              <label class="block text-sm font-bold text-on-surface mb-1.5">Deskripsi (Opsional)</label>
              <textarea 
                v-model="editingCourse.description" 
                rows="3"
                class="w-full px-4 py-3 rounded-xl border border-outline-variant/50 bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface resize-none"
              ></textarea>
            </div>
            
            <div>
              <label class="block text-sm font-bold text-on-surface mb-1.5">Gambar/Foto (URL)</label>
              <input 
                v-model="editingCourse.cover_url" 
                type="url" 
                class="w-full px-4 py-3 rounded-xl border border-outline-variant/50 bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface" 
                placeholder="https://contoh.com/gambar.jpg" 
              />
            </div>
            
            <div>
              <label class="block text-sm font-bold text-on-surface mb-1.5">Dokumen Silabus/Materi (URL PDF/File)</label>
              <input 
                v-model="editingCourse.syllabus_url" 
                type="url" 
                class="w-full px-4 py-3 rounded-xl border border-outline-variant/50 bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface" 
                placeholder="https://contoh.com/silabus.pdf" 
              />
            </div>

            <div>
              <label class="block text-sm font-bold text-on-surface mb-1.5">Nama Dokumen Silabus</label>
              <input 
                v-model="editingCourse.syllabus_name" 
                type="text" 
                class="w-full px-4 py-3 rounded-xl border border-outline-variant/50 bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface" 
                placeholder="Misal: Pedoman Belajar Bab 1" 
              />
            </div>
            
            <div class="flex flex-col gap-2 pt-2 border-t border-outline-variant/30">
              <label class="text-sm font-bold text-on-surface">Akses Course</label>
              <div class="flex flex-col gap-2">
                <label class="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/30 cursor-pointer hover:bg-surface-container-low transition-colors" :class="{'border-primary bg-primary/5': editingCourse.visibility === 'public'}">
                  <input type="radio" v-model="editingCourse.visibility" value="public" class="w-4 h-4 text-primary focus:ring-primary">
                  <div>
                    <div class="font-bold text-on-surface text-sm">Publik (Semua Siswa)</div>
                    <div class="text-xs text-on-surface-variant">Course ini dapat dilihat oleh semua siswa tanpa perlu login (kecuali isi materi).</div>
                  </div>
                </label>
                
                <label class="flex items-center gap-3 p-3 rounded-xl border border-outline-variant/30 cursor-pointer hover:bg-surface-container-low transition-colors" :class="{'border-primary bg-primary/5': editingCourse.visibility === 'class'}">
                  <input type="radio" v-model="editingCourse.visibility" value="class" class="w-4 h-4 text-primary focus:ring-primary">
                  <div>
                    <div class="font-bold text-on-surface text-sm">Privat (Hanya Kelas Tertentu)</div>
                    <div class="text-xs text-on-surface-variant">Course hanya akan muncul di dashboard siswa yang terdaftar pada kelas yang Anda pilih.</div>
                  </div>
                </label>
              </div>
            </div>
            
            <div v-if="editingCourse.visibility === 'class'" class="flex flex-col gap-2 animate-fade-in">
              <label class="text-sm font-bold text-on-surface">Pilih Kelas</label>
              <div v-if="loadingClasses" class="text-sm text-outline flex items-center gap-2">
                <span class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span> Memuat kelas...
              </div>
              <div v-else-if="availableClasses.length === 0" class="text-sm text-error font-medium p-3 bg-error/10 rounded-xl">
                Anda belum membuat satupun kelas. Buat kelas terlebih dahulu di menu Kelas.
              </div>
              <div v-else class="flex flex-col gap-2 max-h-40 overflow-y-auto pr-2">
                <label v-for="cls in availableClasses" :key="cls.id" class="flex items-center gap-3 p-2 hover:bg-surface-container-low rounded-lg cursor-pointer transition-colors">
                  <input type="checkbox" :value="cls.id" v-model="editingCourse.selectedClasses" class="w-4 h-4 rounded text-primary focus:ring-primary">
                  <span class="text-sm font-medium text-on-surface">{{ cls.name }}</span>
                </label>
              </div>
            </div>
            
            <div class="mt-4 pt-4 border-t border-outline-variant/20 flex gap-3 justify-end shrink-0">
              <button 
                type="button" 
                @click="closeEditModal"
                class="px-5 py-2.5 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container transition-colors"
                :disabled="isSubmitting"
              >
                Batal
              </button>
              <button 
                type="submit" 
                class="bg-primary text-on-primary px-5 py-2.5 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2"
                :disabled="isSubmitting"
              >
                <span v-if="isSubmitting" class="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
                {{ isSubmitting ? 'Menyimpan...' : 'Simpan Perubahan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>
