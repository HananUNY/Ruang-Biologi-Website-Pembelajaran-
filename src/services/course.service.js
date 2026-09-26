import { supabase } from '../supabase'
import { user } from './auth.service'

/**
 * Mendapatkan semua courses yang dimiliki oleh guru yang login
 */
export const getCourses = async () => {
  if (!user.value) return []

  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      modules (
        id,
        lessons (id)
      ),
      course_classes (
        class_id
      )
    `)
    .eq('teacher_id', user.value.id)
    .order('updated_at', { ascending: false })

  if (error) throw error
  
  // Karena kita ingin count dari modules dan total lessons, kita map hasilnya
  return data.map(course => {
    const modulesCount = course.modules ? course.modules.length : 0
    const lessonsCount = course.modules 
      ? course.modules.reduce((sum, mod) => sum + (mod.lessons ? mod.lessons.length : 0), 0)
      : 0

    return {
      ...course,
      modulesCount,
      lessonsCount
    }
  })
}

/**
 * Membuat course baru
 */
export const createCourse = async (title, description) => {
  if (!user.value) throw new Error('User not logged in')

  const { data, error } = await supabase
    .from('courses')
    .insert([
      {
        title,
        description,
        teacher_id: user.value.id,
        status: 'draft',
        visibility: 'public',
        // placeholder image jika belum ada
        cover_url: 'https://images.unsplash.com/photo-1511497584788-876760111969?auto=format&fit=crop&q=80&w=400&h=250'
      }
    ])
    .select()
    .single()

  if (error) throw error
  return data
}

/**
 * Mendapatkan ringkasan metrik untuk dashboard (Courses, Lessons count)
 */
export const getDashboardStats = async () => {
  if (!user.value) return { courses: 0, lessons: 0 }

  // Count courses
  const { count: coursesCount, error: coursesError } = await supabase
    .from('courses')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', user.value.id)

  if (coursesError) throw coursesError

  // Untuk lessons, Supabase RLS idealnya membatasi akses, tapi 
  // karena ini simple query, kita bisa join atau query terpisah.
  // Untuk MVP, kita kembalikan saja course count dulu.
  
  return {
    courses: coursesCount || 0,
    lessons: 0, // Implementasi agregat lesson bisa dilakukan nanti
    questions: 0
  }
}
