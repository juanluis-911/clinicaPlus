import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logMovimientoInventario } from '@/lib/farmacia-log'

// Sólo el médico dueño puede registrar movimientos manuales
async function getDuenoAccess(supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', status: 401 }

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol, medico_empleador_id, nombre_completo')
    .eq('id', user.id)
    .single()

  if (perfil?.rol !== 'medico' || perfil?.medico_empleador_id) {
    return { error: 'Solo el médico titular puede ajustar el inventario', status: 403 }
  }

  return { userId: user.id, userName: perfil.nombre_completo }
}

// Cualquier usuario con acceso a farmacia puede leer el log
async function getFarmaciaReadAccess(supabase) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado', status: 401 }

  const { data: perfil } = await supabase
    .from('perfiles')
    .select('rol, medico_empleador_id, atiende_farmacia')
    .eq('id', user.id)
    .single()

  const esMedico = perfil?.rol === 'medico'
  const esAsistenteFarmacia = perfil?.rol === 'asistente' && perfil?.atiende_farmacia

  if (!esMedico && !esAsistenteFarmacia) {
    return { error: 'Sin acceso a la farmacia', status: 403 }
  }

  return { userId: user.id }
}

// ─── GET /api/farmacia/movimientos ────────────────────────────────────────────
// Parámetros opcionales: producto_id, tipo, desde, hasta, limit
export async function GET(request) {
  const supabase = await createClient()
  const access = await getFarmaciaReadAccess(supabase)
  if (access.error) return NextResponse.json({ error: access.error }, { status: access.status })

  const { searchParams } = new URL(request.url)
  const producto_id = searchParams.get('producto_id')
  const tipo        = searchParams.get('tipo')
  const desde       = searchParams.get('desde')
  const hasta       = searchParams.get('hasta')
  const limit       = Math.min(parseInt(searchParams.get('limit') || '100'), 500)

  let query = supabase
    .from('log_inventario_farmacia')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (producto_id) query = query.eq('producto_id', producto_id)
  if (tipo)        query = query.eq('tipo', tipo)
  if (desde)       query = query.gte('created_at', desde)
  if (hasta)       query = query.lte('created_at', hasta)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}

// ─── POST /api/farmacia/movimientos ───────────────────────────────────────────
// Body: { producto_id, tipo, cantidad, motivo }
// tipo: 'entrada' | 'salida' | 'ajuste'
// cantidad: siempre positivo (la dirección la define el tipo)
export async function POST(request) {
  const supabase = await createClient()
  const access = await getDuenoAccess(supabase)
  if (access.error) return NextResponse.json({ error: access.error }, { status: access.status })

  const body = await request.json()
  const { producto_id, tipo, cantidad, motivo } = body

  // Validaciones
  if (!producto_id)                   return NextResponse.json({ error: 'Falta producto_id' }, { status: 400 })
  if (!['entrada', 'salida', 'ajuste'].includes(tipo))
    return NextResponse.json({ error: 'Tipo inválido. Usa: entrada, salida, ajuste' }, { status: 400 })
  if (!cantidad || parseInt(cantidad) <= 0)
    return NextResponse.json({ error: 'La cantidad debe ser mayor a 0' }, { status: 400 })

  const cantidadInt = parseInt(cantidad)

  // Leer producto actual
  const { data: producto, error: prodError } = await supabase
    .from('productos_farmacia')
    .select('id, nombre, stock_actual, medico_id')
    .eq('id', producto_id)
    .single()

  if (prodError || !producto) return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })

  // Calcular delta y nuevo stock según tipo
  const delta = tipo === 'salida' ? -cantidadInt : cantidadInt
  const stockAntes  = producto.stock_actual
  const stockDespues = Math.max(0, stockAntes + delta)

  if (tipo === 'salida' && cantidadInt > stockAntes) {
    return NextResponse.json({
      error: `Stock insuficiente. Disponible: ${stockAntes}`
    }, { status: 400 })
  }

  // Actualizar stock
  const { error: updateError } = await supabase
    .from('productos_farmacia')
    .update({ stock_actual: stockDespues })
    .eq('id', producto_id)

  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 })

  // Registrar en el log
  await logMovimientoInventario(supabase, {
    medico_id:       producto.medico_id,
    producto_id:     producto.id,
    producto_nombre: producto.nombre,
    usuario_id:      access.userId,
    usuario_nombre:  access.userName,
    tipo,
    cantidad:        delta,
    stock_antes:     stockAntes,
    stock_despues:   stockDespues,
    motivo:          motivo?.trim() || null,
  })

  return NextResponse.json({
    data: {
      producto_id,
      tipo,
      cantidad: delta,
      stock_antes:   stockAntes,
      stock_despues: stockDespues,
    }
  }, { status: 201 })
}
