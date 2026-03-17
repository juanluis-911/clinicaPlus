import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { logMovimientoInventario } from '@/lib/farmacia-log'

async function getPosAccess(supabase) {
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

  if (!esMedicoDueno && !esAsistenteFarmacia) {
    return { error: 'Sin acceso al POS', status: 403 }
  }

  // El medico_id efectivo de la clínica (para multi-tenant)
  const medicoId = esMedicoDueno ? user.id : perfil.medico_empleador_id

  return { userId: user.id, userName: perfil.nombre_completo, medicoId }
}

// GET /api/farmacia/ventas — historial de ventas
export async function GET(request) {
  const supabase = await createClient()
  const access = await getPosAccess(supabase)
  if (access.error) return NextResponse.json({ error: access.error }, { status: access.status })

  const { searchParams } = new URL(request.url)
  const desde = searchParams.get('desde')
  const hasta = searchParams.get('hasta')
  const limit = parseInt(searchParams.get('limit') || '50')

  let query = supabase
    .from('ventas_farmacia')
    .select(`
      id, medico_id, atendido_por, paciente_id, cita_id,
      subtotal, descuento, total, metodo_pago, estado, notas, created_at,
      pacientes:paciente_id ( nombre, apellido ),
      atendido:atendido_por ( nombre_completo ),
      detalle_ventas_farmacia ( id, tipo, producto_id, descripcion, cantidad, precio_unitario, subtotal )
    `)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (desde) query = query.gte('created_at', desde)
  if (hasta) query = query.lte('created_at', hasta)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}

// POST /api/farmacia/ventas — procesar una venta en el POS
export async function POST(request) {
  const supabase = await createClient()
  const access = await getPosAccess(supabase)
  if (access.error) return NextResponse.json({ error: access.error }, { status: access.status })

  const body = await request.json()
  const { items, descuento = 0, metodo_pago = 'efectivo', paciente_id, cita_id, notas } = body

  if (!Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: 'El ticket no tiene líneas' }, { status: 400 })
  }

  // Validar items
  for (const item of items) {
    if (!item.descripcion) return NextResponse.json({ error: 'Cada línea necesita descripción' }, { status: 400 })
    if (!item.cantidad || item.cantidad <= 0) return NextResponse.json({ error: 'Cantidad inválida' }, { status: 400 })
    if (item.precio_unitario == null || item.precio_unitario < 0) {
      return NextResponse.json({ error: 'Precio inválido' }, { status: 400 })
    }
  }

  // Calcular totales
  const subtotal = items.reduce((acc, i) => acc + (i.cantidad * i.precio_unitario), 0)
  const total = Math.max(0, subtotal - parseFloat(descuento))

  // Verificar stock de productos y guardamos los datos para el log posterior
  const productItems = items.filter(i => i.tipo === 'producto' && i.producto_id)
  const productosSnap = {}   // producto_id → { nombre, stock_actual }
  for (const item of productItems) {
    const { data: prod } = await supabase
      .from('productos_farmacia')
      .select('id, nombre, stock_actual, medico_id')
      .eq('id', item.producto_id)
      .single()

    if (!prod) return NextResponse.json({ error: `Producto no encontrado: ${item.descripcion}` }, { status: 400 })
    if (prod.stock_actual < item.cantidad) {
      return NextResponse.json({
        error: `Stock insuficiente de "${prod.nombre}". Disponible: ${prod.stock_actual}`
      }, { status: 400 })
    }
    productosSnap[prod.id] = prod
  }

  // Crear la venta
  const { data: venta, error: ventaError } = await supabase
    .from('ventas_farmacia')
    .insert({
      medico_id: access.medicoId,
      atendido_por: access.userId,
      paciente_id: paciente_id || null,
      cita_id: cita_id || null,
      subtotal: parseFloat(subtotal.toFixed(2)),
      descuento: parseFloat(parseFloat(descuento).toFixed(2)),
      total: parseFloat(total.toFixed(2)),
      metodo_pago,
      notas: notas?.trim() || null,
    })
    .select()
    .single()

  if (ventaError) return NextResponse.json({ error: ventaError.message }, { status: 500 })

  // Insertar líneas del ticket
  const detalles = items.map(i => ({
    venta_id: venta.id,
    tipo: i.tipo || 'producto',
    producto_id: i.producto_id || null,
    descripcion: i.descripcion,
    cantidad: parseFloat(i.cantidad),
    precio_unitario: parseFloat(i.precio_unitario),
    subtotal: parseFloat((i.cantidad * i.precio_unitario).toFixed(2)),
  }))

  const { error: detalleError } = await supabase
    .from('detalle_ventas_farmacia')
    .insert(detalles)

  if (detalleError) {
    // Rollback manual de la venta si falla el detalle
    await supabase.from('ventas_farmacia').delete().eq('id', venta.id)
    return NextResponse.json({ error: detalleError.message }, { status: 500 })
  }

  // Descontar stock y registrar movimiento en el log
  for (const item of productItems) {
    const snap = productosSnap[item.producto_id]
    if (!snap) continue

    const cantidadInt  = parseInt(item.cantidad)
    const stockAntes   = snap.stock_actual
    const stockDespues = Math.max(0, stockAntes - cantidadInt)

    await supabase
      .from('productos_farmacia')
      .update({ stock_actual: stockDespues })
      .eq('id', item.producto_id)

    await logMovimientoInventario(supabase, {
      medico_id:       snap.medico_id,
      producto_id:     snap.id,
      producto_nombre: snap.nombre,
      usuario_id:      access.userId,
      usuario_nombre:  access.userName,
      tipo:            'venta',
      cantidad:        -cantidadInt,
      stock_antes:     stockAntes,
      stock_despues:   stockDespues,
      referencia_id:   venta.id,
      motivo:          `Venta #${venta.id.slice(0, 8)}`,
    })
  }

  return NextResponse.json({ data: venta }, { status: 201 })
}
