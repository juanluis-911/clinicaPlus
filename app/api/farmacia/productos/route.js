import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logMovimientoInventario } from '@/lib/farmacia-log'

// Helper: verifica que el usuario tenga acceso a la farmacia de su clínica
async function getFarmaciaAccess(supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', status: 401 }

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol, medico_empleador_id, atiende_farmacia, nombre_completo')
    .eq('id', user.id)
    .single()

  if (!perfil) return { error: 'Perfil no encontrado', status: 404 }

  const esMedicoDueno = perfil.rol === 'medico' && !perfil.medico_empleador_id
  const esAsistenteFarmacia = perfil.rol === 'asistente' && perfil.atiende_farmacia
  const esMedicoAsociado = perfil.rol === 'medico' && !!perfil.medico_empleador_id

  if (!esMedicoDueno && !esAsistenteFarmacia && !esMedicoAsociado) {
    return { error: 'Sin acceso a la farmacia', status: 403 }
  }

  return { userId: user.id, userName: perfil.nombre_completo, perfil, esMedicoDueno }
}

// GET /api/farmacia/productos — lista productos del inventario
export async function GET(request) {
  const supabase = await createClient()
  const access = await getFarmaciaAccess(supabase)
  if (access.error) return NextResponse.json({ error: access.error }, { status: access.status })

  const { searchParams } = new URL(request.url)
  const search = searchParams.get('search') || ''
  const categoria = searchParams.get('categoria') || ''
  const soloActivos = searchParams.get('activo') !== 'false'

  let query = supabase
    .from('productos_farmacia')
    .select('*')
    .order('nombre')

  if (soloActivos) query = query.eq('activo', true)
  if (categoria) query = query.eq('categoria', categoria)
  if (search) query = query.ilike('nombre', `%${search}%`)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}

// POST /api/farmacia/productos — crear producto (solo médico dueño)
export async function POST(request) {
  const supabase = await createClient()
  const access = await getFarmaciaAccess(supabase)
  if (access.error) return NextResponse.json({ error: access.error }, { status: access.status })

  if (!access.esMedicoDueno) {
    return NextResponse.json({ error: 'Solo el médico titular puede gestionar el inventario' }, { status: 403 })
  }

  const body = await request.json()
  const { nombre, descripcion, categoria, sku, precio, costo, stock_actual, stock_minimo, unidad } = body

  if (!nombre?.trim()) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
  if (precio == null || precio < 0) return NextResponse.json({ error: 'El precio es requerido' }, { status: 400 })

  const { data, error } = await supabase
    .from('productos_farmacia')
    .insert({
      medico_id: access.userId,
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
      categoria: categoria?.trim() || null,
      sku: sku?.trim() || null,
      precio: parseFloat(precio),
      costo: costo != null ? parseFloat(costo) : null,
      stock_actual: parseInt(stock_actual) || 0,
      stock_minimo: parseInt(stock_minimo) || 0,
      unidad: unidad?.trim() || 'pieza',
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Loguear stock inicial si > 0
  const stockInicial = parseInt(stock_actual) || 0
  if (stockInicial > 0) {
    await logMovimientoInventario(supabase, {
      medico_id:       access.userId,
      producto_id:     data.id,
      producto_nombre: data.nombre,
      usuario_id:      access.userId,
      usuario_nombre:  access.userName,
      tipo:            'inicial',
      cantidad:        stockInicial,
      stock_antes:     0,
      stock_despues:   stockInicial,
      motivo:          'Stock inicial al crear el producto',
    })
  }

  return NextResponse.json({ data }, { status: 201 })
}
