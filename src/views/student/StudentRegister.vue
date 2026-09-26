<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { register } from '../../services/auth.service'

const router = useRouter()
const fullName = ref('')
const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)
const successMsg = ref('')

const handleRegister = async () => {
  if (!fullName.value || !email.value || !password.value) {
    errorMsg.value = 'Mohon lengkapi semua kolom'
    return
  }
  
  if (password.value.length < 6) {
    errorMsg.value = 'Password harus minimal 6 karakter'
    return
  }
  
  loading.value = true
  errorMsg.value = ''
  
  try {
    await register(email.value, password.value, 'student', fullName.value)
    
    successMsg.value = 'Pendaftaran berhasil! Mengarahkan ke dasbor...'
    setTimeout(() => {
      router.push('/student')
    }, 1500)
    
  } catch (err) {
    errorMsg.value = 'Pendaftaran gagal: ' + err.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-surface flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md text-center">
      <div class="w-16 h-16 bg-secondary text-on-secondary rounded-2xl mx-auto flex items-center justify-center text-3xl font-black mb-4 shadow-lg">
        B
      </div>
      <h2 class="text-3xl font-extrabold text-on-surface tracking-tight">Daftar Akun Siswa</h2>
      <p class="mt-2 text-on-surface-variant font-medium">Buat akun untuk mulai belajar Biologi dengan menyenangkan</p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-surface-container-lowest py-8 px-4 shadow-xl sm:rounded-3xl sm:px-10 border border-outline-variant/20">
        <form class="space-y-6" @submit.prevent="handleRegister">
          
          <div v-if="errorMsg" class="bg-error/10 text-error p-3 rounded-lg text-sm font-bold border border-error/20">
            {{ errorMsg }}
          </div>
          
          <div v-if="successMsg" class="bg-success/10 text-success p-3 rounded-lg text-sm font-bold border border-success/20">
            {{ successMsg }}
          </div>

          <div>
            <label for="fullName" class="block text-sm font-bold text-on-surface mb-2">Nama Lengkap</label>
            <input id="fullName" v-model="fullName" type="text" required 
              class="appearance-none block w-full px-4 py-3 border border-outline-variant/50 rounded-xl bg-surface-container-low text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-medium">
          </div>
          
          <div>
            <label for="email" class="block text-sm font-bold text-on-surface mb-2">Alamat Email</label>
            <input id="email" v-model="email" type="email" autocomplete="email" required 
              class="appearance-none block w-full px-4 py-3 border border-outline-variant/50 rounded-xl bg-surface-container-low text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-medium">
          </div>

          <div>
            <label for="password" class="block text-sm font-bold text-on-surface mb-2">Password</label>
            <input id="password" v-model="password" type="password" autocomplete="new-password" required 
              class="appearance-none block w-full px-4 py-3 border border-outline-variant/50 rounded-xl bg-surface-container-low text-on-surface placeholder-on-surface-variant focus:outline-none focus:ring-2 focus:ring-secondary/50 focus:border-secondary transition-all font-medium">
          </div>

          <div>
            <button type="submit" :disabled="loading" 
              class="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-bold text-on-secondary bg-secondary hover:bg-secondary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary transition-all">
              <span v-if="loading" class="material-symbols-outlined animate-spin mr-2">progress_activity</span>
              {{ loading ? 'Mendaftarkan...' : 'Daftar Sekarang' }}
            </button>
          </div>
          
          <div class="text-center text-sm text-on-surface-variant">
            Sudah punya akun? 
            <router-link to="/student/login" class="font-bold text-secondary hover:text-secondary/80">
              Masuk di sini
            </router-link>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
