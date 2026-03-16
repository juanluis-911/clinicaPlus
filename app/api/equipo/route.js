import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Helper: verifica que el usuario sea médico dueño (no asociado)
async function getMedicoOwner(supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', status: 401 }

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol, medico_empleador_id')
    .eq('id', user.id)
    .single()

  if (perfil?.rol !== 'medico' || perfil?.medico_empleador_id) {
    return { error: 'Solo el médico titular puede gestionar el equipo', status: 403 }
  }

  return { medicoId: user.id }
}

// GET /api/equipo — lista miembros del equipo
export async function GET() {
  const supabase = await createClient()
  const check = await getMedicoOwner(supabase)
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const service = createServiceClient()
  const { data, error } = await service
    .from('perfiles')
    .select('id, nombre_completo, rol, especialidad, telefono, activo, doctores_asignados, created_at')
    .eq('medico_empleador_id', check.medicoId)
    .order('nombre_completo')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}

// PATCH /api/equipo — actualiza activo y/o doctores_asignados de un miembro
export async function PATCH(request) {
  const supabase = await createClient()
  const check = await getMedicoOwner(supabase)
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const body = await request.json()
  const { id, activo, doctores_asignados } = body
  if (!id) return NextResponse.json({ error: 'Falta id del miembro' }, { status: 400 })

  // Verificar que el miembro pertenece al médico (service client para bypasear RLS)
  const service = createServiceClient()
  const { data: miembro } = await service
    .from('perfiles')
    .select('id, rol')
    .eq('id', id)
    .eq('medico_empleador_id', check.medicoId)
    .single()

  if (!miembro) return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 })

  const updates = {}
  if (activo !== undefined) updates.activo = activo
  if (doctores_asignados !== undefined && miembro.rol === 'asistente') {
    updates.doctores_asignados = Array.isArray(doctores_asignados) ? doctores_asignados : []
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })
  }

  const { data, error } = await service
    .from('perfiles')
    .update(updates)
    .eq('id', id)
    .select('id, nombre_completo, activo, doctores_asignados')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
