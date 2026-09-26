import { supabase } from '../supabase'

export const getClasses = async (teacherId) => {
  const { data, error } = await supabase
    .from('classes')
    .select(`
      *,
      assessment_schedules ( count )
    `)
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export const createClass = async (classData) => {
  const { data, error } = await supabase
    .from('classes')
    .insert([classData])
    .select()
    .single()

  if (error) throw error
  return data
}

export const updateClass = async (id, updateData) => {
  const { data, error } = await supabase
    .from('classes')
    .update(updateData)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data
}

export const deleteClass = async (id) => {
  const { error } = await supabase
    .from('classes')
    .delete()
    .eq('id', id)

  if (error) throw error
  return true
}

export const getClassMembers = async (classId) => {
  const { data, error } = await supabase
    .from('class_members')
    .select(`
      id,
      joined_at,
      students:student_id (
        id,
        nis,
        full_name
      )
    `)
    .eq('class_id', classId)

  if (error) throw error
  return data
}

export const addStudentToClass = async (classId, studentData, teacherId) => {
  // 1. Cek apakah student sudah ada berdasarkan NIS
  let studentId = null;
  const { data: existingStudent } = await supabase
    .from('students')
    .select('id')
    .eq('nis', studentData.nis)
    .single();

  if (existingStudent) {
    studentId = existingStudent.id;
  } else {
    // 2. Buat student baru
    const { data: newStudent, error: createError } = await supabase
      .from('students')
      .insert([{
        nis: studentData.nis,
        full_name: studentData.full_name,
        password: studentData.password,
        teacher_id: teacherId
      }])
      .select()
      .single();
      
    if (createError) throw createError;
    studentId = newStudent.id;
  }

  // 3. Masukkan ke class_members
  const { error: memberError } = await supabase
    .from('class_members')
    .insert([{
      class_id: classId,
      student_id: studentId
    }]);

  if (memberError && memberError.code !== '23505') { // Abaikan error duplicate (sudah masuk kelas)
    throw memberError;
  }
  
  return true;
}

export const addMultipleStudentsToClass = async (classId, studentsArray, teacherId) => {
  const results = { success: 0, failed: 0, errors: [] }
  
  for (const studentData of studentsArray) {
    try {
      if (!studentData.nis || !studentData.full_name) {
        throw new Error('Data tidak lengkap');
      }
      // Set default password to NIS if not provided
      const password = studentData.password || studentData.nis;
      
      await addStudentToClass(classId, { ...studentData, password }, teacherId);
      results.success++;
    } catch (err) {
      results.failed++;
      results.errors.push(`Gagal memproses NIS ${studentData.nis}: ${err.message}`);
    }
  }
  
  return results;
}
