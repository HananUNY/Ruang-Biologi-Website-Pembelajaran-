<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { user, logout } from '../services/auth.service'

const router = useRouter()
const isSidebarOpen = ref(true)
const isProfileDropdownOpen = ref(false)

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value
}

const toggleProfileDropdown = () => {
  isProfileDropdownOpen.value = !isProfileDropdownOpen.value
}

const handleLogout = async () => {
  try {
    await logout()
    router.push('/')
  } catch (error) {
    console.error('Logout failed:', error)
  }
}

// Ekstrak inisial nama atau email pengguna
const userInitial = computed(() => {
  if (user.value?.email) {
    return user.value.email.charAt(0).toUpperCase()
  }
  return 'G'
})

const displayName = computed(() => {
  // Nantinya kita bisa menghubungkan ini dengan tabel 'profiles'
  return user.value?.email || 'Guru Biologi'
})
</script>

<template>
  <div class="flex h-screen bg-surface-container-low overflow-hidden font-body-md text-on-surface">
    <!-- Sidebar -->
    <aside 
      class="bg-surface-container-lowest border-r border-outline-variant/30 flex flex-col transition-all duration-300 z-20 shrink-0"
      :class="isSidebarOpen ? 'w-64' : 'w-20'"
    >
      <div class="h-16 flex items-center justify-between px-4 border-b border-outline-variant/30">
        <div class="flex items-center gap-2 overflow-hidden" v-if="isSidebarOpen">
          <img src="/logo-ruang-biologi.png" alt="Logo Ruang Biologi" class="h-6 w-auto" />
          <span class="font-sf-rounded text-2xl text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary tracking-tight font-extrabold ml-1">Ruang Biologi</span>
          <span class="text-xs uppercase bg-primary-container text-on-primary-container px-1.5 py-0.5 rounded font-bold">Guru</span>
        </div>
        <button @click="toggleSidebar" class="p-1 rounded hover:bg-surface-container text-outline hover:text-on-surface transition-colors flex-shrink-0 mx-auto">
          <span class="material-symbols-outlined text-[20px]">menu</span>
        </button>
      </div>

      <nav class="flex-1 overflow-y-auto py-4 px-3 flex flex-col gap-1">
        <router-link to="/teacher" exact-active-class="bg-primary/10 text-primary font-semibold" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container transition-colors group text-on-surface-variant hover:text-on-surface">
          <span class="material-symbols-outlined text-[20px] group-hover:text-primary transition-colors">dashboard</span>
          <span v-if="isSidebarOpen" class="font-label-md text-sm whitespace-nowrap">Dashboard</span>
        </router-link>
        <router-link to="/teacher/courses" active-class="bg-primary/10 text-primary font-semibold" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors group">
          <span class="material-symbols-outlined text-[20px] group-hover:text-primary transition-colors">book</span>
          <span v-if="isSidebarOpen" class="font-label-md text-sm whitespace-nowrap">Courses</span>
        </router-link>
        
        <router-link to="/teacher/virtual-labs" active-class="bg-primary/10 text-primary font-semibold" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors group">
          <span class="material-symbols-outlined text-[20px] group-hover:text-primary transition-colors">science</span>
          <span v-if="isSidebarOpen" class="font-label-md text-sm whitespace-nowrap">Virtual Lab</span>
        </router-link>

        <router-link to="/teacher/media" active-class="bg-primary/10 text-primary font-semibold" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors group">
          <span class="material-symbols-outlined text-[20px] group-hover:text-primary transition-colors">perm_media</span>
          <span v-if="isSidebarOpen" class="font-label-md text-sm whitespace-nowrap">Media Library</span>
        </router-link>
        
        <div v-if="isSidebarOpen" class="mt-4 mb-1 px-3">
          <span class="text-[10px] font-bold uppercase tracking-wider text-outline">Evaluation</span>
        </div>
        <div v-else class="mt-4 mb-1 border-t border-outline-variant/30 w-10 mx-auto"></div>
        
        <router-link to="/teacher/questions" active-class="bg-primary/10 text-primary font-semibold" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors group">
          <span class="material-symbols-outlined text-[20px] group-hover:text-primary transition-colors">quiz</span>
          <span v-if="isSidebarOpen" class="font-label-md text-sm whitespace-nowrap">Bank Soal</span>
        </router-link>
        <router-link to="/teacher/assessments" active-class="bg-primary/10 text-primary font-semibold" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors group">
          <span class="material-symbols-outlined text-[20px] group-hover:text-primary transition-colors">assignment</span>
          <span v-if="isSidebarOpen" class="font-label-md text-sm whitespace-nowrap">Lembar Soal</span>
        </router-link>
        
        <div v-if="isSidebarOpen" class="mt-4 mb-1 px-3">
          <span class="text-[10px] font-bold uppercase tracking-wider text-outline">Administration</span>
        </div>
        <div v-else class="mt-4 mb-1 border-t border-outline-variant/30 w-10 mx-auto"></div>

        <router-link to="/teacher/classes" active-class="bg-primary/10 text-primary font-semibold" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors group">
          <span class="material-symbols-outlined text-[20px] group-hover:text-primary transition-colors">groups</span>
          <span v-if="isSidebarOpen" class="font-label-md text-sm whitespace-nowrap">Classes</span>
        </router-link>
        <router-link to="/teacher/analytics" active-class="bg-primary/10 text-primary font-semibold" class="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors group">
          <span class="material-symbols-outlined text-[20px] group-hover:text-primary transition-colors">insights</span>
          <span v-if="isSidebarOpen" class="font-label-md text-sm whitespace-nowrap">Analytics</span>
        </router-link>
      </nav>

      <div class="p-4 border-t border-outline-variant/30">
        <router-link to="/teacher/settings" active-class="bg-primary/10 text-primary font-semibold" class="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-surface-container text-on-surface-variant hover:text-on-surface transition-colors">
          <span class="material-symbols-outlined text-[20px]">settings</span>
          <span v-if="isSidebarOpen" class="font-label-md text-sm whitespace-nowrap">Settings</span>
        </router-link>
      </div>
    </aside>

    <!-- Main Content Area -->
    <div class="flex-1 flex flex-col min-w-0">
      <!-- Topbar Header -->
      <header class="h-16 bg-surface-container-lowest border-b border-outline-variant/30 px-6 flex items-center justify-between shadow-sm z-10 shrink-0">
        <div class="flex items-center gap-4">
          <h2 class="font-headline-sm font-semibold text-on-surface hidden sm:block">Teacher Dashboard</h2>
        </div>
        <div class="flex items-center gap-4">
          <button class="w-9 h-9 rounded-full bg-surface-container hover:bg-surface-container-high flex items-center justify-center text-on-surface transition-colors relative">
            <span class="material-symbols-outlined text-[20px]">notifications</span>
            <span class="absolute top-2 right-2.5 w-1.5 h-1.5 bg-error rounded-full"></span>
          </button>
          <div class="h-8 w-px bg-outline-variant/50"></div>
          
          <!-- User Profile Dropdown -->
          <div class="relative">
            <button @click="toggleProfileDropdown" class="flex items-center gap-2 hover:bg-surface-container px-2 py-1.5 rounded-lg transition-colors focus:outline-none">
              <div class="w-8 h-8 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-sm">
                {{ userInitial }}
              </div>
              <div class="flex flex-col items-start hidden sm:flex max-w-[120px]">
                <span class="text-xs font-bold leading-tight truncate w-full text-left">{{ displayName }}</span>
                <span class="font-sf-rounded text-[10px] text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary font-extrabold leading-tight">Ruang Biologi</span>
              </div>
              <span class="material-symbols-outlined text-[16px] text-outline transition-transform" :class="isProfileDropdownOpen ? 'rotate-180' : ''">expand_more</span>
            </button>
            
            <!-- Dropdown Menu -->
            <div v-if="isProfileDropdownOpen" class="absolute right-0 mt-2 w-48 bg-surface-container-lowest rounded-xl shadow-lg border border-outline-variant/30 py-2 z-50">
              <div class="px-4 py-2 border-b border-outline-variant/30 mb-2">
                <p class="text-xs text-outline">Masuk sebagai</p>
                <p class="text-sm font-bold truncate">{{ user?.email }}</p>
              </div>
              <button @click="handleLogout" class="w-full text-left px-4 py-2 text-sm text-error hover:bg-error/10 font-semibold flex items-center gap-2 transition-colors">
                <span class="material-symbols-outlined text-[18px]">logout</span>
                Logout
              </button>
            </div>
            
            <!-- Overlay to close dropdown -->
            <div v-if="isProfileDropdownOpen" @click="toggleProfileDropdown" class="fixed inset-0 z-40 bg-transparent"></div>
          </div>
        </div>
      </header>

      <!-- Scrollable Main Content -->
      <main class="flex-1 overflow-y-auto p-6 lg:p-8 bg-surface-container-low">
        <router-view />
      </main>
    </div>
  </div>
</template>
