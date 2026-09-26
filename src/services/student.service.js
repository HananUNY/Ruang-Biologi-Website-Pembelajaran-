import { supabase } from '../supabase'

// Fungsi login khusus siswa menggunakan NIS dan Nama Lengkap
export const loginStudent = async (nis, fullName) => {
  const { data, error } = await supabase
    .from('students')
    .select('id, nis, full_name')
    .eq('nis', nis)
    .ilike('full_name', fullName) // ilike for case-insensitive
    .single()

  if (error || !data) throw new Error('NIS atau Nama Lengkap salah')
  
  // Simpan sesi di localStorage
  localStorage.setItem('student_session', JSON.stringify({
    user: {
      id: data.id,
      nis: data.nis,
      email: data.nis + '@siswa.local', // Dummy email
      user_metadata: { full_name: data.full_name, role: 'student' }
    }
  }))
  
  return { user: data }
}

// Fungsi getSession untuk siswa
export const getStudentSession = () => {
  const sessionData = localStorage.getItem('student_session')
  return sessionData ? JSON.parse(sessionData) : null
}

export const logoutStudent = () => {
  localStorage.removeItem('student_session')
}

// Progress Tracking via LocalStorage
export const markLessonComplete = (studentId, lessonId) => {
  const key = `progress_${studentId}`
  const progress = JSON.parse(localStorage.getItem(key) || '[]')
  if (!progress.includes(lessonId)) {
    progress.push(lessonId)
    localStorage.setItem(key, JSON.stringify(progress))
  }
}

export const getCompletedLessons = (studentId) => {
  const key = `progress_${studentId}`
  return JSON.parse(localStorage.getItem(key) || '[]')
}

// Mendapatkan daftar kelas yang diikuti oleh siswa
export const getMyClasses = async (studentId) => {
  const { data, error } = await supabase
    .from('class_members')
    .select(`
      id,
      joined_at,
      classes (
        id,
        name,
        profiles (
          full_name
        )
      )
    `)
    .eq('student_id', studentId)

  if (error) throw error
  
  return data.map(item => ({
    memberId: item.id,
    joinedAt: item.joined_at,
    classId: item.classes?.id,
    className: item.classes?.name,
    teacherName: item.classes?.profiles?.full_name || 'Guru'
  }))
}

// Mendapatkan daftar courses yang bisa diakses oleh siswa (public + class assigned)
export const getMyCourses = async (studentId) => {
  const myClasses = await getMyClasses(studentId)
  const classIds = myClasses.map(c => c.classId)

  // 1. Dapatkan Public Courses (dan yang visibility-nya null karena backward compatibility)
  const { data: publicCourses, error: pError } = await supabase
    .from('courses')
    .select('*, profiles (full_name)')
    .eq('status', 'published')
    .or('visibility.eq.public,visibility.is.null')

  if (pError) throw pError

  // 2. Dapatkan Class Courses
  let classCourses = []
  if (classIds.length > 0) {
    const { data: ccData, error: ccError } = await supabase
      .from('course_classes')
      .select('courses(*, profiles(full_name))')
      .in('class_id', classIds)

    if (ccError) throw ccError
    // Extract courses and filter by published
    classCourses = ccData.map(cc => cc.courses).filter(c => c && c.status === 'published')
  }

  // Gabungkan dan hapus duplikat (kalau ada course yang public sekaligus di-assign ke kelas)
  const allCourses = [...publicCourses, ...classCourses]
  const uniqueCoursesMap = new Map()
  allCourses.forEach(c => {
    if (c && c.id && !uniqueCoursesMap.has(c.id)) {
      uniqueCoursesMap.set(c.id, {
        id: c.id,
        title: c.title,
        description: c.description,
        cover_url: c.cover_url,
        teacherName: c.profiles?.full_name || 'Guru'
      })
    }
  })

  return Array.from(uniqueCoursesMap.values())
}

// Mendapatkan daftar tugas/ujian (jadwal) untuk siswa berdasarkan kelas yang diikutinya
export const getMyAssessments = async (studentId) => {
  const myClasses = await getMyClasses(studentId)
  const classIds = myClasses.map(c => c.classId)
  
  if (classIds.length === 0) return []

  const { data, error } = await supabase
    .from('assessment_schedules')
    .select(`
      id,
      start_time,
      end_time,
      classes ( name ),
      assessments (
        id,
        title,
        type
      )
    `)
    .in('class_id', classIds)
    
  if (error) throw error
  return data
}
