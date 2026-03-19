import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

// Solo médicos titulares (no asistentes, no médicos asociados) pueden gestionar referidos
async function getMedicoTitular(supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', status: 401 }

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol, medico_empleador_id')
    .eq('id', user.id)
    .single()

  if (perfil?.rol !== 'medico' || perfil?.medico_empleador_id) {
    return { error: 'Solo médicos titulares pueden gestionar referidos', status: 403 }
  }

  return { medicoId: user.id }
}

async function getBaseUrl() {
  const hdrs = await headers()
  const host = hdrs.get('host') || 'localhost:3000'
  const proto = host.startsWith('localhost') ? 'http' : 'https'
  return `${proto}://${host}`
}

function buildLink(base, codigo) {
  return `${base}/auth/registro?ref=${codigo}`
}

// GET /api/referidos — lista todos los referidos del médico + link personal
export async function GET() {
  const supabase = await createClient()
  const check = await getMedicoTitular(supabase)
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  // Obtener (o crear) el código de referido personal del médico
  const service = createServiceClient()
  const { data: codigoData, error: fnErr } = await service
    .rpc('get_or_create_referido_personal', { p_medico_id: check.medicoId })

  const base = await getBaseUrl()
  const linkPersonal = codigoData ? buildLink(base, codigoData) : null

  // Listar todos los referidos (con email/nombre personalizados y sus estados)
  const { data, error } = await supabase
    .from('referidos')
    .select('id, email, nombre, codigo, estado, cancelado, created_at, medico_referido_id')
    .eq('medico_referidor_id', check.medicoId)
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const referidos = (data || []).map(r => ({
    ...r,
    link: buildLink(base, r.codigo),
  }))

  // Stats rápidas
  const total       = referidos.length
  const registrados = referidos.filter(r => r.estado === 'registrado').length
  const pendientes  = referidos.filter(r => r.estado === 'pendiente' && !r.cancelado).length

  return NextResponse.json({
    data: {
      linkPersonal,
      referidos,
      stats: { total, registrados, pendientes },
    }
  })
}

// POST /api/referidos — crear invitación personalizada (con nombre/email opcional)
export async function POST(request) {
  const supabase = await createClient()
  const check = await getMedicoTitular(supabase)
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const { email, nombre } = await request.json()

  const { data, error } = await supabase
    .from('referidos')
    .insert({
      medico_referidor_id: check.medicoId,
      email: email || null,
      nombre: nombre || null,
    })
    .select('id, email, nombre, codigo, estado, created_at')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const base = await getBaseUrl()
  return NextResponse.json({
    data: { ...data, link: buildLink(base, data.codigo) }
  })
}

// DELETE /api/referidos?id=UUID — cancelar invitación personalizada pendiente
export async function DELETE(request) {
  const supabase = await createClient()
  const check = await getMedicoTitular(supabase)
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

  // Solo se pueden cancelar invitaciones personalizadas pendientes, no el link personal (sin email ni nombre)
  const { error } = await supabase
    .from('referidos')
    .update({ cancelado: true })
    .eq('id', id)
    .eq('medico_referidor_id', check.medicoId)
    .eq('estado', 'pendiente')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
