import { supabase } from '../supabase'

/**
 * Upload file ke Supabase Storage dan catat ke tabel `media`
 */
export const uploadMediaFile = async (file, teacherId) => {
  try {
    // 1. Upload ke Supabase Storage (Bucket: 'media')
    const fileExt = file.name.split('.').pop()
    const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`
    const storagePath = `uploads/${teacherId}/${fileName}`

    const { data: storageData, error: storageError } = await supabase.storage
      .from('media')
      .upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type || 'text/plain'
      })

    if (storageError) throw storageError

    // 2. Simpan metadata ke tabel `media`
    const { data: dbData, error: dbError } = await supabase
      .from('media')
      .insert([
        {
          teacher_id: teacherId,
          file_name: file.name,
          file_type: file.type,
          storage_path: storageData.path,
          size_bytes: file.size
        }
      ])
      .select()
      .single()

    if (dbError) throw dbError
    
    return dbData
  } catch (error) {
    console.error('Error uploading media:', error)
    throw error
  }
}

/**
 * Dapatkan daftar media milik seorang guru
 */
export const getTeacherMedia = async (teacherId) => {
  try {
    const { data, error } = await supabase
      .from('media')
      .select('*')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })

    if (error) throw error
    
    return data
  } catch (error) {
    console.error('Error fetching media:', error)
    throw error
  }
}

/**
 * Dapatkan public URL dari storage path
 */
export const getPublicUrl = (storagePath) => {
  const { data } = supabase.storage
    .from('media')
    .getPublicUrl(storagePath)
    
  return data.publicUrl
}

/**
 * Hapus file media
 */
export const deleteMedia = async (mediaId, storagePath) => {
  try {
    // 1. Hapus dari Storage
    const { error: storageError } = await supabase.storage
      .from('media')
      .remove([storagePath])

    if (storageError) throw storageError

    // 2. Hapus dari Database
    const { error: dbError } = await supabase
      .from('media')
      .delete()
      .eq('id', mediaId)

    if (dbError) throw dbError
    
    return true
  } catch (error) {
    console.error('Error deleting media:', error)
    throw error
  }
}
