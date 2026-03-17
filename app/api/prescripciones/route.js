import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const pacienteId = searchParams.get('paciente_id')
  const consultaId = searchParams.get('consulta_id')

  let query = supabase
    .from('prescripciones')
    .select('*, pacientes(nombre, apellido, telefono)')
    .order('fecha', { ascending: false })

  if (pacienteId) query = query.eq('paciente_id', pacienteId)
  if (consultaId) query = query.eq('consulta_id', consultaId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase.from('perfiles').select('id, rol').eq('id', user.id).single()
  if (perfil?.rol !== 'medico') {
    return NextResponse.json({ error: 'Solo los médicos pueden crear prescripciones' }, { status: 403 })
  }

  const body = await request.json()
  const { paciente_id, consulta_id, fecha, medicamentos, instrucciones, vigencia_dias } = body

  if (!paciente_id || !medicamentos || medicamentos.length === 0) {
    return NextResponse.json({ error: 'paciente_id y medicamentos son obligatorios' }, { status: 400 })
  }

  const { data, error } = await supabase.from('prescripciones').insert({
    paciente_id,
    consulta_id: consulta_id || null,
    medico_id: user.id,
    fecha: fecha || new Date().toISOString().slice(0, 10),
    medicamentos,
    instrucciones: instrucciones || null,
    vigencia_dias: vigencia_dias || 30,
  }).select('*, pacientes(nombre, apellido, telefono)').single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}
