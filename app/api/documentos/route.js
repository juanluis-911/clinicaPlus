import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const BUCKET = 'documentos-pacientes'

export async function GET(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const pacienteId = searchParams.get('paciente_id')
  if (!pacienteId) return NextResponse.json({ error: 'paciente_id requerido' }, { status: 400 })

  const { data, error } = await supabase
    .from('documentos')
    .select('*')
    .eq('paciente_id', pacienteId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase.from('perfiles').select('id, rol, medico_empleador_id').eq('id', user.id).single()
  const medicoId = perfil?.rol === 'medico' ? perfil.id : perfil?.medico_empleador_id

  const body = await request.json()
  const { paciente_id, nombre, tipo, url, tamano } = body

  if (!paciente_id || !nombre || !url) {
    return NextResponse.json({ error: 'paciente_id, nombre y url son obligatorios' }, { status: 400 })
  }

  const { data, error } = await supabase.from('documentos').insert({
    paciente_id, nombre, tipo: tipo || 'otro', url,
    tamano: tamano || null, subido_por: user.id,
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

export async function DELETE(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })

  const { data: doc } = await supabase.from('documentos').select('url').eq('id', id).single()
  if (doc?.url) {
    const service = createServiceClient()
    await service.storage.from(BUCKET).remove([doc.url])
  }

  const { error } = await supabase.from('documentos').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
