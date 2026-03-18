import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data } = await supabase
    .from('perfiles')
    .select('receta_formato')
    .eq('id', user.id)
    .single()

  return NextResponse.json({ data: data?.receta_formato || {} })
}

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol')
    .eq('id', user.id)
    .single()

  if (perfil?.rol === 'asistente') {
    return NextResponse.json(
      { error: 'Solo los médicos pueden configurar el formato de receta' },
      { status: 403 }
    )
  }

  const fmt = await request.json()

  const { error } = await supabase
    .from('perfiles')
    .update({ receta_formato: fmt })
    .eq('id', user.id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
