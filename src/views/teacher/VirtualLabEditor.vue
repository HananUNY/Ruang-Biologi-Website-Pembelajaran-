<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { getIndependentVirtualLab, updateIndependentVirtualLab, deleteIndependentVirtualLab } from '../../services/builder.service'
import { uploadMediaFile, getPublicUrl } from '../../services/media.service'
import { user } from '../../services/auth.service'

const route = useRoute()
const router = useRouter()
const labId = route.params.id

const lab = ref(null)
const loading = ref(true)
const saving = ref(false)
const isUploadingHtml = ref(false)

const formData = ref({
  title: '',
  description: '',
  instructions: '',
  status: 'draft',
  engine_type: 'json',
  engine_config: '{}',
  iframe_url: '',
  html_content: '',
  html_file_url: ''
})

const fetchLab = async () => {
  try {
    loading.value = true
    const data = await getIndependentVirtualLab(labId)
    lab.value = data
    formData.value = {
      title: data.title,
      description: data.description || '',
      instructions: data.instructions || '',
      status: data.status,
      // Default to JSON if undefined
      engine_type: data.engine_type || 'json',
      // Ensure it's a string for the textarea
      engine_config: typeof data.engine_config === 'object' ? JSON.stringify(data.engine_config, null, 2) : (data.engine_config || '{\n  "variables": [],\n  "rules": []\n}'),
      iframe_url: data.iframe_url || '',
      html_content: data.html_content || '',
      html_file_url: data.html_file_url || ''
    }
  } catch (error) {
    console.error('Error fetching lab:', error)
    alert('Gagal memuat detail lab.')
    router.push('/teacher/virtual-labs')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchLab()
})

const handleSave = async () => {
  try {
    saving.value = true
    
    // Parse JSON first to ensure it's valid if engine is json
    let parsedConfig = null
    if (formData.value.engine_type === 'json') {
      try {
        parsedConfig = JSON.parse(formData.value.engine_config)
      } catch (e) {
        alert('Format JSON tidak valid! Harap periksa kembali.')
        saving.value = false
        return
      }
    }
    
    const payload = {
      title: formData.value.title,
      description: formData.value.description,
      instructions: formData.value.instructions,
      status: formData.value.status,
      engine_type: formData.value.engine_type,
      engine_config: parsedConfig,
      iframe_url: formData.value.iframe_url,
      html_content: formData.value.html_content,
      html_file_url: formData.value.html_file_url
    }
    
    await updateIndependentVirtualLab(labId, payload)
    alert('Berhasil menyimpan perubahan.')
  } catch (error) {
    console.error('Error saving lab:', error)
    alert('Gagal menyimpan lab. Pastikan tabel virtual_labs sudah memiliki kolom engine_type, engine_config, iframe_url, html_content, dan html_file_url.')
  } finally {
    saving.value = false
  }
}

const handleDelete = async () => {
  if (confirm('Anda yakin ingin menghapus Lab Mandiri ini secara permanen?')) {
    try {
      saving.value = true
      await deleteIndependentVirtualLab(labId)
      router.push('/teacher/virtual-labs')
    } catch (error) {
      console.error('Error deleting lab:', error)
      alert('Gagal menghapus lab.')
      saving.value = false
    }
  }
}

