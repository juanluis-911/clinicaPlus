import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Verifica que el caller sea el médico dueño
async function getMedicoOwner(supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', status: 401 }
  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol, medico_empleador_id')
    .eq('id', user.id)
    .single()
  if (perfil?.rol !== 'medico' || perfil?.medico_empleador_id) {
    return { error: 'Sin permisos', status: 403 }
  }
  return { medicoId: user.id }
}

// GET /api/equipo/[id] — datos completos de un miembro
export async function GET(request, { params }) {
  const supabase = await createClient()
  const check = await getMedicoOwner(supabase)
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const { id } = await params
  const service = createServiceClient()

  const { data, error } = await service
    .from('perfiles')
    .select(`
      id, nombre_completo, rol, especialidad, cedula_profesional,
      telefono, activo, medico_empleador_id, doctores_asignados,
      horario_hora_inicio, horario_hora_fin, horario_dias, horario_duracion_min,
      costo_consulta_propio, moneda_propia, permisos, bio, created_at
    `)
    .eq('id', id)
    .eq('medico_empleador_id', check.medicoId)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 })

  // También obtener el email de auth.users vía service client
  const { data: authUser } = await service.auth.admin.getUserById(id)
  return NextResponse.json({ data: { ...data, email: authUser?.user?.email || null } })
}

// PUT /api/equipo/[id] — actualiza configuración de un miembro
export async function PUT(request, { params }) {
  const supabase = await createClient()
  const check = await getMedicoOwner(supabase)
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const { id } = await params
  const body = await request.json()

  // Campos permitidos para actualizar
  const ALLOWED = [
    'especialidad', 'cedula_profesional', 'telefono', 'bio',
    'horario_hora_inicio', 'horario_hora_fin', 'horario_dias', 'horario_duracion_min',
    'costo_consulta_propio', 'moneda_propia',
    'permisos', 'activo', 'doctores_asignados',
  ]
  const updates = {}
  for (const key of ALLOWED) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })
  }

  // Verificar que el miembro pertenece a esta clínica (service client para bypasear RLS)
  const service = createServiceClient()
  const { data: miembro } = await service
    .from('perfiles')
    .select('id, rol')
    .eq('id', id)
    .eq('medico_empleador_id', check.medicoId)
    .single()

  if (!miembro) return NextResponse.json({ error: 'Miembro no encontrado' }, { status: 404 })

  // permisos y doctores_asignados solo aplican a asistentes
  if (miembro.rol !== 'asistente') {
    delete updates.permisos
    delete updates.doctores_asignados
  }

  // Garantizar que doctores_asignados sea un array válido
  if ('doctores_asignados' in updates) {
    updates.doctores_asignados = Array.isArray(updates.doctores_asignados)
      ? updates.doctores_asignados
      : []
  }

  const { data, error } = await service
    .from('perfiles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
