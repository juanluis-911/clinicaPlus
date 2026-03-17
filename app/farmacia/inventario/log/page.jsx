'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  History, PackagePlus, PackageMinus, RefreshCw, ShoppingCart, Package2,
  ArrowLeft, ArrowUp, ArrowDown, Search,
} from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Card, { CardBody } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { cn } from '@/lib/utils'

// ── Configuración visual por tipo ────────────────────────────────────────────
const TIPO_CONFIG = {
  inicial: {
    label:     'Stock inicial',
    icon:      Package2,
    bg:        'bg-gray-100',
    iconColor: 'text-gray-500',
    badge:     'gray',
    signo:     '+',
    deltaColor:'text-gray-600',
    pillOn:    'bg-gray-100 text-gray-700 border-gray-300',
    pillOff:   'bg-white text-gray-400 border-gray-200',
  },
  entrada: {
    label:     'Entrada',
    icon:      PackagePlus,
    bg:        'bg-emerald-100',
    iconColor: 'text-emerald-600',
    badge:     'emerald',
    signo:     '+',
    deltaColor:'text-emerald-700',
    pillOn:    'bg-emerald-50 text-emerald-700 border-emerald-300',
    pillOff:   'bg-white text-gray-400 border-gray-200',
  },
  salida: {
    label:     'Salida',
    icon:      PackageMinus,
    bg:        'bg-red-100',
    iconColor: 'text-red-500',
    badge:     'red',
    signo:     '−',
    deltaColor:'text-red-600',
    pillOn:    'bg-red-50 text-red-600 border-red-300',
    pillOff:   'bg-white text-gray-400 border-gray-200',
  },
  ajuste: {
    label:     'Ajuste',
    icon:      RefreshCw,
    bg:        'bg-sky-100',
    iconColor: 'text-sky-600',
    badge:     'sky',
    signo:     null,
    deltaColor:'text-sky-700',
    pillOn:    'bg-sky-50 text-sky-700 border-sky-300',
    pillOff:   'bg-white text-gray-400 border-gray-200',
  },
  venta: {
    label:     'Venta',
    icon:      ShoppingCart,
    bg:        'bg-amber-100',
    iconColor: 'text-amber-600',
    badge:     'amber',
    signo:     '−',
    deltaColor:'text-amber-700',
    pillOn:    'bg-amber-50 text-amber-700 border-amber-300',
    pillOff:   'bg-white text-gray-400 border-gray-200',
  },
}

const TODOS_LOS_TIPOS = new Set(Object.keys(TIPO_CONFIG))

function TipoIcon({ tipo }) {
  const cfg = TIPO_CONFIG[tipo] || TIPO_CONFIG.ajuste
  const Icon = cfg.icon
  return (
    <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', cfg.bg)}>
      <Icon size={15} className={cfg.iconColor} />
    </div>
  )
}

function DeltaBadge({ tipo, cantidad }) {
  const cfg = TIPO_CONFIG[tipo] || TIPO_CONFIG.ajuste
  const signo = cfg.signo ?? (cantidad >= 0 ? '+' : '−')
  const abs   = Math.abs(cantidad)
  return (
    <span className={cn('text-sm font-bold tabular-nums', cfg.deltaColor)}>
      {signo}{abs}
    </span>
  )
}

