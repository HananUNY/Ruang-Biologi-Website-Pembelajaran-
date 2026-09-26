import { supabase } from '../supabase'
import { user } from './auth.service'

/**
 * Memastikan profil pengguna ada di tabel `profiles`.
 * Jika belum ada, otomatis buatkan dengan role 'teacher'.
 */
export const ensureProfileExists = async () => {
  if (!user.value) return null

  // Cek apakah profil ada
  const { data: profile, error: getError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.value.id)
    .single()

  if (getError && getError.code === 'PGRST116') {
    // Tidak ditemukan (0 rows), buat baru!
    const { data: newProfile, error: insertError } = await supabase
      .from('profiles')
      .insert([
        { 
          id: user.value.id, 
          role: 'teacher', 
          full_name: user.value.email.split('@')[0] // Nama default dari email
        }
      ])
      .select()
      .single()
      
    if (insertError) throw insertError
    return newProfile
  }

  if (getError) throw getError
  return profile
}
