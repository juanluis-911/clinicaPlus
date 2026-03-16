import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Helper: verifica médico dueño
async function getMedicoOwner(supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', status: 401 }

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol, medico_empleador_id')
    .eq('id', user.id)
    .single()

  if (perfil?.rol !== 'medico' || perfil?.medico_empleador_id) {
    return { error: 'Solo el médico titular puede gestionar invitaciones', status: 403 }
  }

  return { medicoId: user.id }
}

// Obtiene la URL base de la app para construir el link de invitación
async function getBaseUrl() {
  const hdrs = await headers()
  const host = hdrs.get('host') || 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  return `${proto}://${host}`
}

// GET /api/invitaciones — lista invitaciones pendientes del médico
export async function GET() {
  const supabase = await createClient()
  const check = await getMedicoOwner(supabase)
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const { data, error } = await supabase
    .from('invitaciones')
    .select('id, rol, codigo, email, nombre, usado, created_at, expires_at')
    .eq('medico_id', check.medicoId)
    .eq('usado', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const base = await getBaseUrl()
  const invitaciones = (data || []).map(inv => ({
    ...inv,
    link: `${base}/auth/registro?invite=${inv.codigo}`,
  }))

  return NextResponse.json({ data: invitaciones })
}

// POST /api/invitaciones — crear nueva invitación
export async function POST(request) {
  const supabase = await createClient()
  const check = await getMedicoOwner(supabase)
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const { rol, email, nombre } = await request.json()
  if (!rol || !['asistente', 'medico'].includes(rol)) {
    return NextResponse.json({ error: 'Rol inválido' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('invitaciones')
    .insert({ medico_id: check.medicoId, rol, email: email || null, nombre: nombre || null })
    .select('id, rol, codigo, email, nombre, expires_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const base = await getBaseUrl()
  return NextResponse.json({
    data: { ...data, link: `${base}/auth/registro?invite=${data.codigo}` }
  })
}

// DELETE /api/invitaciones?id=UUID — cancelar invitación
export async function DELETE(request) {
  const supabase = await createClient()
  const check = await getMedicoOwner(supabase)
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

  const { error } = await supabase
    .from('invitaciones')
    .delete()
    .eq('id', id)
    .eq('medico_id', check.medicoId)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
