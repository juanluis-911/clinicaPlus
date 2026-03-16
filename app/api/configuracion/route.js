import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase.from('perfiles').select('rol, medico_empleador_id').eq('id', user.id).single()
  // Médico dueño → su propio ID; asistente o médico asociado → ID del dueño
  const medicoId = (perfil?.rol === 'medico' && !perfil?.medico_empleador_id)
    ? user.id
    : perfil?.medico_empleador_id

  const { data, error } = await supabase
    .from('configuracion_clinica')
    .select('*')
    .eq('id', medicoId)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase.from('perfiles').select('rol, medico_empleador_id').eq('id', user.id).single()
  if (perfil?.rol !== 'medico' || perfil?.medico_empleador_id) {
    return NextResponse.json({ error: 'Solo el médico titular puede editar la configuración' }, { status: 403 })
  }

  const body = await request.json()
  const { data, error } = await supabase
    .from('configuracion_clinica')
    .upsert({ id: user.id, ...body }, { onConflict: 'id' })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
