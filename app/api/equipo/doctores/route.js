import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/equipo/doctores
// Devuelve todos los médicos de la clínica: el dueño + médicos asociados.
// Accesible para cualquier miembro del equipo (owner, asistente, médico asociado).
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol, medico_empleador_id')
    .eq('id', user.id)
    .single()

  // Determinar el ID del dueño de la clínica
  const ownerId = (perfil?.rol === 'medico' && !perfil?.medico_empleador_id)
    ? user.id
    : perfil?.medico_empleador_id

  if (!ownerId) return NextResponse.json({ data: [] })

  // Usar service client para leer perfiles sin restricciones de RLS de equipo
  const service = createServiceClient()

  // 1. El dueño de la clínica
  const { data: owner } = await service
    .from('perfiles')
    .select('id, nombre_completo, especialidad, activo')
    .eq('id', ownerId)
    .single()

  // 2. Médicos asociados (medico + medico_empleador_id = ownerId)
  const { data: asociados } = await service
    .from('perfiles')
    .select('id, nombre_completo, especialidad, activo')
    .eq('medico_empleador_id', ownerId)
    .eq('rol', 'medico')
    .eq('activo', true)

  const doctores = [
    ...(owner ? [{ ...owner, esDueno: true }] : []),
    ...(asociados || []).map(d => ({ ...d, esDueno: false })),
  ]

  return NextResponse.json({ data: doctores })
}
