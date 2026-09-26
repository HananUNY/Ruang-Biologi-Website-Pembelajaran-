# Konsep Arsitektur Virtual Lab di Biologi.id

Dokumen ini menjelaskan mengapa kita memiliki **dua** jalur pembuatan Virtual Lab ("Mandiri" vs "Course") dan bagaimana cara kerjanya, agar mempermudah pemahaman logika *database* dan *flow* aplikasi.

---

## 1. Masalah Utama (Latar Belakang)
Pada awalnya, sistem kita dirancang sangat terikat pada struktur **Course**:
`Course -> Module (Bab) -> Lesson (Materi/Kuis/Lab)`

Masalahnya:
- Jika guru ingin membuat "Simulasi Reaksi Enzim", guru **wajib** membuat *Course* dulu, lalu membuat *Module*, baru bisa membuat *Lab* di dalamnya.
- Jika ada simulasi "Reaksi Enzim" yang sama ingin dipakai di *Course* Kelas 10 dan *Course* Kelas 11, guru harus membuat simulasi itu dua kali dari nol di masing-masing course.
- Pengunjung publik tidak bisa sekadar bermain simulasi lab karena simulasi itu "terkurung" di dalam struktur *Course* yang sifatnya privat.

## 2. Solusi: Arsitektur 2 Jalur
Untuk mengatasi hal ini, kita memisahkan konsep **"Isi Lab" (Konten Simulasi)** dengan **"Penempatan Lab" (Modul Belajar)**. 

### A. Lab Virtual Mandiri (*Independent Virtual Labs*)
Ini adalah lab yang disimpan di tabel `virtual_labs`. 
- **Sifat**: Berdiri sendiri (*Standalone*).
- **Tujuan**: Sebagai "Bank Lab" atau perpustakaan alat peraga milik Anda.
- **Keunggulan**: Bisa dipublikasikan langsung ke halaman `/public/labs` agar pengunjung umum bisa mencobanya tanpa harus mendaftar atau masuk ke kelas/course apa pun.
- **Pembuatan**: Dibuat langsung di Dashboard -> **Koleksi Virtual Lab** -> tombol **"Buat Lab Mandiri"**.

### B. Lab Virtual Course (*Course-bound Labs*)
Ini adalah lab yang berstatus sebagai bagian dari *Lesson* (materi) dengan `type = 'lab'`, yang tersimpan di tabel `lessons`.
- **Sifat**: Terikat pada kurikulum (*Course*).
- **Tujuan**: Digunakan saat siswa sedang mengikuti urutan pelajaran berjenjang (misal: habis baca teori sel, disuruh praktikum, lalu lanjut kuis).
- **Pembuatan**: Dibuat di **Course Builder** saat Anda menekan tombol "Tambah Lesson".

---

## 3. Integrasi: Fitur "Pilih dari Lab Mandiri" (Import)
Karena Anda sekarang memiliki "Bank Lab" (Lab Mandiri), saat Anda sedang menyusun kerangka *Course*, Anda tidak perlu membuat lab dari awal.

**Alur kerjanya:**
1. Guru pergi ke **Course Builder**.
2. Klik **Tambah Lesson**, pilih tipe **Lab Virtual**.
3. Sistem akan bertanya: *"Buat Baru (dari nol) atau Pilih dari Lab Mandiri (ambil dari perpustakaan)?"*
4. Jika guru memilih **"Pilih dari Lab Mandiri"** dan memilih "Uji Enzim Katalase", maka sistem akan **menduplikasi** atau **menyalin** (secara konseptual) lab tersebut ke dalam *Course* ini.
5. Siswa di dalam *Course* tersebut kini bisa mengerjakan "Uji Enzim Katalase" secara berurutan sesuai kurikulum.

## 4. Rangkuman Kegunaan
| Skenario Penggunaan | Tipe Lab yang Digunakan |
| :--- | :--- |
| Ingin pamer ke publik/umum agar bisa dicoba tanpa login | **Lab Mandiri** (Set status ke *Published*) |
| Ingin siswa mengerjakan lab sebagai bagian dari tugas kelas/bab | **Lab Course** (Dibuat di Course Builder) |
| Ingin pakai lab yang sudah pernah dibuat untuk dimasukkan ke course baru | **Lab Mandiri** (lalu di-import via Course Builder) |

---

## 5. Bagaimana Cara "Mem-build" Konten Lab Mandiri?
Meskipun Anda sudah bisa membuat "cangkang" atau wadah Lab Mandiri (mengisi judul dan deskripsi), Anda mungkin bertanya-tanya: *"Lalu bagaimana cara saya memasukkan animasi selnya, atau mengatur slider suhu dan pH-nya?"*

Ada beberapa pendekatan teknis yang bisa kita kembangkan ke depannya untuk halaman **Virtual Lab Editor**:

### Pendekatan 1: *JSON Configuration* (Simulasi Terstruktur)
Sistem akan menyediakan tipe-tipe *template* simulasi bawaan (misal: "Template Tabung Reaksi", "Template Mikroskop"). Di dalam halaman Editor Lab Mandiri, Anda tinggal mengisi formulir parameter:
- Apa variabel X-nya? (Suhu: 0-100)
- Apa variabel Y-nya? (pH: 1-14)
- Apa aturan reaksinya? (Jika suhu > 50, maka = denaturasi)
Sistem akan menyimpan formulir ini sebagai data **JSON** di *database*, lalu menerjemahkannya menjadi visual simulasi yang interaktif. (Ini adalah pendekatan paling aman, cepat, dan rapi).

### Pendekatan 2: *HTML Eksternal* (3 Metode)
Bagi guru atau developer yang sudah memiliki aset game simulasi HTML5 (Phaser, Unity WebGL, atau vendor pihak ketiga), sistem menyediakan tiga cara fleksibel:
1. **Tautan URL (Embed):** Anda cukup mem-*paste* link (misal: simulasi PhET Colorado), dan sistem akan menampilkannya dalam *iFrame*.
2. **Kode HTML Mentah (Raw):** Anda bisa menyalin (*copy*) lalu menempelkan (*paste*) langsung ratusan baris kode HTML simulasi tersebut ke dalam kolom di sistem kami.
3. **Upload File HTML/ZIP:** Anda bisa mengunggah file `.html` atau kumpulan file (ZIP) aset simulasi langsung ke *database* (Supabase Storage) kami, dan sistem akan menjalankan file tersebut secara mandiri.

**Rencana Eksekusi Utama:**
Untuk fitur Lab Virtual ini, kita **hanya** akan menggunakan gabungan **Pendekatan 1 (JSON)** dan **Pendekatan 2 (HTML - URL, Raw, Upload)** karena sangat komprehensif untuk menangani berbagai tipe guru (dari yang awam hingga developer). Fitur form input-nya sudah diterapkan di dalam halaman `VirtualLabEditor.vue`.

---
**Kesimpulan:**
Konsep ini mirip dengan "Google Drive" (Lab Mandiri) dan "Google Classroom" (Course). Anda bisa menaruh file Anda di Drive secara bebas, dan ketika Anda mengajar di Classroom, Anda tinggal me-*link* atau melampirkan file dari Drive tersebut ke tugas siswa.
