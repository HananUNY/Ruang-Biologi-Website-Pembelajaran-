# Biologi.id — Backend & Teacher Authoring Specification

> Dokumen ini merupakan spesifikasi backend untuk **Biologi.id**, khususnya untuk memastikan guru dapat membuat, mengunggah, mengedit, mengorganisasi, memublikasikan, dan memelihara materi pembelajaran tanpa harus melakukan coding.

---

# 1. Tujuan Backend Biologi.id

Backend Biologi.id tidak hanya bertugas menyimpan data. Backend harus menjadi fondasi untuk:

- akun guru dan siswa;
- course, module, dan lesson;
- editor materi;
- upload dan pengelolaan media;
- bank soal;
- quiz;
- progress siswa;
- penilaian;
- analytics;
- draft/review/publish;
- versioning konten;
- keamanan akses.

Prinsip utamanya:

> **Guru mengelola konten melalui Teacher Dashboard. Guru tidak perlu menyentuh database, JSON, API, atau source code.**

Arsitektur yang dipilih:

```text
Vue 3 + Vite + TypeScript
            │
       Supabase Client
            │
     ┌──────┼───────────┐
     │      │           │
    Auth  Database    Storage
     │   PostgreSQL      │
     │      │             │
     └──────┼─────────────┘
            │
      Edge Functions
         (opsional)
```

