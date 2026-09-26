<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { getStudentSession, logoutStudent } from '../services/student.service'

const router = useRouter()
const userName = ref('')
const searchQuery = ref('')

const handleSearch = () => {
  const q = searchQuery.value.trim()
  if (q) {
    router.push({ name: 'StudentMaterials', query: { q } })
    searchQuery.value = ''
  }
}

onMounted(async () => {
  const session = await getStudentSession()
  if (!session) {
    router.push('/student/login')
  } else {
    userName.value = session.user.user_metadata.full_name
  }
})

const handleLogout = async () => {
  logoutStudent()
  router.push('/')
}
</script>

<template>
  <div class="bg-background font-body-md text-on-surface antialiased min-h-screen flex flex-col">
    <header class="fixed top-0 w-full z-50 bg-surface/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(0,0,0,0.03)]">
      <div class="h-20 max-w-7xl mx-auto px-6 lg:px-12 flex items-center justify-between gap-4">
        <!-- Logo -->
        <div class="flex items-center gap-3">
          <img src="/logo-template.png" alt="Logo EduPlatform" class="h-10 w-auto shrink-0" />
          <div class="flex flex-col">
            <span class="font-sf-rounded text-xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary tracking-tight font-extrabold">EduPlatform</span>
            <span class="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Biologi SMA</span>
          </div>
        </div>
        
        <!-- Navigation -->
        <nav class="hidden xl:flex items-center gap-1 bg-surface-container-low p-1 rounded-xl">
          <router-link to="/student" exact-active-class="!bg-primary/10 !text-primary font-bold" class="px-4 py-2 rounded-lg font-body-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">Beranda</router-link>
          <router-link to="/student/classes" active-class="!bg-primary/10 !text-primary font-bold" class="px-4 py-2 rounded-lg font-body-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">Materi</router-link>
          <router-link to="/student/lab" active-class="!bg-primary/10 !text-primary font-bold" class="px-4 py-2 rounded-lg font-body-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">Lab Virtual</router-link>
          <router-link to="/student/assessments" active-class="!bg-primary/10 !text-primary font-bold" class="px-4 py-2 rounded-lg font-body-sm font-semibold text-on-surface-variant hover:text-on-surface hover:bg-surface-container transition-colors">Tugas</router-link>
        </nav>
        
        <!-- Right side -->
        <div class="flex items-center gap-4">
          <div class="relative hidden md:block w-48 lg:w-64">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[18px]">search</span>
            <input
              v-model="searchQuery"
              @keyup.enter="handleSearch"
              class="w-full pl-9 pr-4 py-2 bg-surface-container-lowest text-on-surface font-body-sm rounded-lg outline-none placeholder:text-outline focus:bg-surface-container-lowest shadow-[0_1px_4px_rgba(0,0,0,0.02)] transition-all"
              placeholder="Cari materi... (Enter)"
              type="text"
            />
          </div>
          <button aria-label="Notifikasi Belajar" class="relative p-2 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors" type="button">
            <span class="material-symbols-outlined text-[22px]">notifications</span>
            <span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-tertiary-fixed-dim ring-2 ring-surface"></span>
          </button>
          
          <div class="flex items-center gap-2 pl-2">
            <div class="hidden sm:flex flex-col text-right">
              <span class="font-headline-sm text-body-sm text-on-surface leading-tight font-semibold">{{ userName }}</span>
              <span class="font-label-sm text-[10px] text-primary uppercase font-bold mt-0.5">Siswa</span>
            </div>
            <!-- Logout Button as Avatar replacement -->
            <button @click="handleLogout" class="w-10 h-10 rounded-full bg-secondary/10 text-secondary hover:bg-error/10 hover:text-error flex items-center justify-center font-bold text-sm transition-colors" title="Keluar">
              <span class="material-symbols-outlined text-[20px]">logout</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <main class="w-full pt-20 bg-background flex-1 flex flex-col">
      <router-view></router-view>
    </main>

    <footer class="w-full bg-surface-container-low mt-10">
      <div class="max-w-7xl mx-auto px-6 lg:px-12 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <img src="/logo-template.png" alt="Logo EduPlatform" class="h-8 w-auto shrink-0" />
          <span class="font-sf-rounded text-lg text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary font-extrabold ml-1">EduPlatform</span>
          <span class="text-outline text-body-sm">•</span>
          <span class="font-body-sm text-on-surface-variant">Biologi SMA</span>
        </div>
        <div class="font-label-md text-xs text-on-surface-variant text-center md:text-right">
          © 2024 EduPlatform · Biologi SMA · Kurikulum Merdeka
        </div>
      </div>
    </footer>
  </div>
</template>
