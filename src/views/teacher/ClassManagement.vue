<script setup>
import { ref, onMounted } from 'vue'
import { getSession } from '../../services/auth.service'
import { getClasses, createClass, updateClass, deleteClass, getClassMembers, addStudentToClass, addMultipleStudentsToClass } from '../../services/class.service'

const currentUser = ref(null)
const classesList = ref([])
const loading = ref(true)

const showModal = ref(false)
const saving = ref(false)
const formData = ref({
  id: null,
  name: ''
})

// Students View
const showStudentsModal = ref(false)
const selectedClass = ref(null)
const classStudents = ref([])
const loadingStudents = ref(false)

const newStudent = ref({
  full_name: '',
  nis: '',
  password: ''
})
const addingStudent = ref(false)
const fileInput = ref(null)

const viewStudents = async (c) => {
  selectedClass.value = c
  showStudentsModal.value = true
  loadingStudents.value = true
  try {
    const data = await getClassMembers(c.id)
    classStudents.value = data
  } catch (error) {
    console.error('Failed to load students:', error)
  } finally {
    loadingStudents.value = false
  }
}

const triggerFileUpload = () => {
  fileInput.value.click()
}

const downloadCsvTemplate = () => {
  const csvContent = "NIS,Nama Lengkap,Password\n1234567890,Budi Santoso,P4ssw0rd\n0987654321,Siti Aminah,Siti123\n1122334455,Ahmad Dahlan,"; // The last one will use NIS as password
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", "template_data_siswa.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

const handleFileUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  addingStudent.value = true
  try {
    const text = await file.text()
    const rows = text.split('\n').map(row => row.trim()).filter(row => row.length > 0)
    
    // Asumsi format CSV: NIS,Nama Lengkap,Password(opsional)
    const studentsToUpload = []
    
    // Tentukan delimiter: koma atau titik koma (sering digunakan Excel Indonesia)
    const delimiter = rows[0].includes(';') ? ';' : ','
    
    // Lewati baris pertama jika itu adalah header
    const startIndex = rows[0].toLowerCase().includes('nis') ? 1 : 0
    
    for (let i = startIndex; i < rows.length; i++) {
      const cols = rows[i].split(delimiter)
      if (cols.length >= 2) {
        studentsToUpload.push({
          nis: cols[0].trim(),
          full_name: cols[1].trim(),
          password: cols[2] ? cols[2].trim() : cols[0].trim() // Default password = NIS
        })
      }
    }
    
    if (studentsToUpload.length === 0) {
      alert('Tidak ada data yang valid ditemukan di CSV. Pastikan formatnya: NIS,Nama')
      return
    }
    
    const result = await addMultipleStudentsToClass(selectedClass.value.id, studentsToUpload, currentUser.value.id)
    
    alert(`Upload selesai! Berhasil: ${result.success}, Gagal: ${result.failed}`)
    
    // Reload student list
    const data = await getClassMembers(selectedClass.value.id)
    classStudents.value = data
    
  } catch (error) {
    alert('Gagal memproses CSV: ' + error.message)
  } finally {
    addingStudent.value = false
    event.target.value = '' // Reset input file
  }
}

const submitAddStudent = async () => {
  if (!newStudent.value.full_name || !newStudent.value.nis || !newStudent.value.password) {
    alert('Mohon lengkapi data siswa (Nama, NIS, Password)');
    return;
  }

  addingStudent.value = true;
  try {
    await addStudentToClass(selectedClass.value.id, newStudent.value, currentUser.value.id);
    // Reload student list
    const data = await getClassMembers(selectedClass.value.id);
    classStudents.value = data;
    
    // Clear form
    newStudent.value = { full_name: '', nis: '', password: '' };
  } catch (error) {
    alert('Gagal menambah siswa: ' + error.message);
  } finally {
    addingStudent.value = false;
  }
}

