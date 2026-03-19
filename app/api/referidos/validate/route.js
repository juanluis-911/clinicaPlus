import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/referidos/validate?codigo=XXX — valida un código de referido (público, sin auth)
// Devuelve info del médico referidor para mostrar en la pantalla de registro
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const codigo = searchParams.get('codigo')
  if (!codigo) return NextResponse.json({ valid: false, error: 'Falta código' }, { status: 400 })

  // Usamos service client para poder leer sin RLS (el usuario aún no está autenticado)
  const service = createServiceClient()

  const { data: referido, error } = await service
    .from('referidos')
    .select(`
      id,
      estado,
      cancelado,
      medico_referidor_id,
      perfiles:medico_referidor_id (
        nombre_completo,
        especialidad
      )
    `)
    .eq('codigo', codigo)
    .single()

  if (error || !referido) {
    return NextResponse.json({ valid: false, error: 'Código no encontrado' })
  }

  if (referido.cancelado) {
    return NextResponse.json({ valid: false, error: 'Este link de invitación fue cancelado' })
  }

  if (referido.estado === 'registrado') {
    return NextResponse.json({ valid: false, error: 'Este link ya fue utilizado' })
  }

  return NextResponse.json({
    valid: true,
    medicoNombre:      referido.perfiles?.nombre_completo || 'Un médico',
    medicoEspecialidad: referido.perfiles?.especialidad || null,
  })
}

// POST /api/referidos/validate — marca el referido como registrado tras el signup
// Se llama desde /auth/registro después de crear la cuenta exitosamente
export async function POST(request) {
  const { codigo, medicoReferidoId } = await request.json()
  if (!codigo) return NextResponse.json({ error: 'Falta código' }, { status: 400 })

  const service = createServiceClient()

  const { error } = await service
    .from('referidos')
    .update({
      estado: 'registrado',
      medico_referido_id: medicoReferidoId || null,
    })
    .eq('codigo', codigo)
    .eq('estado', 'pendiente')
    .eq('cancelado', false)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
