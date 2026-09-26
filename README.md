# Ruang Biologi (Biologi SMA) 🧬

![Status](https://img.shields.io/badge/Status-Beta-yellow.svg)
![Vue](https://img.shields.io/badge/Vue.js-3.x-4fc08d?logo=vue.js)
![Tailwind](https://img.shields.io/badge/TailwindCSS-3.x-38bdf8?logo=tailwind-css)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ecf8e?logo=supabase)

Ruang Biologi adalah platform pembelajaran biologi modern yang dirancang khusus untuk siswa dan guru SMA. Dibangun dengan fokus pada antarmuka premium, interaktif, dan mudah digunakan (UI/UX), platform ini juga dilengkapi dengan fitur Laboratorium Virtual terintegrasi.

## ✨ Fitur Utama

- 🧑‍🎓 **Student Dashboard:** Akses materi, pencarian real-time, tugas, dan pelacakan progres belajar.
- 👨‍🏫 **Teacher Dashboard & Course Builder:** Guru dapat merancang kursus, modul, dan silabus secara dinamis (Drag & Drop) tanpa perlu *coding*.
- 🔬 **Virtual Lab:** Modul eksperimen simulasi virtual interaktif (contoh: Simulasi Enzim Katalase H₂O₂).
- 📱 **Responsive Design:** Tampilan konsisten dan indah baik di PC, tablet, maupun ponsel.
- 🔐 **Authentication:** Sistem otentikasi aman untuk memisahkan sesi Guru dan Siswa.

## 🛠️ Tech Stack

- **Frontend:** [Vue 3](https://vuejs.org/) (Composition API, `<script setup>`) + [Vite](https://vitejs.dev/)
- **Routing:** [Vue Router 4](https://router.vuejs.org/)
- **Styling:** [Tailwind CSS 3](https://tailwindcss.com/)
- **Backend & Database:** [Supabase](https://supabase.com/) (PostgreSQL, Auth, Storage)
- **Komponen Interaktif:** `vuedraggable` untuk Course Builder

## 🚀 Cara Menjalankan Secara Lokal

### Persyaratan
- [Node.js](https://nodejs.org/en/) (v16 atau lebih baru direkomendasikan)
- [Supabase Project](https://database.new) (Gratis)

### 1. Kloning Repositori
```bash
git clone https://github.com/username-anda/ruang-biologi.git
cd ruang-biologi
```

### 2. Instalasi Dependensi
```bash
npm install
```

### 3. Konfigurasi Database (Supabase)
1. Buat proyek baru di [Supabase](https://supabase.com/).
2. Jalankan skrip SQL yang ada di dalam folder `database/` pada SQL Editor di *dashboard* Supabase Anda untuk menyiapkan tabel yang dibutuhkan.
3. Buat file `.env.local` di _root_ proyek dan tambahkan API Key dari Supabase:
```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

### 4. Jalankan Server Pengembangan (Dev Server)
```bash
npm run dev
```
Aplikasi akan berjalan di `http://localhost:5173`.

---

## 📁 Struktur Direktori
- `src/views/` - Kumpulan halaman UI (terbagi menjadi folder `student`, `teacher`, `auth`, dll).
- `src/components/` - Komponen Vue yang dapat digunakan ulang (Reusable).
- `database/` - Skrip SQL untuk migrasi skema database Supabase.
- `docs/` - Dokumentasi arsitektur, panduan *Virtual Lab*, dan referensi gaya UI.
- `scripts/` - Script-script pendukung dan testing.

## 🤝 Berkontribusi (Open Source)
Kami sangat menyambut kontribusi dari komunitas! 
1. *Fork* repositori ini.
2. Buat *branch* fitur Anda (`git checkout -b fitur/FiturKerenAnda`).
3. Lakukan *commit* perubahan Anda (`git commit -m 'Menambahkan fitur keren'`).
4. *Push* ke *branch* tersebut (`git push origin fitur/FiturKerenAnda`).
5. Buka *Pull Request* baru.

## 📄 Lisensi
Didistribusikan di bawah Lisensi MIT. Lihat file `LICENSE` untuk informasi lebih lanjut.
