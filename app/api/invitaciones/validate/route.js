import { createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// GET /api/invitaciones/validate?codigo=CODE
// Endpoint público (sin auth) — valida un código de invitación
export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const codigo = searchParams.get('codigo')
  if (!codigo) return NextResponse.json({ valid: false, error: 'Falta código' }, { status: 400 })

  const service = createServiceClient()

  const { data: inv, error } = await service
    .from('invitaciones')
    .select('id, rol, medico_id, email, nombre, usado, expires_at')
    .eq('codigo', codigo)
    .single()

  if (error || !inv) return NextResponse.json({ valid: false, error: 'Invitación no encontrada' })
  if (inv.usado) return NextResponse.json({ valid: false, error: 'Esta invitación ya fue usada' })
  if (new Date(inv.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, error: 'Esta invitación ha expirado' })
  }

  // Obtener nombre del médico dueño
  const { data: medico } = await service
    .from('perfiles')
    .select('nombre_completo, especialidad')
    .eq('id', inv.medico_id)
    .single()

  return NextResponse.json({
    valid: true,
    rol: inv.rol,
    medico_id: inv.medico_id,
    medico_nombre: medico?.nombre_completo || '',
    medico_especialidad: medico?.especialidad || '',
    email: inv.email || '',
    nombre: inv.nombre || '',
  })
}

// POST /api/invitaciones/validate — marca la invitación como usada (tras registro exitoso)
export async function POST(request) {
  const { codigo } = await request.json()
  if (!codigo) return NextResponse.json({ ok: false }, { status: 400 })

  const service = createServiceClient()

  const { error } = await service
    .from('invitaciones')
    .update({ usado: true })
    .eq('codigo', codigo)
    .eq('usado', false)

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