const fetchClasses = async () => {
  loading.value = true
  try {
    const session = await getSession()
    if (session?.user) {
      currentUser.value = session.user
      classesList.value = await getClasses(session.user.id)
    }
  } catch (error) {
    console.error('Failed to load classes:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchClasses()
})

const openAddModal = () => {
  formData.value = { id: null, name: '' }
  showModal.value = true
}

const openEditModal = (c) => {
  formData.value = { id: c.id, name: c.name }
  showModal.value = true
}

const saveForm = async () => {
  if (!formData.value.name) return
  
  saving.value = true
  try {
    if (formData.value.id) {
      await updateClass(formData.value.id, { name: formData.value.name })
    } else {
      await createClass({
        teacher_id: currentUser.value.id,
        name: formData.value.name
      })
    }
    showModal.value = false
    fetchClasses()
  } catch (error) {
    alert('Gagal menyimpan: ' + error.message)
  } finally {
    saving.value = false
  }
}

const removeClass = async (id) => {
  if (confirm('Yakin ingin menghapus kelas ini? Semua data terkait (termasuk jadwal ujian) akan ikut terhapus.')) {
    try {
      await deleteClass(id)
      fetchClasses()
    } catch (error) {
      alert('Gagal menghapus: ' + error.message)
    }
  }
}
</script>

<template>
  <div class="max-w-7xl mx-auto py-8 px-4">
    <!-- Header -->
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
      <div>
        <h1 class="text-3xl font-extrabold text-on-surface mb-2 tracking-tight">Manajemen Kelas</h1>
        <p class="text-on-surface-variant text-sm">Kelola daftar kelas Anda dan pantau jumlah ujian yang telah dijadwalkan.</p>
      </div>
      <button @click="openAddModal" class="bg-primary text-on-primary hover:bg-primary/90 px-5 py-3 rounded-xl font-bold transition-all flex items-center justify-center gap-2 shadow-sm whitespace-nowrap">
        <span class="material-symbols-outlined text-[20px]">add</span>
        Tambah Kelas
      </button>
    </div>

    <!-- Empty State / Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
    </div>
    
    <div v-else-if="classesList.length === 0" class="text-center py-20 bg-surface-container-lowest border border-dashed border-outline-variant/50 rounded-3xl">
      <span class="material-symbols-outlined text-5xl text-outline-variant mb-4">groups</span>
      <h3 class="text-xl font-bold text-on-surface mb-2">Belum ada Kelas</h3>
      <p class="text-on-surface-variant">Mulai tambahkan kelas untuk menjadwalkan ujian dan materi.</p>
    </div>

    <!-- Classes Grid -->
    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      <div 
        v-for="c in classesList" 
        :key="c.id"
        class="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl overflow-hidden hover:border-primary/40 hover:shadow-md transition-all group flex flex-col"
      >
        <div class="h-24 bg-gradient-to-r from-primary/10 to-primary/5 flex items-center px-6 relative">
          <h3 class="text-2xl font-black text-primary tracking-tight truncate">{{ c.name }}</h3>
          
          <div class="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <button @click="openEditModal(c)" class="bg-surface text-on-surface hover:text-primary w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
              <span class="material-symbols-outlined text-[16px]">edit</span>
            </button>
            <button @click="removeClass(c.id)" class="bg-surface text-error hover:bg-error/10 w-8 h-8 rounded-full flex items-center justify-center shadow-sm">
              <span class="material-symbols-outlined text-[16px]">delete</span>
            </button>
          </div>
        </div>
        
        <div class="p-4 flex flex-col flex-1 bg-surface-container-lowest">
          <div class="flex items-center gap-2 text-sm text-on-surface-variant font-bold mb-4">
            <span class="material-symbols-outlined text-[18px]">assignment</span>
            {{ c.assessment_schedules?.[0]?.count || 0 }} Ujian Terjadwal
          </div>
          
          <div class="mt-auto pt-4 border-t border-outline-variant/20 flex gap-2">
            <button @click="viewStudents(c)" class="flex-1 bg-surface-container hover:bg-surface-container-high py-2 rounded-lg text-sm font-bold transition-colors">
              Lihat Siswa & Progres
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal Form -->
    <div v-if="showModal" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div class="bg-surface-container-lowest rounded-3xl w-full max-w-sm p-6 shadow-2xl">
        <h2 class="text-2xl font-bold text-on-surface mb-4">{{ formData.id ? 'Edit Kelas' : 'Tambah Kelas Baru' }}</h2>
        
        <div class="mb-6">
          <label class="block text-sm font-bold text-on-surface-variant mb-2">Nama Kelas</label>
          <input 
            v-model="formData.name" 
            type="text" 
            placeholder="Misal: XI IPA 1" 
            class="w-full bg-surface-container-low px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary font-medium"
            @keyup.enter="saveForm"
          >
        </div>

        <div class="flex justify-end gap-3">
          <button @click="showModal = false" class="px-5 py-2.5 rounded-xl font-bold text-on-surface-variant hover:bg-surface-container transition-colors">Batal</button>
          <button @click="saveForm" :disabled="saving" class="bg-primary text-on-primary hover:bg-primary/90 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all">
            <span v-if="saving" class="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
            {{ saving ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Students & Progress Modal -->
    <div v-if="showStudentsModal" class="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
      <div class="bg-surface-container-lowest rounded-3xl w-full max-w-4xl p-6 shadow-2xl max-h-[90vh] flex flex-col">
        <div class="flex items-center justify-between mb-6">
          <div>
            <h2 class="text-2xl font-bold text-on-surface">Data Siswa & Progres</h2>
            <p class="text-on-surface-variant text-sm">Kelas: <strong class="text-primary">{{ selectedClass?.name }}</strong></p>
          </div>
          <button @click="showStudentsModal = false" class="bg-surface-container hover:bg-surface-container-high w-10 h-10 rounded-full flex items-center justify-center transition-colors">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        
        <div class="flex-1 overflow-y-auto">
          <div v-if="loadingStudents" class="flex justify-center py-12">
            <span class="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
          </div>
          
          <div v-else-if="classStudents.length === 0" class="text-center py-12 bg-surface-container-low rounded-2xl border border-dashed border-outline-variant/30">
            <span class="material-symbols-outlined text-5xl text-outline-variant mb-4">group_off</span>
            <h3 class="text-lg font-bold text-on-surface mb-2">Belum Ada Siswa</h3>
            <p class="text-on-surface-variant text-sm">Belum ada siswa yang mendaftar atau dimasukkan ke kelas ini.</p>
          </div>
          
          <div v-else class="overflow-x-auto">
            <table class="w-full text-left border-collapse">
              <thead>
                <tr class="border-b border-outline-variant/30 text-sm text-on-surface-variant">
                  <th class="py-3 px-4 font-bold">Nama / ID Siswa</th>
                  <th class="py-3 px-4 font-bold">Bergabung Pada</th>
                  <th class="py-3 px-4 font-bold">Total Progres Belajar</th>
                  <th class="py-3 px-4 font-bold text-right">Rata-rata Nilai Ujian</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="student in classStudents" :key="student.id" class="border-b border-outline-variant/10 hover:bg-primary/5 transition-colors group">
                  <td class="py-4 px-4">
                    <div class="flex items-center gap-3">
                      <div class="w-8 h-8 rounded-full bg-primary/20 text-primary font-bold flex items-center justify-center text-xs">
                        {{ student.students?.full_name?.substring(0,2).toUpperCase() || 'S' }}
                      </div>
                      <div>
                        <div class="font-bold text-on-surface text-sm">{{ student.students?.full_name }}</div>
                        <div class="text-[11px] text-on-surface-variant">NIS: {{ student.students?.nis }}</div>
                      </div>
                    </div>
                  </td>
                  <td class="py-4 px-4 text-sm text-on-surface-variant">
                    {{ new Date(student.joined_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) }}
                  </td>
                  <td class="py-4 px-4">
                    <div class="flex items-center gap-2">
                      <div class="w-24 h-2 bg-surface-container rounded-full overflow-hidden">
                        <div class="h-full bg-primary" style="width: 0%"></div>
                      </div>
                      <span class="text-xs font-bold text-on-surface-variant">0%</span>
                    </div>
                  </td>
                  <td class="py-4 px-4 text-right">
                    <span class="inline-flex items-center justify-center px-2 py-1 bg-surface-container rounded-lg text-sm font-bold">
                      - / 100
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          
          <!-- Form Tambah Siswa Baru -->
          <div class="mt-8 pt-6 border-t border-outline-variant/20">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold text-on-surface">Tambahkan Siswa ke Kelas Ini</h3>
              <div class="flex items-center gap-2">
                <button type="button" @click="downloadCsvTemplate"
                  class="text-primary hover:bg-primary/10 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors">
                  <span class="material-symbols-outlined text-[18px]">download</span>
                  Download Template
                </button>
                <input type="file" accept=".csv" class="hidden" ref="fileInput" @change="handleFileUpload">
                <button type="button" @click="triggerFileUpload" :disabled="addingStudent"
                  class="bg-surface-container hover:bg-surface-container-high text-on-surface px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 border border-outline-variant/30 transition-colors">
                  <span class="material-symbols-outlined text-[18px]">upload_file</span>
                  Upload CSV
                </button>
              </div>
            </div>
            
            <p class="text-xs text-on-surface-variant mb-4">Untuk Upload CSV, gunakan format kolom: <code class="bg-surface-container px-1 py-0.5 rounded">NIS, Nama Lengkap, Password (Opsional)</code></p>
            
            <form @submit.prevent="submitAddStudent" class="flex flex-col md:flex-row gap-4">
              <input v-model="newStudent.full_name" type="text" placeholder="Nama Lengkap Siswa" required
                class="flex-1 bg-surface-container-low px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary text-sm font-medium">
              <input v-model="newStudent.nis" type="text" placeholder="NIS" required
                class="w-full md:w-32 bg-surface-container-low px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary text-sm font-medium">
              <input v-model="newStudent.password" type="text" placeholder="PIN/Password" required
                class="w-full md:w-36 bg-surface-container-low px-4 py-2.5 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary text-sm font-medium">
              <button type="submit" :disabled="addingStudent" 
                class="bg-primary text-on-primary hover:bg-primary/90 px-6 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all whitespace-nowrap">
                <span v-if="addingStudent" class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                <span v-else class="material-symbols-outlined text-[18px]">person_add</span>
                {{ addingStudent ? 'Menyimpan...' : 'Tambah Manual' }}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
