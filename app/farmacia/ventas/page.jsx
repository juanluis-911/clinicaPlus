'use client'

import { useState, useEffect } from 'react'
import { History, ChevronDown, ChevronRight, Package, Stethoscope, Banknote, CreditCard, ArrowLeftRight } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Card, { CardBody } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { useConfig } from '@/hooks/useConfig'
import { cn } from '@/lib/utils'

const METODO_LABEL = {
  efectivo: { label: 'Efectivo', icon: Banknote },
  tarjeta: { label: 'Tarjeta', icon: CreditCard },
  transferencia: { label: 'Transferencia', icon: ArrowLeftRight },
}

export default function VentasPage() {
  const { config } = useConfig()
  const moneda = config?.moneda || 'MXN'

  const [ventas, setVentas] = useState([])
  const [loading, setLoading] = useState(true)
  const [desde, setDesde] = useState(() => {
    const d = new Date()
    d.setDate(1)
    return d.toISOString().slice(0, 10)
  })
  const [hasta, setHasta] = useState(() => new Date().toISOString().slice(0, 10))
  const [expandido, setExpandido] = useState(null)

  const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda }).format(n)

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams({
      desde: desde + 'T00:00:00Z',
      hasta: hasta + 'T23:59:59Z',
    })
    fetch(`/api/farmacia/ventas?${params}`)
      .then(r => r.json())
      .then(({ data }) => { setVentas(data || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [desde, hasta])

  const totalPeriodo = ventas
    .filter(v => v.estado === 'completada')
    .reduce((a, v) => a + parseFloat(v.total || 0), 0)

  const ventasCompletadas = ventas.filter(v => v.estado === 'completada').length

  function formatFecha(iso) {
    return new Date(iso).toLocaleString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  return (
    <AppLayout title="Historial de Ventas">
      <div className="space-y-5 max-w-4xl mx-auto">

        {/* Filtros de fecha */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={e => setDesde(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-500">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={e => setHasta(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
        </div>

        {/* Resumen del período */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500">Ventas completadas</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{ventasCompletadas}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500">Ingresos del período</p>
              <p className="text-2xl font-bold text-emerald-700 mt-1">{fmt(totalPeriodo)}</p>
            </div>
            <div className="bg-white border border-gray-200 rounded-xl p-4">
              <p className="text-xs text-gray-500">Ticket promedio</p>
              <p className="text-2xl font-bold text-sky-700 mt-1">
                {ventasCompletadas > 0 ? fmt(totalPeriodo / ventasCompletadas) : fmt(0)}
              </p>
            </div>
          </div>
        )}

        {/* Lista de ventas */}
        {loading ? (
          <PageSpinner />
        ) : ventas.length === 0 ? (
          <Card>
            <CardBody className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
              <History size={40} className="opacity-30" />
              <p className="text-sm">No hay ventas en el período seleccionado.</p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-2">
            {ventas.map(venta => {
              const abierto = expandido === venta.id
              const metodo = METODO_LABEL[venta.metodo_pago] || { label: venta.metodo_pago }
              const MetodoIcon = metodo.icon
              const pacienteNombre = venta.pacientes
                ? `${venta.pacientes.nombre} ${venta.pacientes.apellido}`
                : null

              return (
                <div
                  key={venta.id}
                  className="bg-white border border-gray-200 rounded-xl overflow-hidden"
                >
                  {/* Cabecera de la venta */}
                  <button
                    onClick={() => setExpandido(abierto ? null : venta.id)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left"
                  >
                    {abierto ? <ChevronDown size={16} className="text-gray-400 flex-shrink-0" /> : <ChevronRight size={16} className="text-gray-400 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-gray-900">{fmt(venta.total)}</span>
                        {MetodoIcon && <MetodoIcon size={13} className="text-gray-400" />}
                        <span className="text-xs text-gray-500">{metodo.label}</span>
                        {pacienteNombre && (
                          <span className="text-xs text-sky-600 truncate">· {pacienteNombre}</span>
                        )}
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatFecha(venta.created_at)}
                        {venta.atendido && (
                          <span className="ml-2">· {venta.atendido.nombre_completo}</span>
                        )}
                      </p>
                    </div>
                    <Badge color={venta.estado === 'completada' ? 'emerald' : 'gray'}>
                      {venta.estado === 'completada' ? 'Completada' : 'Cancelada'}
                    </Badge>
                  </button>

                  {/* Detalle expandido */}
                  {abierto && (
                    <div className="border-t border-gray-100 px-4 pb-4 pt-3">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-xs text-gray-400 border-b border-gray-100">
                            <th className="text-left pb-2 font-medium">Concepto</th>
                            <th className="text-center pb-2 font-medium">Cant.</th>
                            <th className="text-right pb-2 font-medium">P. Unit.</th>
                            <th className="text-right pb-2 font-medium">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                          {(venta.detalle_ventas_farmacia || []).map(d => (
                            <tr key={d.id}>
                              <td className="py-1.5 flex items-center gap-1.5">
                                {d.tipo === 'consulta'
                                  ? <Stethoscope size={12} className="text-indigo-500 flex-shrink-0" />
                                  : <Package size={12} className="text-sky-500 flex-shrink-0" />}
                                <span className={cn('text-gray-800', d.tipo === 'consulta' && 'italic')}>{d.descripcion}</span>
                              </td>
                              <td className="py-1.5 text-center text-gray-500">{d.cantidad}</td>
                              <td className="py-1.5 text-right text-gray-500">{fmt(d.precio_unitario)}</td>
                              <td className="py-1.5 text-right font-medium text-gray-800">{fmt(d.subtotal)}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          {parseFloat(venta.descuento) > 0 && (
                            <tr className="text-xs text-emerald-600">
                              <td colSpan={3} className="pt-2 text-right">Descuento</td>
                              <td className="pt-2 text-right">- {fmt(venta.descuento)}</td>
                            </tr>
                          )}
                          <tr className="font-bold text-gray-900">
                            <td colSpan={3} className="pt-2 text-right border-t border-gray-100">Total</td>
                            <td className="pt-2 text-right border-t border-gray-100">{fmt(venta.total)}</td>
                          </tr>
                        </tfoot>
                      </table>
                      {venta.notas && (
                        <p className="text-xs text-gray-400 mt-2 italic">Nota: {venta.notas}</p>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
