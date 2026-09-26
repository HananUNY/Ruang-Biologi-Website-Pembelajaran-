import { supabase } from '../supabase'
import { user } from './auth.service'

/**
 * Mendapatkan detail lengkap dari sebuah Course (termasuk Modules & Lessons yang sudah diurutkan)
 */
export const getCourseDetails = async (courseId) => {
  if (!user.value) throw new Error('User not logged in')

  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      modules (
        id,
        title,
        order_index,
        lessons (
          id,
          title,
          type,
          status,
          order_index
        )
      ),
      course_classes (
        class_id
      )
    `)
    .eq('id', courseId)
    .single()

  if (error) throw error

  // Sort modules dan lessons berdasarkan order_index
  if (data.modules) {
    data.modules.sort((a, b) => a.order_index - b.order_index)
    data.modules.forEach(module => {
      if (module.lessons) {
        module.lessons.sort((a, b) => a.order_index - b.order_index)
      }
    })
  }

  return data
}

/**
 * Update status course (misal: 'published')
 */
export const updateCourseStatus = async (courseId, status) => {
  const { data, error } = await supabase
    .from('courses')
    .update({ status })
    .eq('id', courseId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Update detail course (judul, deskripsi)
 */
export const updateCourseDetails = async (courseId, updates, classIds = []) => {
  const { data, error } = await supabase
    .from('courses')
    .update(updates)
    .eq('id', courseId)
    .select()
    .single()

  if (error) throw error

  // If updates include visibility 'class', we need to sync course_classes
  if (updates.visibility === 'class') {
    // Delete existing
    await supabase.from('course_classes').delete().eq('course_id', courseId)
    
    // Insert new
    if (classIds && classIds.length > 0) {
      const inserts = classIds.map(cid => ({
        course_id: courseId,
        class_id: cid
      }))
      const { error: insertError } = await supabase.from('course_classes').insert(inserts)
      if (insertError) throw insertError
    }
  } else if (updates.visibility === 'public') {
    // If public, clear class relations
    await supabase.from('course_classes').delete().eq('course_id', courseId)
  }

  return data
}

/**
 * Membuat modul baru di dalam sebuah course
 */
export const createModule = async (courseId, title, nextOrderIndex) => {
  const { data, error } = await supabase
    .from('modules')
    .insert([
      { course_id: courseId, title, order_index: nextOrderIndex }
    ])
    .select()
    .single()

  if (error) throw error
  // Tambahkan empty array untuk UI reactivity
  return { ...data, lessons: [] }
}

/**
 * Membuat lesson baru di dalam sebuah modul
 */
export const createLesson = async (moduleId, title, nextOrderIndex, type = 'material') => {
  const { data, error } = await supabase
    .from('lessons')
    .insert([
      { module_id: moduleId, title, order_index: nextOrderIndex, status: 'draft', type }
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Mengupdate urutan modul (Drag & Drop)
 */
export const updateModulesOrder = async (modulesArray) => {
  // Hanya ambil id dan order_index baru
  const updates = modulesArray.map((m, index) => ({
    id: m.id,
    course_id: m.course_id, // Dibutuhkan oleh Supabase jika ada FK restrictions tertentu saat upsert, tapi kita update by ID.
    title: m.title, // upsert membutuhkan kolom wajib jika tidak pakai patch berulang. 
    // Cara terbaik untuk bulk update di Supabase adalah upsert.
    order_index: index + 1
  }))

  const { error } = await supabase
    .from('modules')
    .upsert(updates)

  if (error) throw error
}

/**
 * Mengupdate urutan lesson (Drag & Drop)
 */
export const updateLessonsOrder = async (lessonsArray, moduleId) => {
  if (!lessonsArray || lessonsArray.length === 0) return
  
  const updates = lessonsArray.map((l, index) => ({
    id: l.id,
    module_id: moduleId, // Pastikan module_id benar (berfungsi juga untuk pindah modul)
    title: l.title,
    order_index: index + 1,
    status: l.status
  }))

  const { error } = await supabase
    .from('lessons')
    .upsert(updates)

  if (error) throw error
}

/**
 * Mendapatkan detail Lesson beserta blok-blok kontennya
 */
export const getLessonDetails = async (lessonId) => {
  const { data, error } = await supabase
    .from('lessons')
    .select(`
      *,
      lesson_blocks (
        id,
        type,
        content,
        order_index
      )
    `)
    .eq('id', lessonId)
    .single()

  if (error) throw error

  if (data.lesson_blocks) {
    data.lesson_blocks.sort((a, b) => a.order_index - b.order_index)
  } else {
    data.lesson_blocks = []
  }

  return data
}

/**
 * Menyimpan / Sync seluruh blok konten di sebuah lesson
 */
export const saveLessonBlocks = async (lessonId, blocksArray) => {
  // Karena ini pendekatan "sync", kita hapus blok lama dan masukkan yang baru,
  // atau kita upsert dan delete yang hilang. Untuk kemudahan MVP: Hapus lalu insert.
  
  // 1. Hapus semua block sebelumnya untuk lesson ini
  const { error: delError } = await supabase
    .from('lesson_blocks')
    .delete()
    .eq('lesson_id', lessonId)
    
  if (delError) throw delError

  if (blocksArray.length === 0) return true

  // 2. Siapkan data baru (pastikan ID baru digenerate Supabase atau gunakan ID lama jika pakai Upsert)
  const inserts = blocksArray.map((block, index) => ({
    // Kita biarkan Supabase UUID meng-generate ID baru setiap save agar mudah (karena cascade)
    lesson_id: lessonId,
    type: block.type || block.block_type || 'text', // support property lama jika masih ada
    content: block.content, // JSON
    order_index: index + 1
  }))

  // 3. Insert blocks baru
  const { error: insError } = await supabase
    .from('lesson_blocks')
    .insert(inserts)

  if (insError) throw insError
  return true
}

/**
 * Menghapus course
 */
export const deleteCourse = async (courseId) => {
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId)
    
  if (error) throw error
  return true
}

/**
 * Mendapatkan semua virtual lab (lessons dengan type='lab') beserta course asal
 */
export const getAllVirtualLabs = async () => {
  if (!user.value) throw new Error('User not logged in')

  // Supabase inner join untuk memastikan hanya mengambil lab milik course guru ini
  const { data, error } = await supabase
    .from('lessons')
    .select(`
      *,
      modules!inner (
        id,
        title,
        courses!inner (
          id,
          title,
          teacher_id
        )
      ),
      lesson_blocks (
        content
      )
    `)
    .eq('type', 'lab')
    .eq('modules.courses.teacher_id', user.value.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Mendapatkan semua virtual lab mandiri
 */
export const getIndependentVirtualLabs = async () => {
  if (!user.value) throw new Error('User not logged in')

  const { data, error } = await supabase
    .from('virtual_labs')
    .select('*')
    .eq('teacher_id', user.value.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

/**
 * Membuat virtual lab mandiri baru
 */
export const createIndependentVirtualLab = async (title) => {
  if (!user.value) throw new Error('User not logged in')

  const { data, error } = await supabase
    .from('virtual_labs')
    .insert([
      { teacher_id: user.value.id, title, status: 'draft' }
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Mendapatkan detail virtual lab mandiri
 */
export const getIndependentVirtualLab = async (labId) => {
  const { data, error } = await supabase
    .from('virtual_labs')
    .select('*')
    .eq('id', labId)
    .single()

  if (error) throw error
  return data
}

/**
 * Update virtual lab mandiri
 */
export const updateIndependentVirtualLab = async (labId, updates) => {
  const { data, error } = await supabase
    .from('virtual_labs')
    .update(updates)
    .eq('id', labId)
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Delete virtual lab mandiri
 */
export const deleteIndependentVirtualLab = async (labId) => {
  const { error } = await supabase
    .from('virtual_labs')
    .delete()
    .eq('id', labId)

  if (error) throw error
  return true
}

export const getPublicVirtualLabs = async () => {
  const { data, error } = await supabase
    .from('virtual_labs')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}
