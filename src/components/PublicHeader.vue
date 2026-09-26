<script setup>
import { defineProps } from 'vue'

const props = defineProps({
  backLink: {
    type: String,
    default: null
  }
})
</script>

<template>
  <header class="bg-surface/90 backdrop-blur-xl border-b border-outline-variant/30 sticky top-0 z-50 shadow-[0_1px_8px_rgba(0,0,0,0.04)]">
    <div class="h-20 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-4">
      <!-- Logo & Back Button -->
      <div class="flex items-center gap-3">
        <router-link v-if="backLink" :to="backLink" class="w-10 h-10 rounded-full hover:bg-surface-container flex items-center justify-center text-on-surface transition-colors mr-2">
          <span class="material-symbols-outlined">arrow_back</span>
        </router-link>
        
        <router-link to="/" class="flex items-center gap-3">
          <img src="/logo-ruang-biologi.png" alt="Logo Ruang Biologi" class="h-10 w-auto shrink-0 hidden sm:block" />
          <div class="flex flex-col">
            <span class="font-sf-rounded text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary tracking-tight font-extrabold">Ruang Biologi</span>
            <span class="font-label-sm text-xs text-on-surface-variant uppercase tracking-wider hidden sm:block">Biologi SMA</span>
          </div>
        </router-link>
      </div>
      
      <!-- Nav Options (Desktop) -->
      <nav class="hidden lg:flex items-center gap-8">
        <router-link to="/" class="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">Beranda</router-link>
        <router-link to="/public/syllabus" class="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">Materi &amp; Silabus</router-link>
        <router-link to="/public/courses" class="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">Materi Belajar Publik</router-link>
        <router-link to="/public/labs" class="text-sm font-semibold text-on-surface-variant hover:text-primary transition-colors">Lab Virtual</router-link>
      </nav>
      
      <!-- Auth Actions -->
      <div class="flex items-center gap-3">
        <router-link to="/teacher/login" class="hidden sm:inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-bold bg-primary text-on-primary hover:bg-primary/90 transition-all shadow-sm">Login Guru</router-link>
        <router-link to="/student/login" class="inline-flex items-center justify-center px-5 py-2.5 rounded-lg text-sm font-bold bg-secondary text-on-secondary hover:bg-secondary/90 transition-all shadow-sm">Login Siswa</router-link>
      </div>
    </div>
  </header>
</template>

<style scoped>
/* Optional styling */
.router-link-active {
  color: theme('colors.primary') !important;
}
</style>
