import { supabase } from '../supabase'

export const getAssessments = async (teacherId) => {
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const getAssessmentById = async (id) => {
  const { data, error } = await supabase
    .from('assessments')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export const createAssessment = async (assessmentData) => {
  const { data, error } = await supabase
    .from('assessments')
    .insert([assessmentData])
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateAssessment = async (id, updateData) => {
  const { data, error } = await supabase
    .from('assessments')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteAssessment = async (id) => {
  const { error } = await supabase
    .from('assessments')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

// Data Pendukung (Kelas & Modul)
export const getClasses = async (teacherId) => {
  const { data, error } = await supabase
    .from('classes')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const getModulesForTeacher = async (teacherId) => {
  // Ambil semua courses beserta modulenya untuk guru ini
  const { data, error } = await supabase
    .from('courses')
    .select(`
      id, title,
      modules (
        id, title, order_index
      )
    `)
    .eq('teacher_id', teacherId)

  if (error) throw error
  
  // Flat map courses to a list of modules with course titles
  const flatModules = []
  data.forEach(course => {
    course.modules.sort((a, b) => a.order_index - b.order_index)
    course.modules.forEach(mod => {
      flatModules.push({
        id: mod.id,
        course_title: course.title,
        title: mod.title
      })
    })
  })
  
  return flatModules
}

export const createSchedule = async (scheduleData) => {
  const { data, error } = await supabase
    .from('assessment_schedules')
    .insert([scheduleData])
    .select()
    .single()

  if (error) throw error
  return data
}
