# Panduan Desain & Antarmuka Biologi.id (Style Guide)

Panduan ini bertujuan untuk menjaga konsistensi desain visual dan struktur komponen pada seluruh platform **Biologi.id**, khususnya dalam pengembangan modul **Laboratorium Virtual** di masa mendatang.

---

## 1. Sistem Warna (Color System)
Proyek ini menggunakan Tailwind CSS dengan variabel warna khusus (terinspirasi dari Material Design 3) untuk menciptakan nuansa terang, bersih, dan elegan (*Luxury Light Showcase*).

### Warna Merek & Aksen (Brand & Accents)
- **Primary** (`bg-primary`, `text-primary`): Hijau Zamrud (`#006C4C`). Digunakan untuk tombol utama, aksi krusial, dan highlight penting.
- **Secondary** (`bg-secondary`, `text-secondary`): Hijau Kebiruan (`#4D6357`). Digunakan untuk ikon sekunder, lencana (badge), dan elemen pendukung.
- **Tertiary** (`bg-tertiary`, `text-tertiary`): Biru Keunguan (`#3D6373`). Digunakan untuk elemen pelengkap atau visual pembeda (seperti ikon 3 pilar).

### Warna Permukaan (Surfaces) - Tema Terang
Seluruh background menggunakan hierarki warna permukaan untuk menciptakan kedalaman (depth):
- `bg-surface-container-lowest`: Putih bersih (`#FFFFFF`). Digunakan untuk **Kartu (Card) utama**, kanvas simulasi, atau panel yang harus paling menonjol.
- `bg-surface-container-low`: Abu-abu sangat terang (`#F2F4F2`). Digunakan untuk **Latar belakang sub-komponen** (seperti blok instruksi, panel kontrol).
- `bg-surface`: Latar belakang utama halaman (`#FBFDF9`).
- `bg-surface-container-high`: Abu-abu sedikit lebih gelap (`#E6E9E7`). Digunakan untuk border, slider track, atau tombol sekunder.

### Teks (Typography Colors)
- `text-on-surface`: Abu-abu nyaris hitam (`#191C1A`). Untuk **Heading** dan teks utama.
- `text-on-surface-variant`: Abu-abu redup (`#404944`). Untuk **Deskripsi**, paragraf, dan sub-judul.
- `text-on-primary`: Putih (`#FFFFFF`). Teks di atas latar belakang *Primary*.

---

## 2. Tipografi (Typography)
- **Font Utama**: `Inter` (untuk keterbacaan paragraf & teks kontrol).
- **Font Display/Heading**: `Plus Jakarta Sans` (memberikan kesan modern, tebal, dan eksklusif).

**Kelas Heading Standar:**
- `font-headline-lg text-3xl font-bold text-on-surface` (Judul Halaman).
- `font-headline-sm text-xl font-bold text-on-surface` (Judul Kartu / Modul).
- `font-label-md text-xs font-bold uppercase tracking-widest` (Label / Lencana Status).

---

## 3. Komponen Laboratorium Virtual
Untuk mempertahankan *layout* yang elegan, setiap Lab Virtual harus menggunakan struktur 2 Kolom (*Two-Column Layout*) pada layar besar (Desktop), dan bertumpuk (*stacked*) pada Mobile.

### A. Container Utama Halaman
```html
<main class="flex-1 max-w-5xl mx-auto w-full px-6 py-8 flex flex-col lg:flex-row gap-8">
  <!-- Kiri: Kanvas & Instruksi -->
  <!-- Kanan: Panel Kontrol -->
</main>
```

### B. Area Kanvas Simulasi (Kiri)
Gunakan `aspect-video` agar proporsional, serta `bg-surface-container-lowest` untuk kontras maksimal. Tambahkan efek *Grid* ringan sebagai latar belakang agar terasa "saintifik".

```html
<div class="w-full aspect-video bg-surface-container-lowest border border-outline-variant/30 rounded-2xl shadow-sm relative overflow-hidden flex flex-col items-center justify-center">
  <!-- Latar Belakang Grid Sains -->
  <div class="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>
  
  <!-- Objek Visual Interaktif / Ikon SVG Ditempatkan Di Sini -->
</div>
```

### C. Panel Kontrol (Kanan)
Panel harus diletakkan di dalam kontainer yang memiliki garis pinggir (*border*) lembut dan *shadow-sm*. Lebarnya dipatok sekitar `w-full lg:w-80`.

```html
<div class="bg-surface-container-lowest border border-outline-variant/30 rounded-2xl p-6 shadow-sm">
  <!-- Judul Panel -->
  <div class="flex items-center gap-2 mb-6 border-b border-outline-variant/30 pb-4">
    <span class="material-symbols-outlined text-primary">tune</span>
    <h2 class="font-bold text-lg text-on-surface">Panel Kontrol</h2>
  </div>

  <!-- Input Area (Sliders, Selects) -->
  <div class="flex flex-col gap-6">
    <!-- Komponen Input akan masuk ke sini -->
  </div>
</div>
```

### D. Standar Input Interaktif
**1. Range Slider (Suhu, pH, Konsentrasi)**
```html
<div class="flex flex-col gap-2">
  <label class="text-sm font-bold text-on-surface flex justify-between">
    Suhu (°C)
    <span class="text-primary font-mono bg-primary/10 px-2 rounded">37</span>
  </label>
  <input type="range" min="0" max="100" class="w-full accent-primary h-2 bg-surface-container-high rounded-lg appearance-none cursor-pointer" />
</div>
```

**2. Select Dropdown (Pilihan Gen, Kondisi)**
```html
<select class="w-full px-4 py-2.5 rounded-xl bg-surface-container border border-outline-variant/50 text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary appearance-none text-sm">
  <option value="A">Opsi A</option>
</select>
```

**3. Tombol Aksi Utama (Call to Action)**
Gunakan `bg-primary`, tambahkan *shadow*, dan efek skala (`active:scale-95`) saat diklik agar terasa interaktif.
```html
<button class="w-full mt-4 py-3 bg-primary text-on-primary rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary-container transition-all active:scale-95 shadow-md">
  <span class="material-symbols-outlined text-[20px]">play_arrow</span>
  Mulai Reaksi
</button>
```

---

## 4. Estetika & Animasi (Micro-Interactions)
- **Glassmorphism Lembut**: Gunakan `backdrop-blur-xl` atau `backdrop-blur-md` yang dipadukan dengan `bg-surface/80` (background tembus pandang 80%) pada *Header Navbar* atau kotak pop-up di atas kanvas.
- **Ambient Glow (Cahaya Pendar)**: Untuk bagian hero atau footer, gunakan div absolut dengan `blur-[120px]` berwarna `bg-primary/5` untuk memberi pantulan cahaya *luxury* yang sangat redup.
- **Ikon Beranimasi**: Saat sistem sedang memproses logika praktikum (seperti mengaduk larutan, memanaskan tabung), gunakan ikon dengan rotasi (`animate-spin`) atau denyut (`animate-pulse`).

---
Dengan mengikuti pola-pola HTML/Tailwind di atas, setiap modul kanvas dan antarmuka laboratorium virtual yang dikembangkan ke depannya dijamin akan memiliki konsistensi visual 100% selaras dengan identitas **Biologi.id**.
