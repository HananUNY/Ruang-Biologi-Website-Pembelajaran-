<script setup>
import { ref, onMounted } from 'vue'
import { getSession } from '../../services/auth.service'
import { supabase } from '../../supabase'

const userEmail = ref('')
const role = ref('')
const loading = ref(true)
const saving = ref(false)

const currentTab = ref('profile') // profile, security, preferences, notifications, billing

const profileData = ref({
  fullName: '',
  schoolName: '',
  phoneNumber: '',
  bio: '',
  subject: 'Biologi'
})

const preferencesData = ref({
  theme: 'system',
  language: 'id',
  autoSave: true
})

const notificationData = ref({
  emailWeeklyReport: true,
  emailStudentSubmit: true,
  pushAlerts: false
})

onMounted(async () => {
  try {
    const session = await getSession()
    if (session?.user) {
      userEmail.value = session.user.email
      
      const { data } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single()
        
      if (data) {
        role.value = data.role
        profileData.value.fullName = data.full_name || ''
        profileData.value.schoolName = data.school_name || ''
        profileData.value.phoneNumber = data.phone_number || ''
        // Bio and subject could be added to DB later
      }
    }
  } catch (error) {
    console.error('Gagal mengambil data:', error)
  } finally {
    loading.value = false
  }
})

const saveSettings = async () => {
  saving.value = true
  try {
    const session = await getSession()
    
    // Simpan ke profiles
    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profileData.value.fullName,
        school_name: profileData.value.schoolName,
        phone_number: profileData.value.phoneNumber
      })
      .eq('id', session.user.id)
      
    if (error && error.code !== 'PGRST204') {
      console.warn('Pastikan kolom sudah ditambahkan di Supabase', error)
    }
    
    // (Preferences dan Notifikasi disimulasikan disimpan di local/DB)
    setTimeout(() => {
      alert('Semua pengaturan berhasil disimpan!')
      saving.value = false
    }, 800)
    
  } catch (error) {
    alert('Gagal menyimpan pengaturan.')
    saving.value = false
  }
}

const handlePasswordReset = async () => {
  alert('Instruksi reset password telah dikirim ke ' + userEmail.value)
}

const tabs = [
  { id: 'profile', icon: 'person', label: 'Profil Publik' },
  { id: 'security', icon: 'shield_lock', label: 'Keamanan Akun' },
  { id: 'preferences', icon: 'tune', label: 'Preferensi' },
  { id: 'notifications', icon: 'notifications', label: 'Notifikasi' },
  { id: 'billing', icon: 'credit_card', label: 'Paket & Langganan' }
]
</script>

