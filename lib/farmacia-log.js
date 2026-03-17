/**
 * Helper para insertar entradas en el log de inventario de farmacia.
 * Se usa desde API routes (server-side) con un cliente Supabase ya autenticado.
 *
 * @param {object} supabase  - Cliente Supabase (createClient o createServiceClient)
 * @param {object} entry
 * @param {string} entry.medico_id
 * @param {string} entry.producto_id
 * @param {string} entry.producto_nombre  - Nombre en el momento del movimiento
 * @param {string} entry.usuario_id
 * @param {string} entry.usuario_nombre
 * @param {'inicial'|'entrada'|'salida'|'ajuste'|'venta'} entry.tipo
 * @param {number} entry.cantidad          - Positivo = entrada, negativo = salida
 * @param {number} entry.stock_antes
 * @param {number} entry.stock_despues
 * @param {string} [entry.referencia_id]   - venta_id si tipo = 'venta'
 * @param {string} [entry.motivo]
 */
export async function logMovimientoInventario(supabase, entry) {
  const { error } = await supabase
    .from('log_inventario_farmacia')
    .insert({
      medico_id:       entry.medico_id,
      producto_id:     entry.producto_id,
      producto_nombre: entry.producto_nombre,
      usuario_id:      entry.usuario_id,
      usuario_nombre:  entry.usuario_nombre,
      tipo:            entry.tipo,
      cantidad:        entry.cantidad,
      stock_antes:     entry.stock_antes,
      stock_despues:   entry.stock_despues,
      referencia_id:   entry.referencia_id ?? null,
      motivo:          entry.motivo ?? null,
    })

  // El log no debe interrumpir el flujo principal; solo advertimos en consola
  if (error) console.error('[farmacia-log] Error al insertar movimiento:', error.message)
}
