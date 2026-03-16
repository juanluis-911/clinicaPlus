import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)

  // Single patient by ID
  const id = searchParams.get('id')
  if (id) {
    const { data, error } = await supabase.from('pacientes').select('*').eq('id', id).single()
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json({ data })
  }

  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20
  const offset = (page - 1) * limit

  let query = supabase
    .from('pacientes')
    .select('*, created_at', { count: 'exact' })
    .order('apellido', { ascending: true })
    .range(offset, offset + limit - 1)

  if (search) {
    query = query.or(`nombre.ilike.%${search}%,apellido.ilike.%${search}%,email.ilike.%${search}%`)
  }

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, count })
}

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase.from('perfiles').select('id, rol, medico_empleador_id').eq('id', user.id).single()
  const medicoId = perfil?.rol === 'medico' ? perfil.id : perfil?.medico_empleador_id
  if (!medicoId) return NextResponse.json({ error: 'Perfil no configurado' }, { status: 400 })

  const body = await request.json()
  const { nombre, apellido, fecha_nacimiento, telefono, email, direccion, alergias, condiciones_cronicas, medicacion_actual, notas } = body

  if (!nombre || !apellido) return NextResponse.json({ error: 'Nombre y apellido son obligatorios' }, { status: 400 })

  const { data, error } = await supabase.from('pacientes').insert({
    nombre, apellido, fecha_nacimiento: fecha_nacimiento || null,
    telefono: telefono || null, email: email || null,
    direccion: direccion || null, alergias: alergias || null,
    condiciones_cronicas: condiciones_cronicas || null,
    medicacion_actual: medicacion_actual || null,
    notas: notas || null,
    medico_id: medicoId,
    created_by: user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

export async function PUT(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const { id, ...fields } = body
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { data, error } = await supabase.from('pacientes').update(fields).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
