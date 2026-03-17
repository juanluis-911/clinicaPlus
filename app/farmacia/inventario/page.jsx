'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, Package, AlertTriangle, Edit2, ToggleLeft, ToggleRight, History } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Card, { CardBody } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { usePermission } from '@/hooks/usePermission'
import { useConfig } from '@/hooks/useConfig'
import { cn } from '@/lib/utils'

export default function InventarioPage() {
  const { can } = usePermission()
  const { config } = useConfig()
  const moneda = config?.moneda || 'MXN'

  const [productos, setProductos] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [soloActivos, setSoloActivos] = useState(true)
  const [categorias, setCategorias] = useState([])
  const [filtroCategoria, setFiltroCategoria] = useState('')

  const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda }).format(n)

  async function loadProductos() {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    if (filtroCategoria) params.set('categoria', filtroCategoria)
    params.set('activo', soloActivos ? 'true' : 'false')
    const res = await fetch(`/api/farmacia/productos?${params}`)
    const { data } = await res.json()
    const lista = data || []
    setProductos(lista)
    const cats = [...new Set(lista.map(p => p.categoria).filter(Boolean))].sort()
    setCategorias(cats)
    setLoading(false)
  }

  useEffect(() => { loadProductos() }, [search, filtroCategoria, soloActivos])

  async function toggleActivo(producto) {
    await fetch(`/api/farmacia/productos/${producto.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ activo: !producto.activo }),
    })
    loadProductos()
  }

  const stockBajo = productos.filter(p => p.stock_actual <= p.stock_minimo && p.activo)

  return (
    <AppLayout title="Inventario Farmacia">
      <div className="space-y-5">

        {/* Alerta stock bajo */}
        {stockBajo.length > 0 && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
            <AlertTriangle size={15} className="flex-shrink-0" />
            <span>
              <strong>{stockBajo.length}</strong> producto{stockBajo.length !== 1 ? 's' : ''} con stock bajo o agotado.
            </span>
          </div>
        )}

        {/* Barra de controles */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {categorias.length > 0 && (
            <select
              value={filtroCategoria}
              onChange={e => setFiltroCategoria(e.target.value)}
              className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <option value="">Todas las categorías</option>
              {categorias.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}

          <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={soloActivos}
              onChange={e => setSoloActivos(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-sky-600"
            />
            Solo activos
          </label>

          <Link href="/farmacia/inventario/log">
            <Button size="sm" variant="secondary">
              <History size={14} /> Log de movimientos
            </Button>
          </Link>
          {can('gestionar_inventario_farmacia') && (
            <Link href="/farmacia/inventario/nuevo">
              <Button size="sm">
                <Plus size={14} /> Nuevo producto
              </Button>
            </Link>
          )}
        </div>

        {/* Tabla */}
        {loading ? (
          <PageSpinner />
        ) : productos.length === 0 ? (
          <Card>
            <CardBody className="flex flex-col items-center justify-center py-16 text-gray-400 gap-3">
              <Package size={40} className="opacity-30" />
              <p className="text-sm">
                {search ? 'Sin resultados para la búsqueda.' : 'No hay productos en el inventario.'}
              </p>
              {can('gestionar_inventario_farmacia') && !search && (
                <Link href="/farmacia/inventario/nuevo">
                  <Button size="sm" variant="secondary">
                    <Plus size={14} /> Agregar primer producto
                  </Button>
                </Link>
              )}
            </CardBody>
          </Card>
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Producto</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Categoría</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600">Precio</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Stock</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600">Estado</th>
                    {can('gestionar_inventario_farmacia') && (
                      <th className="px-4 py-3"></th>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {productos.map(p => {
                    const stockAlerta = p.stock_actual <= p.stock_minimo
                    return (
                      <tr key={p.id} className={cn('hover:bg-gray-50/50 transition-colors', !p.activo && 'opacity-50')}>
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{p.nombre}</p>
                            {p.sku && <p className="text-xs text-gray-400">SKU: {p.sku}</p>}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-gray-500">{p.categoria || '—'}</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-800">{fmt(p.precio)}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={cn(
                            'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
                            stockAlerta && p.activo
                              ? 'bg-red-100 text-red-700'
                              : 'bg-gray-100 text-gray-700'
                          )}>
                            {stockAlerta && p.activo && <AlertTriangle size={10} />}
                            {p.stock_actual} {p.unidad}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge color={p.activo ? 'emerald' : 'gray'}>
                            {p.activo ? 'Activo' : 'Inactivo'}
                          </Badge>
                        </td>
                        {can('gestionar_inventario_farmacia') && (
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-2">
                              <Link href={`/farmacia/inventario/${p.id}`} title="Editar">
                                <button className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors">
                                  <Edit2 size={14} />
                                </button>
                              </Link>
                              <button
                                onClick={() => toggleActivo(p)}
                                title={p.activo ? 'Desactivar' : 'Activar'}
                                className="p-1.5 rounded-lg text-gray-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                              >
                                {p.activo ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AppLayout>
  )
}
