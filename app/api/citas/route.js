import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const desde    = searchParams.get('desde')
  const hasta    = searchParams.get('hasta')
  const estado   = searchParams.get('estado')
  const pacienteId = searchParams.get('paciente_id')
  const medicoId = searchParams.get('medico_id')   // filtro por doctor

  let query = supabase
    .from('citas')
    .select('*, pacientes(nombre, apellido, telefono, email)')
    .order('fecha_hora', { ascending: true })

  if (desde)     query = query.gte('fecha_hora', desde)
  if (hasta)     query = query.lte('fecha_hora', hasta)
  if (estado)    query = query.eq('estado', estado)
  if (pacienteId) query = query.eq('paciente_id', pacienteId)
  if (medicoId)  query = query.eq('medico_id', medicoId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('id, rol, medico_empleador_id, doctores_asignados')
    .eq('id', user.id)
    .single()

  // Clínica efectiva (para pacientes compartidos)
  const efectivoId = (perfil?.rol === 'medico' && !perfil?.medico_empleador_id)
    ? perfil.id
    : perfil?.medico_empleador_id
  if (!efectivoId) return NextResponse.json({ error: 'Perfil no configurado' }, { status: 400 })

  const body = await request.json()
  const { paciente_id, fecha_hora, duracion_minutos, tipo, estado, notas, medico_id } = body

  if (!paciente_id || !fecha_hora) {
    return NextResponse.json({ error: 'paciente_id y fecha_hora son obligatorios' }, { status: 400 })
  }

  // Prioridad: medico_id del body → primer doctor asignado al asistente → dueño de la clínica
  const doctorId = medico_id
    || perfil?.doctores_asignados?.[0]
    || efectivoId

  const { data, error } = await supabase.from('citas').insert({
    paciente_id, fecha_hora,
    duracion_minutos: duracion_minutos || 30,
    tipo:    tipo    || 'consulta',
    estado:  estado  || 'programada',
    notas:   notas   || null,
    medico_id: doctorId,
    creado_por: user.id,
  }).select('*, pacientes(nombre, apellido)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabase.from('recordatorios').insert({ cita_id: data.id, tipo: 'email', estado: 'pendiente' })

  return NextResponse.json({ data }, { status: 201 })
}

export async function PUT(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const { id, ...fields } = body
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { data, error } = await supabase.from('citas').update(fields).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { error } = await supabase.from('citas').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