const handleHtmlUpload = async (event) => {
  const file = event.target.files[0]
  if (!file) return
  
  if (file.type !== 'text/html' && !file.name.endsWith('.html')) {
    alert('Hanya file HTML (.html) yang diperbolehkan.')
    return
  }

  isUploadingHtml.value = true
  try {
    const uploaded = await uploadMediaFile(file, user.value.id)
    const publicUrl = getPublicUrl(uploaded.storage_path)
    formData.value.html_file_url = publicUrl
  } catch (error) {
    console.error('HTML Upload Error:', error)
    alert('Gagal mengupload file HTML.')
  } finally {
    isUploadingHtml.value = false
    event.target.value = ''
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto flex flex-col gap-6">
    <div class="flex items-center gap-4">
      <button @click="router.push('/teacher/virtual-labs')" class="w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface transition-colors">
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
      <div>
        <h1 class="font-headline-md text-2xl font-bold text-on-surface">Edit Virtual Lab</h1>
        <p class="text-on-surface-variant text-sm mt-1">Konfigurasi detail dan engine simulasi lab mandiri Anda.</p>
      </div>
    </div>

    <div v-if="loading" class="py-12 flex justify-center">
      <span class="material-symbols-outlined text-[48px] text-primary animate-spin">progress_activity</span>
    </div>

    <div v-else class="flex flex-col gap-6 pb-24">
      
      <!-- General Info -->
      <div class="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
        <h2 class="font-bold text-lg mb-4 text-on-surface border-b border-outline-variant/30 pb-2">Informasi Dasar</h2>
        
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-bold text-on-surface mb-1">Judul Lab</label>
            <input v-model="formData.title" type="text" class="w-full px-4 py-2 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm bg-surface">
          </div>
          
          <div>
            <label class="block text-sm font-bold text-on-surface mb-1">Deskripsi & Tujuan Praktikum</label>
            <textarea v-model="formData.description" rows="3" class="w-full px-4 py-2 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm bg-surface"></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-bold text-on-surface mb-1">Petunjuk Praktikum</label>
            <textarea v-model="formData.instructions" rows="4" class="w-full px-4 py-2 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm bg-surface" placeholder="1. Siapkan...&#10;2. Amati...&#10;3. Catat hasil..."></textarea>
          </div>
          
          <div>
            <label class="block text-sm font-bold text-on-surface mb-1">Status Publikasi</label>
            <select v-model="formData.status" class="w-full sm:w-1/2 px-4 py-2 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm bg-surface">
              <option value="draft">Draft (Belum Publik)</option>
              <option value="published">Published (Publik)</option>
            </select>
          </div>
        </div>
      </div>
      
      <!-- Engine Config -->
      <div class="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
        <h2 class="font-bold text-lg mb-6 text-on-surface border-b border-outline-variant/30 pb-4">Konfigurasi Engine Simulasi</h2>
        
        <div class="space-y-6">
          <div>
            <label class="block text-sm font-bold text-on-surface mb-3">Pendekatan Engine</label>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <label class="flex items-start gap-3 p-4 rounded-xl border border-outline-variant/30 cursor-pointer hover:bg-surface-container-low transition-colors" :class="{'border-primary bg-primary/5 ring-1 ring-primary': formData.engine_type === 'json'}">
                <input type="radio" v-model="formData.engine_type" value="json" class="mt-1 text-primary focus:ring-primary w-4 h-4">
                <div>
                  <div class="font-bold text-on-surface text-sm flex items-center gap-1">
                    <span class="material-symbols-outlined text-[16px]">data_object</span>
                    JSON Configuration
                  </div>
                  <div class="text-xs text-on-surface-variant mt-1 leading-relaxed">Gunakan struktur data JSON native.</div>
                </div>
              </label>
              
              <label class="flex items-start gap-3 p-4 rounded-xl border border-outline-variant/30 cursor-pointer hover:bg-surface-container-low transition-colors" :class="{'border-primary bg-primary/5 ring-1 ring-primary': formData.engine_type === 'iframe'}">
                <input type="radio" v-model="formData.engine_type" value="iframe" class="mt-1 text-primary focus:ring-primary w-4 h-4">
                <div>
                  <div class="font-bold text-on-surface text-sm flex items-center gap-1">
                    <span class="material-symbols-outlined text-[16px]">link</span>
                    Tautan Embed URL
                  </div>
                  <div class="text-xs text-on-surface-variant mt-1 leading-relaxed">Tempelkan link dari simulasi eksternal (PhET).</div>
                </div>
              </label>

              <label class="flex items-start gap-3 p-4 rounded-xl border border-outline-variant/30 cursor-pointer hover:bg-surface-container-low transition-colors" :class="{'border-primary bg-primary/5 ring-1 ring-primary': formData.engine_type === 'html_raw'}">
                <input type="radio" v-model="formData.engine_type" value="html_raw" class="mt-1 text-primary focus:ring-primary w-4 h-4">
                <div>
                  <div class="font-bold text-on-surface text-sm flex items-center gap-1">
                    <span class="material-symbols-outlined text-[16px]">html</span>
                    Paste HTML Raw
                  </div>
                  <div class="text-xs text-on-surface-variant mt-1 leading-relaxed">Paste ratusan baris kode HTML simulasi secara langsung.</div>
                </div>
              </label>

              <label class="flex items-start gap-3 p-4 rounded-xl border border-outline-variant/30 cursor-pointer hover:bg-surface-container-low transition-colors" :class="{'border-primary bg-primary/5 ring-1 ring-primary': formData.engine_type === 'html_upload'}">
                <input type="radio" v-model="formData.engine_type" value="html_upload" class="mt-1 text-primary focus:ring-primary w-4 h-4">
                <div>
                  <div class="font-bold text-on-surface text-sm flex items-center gap-1">
                    <span class="material-symbols-outlined text-[16px]">upload_file</span>
                    Upload File HTML
                  </div>
                  <div class="text-xs text-on-surface-variant mt-1 leading-relaxed">Unggah file .html ke database Supabase kami.</div>
                </div>
              </label>
            </div>
          </div>
          
          <!-- Conditional Fields -->
          <div v-if="formData.engine_type === 'json'" class="animate-fade-in space-y-2 bg-surface-container p-4 rounded-xl border border-outline-variant/20">
            <label class="block text-sm font-bold text-on-surface">Data JSON Konfigurasi</label>
            <p class="text-xs text-on-surface-variant mb-2">Masukkan konfigurasi parameter eksperimen Anda di sini. Pastikan format valid.</p>
            <textarea v-model="formData.engine_config" rows="12" class="w-full px-4 py-3 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm bg-surface font-mono text-primary/80"></textarea>
          </div>
          
          <div v-if="formData.engine_type === 'iframe'" class="animate-fade-in space-y-2 bg-surface-container p-4 rounded-xl border border-outline-variant/20">
            <label class="block text-sm font-bold text-on-surface">Tautan URL Eksternal (Embed)</label>
            <p class="text-xs text-on-surface-variant mb-2">Masukkan link simulasi eksternal (contoh: https://phet.colorado.edu/sims/...)</p>
            <input v-model="formData.iframe_url" type="url" placeholder="https://" class="w-full px-4 py-3 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm bg-surface">
          </div>

          <div v-if="formData.engine_type === 'html_raw'" class="animate-fade-in space-y-2 bg-surface-container p-4 rounded-xl border border-outline-variant/20">
            <label class="block text-sm font-bold text-on-surface">Kode HTML Lengkap</label>
            <p class="text-xs text-on-surface-variant mb-2">Tempelkan seluruh baris kode HTML simulasi (termasuk tag script/style) di sini.</p>
            <textarea v-model="formData.html_content" rows="12" placeholder="<!DOCTYPE html>&#10;<html>&#10;...&#10;</html>" class="w-full px-4 py-3 rounded-xl border border-outline-variant/50 focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm bg-surface font-mono text-primary/80"></textarea>
          </div>

          <div v-if="formData.engine_type === 'html_upload'" class="animate-fade-in space-y-2 bg-surface-container p-4 rounded-xl border border-outline-variant/20">
            <label class="block text-sm font-bold text-on-surface">Upload File HTML Simulasi</label>
            <p class="text-xs text-on-surface-variant mb-4">Pilih file .html dari komputer Anda untuk diunggah ke penyimpanan cloud.</p>
            <div class="flex items-center gap-4">
              <label class="cursor-pointer bg-surface-variant text-on-surface-variant px-4 py-2 rounded-lg font-bold text-sm hover:bg-surface-variant/80 transition-all flex items-center gap-2" :class="{'opacity-50 pointer-events-none': isUploadingHtml}">
                <span v-if="isUploadingHtml" class="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
                <span v-else class="material-symbols-outlined text-[16px]">upload_file</span>
                {{ isUploadingHtml ? 'Mengupload...' : 'Pilih File...' }}
                <input type="file" accept=".html" class="hidden" @change="handleHtmlUpload" :disabled="isUploadingHtml" />
              </label>
              <input v-model="formData.html_file_url" type="text" placeholder="URL File Tersimpan (Otomatis terisi setelah upload)" class="flex-1 px-4 py-2 rounded-lg border border-outline-variant/50 focus:border-primary outline-none text-sm bg-surface" readonly>
            </div>
          </div>
          
        </div>
      </div>

      <!-- Actions -->
      <div class="flex items-center justify-between border-t border-outline-variant/30 pt-6">
        <button @click="handleDelete" class="text-error font-bold text-sm px-4 py-2 hover:bg-error/10 rounded-lg transition-colors">
          Hapus Lab
        </button>
        <button @click="handleSave" :disabled="saving" class="bg-primary text-on-primary px-6 py-2.5 rounded-xl font-bold hover:bg-primary-container hover:text-on-primary-container shadow-md transition-colors flex items-center gap-2 disabled:opacity-50">
          <span v-if="saving" class="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
          <span v-else class="material-symbols-outlined text-[18px]">save</span>
          Simpan Konfigurasi
        </button>
      </div>

    </div>
  </div>
</template>
