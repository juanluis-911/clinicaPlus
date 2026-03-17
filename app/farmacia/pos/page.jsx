'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Search, Plus, Minus, Trash2, ShoppingCart, Stethoscope,
  CheckCircle, XCircle, Package, CreditCard, Banknote, ArrowLeftRight,
} from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Button from '@/components/ui/Button'
import { usePermission } from '@/hooks/usePermission'
import { useConfig } from '@/hooks/useConfig'
import { cn } from '@/lib/utils'
import PatientCombobox from '@/components/ui/PatientCombobox'

const METODOS_PAGO = [
  { value: 'efectivo',       label: 'Efectivo',       icon: Banknote       },
  { value: 'tarjeta',        label: 'Tarjeta',         icon: CreditCard     },
  { value: 'transferencia',  label: 'Transferencia',   icon: ArrowLeftRight },
]

export default function PosPage() {
  const { can } = usePermission()
  const { config } = useConfig()
  const moneda = config?.moneda || 'MXN'
  const costoConsultaDefault = config?.costo_consulta || 0

  const [productos, setProductos] = useState([])
  const [search, setSearch] = useState('')
  const [cart, setCart] = useState([])
  const [descuento, setDescuento] = useState('')
  const [metodoPago, setMetodoPago] = useState('efectivo')
  const [paciente, setPaciente] = useState(null)
  const [notas, setNotas] = useState('')
  const [processing, setProcessing] = useState(false)
  const [ticketOk, setTicketOk] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  // Tab activo en móvil: 'productos' | 'ticket'
  const [mobileTab, setMobileTab] = useState('productos')

  // Modal para agregar consulta
  const [modalConsulta, setModalConsulta] = useState(false)
  const [consultaDesc, setConsultaDesc] = useState('Consulta médica')
  const [consultaPrecio, setConsultaPrecio] = useState('')

  const fmt = useCallback((n) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda }).format(n),
  [moneda])

  useEffect(() => {
    fetch('/api/farmacia/productos?activo=true')
      .then(r => r.json())
      .then(({ data }) => setProductos(data || []))
  }, [])

  if (!can('usar_pos_farmacia')) {
    return (
      <AppLayout title="Punto de Venta">
        <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
          Sin acceso al POS de farmacia.
        </div>
      </AppLayout>
    )
  }

  const productosFiltrados = productos.filter(p =>
    !search || p.nombre.toLowerCase().includes(search.toLowerCase()) ||
    p.sku?.toLowerCase().includes(search.toLowerCase())
  )

  function addProducto(producto) {
    setCart(prev => {
      const idx = prev.findIndex(i => i.tipo === 'producto' && i.producto_id === producto.id)
      if (idx >= 0) {
        const updated = [...prev]
        updated[idx] = { ...updated[idx], cantidad: updated[idx].cantidad + 1 }
        return updated
      }
      return [...prev, {
        tipo: 'producto',
        producto_id: producto.id,
        descripcion: producto.nombre,
        unidad: producto.unidad,
        cantidad: 1,
        precio_unitario: parseFloat(producto.precio),
      }]
    })
  }

  function addConsulta() {
    const precio = parseFloat(consultaPrecio) || 0
    setCart(prev => [...prev, {
      tipo: 'consulta',
      producto_id: null,
      descripcion: consultaDesc || 'Consulta médica',
      unidad: 'servicio',
      cantidad: 1,
      precio_unitario: precio,
    }])
    setModalConsulta(false)
    setConsultaDesc('Consulta médica')
    setConsultaPrecio('')
  }

  function updateCantidad(idx, delta) {
    setCart(prev => {
      const updated = [...prev]
      const nuevaCantidad = updated[idx].cantidad + delta
      if (nuevaCantidad <= 0) return prev.filter((_, i) => i !== idx)
      updated[idx] = { ...updated[idx], cantidad: nuevaCantidad }
      return updated
    })
  }

  function removeItem(idx) {
    setCart(prev => prev.filter((_, i) => i !== idx))
  }

  function clearCart() {
    setCart([])
    setDescuento('')
    setPaciente(null)
    setNotas('')
    setMetodoPago('efectivo')
    setTicketOk(null)
    setErrorMsg('')
  }

  const subtotal = cart.reduce((acc, i) => acc + i.cantidad * i.precio_unitario, 0)
  const descuentoVal = parseFloat(descuento) || 0
  const total = Math.max(0, subtotal - descuentoVal)

  async function handleCobrar() {
    if (cart.length === 0) return
    setProcessing(true)
    setErrorMsg('')
    const res = await fetch('/api/farmacia/ventas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        items: cart.map(i => ({
          tipo: i.tipo,
          producto_id: i.producto_id,
          descripcion: i.descripcion,
          cantidad: i.cantidad,
          precio_unitario: i.precio_unitario,
        })),
        descuento: descuentoVal,
        metodo_pago: metodoPago,
        paciente_id: paciente?.id || null,
        notas: notas || null,
      }),
    })
    const json = await res.json()
    setProcessing(false)
    if (!res.ok) { setErrorMsg(json.error || 'Error al procesar la venta'); return }
    setTicketOk({ total, metodo_pago: metodoPago, items: cart.length })
    fetch('/api/farmacia/productos?activo=true')
      .then(r => r.json())
      .then(({ data }) => setProductos(data || []))
  }

  // ── Ticket de confirmación ───────────────────────────────────────────────
  if (ticketOk) {
    return (
      <AppLayout title="Punto de Venta">
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
          <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
            <CheckCircle size={32} className="text-emerald-600" />
          </div>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900">Venta completada</h2>
            <p className="text-gray-500 mt-1">
              {fmt(ticketOk.total)} · {ticketOk.items} artículo{ticketOk.items !== 1 ? 's' : ''} ·{' '}
              {METODOS_PAGO.find(m => m.value === ticketOk.metodo_pago)?.label}
            </p>
          </div>
          <Button onClick={clearCart}>Nueva venta</Button>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Punto de Venta">

      {/* ── Tab bar móvil ─────────────────────────────────────────────────── */}
      <div className="flex md:hidden rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm mb-4">
        <button
          onClick={() => setMobileTab('productos')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors',
            mobileTab === 'productos'
              ? 'text-white'
              : 'text-gray-500 hover:bg-gray-50'
          )}
          style={mobileTab === 'productos' ? { backgroundColor: 'var(--brand-600)' } : {}}
        >
          <Package size={15} />
          Productos
        </button>
        <button
          onClick={() => setMobileTab('ticket')}
          className={cn(
            'flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors relative',
            mobileTab === 'ticket'
              ? 'text-white'
              : 'text-gray-500 hover:bg-gray-50'
          )}
          style={mobileTab === 'ticket' ? { backgroundColor: 'var(--brand-600)' } : {}}
        >
          <ShoppingCart size={15} />
          Ticket
          {cart.length > 0 && (
            <span className={cn(
              'absolute top-2 right-6 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center',
              mobileTab === 'ticket' ? 'bg-white text-[var(--brand-700)]' : 'bg-[var(--brand-600)] text-white'
            )}>
              {cart.length}
            </span>
          )}
        </button>
      </div>

      {/* ── Layout principal ──────────────────────────────────────────────── */}
      <div className="flex gap-5 min-h-0 md:h-[calc(100dvh-128px)]">

        {/* ── Panel izquierdo: productos ── */}
        <div className={cn(
          'flex-1 flex flex-col gap-4 min-w-0 overflow-hidden',
          mobileTab !== 'productos' ? 'hidden md:flex' : 'flex'
        )}>

          {/* Buscador */}
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] bg-white"
            />
          </div>

          {/* Botón cobrar consulta */}
          <button
            onClick={() => { setConsultaDesc('Consulta médica'); setConsultaPrecio(String(costoConsultaDefault)); setModalConsulta(true) }}
            className="flex items-center gap-3 w-full bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 rounded-xl px-4 py-3 text-left transition-colors"
          >
            <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
              <Stethoscope size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-indigo-800">Cobrar consulta</p>
              <p className="text-xs text-indigo-500">Agrega una consulta médica al ticket</p>
            </div>
            <Plus size={16} className="text-indigo-600 flex-shrink-0" />
          </button>

          {/* Grid de productos */}
          <div className="flex-1 overflow-y-auto">
            {productosFiltrados.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-gray-400 gap-2">
                <Package size={32} className="opacity-30" />
                <p className="text-sm">{search ? 'Sin resultados' : 'No hay productos activos'}</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 pb-4">
                {productosFiltrados.map(p => {
                  const enCart = cart.find(i => i.tipo === 'producto' && i.producto_id === p.id)
                  const sinStock = p.stock_actual === 0
                  return (
                    <button
                      key={p.id}
                      onClick={() => !sinStock && addProducto(p)}
                      disabled={sinStock}
                      className={cn(
                        'relative text-left p-3 rounded-xl border-2 transition-all',
                        sinStock
                          ? 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                          : enCart
                            ? 'border-[var(--brand-400)] bg-[var(--brand-50)]'
                            : 'border-gray-200 bg-white hover:border-[var(--brand-300)] hover:bg-[var(--brand-50)]/50'
                      )}
                    >
                      {enCart && (
                        <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[var(--brand-600)] text-white text-xs flex items-center justify-center font-bold">
                          {enCart.cantidad}
                        </span>
                      )}
                      <p className="text-xs font-semibold text-gray-800 leading-tight line-clamp-2">{p.nombre}</p>
                      {p.categoria && <p className="text-[10px] text-gray-400 mt-0.5">{p.categoria}</p>}
                      <p className="text-sm font-bold text-[var(--brand-700)] mt-1.5">{fmt(p.precio)}</p>
                      <p className={cn('text-[10px] mt-0.5', sinStock ? 'text-red-500' : 'text-gray-400')}>
                        {sinStock ? 'Agotado' : `Stock: ${p.stock_actual} ${p.unidad}`}
                      </p>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Panel derecho: carrito ── */}
        <div className={cn(
          'flex flex-col bg-white rounded-2xl border border-gray-200 overflow-hidden',
          // Desktop: columna fija a la derecha
          'md:w-80 md:flex-shrink-0',
          // Móvil: ocupa todo el ancho cuando está activo
          mobileTab !== 'ticket' ? 'hidden md:flex' : 'flex flex-1'
        )}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className="text-[var(--brand-600)]" />
              <span className="font-semibold text-gray-800 text-sm">Ticket actual</span>
            </div>
            {cart.length > 0 && (
              <button onClick={clearCart} className="text-xs text-gray-400 hover:text-red-500 transition-colors">
                Limpiar
              </button>
            )}
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 gap-2 py-12">
                <ShoppingCart size={28} className="opacity-30" />
                <p className="text-xs">Agrega productos o una consulta</p>
              </div>
            ) : (
              cart.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2 px-3 py-3">
                  <div className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0',
                    item.tipo === 'consulta' ? 'bg-indigo-100' : 'bg-[var(--brand-100)]'
                  )}>
                    {item.tipo === 'consulta'
                      ? <Stethoscope size={13} className="text-indigo-600" />
                      : <Package size={13} className="text-[var(--brand-600)]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{item.descripcion}</p>
                    <p className="text-xs text-gray-400">{fmt(item.precio_unitario)}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => updateCantidad(idx, -1)}
                      className="w-6 h-6 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <Minus size={10} />
                    </button>
                    <span className="text-xs font-bold text-gray-800 w-4 text-center">{item.cantidad}</span>
                    <button
                      onClick={() => updateCantidad(idx, 1)}
                      className="w-6 h-6 rounded-lg border border-gray-300 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors"
                    >
                      <Plus size={10} />
                    </button>
                  </div>
                  <div className="text-right ml-1 min-w-[48px]">
                    <p className="text-xs font-bold text-gray-800">{fmt(item.cantidad * item.precio_unitario)}</p>
                  </div>
                  <button onClick={() => removeItem(idx)} className="text-gray-300 hover:text-red-400 transition-colors">
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-gray-100 p-4 space-y-3">

            <PatientCombobox
              label="Paciente (opcional)"
              value={paciente?.id || ''}
              onSelect={p => setPaciente(p)}
              initialPatient={paciente}
            />

            {/* Descuento */}
            <div className="flex items-center gap-2">
              <label className="text-xs text-gray-500 flex-shrink-0">Descuento</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                value={descuento}
                onChange={e => setDescuento(e.target.value)}
                className="flex-1 text-sm border border-gray-300 rounded-xl px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] text-right"
              />
            </div>

            {/* Totales */}
            <div className="space-y-1 text-sm">
              <div className="flex justify-between text-gray-500">
                <span>Subtotal</span><span>{fmt(subtotal)}</span>
              </div>
              {descuentoVal > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Descuento</span><span>- {fmt(descuentoVal)}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-gray-900 text-base pt-1 border-t border-gray-100">
                <span>Total</span><span>{fmt(total)}</span>
              </div>
            </div>

            {/* Método de pago */}
            <div className="flex gap-1.5">
              {METODOS_PAGO.map(m => {
                const Icon = m.icon
                return (
                  <button
                    key={m.value}
                    onClick={() => setMetodoPago(m.value)}
                    className={cn(
                      'flex-1 flex flex-col items-center gap-0.5 py-2 rounded-xl border text-xs font-medium transition-colors',
                      metodoPago === m.value
                        ? 'border-[var(--brand-500)] bg-[var(--brand-50)] text-[var(--brand-700)]'
                        : 'border-gray-200 bg-white text-gray-500 hover:border-[var(--brand-300)]'
                    )}
                  >
                    <Icon size={14} />
                    {m.label}
                  </button>
                )
              })}
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-xl px-3 py-2 text-xs text-red-600">
                <XCircle size={13} className="flex-shrink-0 mt-0.5" />
                {errorMsg}
              </div>
            )}

            <Button
              className="w-full"
              disabled={cart.length === 0}
              loading={processing}
              onClick={handleCobrar}
            >
              Cobrar {cart.length > 0 ? fmt(total) : ''}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Modal cobrar consulta ── */}
      {modalConsulta && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
          <div className="modal-enter bg-white w-full rounded-t-3xl sm:rounded-2xl shadow-2xl sm:max-w-sm">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 sm:hidden" aria-hidden="true">
              <div className="w-10 h-1 rounded-full bg-gray-300" />
            </div>
            <div className="px-5 pb-6 pt-4 space-y-4">
              <div className="flex items-center gap-2">
                <Stethoscope size={18} className="text-indigo-600" />
                <h2 className="font-bold text-gray-900">Cobrar consulta</h2>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="text-sm font-medium text-gray-700">Descripción</label>
                  <input
                    type="text"
                    value={consultaDesc}
                    onChange={e => setConsultaDesc(e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700">Precio</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={consultaPrecio}
                    onChange={e => setConsultaPrecio(e.target.value)}
                    className="mt-1 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
                    autoFocus
                  />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="secondary" className="flex-1" onClick={() => setModalConsulta(false)}>Cancelar</Button>
                <Button className="flex-1" onClick={addConsulta}>
                  <Plus size={13} /> Agregar
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  )
}
