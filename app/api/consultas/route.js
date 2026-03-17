import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const pacienteId = searchParams.get('paciente_id')
  if (!pacienteId) return NextResponse.json({ error: 'paciente_id requerido' }, { status: 400 })

  const { data, error } = await supabase
    .from('consultas')
    .select('*')
    .eq('paciente_id', pacienteId)
    .order('fecha', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const { signos_vitales, ...consultaFields } = body

  // Limpiar campos vacíos de la consulta
  const cleanConsulta = Object.fromEntries(
    Object.entries(consultaFields).map(([k, v]) => [k, v === '' ? null : v])
  )

  const { data: consulta, error } = await supabase
    .from('consultas')
    .insert({ ...cleanConsulta, medico_id: user.id, creado_por: user.id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Insertar signos vitales si se proporcionaron
  if (signos_vitales) {
    const cleanSV = Object.fromEntries(
      Object.entries(signos_vitales).filter(([, v]) => v !== '' && v !== null && v !== undefined)
    )
    if (Object.keys(cleanSV).length > 0) {
      await supabase.from('signos_vitales').insert({
        ...cleanSV,
        paciente_id: consultaFields.paciente_id,
        consulta_id: consulta.id,
        fecha: consultaFields.fecha || new Date().toISOString().slice(0, 10),
        medico_id: user.id,
        creado_por: user.id,
      })
    }
  }

  return NextResponse.json({ data: consulta }, { status: 201 })
}

export async function PUT(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id, ...fields } = await request.json()
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const cleanFields = Object.fromEntries(
    Object.entries(fields).map(([k, v]) => [k, v === '' ? null : v])
  )

  const { data, error } = await supabase
    .from('consultas')
    .update(cleanFields)
    .eq('id', id)
    .select()
    .single()

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

  const { error } = await supabase.from('consultas').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
