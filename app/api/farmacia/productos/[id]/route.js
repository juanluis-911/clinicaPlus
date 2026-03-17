import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

async function getFarmaciaDueno(supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', status: 401 }

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol, medico_empleador_id')
    .eq('id', user.id)
    .single()

  if (perfil?.rol !== 'medico' || perfil?.medico_empleador_id) {
    return { error: 'Solo el médico titular puede gestionar el inventario', status: 403 }
  }

  return { userId: user.id }
}

// GET /api/farmacia/productos/[id]
export async function GET(request, { params }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { id } = await params
  const { data, error } = await supabase
    .from('productos_farmacia')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
  return NextResponse.json({ data })
}

// PATCH /api/farmacia/productos/[id]
export async function PATCH(request, { params }) {
  const supabase = await createClient()
  const check = await getFarmaciaDueno(supabase)
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const { id } = await params
  const body = await request.json()

  const ALLOWED = ['nombre', 'descripcion', 'categoria', 'sku', 'precio', 'costo',
    'stock_actual', 'stock_minimo', 'unidad', 'activo']
  const updates = {}
  for (const key of ALLOWED) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'Sin cambios' }, { status: 400 })
  }

  if ('precio' in updates) updates.precio = parseFloat(updates.precio)
  if ('costo' in updates) updates.costo = updates.costo != null ? parseFloat(updates.costo) : null
  if ('stock_actual' in updates) updates.stock_actual = parseInt(updates.stock_actual)
  if ('stock_minimo' in updates) updates.stock_minimo = parseInt(updates.stock_minimo)

  const { data, error } = await supabase
    .from('productos_farmacia')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// DELETE /api/farmacia/productos/[id]
export async function DELETE(request, { params }) {
  const supabase = await createClient()
  const check = await getFarmaciaDueno(supabase)
  if (check.error) return NextResponse.json({ error: check.error }, { status: check.status })

  const { id } = await params
  const { error } = await supabase
    .from('productos_farmacia')
    .update({ activo: false })
    .eq('id', id)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
