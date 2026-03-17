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
    .from('antecedentes')
    .select('*')
    .eq('paciente_id', pacienteId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PUT(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('id, rol, medico_empleador_id')
    .eq('id', user.id)
    .single()

  const medicoId = perfil?.rol === 'medico' ? perfil.id : perfil?.medico_empleador_id
  if (!medicoId) return NextResponse.json({ error: 'Perfil no configurado' }, { status: 400 })

  const body = await request.json()
  const { paciente_id, ...fields } = body
  if (!paciente_id) return NextResponse.json({ error: 'paciente_id requerido' }, { status: 400 })

  // Limpiar campos vacíos a null
  const cleanFields = Object.fromEntries(
    Object.entries(fields).map(([k, v]) => [k, v === '' ? null : v])
  )

  const { data, error } = await supabase
    .from('antecedentes')
    .upsert(
      { paciente_id, medico_id: medicoId, ...cleanFields },
      { onConflict: 'paciente_id' }
    )
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
