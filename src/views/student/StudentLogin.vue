<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { loginStudent } from '../../services/student.service'

const router = useRouter()
const nis = ref('')
const fullName = ref('')
const errorMsg = ref('')
const loading = ref(false)

const handleLogin = async () => {
  if (!nis.value || !fullName.value) {
    errorMsg.value = 'Mohon isi NIS dan Nama Lengkap'
    return
  }
  
  loading.value = true
  errorMsg.value = ''
  
  try {
    await loginStudent(nis.value, fullName.value)
    
    router.push('/student')
  } catch (err) {
    errorMsg.value = err.message || 'Login gagal: NIS atau Nama Lengkap salah.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-surface-container-lowest flex items-center justify-center p-4 font-body-md">
    <div class="w-full max-w-md">
      <div class="bg-surface-container-lowest rounded-3xl shadow-lg border border-outline-variant/30 p-8 sm:p-10 relative overflow-hidden">
        <!-- Decorative element -->
        <div class="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-primary to-secondary"></div>
        
        <div class="text-center mb-10 flex flex-col items-center">
          <img src="/logo-template.png" alt="Logo EduPlatform" class="h-16 w-auto mb-4" />
          <h1 class="font-sf-rounded font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary tracking-tight text-3xl mb-2">EduPlatform</h1>
          <p class="text-on-surface-variant font-medium">Portal Belajar Siswa</p>
        </div>

        <div v-if="errorMsg" class="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3">
          <span class="material-symbols-outlined text-error">error</span>
          <p class="text-error text-sm font-medium pt-0.5">{{ errorMsg }}</p>
        </div>

        <form @submit.prevent="handleLogin" class="flex flex-col gap-5">
          <div>
            <label class="block text-sm font-bold text-on-surface mb-1.5" for="nis">Nomor Induk Siswa (NIS)</label>
            <div class="relative">
              <span class="absolute left-3.5 top-3 text-outline material-symbols-outlined">badge</span>
              <input 
                id="nis" 
                v-model="nis" 
                type="text" 
                required 
                placeholder="Misal: 202401001"
                class="w-full pl-11 pr-4 py-3 rounded-xl border border-outline-variant/50 bg-surface focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all text-on-surface placeholder:text-outline/70"
                :disabled="loading"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-bold text-on-surface mb-1.5" for="fullName">Nama Lengkap</label>
            <div class="relative">
              <span class="absolute left-3.5 top-3 text-outline material-symbols-outlined">person</span>
              <input 
                id="fullName" 
                v-model="fullName" 
                type="text" 
                autocomplete="name"
                required 
                placeholder="Nama sesuai presensi"
                class="w-full pl-11 pr-4 py-3 rounded-xl border border-outline-variant/50 bg-surface focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none transition-all text-on-surface placeholder:text-outline/70"
                :disabled="loading"
              />
            </div>
          </div>

          <div class="flex items-center justify-between mt-1 mb-2">
            <div class="flex items-center">
              <input id="remember-me" name="remember-me" type="checkbox" class="h-4 w-4 text-secondary focus:ring-secondary border-outline/50 rounded bg-surface">
              <label for="remember-me" class="ml-2 block text-sm text-on-surface-variant font-medium">
                Ingat saya
              </label>
            </div>
          </div>

          <button 
            type="submit" 
            class="w-full bg-secondary text-on-secondary py-3.5 rounded-xl font-bold hover:bg-secondary/90 transition-colors shadow-sm flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            :disabled="loading"
          >
            <span v-if="loading" class="material-symbols-outlined animate-spin">progress_activity</span>
            <span>{{ loading ? 'Masuk...' : 'Masuk ke Dashboard' }}</span>
          </button>
        </form>
        
        <div class="mt-8 text-center">
          <router-link to="/" class="text-sm text-outline hover:text-on-surface font-medium inline-flex items-center gap-1 transition-colors">
            <span class="material-symbols-outlined text-[16px]">arrow_back</span>
            Kembali ke Beranda
          </router-link>
        </div>
      </div>
    </div>
  </div>
</template>
