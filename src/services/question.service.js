import { supabase } from '../supabase'

/**
 * Mengambil daftar soal milik guru
 */
export const getQuestions = async (teacherId, filters = {}) => {
  try {
    let query = supabase
      .from('questions')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })

    if (filters.topic) query = query.eq('topic', filters.topic)
    if (filters.cognitive_level) query = query.eq('cognitive_level', filters.cognitive_level)
    if (filters.difficulty) query = query.eq('difficulty', filters.difficulty)

    const { data, error } = await query

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching questions:', error)
    throw error
  }
}

/**
 * Menyimpan soal baru ke bank soal
 */
export const createQuestion = async (questionData) => {
  try {
    const { data, error } = await supabase
      .from('questions')
      .insert([questionData])
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error creating question:', error)
    throw error
  }
}

/**
 * Menghapus soal dari bank soal
 */
export const deleteQuestion = async (questionId) => {
  try {
    const { error } = await supabase
      .from('questions')
      .delete()
      .eq('id', questionId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error deleting question:', error)
    throw error
  }
}
