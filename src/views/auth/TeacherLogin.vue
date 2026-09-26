<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '../../services/auth.service'

const router = useRouter()
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const handleLogin = async () => {
  try {
    loading.value = true
    errorMessage.value = ''
    await login(email.value, password.value)
    router.push('/teacher')
  } catch (error) {
    errorMessage.value = error.message || 'Gagal masuk. Periksa kembali email dan password Anda.'
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
          <p class="text-on-surface-variant font-medium">Portal Authoring Guru</p>
        </div>

        <div v-if="errorMessage" class="mb-6 p-4 rounded-xl bg-error/10 border border-error/20 flex items-start gap-3">
          <span class="material-symbols-outlined text-error">error</span>
          <p class="text-error text-sm font-medium pt-0.5">{{ errorMessage }}</p>
        </div>

        <form @submit.prevent="handleLogin" class="flex flex-col gap-5">
          <div>
            <label class="block text-sm font-bold text-on-surface mb-1.5" for="email">Email Address</label>
            <div class="relative">
              <span class="absolute left-3.5 top-3 text-outline material-symbols-outlined">mail</span>
              <input 
                id="email" 
                v-model="email" 
                type="email" 
                required 
                placeholder="guru@sekolah.com"
                class="w-full pl-11 pr-4 py-3 rounded-xl border border-outline-variant/50 bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface placeholder:text-outline/70"
                :disabled="loading"
              />
            </div>
          </div>

          <div>
            <div class="flex justify-between items-center mb-1.5">
              <label class="block text-sm font-bold text-on-surface" for="password">Password</label>
              <a href="#" class="text-xs font-bold text-primary hover:underline">Lupa password?</a>
            </div>
            <div class="relative">
              <span class="absolute left-3.5 top-3 text-outline material-symbols-outlined">lock</span>
              <input 
                id="password" 
                v-model="password" 
                type="password" 
                required 
                placeholder="••••••••"
                class="w-full pl-11 pr-4 py-3 rounded-xl border border-outline-variant/50 bg-surface focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-on-surface placeholder:text-outline/70"
                :disabled="loading"
              />
            </div>
          </div>

          <button 
            type="submit" 
            class="w-full bg-primary text-on-primary py-3.5 rounded-xl font-bold hover:bg-primary/90 transition-colors mt-2 shadow-sm flex justify-center items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
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