export default function LogInventarioPage() {
  const searchParams  = useSearchParams()
  const productoIdUrl = searchParams.get('producto_id') || ''
  const nombreUrl     = searchParams.get('nombre') || ''

  const [movimientos, setMovimientos] = useState([])
  const [loading, setLoading]         = useState(true)
  const [productos, setProductos]     = useState([])

  // Filtros
  const [filtroProducto, setFiltroProducto] = useState(productoIdUrl)
  const [tiposActivos,   setTiposActivos]   = useState(TODOS_LOS_TIPOS)
  const [filtroUsuario,  setFiltroUsuario]  = useState('')
  const [desde,          setDesde]          = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().slice(0, 10)
  })
  const [hasta, setHasta]       = useState(() => new Date().toISOString().slice(0, 10))
  const [busqueda, setBusqueda] = useState('')

  // Stats
  const [stats, setStats] = useState({ entradas: 0, salidas: 0, ventas: 0, ajustes: 0 })

  const cargarMovimientos = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams({ limit: '200' })
    if (filtroProducto) params.set('producto_id', filtroProducto)
    if (desde)          params.set('desde', desde + 'T00:00:00Z')
    if (hasta)          params.set('hasta', hasta + 'T23:59:59Z')

    const res = await fetch(`/api/farmacia/movimientos?${params}`)
    const { data } = await res.json()
    const lista = data || []
    setMovimientos(lista)

    setStats({
      entradas: lista.filter(m => m.tipo === 'entrada' || m.tipo === 'inicial').reduce((a, m) => a + Math.abs(m.cantidad), 0),
      salidas:  lista.filter(m => m.tipo === 'salida').reduce((a, m) => a + Math.abs(m.cantidad), 0),
      ventas:   lista.filter(m => m.tipo === 'venta').reduce((a, m) => a + Math.abs(m.cantidad), 0),
      ajustes:  lista.filter(m => m.tipo === 'ajuste').length,
    })
    setLoading(false)
  }, [filtroProducto, desde, hasta])

  // Cargar lista de productos para el selector de filtro
  useEffect(() => {
    fetch('/api/farmacia/productos?activo=false')
      .then(r => r.json())
      .then(({ data }) => setProductos(data || []))
  }, [])

  useEffect(() => { cargarMovimientos() }, [cargarMovimientos])

  // Usuarios únicos del período cargado
  const usuarios = useMemo(() => {
    const map = new Map()
    movimientos.forEach(m => {
      if (!map.has(m.usuario_id)) map.set(m.usuario_id, m.usuario_nombre)
    })
    return Array.from(map.entries())
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [movimientos])

  // Toggle individual de tipo
  function toggleTipo(tipo) {
    setTiposActivos(prev => {
      const next = new Set(prev)
      next.has(tipo) ? next.delete(tipo) : next.add(tipo)
      return next
    })
  }

  // Doble clic: ver solo ese tipo
  function soloEseTipo(tipo) {
    setTiposActivos(new Set([tipo]))
  }

  const todosMarcados = tiposActivos.size === TODOS_LOS_TIPOS.size

  function limpiarFiltros() {
    setTiposActivos(TODOS_LOS_TIPOS)
    setFiltroUsuario('')
    setBusqueda('')
  }

  const hayFiltrosActivos = !todosMarcados || filtroUsuario || busqueda

  // Filtro local: tipo + usuario + texto
  const movsFiltrados = movimientos.filter(m => {
    if (!tiposActivos.has(m.tipo)) return false
    if (filtroUsuario && m.usuario_id !== filtroUsuario) return false
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return (
      m.producto_nombre.toLowerCase().includes(q) ||
      m.usuario_nombre.toLowerCase().includes(q)  ||
      (m.motivo && m.motivo.toLowerCase().includes(q))
    )
  })

  function formatFecha(iso) {
    return new Date(iso).toLocaleString('es-MX', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }

  const tituloFiltrado = filtroProducto && nombreUrl
    ? `Historial: ${decodeURIComponent(nombreUrl)}`
    : 'Log de Inventario'

  return (
    <AppLayout title={tituloFiltrado}>
      <div className="space-y-5 max-w-5xl mx-auto">

        {/* Header con back */}
        <div className="flex items-center gap-3">
          <Link
            href={filtroProducto ? `/farmacia/inventario/${filtroProducto}` : '/farmacia/inventario'}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </Link>
          <div className="flex items-center gap-2">
            <History size={18} className="text-sky-600" />
            <h1 className="text-lg font-bold text-gray-900">{tituloFiltrado}</h1>
          </div>
        </div>

        {/* ── Filtros ── */}
        <div className="space-y-3">

          {/* Fila 1: búsqueda · producto · usuario · fechas */}
          <div className="flex flex-wrap gap-3 items-end">

            {/* Búsqueda por texto */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar producto, usuario, motivo..."
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                className="pl-7 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 w-60"
              />
            </div>

            {/* Filtro producto */}
            <select
              value={filtroProducto}
              onChange={e => setFiltroProducto(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">Todos los productos</option>
              {productos.map(p => (
                <option key={p.id} value={p.id}>{p.nombre}</option>
              ))}
            </select>

            {/* Filtro usuario */}
            <select
              value={filtroUsuario}
              onChange={e => setFiltroUsuario(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">Todos los usuarios</option>
              {usuarios.map(u => (
                <option key={u.id} value={u.id}>{u.nombre}</option>
              ))}
            </select>

            {/* Rango de fechas */}
            <div className="flex items-center gap-2">
              <input
                type="date" value={desde}
                onChange={e => setDesde(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
              <span className="text-gray-400 text-xs">—</span>
              <input
                type="date" value={hasta}
                onChange={e => setHasta(e.target.value)}
                className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Fila 2: pills de tipo */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-gray-400 mr-1">Tipo:</span>

            {/* Pill "Todos" */}
            <button
              onClick={() => setTiposActivos(TODOS_LOS_TIPOS)}
              className={cn(
                'flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-colors',
                todosMarcados
                  ? 'bg-gray-800 text-white border-gray-800'
                  : 'bg-white text-gray-400 border-gray-200 hover:border-gray-300 hover:text-gray-600'
              )}
            >
              Todos
            </button>

            {Object.entries(TIPO_CONFIG).map(([val, cfg]) => {
              const activo = tiposActivos.has(val)
              const Icon   = cfg.icon
              return (
                <button
                  key={val}
                  onClick={() => toggleTipo(val)}
                  onDoubleClick={() => soloEseTipo(val)}
                  title="Clic: activar/desactivar · Doble clic: ver solo este tipo"
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-medium transition-all select-none',
                    activo
                      ? cfg.pillOn
                      : cn(cfg.pillOff, 'hover:border-gray-300 hover:text-gray-500')
                  )}
                >
                  <Icon size={11} />
                  {cfg.label}
                </button>
              )
            })}

            {/* Limpiar filtros locales */}
            {hayFiltrosActivos && (
              <button
                onClick={limpiarFiltros}
                className="text-xs text-sky-500 hover:text-sky-700 underline ml-1 transition-colors"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* ── Stats del período ── */}
        {!loading && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={PackagePlus} label="Unidades ingresadas"
              value={stats.entradas} color="emerald"
            />
            <StatCard
              icon={ShoppingCart} label="Unidades vendidas"
              value={stats.ventas} color="amber"
            />
            <StatCard
              icon={PackageMinus} label="Unidades retiradas"
              value={stats.salidas} color="red"
            />
            <StatCard
              icon={RefreshCw} label="Ajustes realizados"
              value={stats.ajustes} color="sky"
            />
          </div>
        )}

        {/* ── Tabla de movimientos ── */}
        {loading ? (
          <PageSpinner />
        ) : movsFiltrados.length === 0 ? (
          <Card>
            <CardBody className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
              <History size={40} className="opacity-30" />
              <p className="text-sm">No hay movimientos con los filtros aplicados.</p>
            </CardBody>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 w-8"></th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Producto</th>
                    <th className="text-center px-3 py-3 font-medium text-gray-500">Tipo</th>
                    <th className="text-center px-3 py-3 font-medium text-gray-500">Movimiento</th>
                    <th className="text-center px-3 py-3 font-medium text-gray-500 whitespace-nowrap">
                      <ArrowDown size={12} className="inline mr-0.5" />Antes
                    </th>
                    <th className="text-center px-3 py-3 font-medium text-gray-500 whitespace-nowrap">
                      <ArrowUp size={12} className="inline mr-0.5" />Después
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Usuario</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500">Motivo</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-500 whitespace-nowrap">Fecha</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {movsFiltrados.map(m => (
                    <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3">
                        <TipoIcon tipo={m.tipo} />
                      </td>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-800 truncate max-w-[160px]">
                          {m.producto_nombre}
                        </p>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <Badge color={TIPO_CONFIG[m.tipo]?.badge || 'gray'}>
                          {TIPO_CONFIG[m.tipo]?.label || m.tipo}
                        </Badge>
                      </td>
                      <td className="px-3 py-3 text-center">
                        <DeltaBadge tipo={m.tipo} cantidad={m.cantidad} />
                      </td>
                      <td className="px-3 py-3 text-center text-gray-400 tabular-nums">
                        {m.stock_antes}
                      </td>
                      <td className="px-3 py-3 text-center font-semibold text-gray-700 tabular-nums">
                        {m.stock_despues}
                      </td>
                      <td className="px-4 py-3 text-gray-500 truncate max-w-[120px]">
                        {m.usuario_nombre}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs truncate max-w-[160px]">
                        {m.motivo || '—'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs whitespace-nowrap">
                        {formatFecha(m.created_at)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2.5 bg-gray-50 border-t border-gray-100 text-xs text-gray-400">
              {movsFiltrados.length} movimiento{movsFiltrados.length !== 1 ? 's' : ''}
              {movsFiltrados.length !== movimientos.length && ` · filtrado de ${movimientos.length} totales`}
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    emerald: 'bg-emerald-50 text-emerald-600',
    amber:   'bg-amber-50 text-amber-600',
    red:     'bg-red-50 text-red-600',
    sky:     'bg-sky-50 text-sky-600',
  }
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-3 flex items-center gap-3">
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', colors[color])}>
        <Icon size={16} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-400 truncate">{label}</p>
        <p className="text-xl font-bold text-gray-800">{value}</p>
      </div>
    </div>
  )
}