Supabase menyediakan PostgreSQL, Auth, Storage, Data API, dan Edge Functions dalam satu platform. `supabase-js` dapat digunakan dari aplikasi JavaScript untuk database, autentikasi, storage, dan pemanggilan Edge Functions. [Supabase JavaScript](https://supabase.com/docs/reference/javascript/introduction)

---

# 2. Pembagian Sistem

Biologi.id memiliki dua pengalaman utama:

```text
                    BIOLOGI.ID
                         │
            ┌────────────┴────────────┐
            │                         │
       STUDENT APP               TEACHER APP
            │                         │
       Learn / Explore          Create / Manage
            │                         │
            └────────────┬────────────┘
                         │
                    SUPABASE
```

## Student App

Siswa:

- melihat course;
- membuka lesson;
- menonton video;
- melakukan aktivitas;
- mengerjakan quiz;
- mengirim tugas;
- melihat feedback;
- melihat progress.

## Teacher App

Guru:

- membuat course;
- membuat module;
- membuat lesson;
- menulis materi;
- mengunggah file;
- memasukkan video;
- membuat aktivitas;
- membuat bank soal;
- membuat quiz;
- preview;
- publish;
- mengelola kelas;
- melihat hasil belajar.

---

# 3. Teacher Dashboard adalah Pusat Authoring

Teacher Dashboard bukan sekadar dashboard statistik.

Fungsi utamanya adalah **Content Management dan Authoring**.

Struktur:

```text
TEACHER DASHBOARD
│
├── Dashboard
│
├── Courses
│   ├── All Courses
│   ├── Create Course
│   └── Templates
│
├── Content
│   ├── Lessons
│   ├── Lesson Builder
│   └── Imported Materials
│
├── Media Library
│   ├── Images
│   ├── Videos
│   ├── Documents
│   ├── Audio
│   └── Other Files
│
├── Assessment
│   ├── Question Bank
│   ├── Quiz Builder
│   └── Assignments
│
├── Classes
│   ├── Class List
│   └── Students
│
├── Analytics
│   ├── Course Analytics
│   ├── Quiz Analytics
│   └── Student Progress
│
└── Settings
```

---

# 4. Teacher Dashboard — Halaman Utama

Guru melihat ringkasan aktivitas kerja, bukan hanya statistik siswa.

```text
┌──────────────────────────────────────────────────────────┐
│ Biologi.id Admin                         👤 Guru         │
├───────────────┬──────────────────────────────────────────┤
│ Dashboard     │ Selamat datang kembali                  │
│               │                                          │
│ Courses       │ +--------------------------------------+ │
│ Lessons       │ | Courses        Lessons      Questions │ │
│ Media         │ | 8              64           482       │ │
│ Assessment    │ +--------------------------------------+ │
│ Classes       │                                          │
│ Analytics     │ Recent Work                              │
│               │                                          │
│               │ Draft yang belum selesai                │
│               │ • Sistem Respirasi — 80%                │
│               │ • Genetika — 45%                        │
│               │                                          │
│               │ Quick Actions                            │
│               │ [ + Materi ] [ + Video ] [ + Quiz ]    │
└───────────────┴──────────────────────────────────────────┘
```

Quick action sangat penting agar guru dapat langsung bekerja.

---

# 5. Workflow Utama Guru

Alur authoring harus sederhana:

```text
CREATE
  ↓
EDIT
  ↓
SAVE
  ↓
PREVIEW
  ↓
REVIEW
  ↓
PUBLISH
```

Untuk materi yang sudah ada:

```text
UPLOAD
  ↓
VALIDATE
  ↓
PROCESS
  ↓
IMPORT / ATTACH
  ↓
EDIT
  ↓
PREVIEW
  ↓
PUBLISH
```

---

# 6. Dua Cara Guru Membuat Materi

Biologi.id harus mendukung dua workflow.

## Workflow A — Membuat materi langsung

Guru memilih:

```text
+ Materi Baru
```

kemudian menggunakan Lesson Builder.

## Workflow B — Memasukkan materi yang sudah dimiliki

Guru memilih:

```text
+ Upload Materi
```

Untuk tahap awal, tipe file yang dapat diterima:

```text
PDF
DOCX
PPTX
TXT
MD
Gambar
Video
Audio
```

File dapat menjadi:

- resource yang bisa diunduh siswa;
- lampiran lesson;
- bahan referensi;
- media pembelajaran;
- aset yang digunakan dalam content block.

**Catatan arsitektur:** konversi DOCX/PPTX menjadi lesson block otomatis sebaiknya dianggap sebagai fitur tahap lanjut. MVP cukup menyimpan file dan metadata dengan aman, lalu guru menyusun lesson menggunakan editor.

---

# 7. Upload Materi — UI Workflow

Guru menekan:

**+ Upload Materi**

Muncul dialog:

```text
UPLOAD MATERIAL

┌─────────────────────────────────────┐
│                                     │
│       Drag & Drop files here        │
│                                     │
│          atau                       │
│                                     │
│       [ Choose Files ]              │
│                                     │
│ PDF • DOCX • PPTX • Images          │
└─────────────────────────────────────┘
```

Setelah memilih file:

```text
Uploading...

Sistem Respirasi.pdf
████████████████░░░░ 82%

82 MB
```

Untuk beberapa file:

```text
Upload Queue

✓ respirasi.pdf
✓ diagram-paru.png
⟳ video-inspirasi.mp4
○ lkpd-respirasi.pdf
```

Upload queue harus mendukung:

- progress;
- pause/retry bila memungkinkan;
- error indication;
- cancel;
- validasi tipe;
- validasi ukuran;
- status selesai.

---

# 8. Supabase Storage untuk Upload

File fisik berada di **Supabase Storage**, sedangkan metadata file disimpan pada PostgreSQL.

```text
FILE
 ↓
Supabase Storage

METADATA
 ↓
PostgreSQL / media table
```

Supabase Storage mendukung file bucket untuk gambar, video, dokumen, dan file umum. Untuk file kecil dapat digunakan standard upload; Supabase merekomendasikan TUS resumable upload untuk file di atas sekitar 6 MB atau ketika stabilitas jaringan menjadi perhatian. [Supabase Storage](https://supabase.com/docs/guides/storage) · [Supabase Standard Uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads) · [Supabase Resumable Uploads](https://supabase.com/docs/guides/storage/uploads/resumable-uploads)

Untuk video/file besar, workflow yang direkomendasikan:

```text
Teacher Browser
      ↓
Validate
      ↓
TUS Resumable Upload
      ↓
Supabase Storage
      ↓
Create Media Record
      ↓
Media Library
```

---

# 9. Struktur Storage

Gunakan bucket berdasarkan kebutuhan akses, bukan satu bucket raksasa.

```text
Supabase Storage
│
├── public-assets/
│   ├── course-covers/
│   ├── thumbnails/
│   └── public-images/
│
├── course-media/
│   ├── biology-x/
│   ├── biology-xi/
│   └── biology-xii/
│
├── documents/
│   ├── modules/
│   ├── lkpd/
│   └── references/
│
└── submissions/
    ├── assignments/
    └── student-files/
```

File yang memang publik dapat ditempatkan pada bucket publik. Materi terbatas dan file siswa menggunakan bucket yang terlindungi.

Storage Supabase menggunakan policy/RLS pada `storage.objects` untuk membatasi upload, read, update, dan delete. Secara default, upload tidak diizinkan tanpa policy yang sesuai. [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control)

---

# 10. Metadata File

Tabel:

```text
media
--------------------------------
id
owner_id
bucket
storage_path
file_name
display_name
mime_type
file_size
width
height
duration
alt_text
caption
description
folder_id
visibility
status
created_at
updated_at
```

Status:

```text
uploading
ready
processing
failed
archived
```

Dengan pola:

```text
Storage = file sebenarnya

Database = informasi tentang file
```

Jangan mengedit tabel internal `storage.objects` secara langsung. Supabase merekomendasikan operasi file dilakukan melalui Storage API; schema Storage sebaiknya diperlakukan sebagai managed/read-only metadata layer. [Supabase Storage Schema](https://supabase.com/docs/guides/storage/schema/design)

---

# 11. Media Library

Semua media masuk ke satu Media Library.

Guru dapat:

```text
MEDIA LIBRARY

[ Upload ] [ New Folder ] [ Search ]

All | Images | Videos | Documents | Audio

┌─────────────┐ ┌─────────────┐ ┌─────────────┐
│ thumbnail   │ │ thumbnail   │ │ thumbnail   │
│             │ │             │ │             │
│ neuron.png  │ │ mitosis.mp4 │ │ lkpd.pdf    │
│ 2.4 MB      │ │ 128 MB      │ │ 1.2 MB      │
└─────────────┘ └─────────────┘ └─────────────┘
```

Fungsi:

- search;
- filter;
- sort;
- rename;
- move;
- delete/archive;
- preview;
- copy link/reference;
- melihat penggunaan media.

---

# 12. Reuse Media

Guru tidak boleh dipaksa upload file yang sama berkali-kali.

Workflow:

```text
Lesson Builder
    ↓
Add Image
    ↓
Media Library
    ↓
Select Existing
    ↓
Insert
```

atau:

```text
Add Image
 ↓
Upload New
 ↓
Save to Media Library
 ↓
Insert
```

Satu media dapat digunakan oleh beberapa lesson.

---

# 13. Course Builder

Guru memilih:

```text
+ Create Course
```

Form:

```text
Course Title
Description
Grade
Subject
Cover
Author
Status
```

Setelah dibuat:

```text
Biologi Kelas XI
│
├── Module 1 — Sel
├── Module 2 — Sistem Gerak
├── Module 3 — Sistem Respirasi
└── Module 4 — Sistem Ekskresi
```

Module dapat diubah urutannya menggunakan drag & drop.

---

# 14. Lesson Builder

Lesson Builder adalah pusat authoring.

```text
┌──────────────┬──────────────────────────┬───────────────┐
│ BLOCKS       │ CANVAS                   │ SETTINGS      │
│              │                          │               │
│ Text         │ Lesson Title             │ Status        │
│ Heading      │                          │ Draft         │
│ Image        │ [Text]                   │               │
│ Video        │                          │ Duration      │
│ PDF          │ [Image]                  │ 15 min        │
│ Diagram      │                          │               │
│ Simulation   │ [Video]                  │ Objectives    │
│ Quiz         │                          │               │
│ Activity     │ [Quiz]                   │ Tags          │
│ Case Study   │                          │               │
│ Reflection   │                          │               │
└──────────────┴──────────────────────────┴───────────────┘
```

Guru dapat:

- drag;
- drop;
- edit;
- duplicate;
- reorder;
- hide;
- delete;
- preview.

---

# 15. Content Block Types

Minimal:

```text
TEXT
- Heading
- Paragraph
- Quote
- Callout

MEDIA
- Image
- Video
- Audio
- PDF

SCIENCE
- Diagram
- Hotspot
- Data Table
- Graph
- Simulation
- Virtual Lab

ACTIVITY
- Multiple Choice
- Matching
- Drag & Drop
- Ordering
- Labeling

PEDAGOGY
- Case Study
- Reflection
- Summary
- Learning Check
```

---

# 16. Database Lesson Block

```text
lesson_blocks
--------------------------------
id
lesson_id
block_type
position
content_json
settings_json
created_at
updated_at
```

Prinsip:

```text
Relasi penting → kolom PostgreSQL

Konfigurasi fleksibel → JSONB
```

Contoh video:

```json
{
  "source_type": "youtube",
  "url": "https://youtube.com/...",
  "title": "Mekanisme Inspirasi"
}
```

Contoh image:

```json
{
  "media_id": "uuid",
  "alt_text": "Diagram paru-paru"
}
```

Contoh simulation:

```json
{
  "variables": {
    "temperature": {"min": 10, "max": 40},
    "co2": {"min": 0, "max": 100}
  }
}
```

---

# 17. Rich Text Editor

Untuk text block, gunakan:

```text
Tiptap + Vue 3
```

Guru mendapatkan toolbar:

```text
B I U
H1 H2 H3
Bullet
Numbering
Link
Quote
Table
```

Tiptap menyimpan konten terstruktur yang dapat dirender kembali oleh frontend.

Rich text editor adalah bagian dari Content Block, bukan seluruh lesson.

---

# 18. Auto Save

Lesson Builder harus memiliki autosave.

Status:

```text
Saving...
✓ Saved just now
⚠ Unsaved changes
```

Strategi:

```text
Edit block
   ↓
Debounce
   ↓
Save draft
   ↓
Supabase
```

Tujuan:

- mencegah kehilangan pekerjaan;
- memungkinkan guru menutup browser;
- menjaga draft tetap aman.

---

# 19. Draft System

Setiap course/lesson memiliki:

```text
draft
review
published
archived
```

Draft dapat diubah berkali-kali tanpa langsung mengubah konten publik.

---

# 20. Preview

Guru dapat memilih:

```text
[ Edit ] [ Preview Student ]
```

Preview harus menggunakan renderer yang sama dengan Student App.

Tujuannya:

> Tampilan preview harus sedekat mungkin dengan tampilan siswa sebenarnya.

---

# 21. Publish Workflow

```text
DRAFT
 ↓
Preview
 ↓
Teacher Review
 ↓
Publish
 ↓
PUBLISHED
```

Saat publish:

- validasi metadata;
- cek semua block;
- cek link/media;
- cek quiz;
- cek objective;
- pastikan tidak ada block rusak.

Jika ada error:

```text
Cannot publish

✕ Video block belum memiliki sumber
✕ Quiz belum memiliki jawaban benar
✕ Image belum memiliki alt text
```

---

# 22. Versioning Materi

Gunakan versioning untuk lesson.

Contoh:

```text
Lesson: Sistem Respirasi

v1
v2
v3
current
```

Guru dapat:

- melihat perubahan;
- mengetahui siapa yang mengubah;
- melihat waktu perubahan;
- rollback ke versi sebelumnya.

Untuk MVP, versioning dapat dibuat pada level lesson dengan snapshot JSON.

Tabel:

```text
lesson_versions
--------------------------------
id
lesson_id
version_number
snapshot_json
created_by
created_at
change_note
```

---

# 23. Import Materi

Untuk file yang diunggah guru:

```text
Imported Materials
```

Guru dapat melihat:

```text
Sistem Respirasi.pdf
Status: Ready

[Preview] [Attach to Lesson] [Download]
```

Dokumen tersebut tidak otomatis menjadi lesson.

Guru menentukan penggunaannya:

```text
Attach as resource
```

atau:

```text
Insert into Lesson
```

Konversi otomatis PDF/DOCX/PPTX menjadi blok konten dapat dikembangkan sebagai fitur lanjutan.

---

# 24. Video Management

Guru dapat menambahkan:

```text
YouTube
Vimeo
External URL
Uploaded Video
```

Form:

```text
Video Title
Source
URL/File
Thumbnail
Description
Caption
Duration
```

Video dapat dipakai ulang melalui Media Library.

Untuk video besar yang di-upload langsung, gunakan resumable upload.

---

# 25. Question Bank

Tabel:

```text
questions
question_options
```

Metadata:

```text
topic
subtopic
difficulty
cognitive_level
question_type
competency
points
```

Guru dapat:

```text
+ New Question
Import CSV
Duplicate
Archive
Filter
Search
```

---

# 26. Quiz Builder

Workflow:

```text
Create Quiz
 ↓
Select Manual / Question Bank
 ↓
Set Question Count
 ↓
Set Cognitive Composition
 ↓
Generate / Add
 ↓
Preview
 ↓
Publish
```

Contoh:

```text
10 questions

C1 = 1
C2 = 2
C3 = 3
C4 = 4

Difficulty:
Medium
```

---

# 27. Class Management

Tabel:

```text
schools
classes
class_members
```

Contoh:

```text
SMA Negeri X
│
├── XI IPA 1
├── XI IPA 2
└── XI IPA 3
```

Guru dapat menghubungkan:

```text
Course
 ↓
Class
 ↓
Students
```

---

# 28. Enrollment

Tabel:

```text
enrollments
--------------------------------
id
student_id
course_id
class_id
status
enrolled_at
```

Dengan ini guru dapat menentukan siapa yang boleh mengikuti course tertentu.

---

# 29. Progress

Tabel:

```text
progress
--------------------------------
id
student_id
course_id
lesson_id
status
progress_percent
started_at
completed_at
last_accessed_at
```

Progress dapat berdasarkan:

```text
Lesson
Activity
Quiz
Assignment
```

---

# 30. Quiz Attempt dan Answer

```text
attempts
--------------------------------
id
quiz_id
student_id
started_at
submitted_at
score
percentage
status
```

```text
answers
--------------------------------
id
attempt_id
question_id
answer_data
is_correct
points_earned
answered_at
```

---

# 31. Analytics untuk Guru

Dashboard guru dapat menampilkan:

```text
Course Completion
Average Score
Quiz Completion
Most Missed Questions
Topic Performance
Student Progress
```

Contoh:

```text
Sistem Respirasi

Completion: 83%

Rata-rata Quiz: 78

Topik dengan kesalahan tinggi:
1. Pertukaran gas
2. Volume paru
3. Mekanisme ekspirasi
```

---

# 32. Security Model

Security harus dilakukan di backend, bukan hanya frontend.

Supabase Auth menyediakan identitas pengguna, sedangkan JWT dan RLS dapat digunakan untuk membatasi data per baris. Supabase merekomendasikan RLS untuk tabel yang diekspos melalui Data API dan menekankan bahwa grants serta RLS bekerja bersama. [Supabase Auth](https://supabase.com/docs/guides/auth) · [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)

## Student

Boleh:

```text
read published course
read enrolled lesson
create own attempt
create own answers
read own progress
```

Tidak boleh:

```text
edit course
edit lesson
edit questions
read students lain
```

## Teacher

Boleh:

```text
create/edit own courses
create/edit own lessons
upload own media
create/edit own questions
create/edit quizzes
read student results for managed classes
```

## Admin

Boleh:

```text
manage users
manage school
manage courses
manage classes
manage platform
```

---

# 33. Storage Security

Gunakan bucket:

```text
public
private
```

Public:

```text
course cover
public thumbnail
public illustration
```

Private:

```text
teacher documents
student submissions
restricted resources
```

Storage access dikontrol melalui policy pada `storage.objects`. [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control)

---

# 34. Service Layer Frontend

Frontend jangan langsung menulis query Supabase di semua komponen.

Gunakan:

```text
services/
├── auth.service.ts
├── course.service.ts
├── lesson.service.ts
├── media.service.ts
├── quiz.service.ts
├── progress.service.ts
└── analytics.service.ts
```

Contoh:

```text
Teacher UI
   ↓
lesson.service
   ↓
Supabase
```

Ini membuat kode lebih mudah dipelihara.

---

# 35. Supabase Client

Gunakan:

```text
@supabase/supabase-js
```

Untuk:

- Auth;
- Database;
- Storage;
- Realtime;
- Edge Functions.

Supabase secara resmi menyediakan `supabase-js` untuk mengakses database, auth, storage, realtime, dan Edge Functions. [Supabase JavaScript](https://supabase.com/docs/reference/javascript/introduction)

---

# 36. Edge Functions

Tidak semua operasi membutuhkan Edge Function.

Gunakan untuk proses server-side seperti:

```text
generate quiz
process imported material
generate PDF report
send notification
heavy business logic
trusted scoring
```

Untuk operasi CRUD biasa:

```text
Vue
 ↓
supabase-js
 ↓
PostgreSQL
```

sudah cukup.

---

# 37. Import Question Bank

Guru dapat mengunggah CSV/Excel.

Workflow:

```text
Import Questions
 ↓
Upload CSV
 ↓
Validate Columns
 ↓
Preview Rows
 ↓
Show Errors
 ↓
Confirm Import
 ↓
Create Questions
```

Contoh mapping:

```text
Question → question_text
A → option A
B → option B
C → option C
D → option D
Answer → correct answer
Level → cognitive level
Difficulty → difficulty
```

Sistem harus menampilkan error sebelum data masuk.

---

# 38. Error Handling pada Teacher Dashboard

Jangan menampilkan error teknis seperti:

```text
PostgREST 23505
```

Guru harus mendapatkan pesan:

```text
Materi belum dapat disimpan.

Judul lesson belum diisi.
```

Untuk upload:

```text
Upload gagal.

File terlalu besar atau koneksi terputus.

[Retry]
```

Untuk permission:

```text
Anda tidak memiliki izin untuk mengubah materi ini.
```

---

# 39. Audit Log

Untuk perubahan penting:

```text
audit_logs
--------------------------------
id
user_id
action
entity_type
entity_id
metadata
created_at
```

Contoh:

```text
Teacher A
UPDATED
Lesson
Sistem Respirasi
23 Sep 2026 21:14
```

Ini berguna untuk debugging, histori, dan pengelolaan platform.

---

# 40. Database Utama

Struktur awal:

```text
profiles
schools
classes
class_members

courses
modules
lessons
lesson_blocks
lesson_versions

media
media_folders
videos

questions
question_options
quizzes
quiz_questions

enrollments
assignments
submissions

attempts
answers
progress

tags
content_tags

audit_logs
```

---

# 41. Relasi Inti

```text
profiles
   │
   ├── courses
   │      │
   │      └── modules
   │             │
   │             └── lessons
   │                    │
   │                    └── lesson_blocks
   │
   ├── questions
   │
   └── media
```

Student:

```text
profiles
   │
   ├── enrollments
   │       │
   │       └── courses
   │
   ├── progress
   │
   └── attempts
           │
           └── answers
```

---

# 42. Alur Lengkap Guru Mengunggah Materi

## Kasus 1 — Upload PDF

```text
Teacher Dashboard
 ↓
Upload Material
 ↓
Choose PDF
 ↓
Validate
 ↓
Upload to Storage
 ↓
Create media record
 ↓
Media Library
 ↓
Attach to Lesson
 ↓
Publish
```

## Kasus 2 — Membuat Lesson langsung

```text
Teacher Dashboard
 ↓
Create Course
 ↓
Create Module
 ↓
Create Lesson
 ↓
Lesson Builder
 ↓
Add Content Blocks
 ↓
Select / Upload Media
 ↓
Add Quiz
 ↓
Autosave
 ↓
Preview
 ↓
Publish
```

## Kasus 3 — Menggunakan file yang sudah pernah diupload

```text
Lesson Builder
 ↓
Add Image
 ↓
Media Library
 ↓
Search
 ↓
Select Existing
 ↓
Insert
```

---

# 43. Alur Guru Membuat Video Lesson

```text
Teacher Dashboard
 ↓
Media Library
 ↓
Add Video
 ↓
Choose:
  YouTube
  Vimeo
  External URL
  Upload
 ↓
Save
 ↓
Lesson Builder
 ↓
Add Video Block
 ↓
Select Video
 ↓
Add caption/checkpoint
 ↓
Preview
 ↓
Publish
```

---

# 44. Alur Guru Membuat Quiz

```text
Teacher Dashboard
 ↓
Question Bank
 ↓
Create Questions
 ↓
Tag:
Topic
Level
Difficulty
 ↓
Quiz Builder
 ↓
Select / Generate Questions
 ↓
Configure Scoring
 ↓
Preview
 ↓
Publish
```

---

# 45. Alur Siswa

```text
Login
 ↓
Dashboard
 ↓
Course
 ↓
Lesson
 ↓
Content Blocks
 ↓
Activity
 ↓
Quiz
 ↓
Attempt
 ↓
Answer
 ↓
Submit
 ↓
Score / Feedback
 ↓
Progress Update
```

---

# 46. Autosave dan Reliability

Teacher authoring harus dianggap sebagai pekerjaan penting.

Karena itu:

- draft disimpan berkala;
- perubahan disimpan tanpa reload;
- upload memiliki retry;
- form memberi feedback;
- publish dilakukan setelah validasi;
- version snapshot dapat dibuat;
- halaman memiliki warning jika ada perubahan yang belum tersimpan.

---

# 47. Prinsip Penting untuk Media

Jangan menggunakan file path sebagai satu-satunya identitas media.

Gunakan:

```text
media_id
```

Contoh:

```text
lesson_block
   ↓
media_id
   ↓
media
   ↓
storage_path
```

Dengan demikian, jika storage path berubah, lesson tidak perlu diubah.

---

# 48. Prinsip Penting untuk Konten

Jangan membuat:

```text
virus.html
sel.html
respirasi.html
```

sebagai data utama.

Gunakan:

```text
course
module
lesson
lesson_blocks
```

Dengan demikian engine dapat merender semua topic menggunakan struktur yang sama.

---

# 49. Prinsip Penting untuk Guru

Guru harus berpikir:

> **“Saya ingin membuat materi Sistem Respirasi.”**

Bukan:

> “Saya harus membuat tabel database lesson.”

Teacher Dashboard menyembunyikan kompleksitas teknis.

Guru hanya melihat:

```text
Materi
Video
Gambar
Aktivitas
Quiz
Publish
```

---

# 50. MVP Backend

Tahap pertama yang benar-benar perlu dibangun:

```text
1. Authentication
2. Profiles / Roles
3. Courses
4. Modules
5. Lessons
6. Lesson Blocks
7. Media Library
8. File Upload
9. Lesson Builder
10. Question Bank
11. Quiz Builder
12. Quiz Attempts
13. Progress
14. RLS
15. Draft / Publish
```

---

# 51. Fitur Tahap Berikutnya

Setelah fondasi stabil:

```text
16. Versioning
17. Import CSV
18. Class Management
19. Assignments
20. Student Submissions
21. Analytics
22. Realtime
23. Edge Functions
24. Automatic document parsing
25. AI-assisted authoring
```

---

# 52. Arsitektur Final

```text
                         BIOLOGI.ID
                              │
                ┌─────────────┴─────────────┐
                │                           │
            STUDENT APP                TEACHER APP
                │                           │
                │                      AUTHORING SYSTEM
                │                           │
                │                 ┌─────────┼─────────┐
                │                 │         │         │
                │              Courses    Media     Quiz
                │                 │         │         │
                │              Lessons    Upload   Questions
                │                 │         │         │
                │                 └─────────┼─────────┘
                │                           │
                └──────────────┬────────────┘
                               │
                         SUPABASE CLIENT
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
                AUTH        POSTGRES        STORAGE
                 │             │             │
                 │        Courses           Images
                 │        Lessons           Videos
                 │        Blocks            PDFs
                 │        Questions         Audio
                 │        Quizzes            Files
                 │        Attempts
                 │        Progress
                 │
                 └─────────────┬─────────────┘
                               │
                       EDGE FUNCTIONS
                          (optional)
```

---

# 53. Prinsip Arsitektur Biologi.id

### Content First

Konten harus dapat dibuat tanpa coding.

### Reusable Media

Media diupload sekali dan dapat digunakan berkali-kali.

### Reusable Questions

Satu soal dapat digunakan di banyak quiz.

### Draft First

Konten tidak langsung menjadi publik.

### Preview Before Publish

Guru selalu dapat melihat perspektif siswa.

### Secure by Default

Role, RLS, dan Storage Policies menentukan hak akses.

### Database untuk struktur

PostgreSQL menyimpan data relasional.

### JSONB untuk fleksibilitas

Konfigurasi content block dan jawaban kompleks menggunakan JSONB.

### Storage untuk file

PostgreSQL tidak digunakan untuk menyimpan binary file.

### Backend Custom Only When Needed

Edge Functions hanya digunakan ketika operasi benar-benar membutuhkan server-side processing.

---

# 54. Target Pengalaman Guru

Target akhir Teacher Dashboard adalah:

```text
LOGIN
  ↓
DASHBOARD
  ↓
+ MATERI
  ↓
Pilih:
  ├── Buat dari awal
  └── Upload file
  ↓
Lesson Builder
  ↓
Tambah:
  ├── Text
  ├── Image
  ├── Video
  ├── Diagram
  ├── Simulation
  ├── Activity
  └── Quiz
  ↓
AUTOSAVE
  ↓
PREVIEW
  ↓
PUBLISH
```

**Guru tidak perlu membuka Supabase Dashboard untuk pekerjaan sehari-hari.**

Supabase Dashboard hanya menjadi alat administrasi developer/admin. Guru bekerja melalui **Teacher Dashboard Biologi.id**.

---

# 55. Kesimpulan

Backend Biologi.id harus dibangun sebagai **CMS + Learning Platform**, bukan sekadar database.

Pusat pengalaman guru adalah:

> **Teacher Dashboard → Content Authoring → Media Library → Question Bank → Quiz Builder → Preview → Publish.**

Pusat pengalaman siswa adalah:

> **Course → Lesson → Interactive Content → Activity → Quiz → Feedback → Progress.**

Supabase menjadi infrastruktur di belakang kedua pengalaman tersebut:

> **Auth + PostgreSQL + Storage + RLS + Edge Functions (opsional).**

Dengan arsitektur ini, Bapak dapat menambah materi Biologi baru tanpa mengubah kode aplikasi.

Contoh:

```text
Hari ini:
Sistem Respirasi

Besok:
Sistem Ekskresi

Minggu depan:
Fotosintesis

Bulan depan:
Genetika
```

Semuanya menggunakan **mesin Biologi.id yang sama**; yang berubah adalah kontennya.
