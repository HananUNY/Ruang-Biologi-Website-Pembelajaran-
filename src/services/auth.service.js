import { ref } from 'vue'
import { supabase } from '../supabase'

export const user = ref(null)
export const isLoading = ref(true)

export const initAuthListener = () => {
  // Listen for auth changes
  supabase.auth.onAuthStateChange((_event, session) => {
    user.value = session?.user ?? null
  })
}

// Function used by router to wait for initial session determination
export const getSession = async () => {
  const { data: { session } } = await supabase.auth.getSession()
  user.value = session?.user ?? null
  return session
}

export const login = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password
  })
  if (error) throw error
  return data
}

export const logout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const register = async (email, password, role = 'student', fullName = '') => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: role,
        full_name: fullName
      }
    }
  })
  
  if (error) throw error
  
  // Masukkan data tambahan profil secara manual (kalau error RLS diabaikan di sisi frontend, tetap bisa login)
  if (data?.user) {
    const { error: profileError } = await supabase.from('profiles').insert({
      id: data.user.id,
      role: role,
      full_name: fullName
    })
    
    if (profileError && profileError.code !== 'PGRST204') {
      console.warn('Pastikan RLS table profiles memperbolehkan user baru menyisipkan data.', profileError)
    }
  }

  return data
}