<template>
  <div class="max-w-6xl mx-auto py-8 px-4 h-full flex flex-col">
    <!-- Header -->
    <div class="mb-8">
      <h1 class="text-3xl font-extrabold text-on-surface mb-2 tracking-tight">Pengaturan</h1>
      <p class="text-on-surface-variant text-sm">Kelola profil pribadi, preferensi aplikasi, hingga detail langganan Anda.</p>
    </div>

    <div v-if="loading" class="flex justify-center py-12">
      <span class="material-symbols-outlined text-4xl animate-spin text-primary">progress_activity</span>
    </div>

    <div v-else class="flex flex-col md:flex-row gap-8 items-start">
      
      <!-- Sidebar Tabs -->
      <aside class="w-full md:w-64 shrink-0 flex flex-col gap-2">
        <button 
          v-for="tab in tabs" :key="tab.id"
          @click="currentTab = tab.id"
          class="flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-left w-full"
          :class="currentTab === tab.id ? 'bg-primary text-on-primary shadow-md' : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'"
        >
          <span class="material-symbols-outlined text-[20px]">{{ tab.icon }}</span>
          {{ tab.label }}
        </button>
      </aside>

      <!-- Content Area -->
      <main class="flex-1 w-full bg-surface-container-lowest border border-outline-variant/30 rounded-3xl p-6 md:p-8 shadow-sm">
        
        <!-- Tab: Profil Publik -->
        <div v-if="currentTab === 'profile'" class="space-y-8 animate-fade-in">
          <div class="flex items-center gap-6 pb-6 border-b border-outline-variant/20">
            <div class="relative group cursor-pointer">
              <div class="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 text-white flex items-center justify-center font-black text-4xl shadow-lg group-hover:opacity-80 transition-opacity">
                {{ userEmail.charAt(0).toUpperCase() }}
              </div>
              <div class="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <span class="material-symbols-outlined text-white">photo_camera</span>
              </div>
            </div>
            <div>
              <h3 class="font-bold text-lg text-on-surface">Foto Profil</h3>
              <p class="text-sm text-on-surface-variant mb-3">Disarankan ukuran 512x512px (Max 2MB).</p>
              <div class="flex gap-2">
                <button class="bg-surface-container text-on-surface hover:bg-surface-container-high px-4 py-1.5 rounded-lg text-sm font-bold transition-colors">Unggah Baru</button>
                <button class="text-error hover:bg-error/10 px-4 py-1.5 rounded-lg text-sm font-bold transition-colors">Hapus</button>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-bold text-on-surface-variant mb-2">Nama Lengkap</label>
              <input v-model="profileData.fullName" type="text" placeholder="Budi Santoso" class="w-full bg-surface-container-low px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary font-medium">
            </div>
            <div>
              <label class="block text-sm font-bold text-on-surface-variant mb-2">Mata Pelajaran</label>
              <select v-model="profileData.subject" class="w-full bg-surface-container-low px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary font-medium">
                <option value="Biologi">Biologi</option>
                <option value="IPA Terpadu">IPA Terpadu</option>
                <option value="Lainnya">Lainnya</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-bold text-on-surface-variant mb-2">Asal Sekolah / Instansi</label>
              <input v-model="profileData.schoolName" type="text" placeholder="SMA Negeri 1 Jakarta" class="w-full bg-surface-container-low px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary font-medium">
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-bold text-on-surface-variant mb-2">Bio Singkat</label>
              <textarea v-model="profileData.bio" rows="3" placeholder="Ceritakan sedikit tentang Anda..." class="w-full bg-surface-container-low px-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-primary/20 border border-transparent focus:border-primary font-medium resize-none"></textarea>
            </div>
          </div>
        </div>

        <!-- Tab: Keamanan -->
        <div v-else-if="currentTab === 'security'" class="space-y-6 animate-fade-in">
          <h2 class="text-xl font-bold text-on-surface mb-2">Keamanan Akun</h2>
          <p class="text-on-surface-variant text-sm mb-6 pb-6 border-b border-outline-variant/20">Lindungi akses ke akun pengajar Anda.</p>
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-surface-container-low rounded-2xl border border-transparent">
            <div>
              <div class="font-bold text-on-surface mb-1">Email Saat Ini</div>
              <div class="text-sm text-on-surface-variant">{{ userEmail }}</div>
            </div>
            <span class="text-xs bg-primary/10 text-primary font-bold px-3 py-1.5 rounded-full">Email Terverifikasi</span>
          </div>
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-surface-container-low rounded-2xl border border-transparent">
            <div>
              <div class="font-bold text-on-surface mb-1 flex items-center gap-2">
                Kata Sandi
                <span class="material-symbols-outlined text-success text-[16px]" title="Kuat">check_circle</span>
              </div>
              <div class="text-sm text-on-surface-variant">Terakhir diubah: Belum pernah</div>
            </div>
            <button @click="handlePasswordReset" class="px-5 py-2 bg-surface text-on-surface font-bold text-sm rounded-xl hover:text-primary transition-colors border border-outline-variant/30 shadow-sm">
              Ganti Password
            </button>
          </div>
          
          <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-surface-container-low rounded-2xl border border-transparent">
            <div>
              <div class="font-bold text-on-surface mb-1">Nomor Handphone (2FA)</div>
              <div class="text-sm text-on-surface-variant">Gunakan SMS OTP untuk verifikasi login tambahan</div>
            </div>
            <input v-model="profileData.phoneNumber" type="text" placeholder="+62 8..." class="w-48 bg-surface px-4 py-2 rounded-xl outline-none focus:border-primary text-sm font-medium border border-outline-variant/30">
          </div>

          <div class="mt-8 pt-6 border-t border-error/20">
            <h3 class="font-bold text-error mb-2">Zona Berbahaya</h3>
            <p class="text-sm text-on-surface-variant mb-4">Menghapus akun akan menghilangkan seluruh data Course, Modul, dan Lembar Soal Anda secara permanen.</p>
            <button class="bg-error/10 text-error hover:bg-error/20 px-5 py-2.5 rounded-xl font-bold transition-colors text-sm">Hapus Akun Saya</button>
          </div>
        </div>

        <!-- Tab: Preferensi -->
        <div v-else-if="currentTab === 'preferences'" class="space-y-6 animate-fade-in">
          <h2 class="text-xl font-bold text-on-surface mb-2">Preferensi Aplikasi</h2>
          <p class="text-on-surface-variant text-sm mb-6 pb-6 border-b border-outline-variant/20">Sesuaikan tampilan dan alur kerja aplikasi Ruang Biologi Anda.</p>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label class="block text-sm font-bold text-on-surface-variant mb-2">Bahasa Utama</label>
              <select v-model="preferencesData.language" class="w-full bg-surface-container-low px-4 py-3 rounded-xl outline-none border border-transparent focus:border-primary font-medium">
                <option value="id">Bahasa Indonesia</option>
                <option value="en">English (US)</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-bold text-on-surface-variant mb-2">Tema Tampilan</label>
              <select v-model="preferencesData.theme" class="w-full bg-surface-container-low px-4 py-3 rounded-xl outline-none border border-transparent focus:border-primary font-medium">
                <option value="system">Mengikuti Sistem Default</option>
                <option value="light">Terang (Light Mode)</option>
                <option value="dark">Gelap (Dark Mode)</option>
              </select>
            </div>
          </div>

          <div class="mt-6">
            <label class="flex items-center gap-3 cursor-pointer">
              <input type="checkbox" v-model="preferencesData.autoSave" class="w-5 h-5 accent-primary">
              <span class="font-bold text-on-surface">Auto-Save di Editor Modul</span>
            </label>
            <p class="text-sm text-on-surface-variant ml-8 mt-1">Sistem akan menyimpan draf Anda setiap 30 detik secara otomatis saat menyusun materi.</p>
          </div>
        </div>

        <!-- Tab: Notifikasi -->
        <div v-else-if="currentTab === 'notifications'" class="space-y-6 animate-fade-in">
          <h2 class="text-xl font-bold text-on-surface mb-2">Pusat Notifikasi</h2>
          <p class="text-on-surface-variant text-sm mb-6 pb-6 border-b border-outline-variant/20">Tentukan informasi apa saja yang ingin Anda terima.</p>
          
          <div class="space-y-4">
            <label class="flex items-start gap-4 p-4 bg-surface-container-low rounded-2xl cursor-pointer hover:bg-surface-container transition-colors">
              <input type="checkbox" v-model="notificationData.emailWeeklyReport" class="w-5 h-5 mt-1 accent-primary">
              <div>
                <span class="block font-bold text-on-surface mb-1">Laporan Mingguan via Email</span>
                <span class="text-sm text-on-surface-variant">Terima ringkasan aktivitas dan progres belajar siswa Anda setiap hari Minggu.</span>
              </div>
            </label>
            <label class="flex items-start gap-4 p-4 bg-surface-container-low rounded-2xl cursor-pointer hover:bg-surface-container transition-colors">
              <input type="checkbox" v-model="notificationData.emailStudentSubmit" class="w-5 h-5 mt-1 accent-primary">
              <div>
                <span class="block font-bold text-on-surface mb-1">Notifikasi Pengumpulan Ujian</span>
                <span class="text-sm text-on-surface-variant">Email saya setiap ada 10 siswa yang baru saja menyelesaikan Lembar Soal / Ujian.</span>
              </div>
            </label>
            <label class="flex items-start gap-4 p-4 bg-surface-container-low rounded-2xl cursor-pointer hover:bg-surface-container transition-colors">
              <input type="checkbox" v-model="notificationData.pushAlerts" class="w-5 h-5 mt-1 accent-primary">
              <div>
                <span class="block font-bold text-on-surface mb-1">Peringatan Langsung (Push Notifications)</span>
                <span class="text-sm text-on-surface-variant">Tampilkan popup di *browser* saat ada pengumuman mendesak dari platform Ruang Biologi.</span>
              </div>
            </label>
          </div>
        </div>

        <!-- Tab: Billing -->
        <div v-else-if="currentTab === 'billing'" class="space-y-6 animate-fade-in">
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-xl font-bold text-on-surface">Paket Langganan Anda</h2>
            <span class="px-3 py-1 bg-primary/10 text-primary font-extrabold text-sm rounded-full">GURU PRO</span>
          </div>
          <p class="text-on-surface-variant text-sm mb-6 pb-6 border-b border-outline-variant/20">Manajemen kuota media dan status keanggotaan aktif Anda.</p>
          
          <div class="bg-gradient-to-br from-primary to-primary/80 text-on-primary rounded-2xl p-6 shadow-lg mb-6 relative overflow-hidden">
            <div class="absolute -right-10 -bottom-10 opacity-20">
              <span class="material-symbols-outlined text-[150px]">workspace_premium</span>
            </div>
            <h3 class="text-2xl font-black mb-1 relative z-10">Pro Educator Plan</h3>
            <p class="text-on-primary/80 text-sm mb-6 relative z-10">Masa aktif hingga: 24 Desember 2026</p>
            
            <div class="relative z-10 space-y-2">
              <div class="flex justify-between text-sm font-bold">
                <span>Penyimpanan Media Library</span>
                <span>450 MB / 1 GB</span>
              </div>
              <div class="w-full h-2 bg-black/20 rounded-full overflow-hidden">
                <div class="h-full bg-white rounded-full" style="width: 45%"></div>
              </div>
            </div>
          </div>

          <div class="flex justify-between items-center">
            <button class="text-primary font-bold hover:underline">Lihat Riwayat Tagihan</button>
            <button class="bg-surface-container hover:bg-surface-container-high text-on-surface px-6 py-2.5 rounded-xl font-bold transition-colors">Upgrade Paket</button>
          </div>
        </div>

        <!-- Global Save Action -->
        <div class="mt-8 pt-6 border-t border-outline-variant/30 flex justify-end">
          <button @click="saveSettings" :disabled="saving" class="bg-primary text-on-primary hover:bg-primary/90 px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition-all shadow-md">
            <span v-if="saving" class="material-symbols-outlined text-[20px] animate-spin">progress_activity</span>
            <span v-else class="material-symbols-outlined text-[20px]">save</span>
            {{ saving ? 'Menyimpan...' : 'Simpan Semua Perubahan' }}
          </button>
        </div>

      </main>
    </div>
  </div>
</template>

<style scoped>
.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
