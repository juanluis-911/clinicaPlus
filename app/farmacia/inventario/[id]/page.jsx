'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Save, Package, CheckCircle, XCircle,
  PackagePlus, PackageMinus, RefreshCw, History, ExternalLink,
} from 'lucide-react'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'
import Card, { CardBody, CardHeader, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input, { Textarea } from '@/components/ui/Input'
import { PageSpinner } from '@/components/ui/Spinner'
import { usePermission } from '@/hooks/usePermission'
import { cn } from '@/lib/utils'

const UNIDADES = ['pieza', 'caja', 'frasco', 'tableta', 'cápsula', 'ampolleta', 'sobre', 'ml', 'mg', 'g', 'L']

const TIPOS_MOVIMIENTO = [
  { value: 'entrada', label: 'Entrada',  icon: PackagePlus,  color: 'text-emerald-600', desc: 'Recepción de mercancía, devolución, etc.' },
  { value: 'salida',  label: 'Salida',   icon: PackageMinus, color: 'text-red-500',     desc: 'Caducidad, pérdida, uso interno, etc.' },
  { value: 'ajuste',  label: 'Ajuste',   icon: RefreshCw,    color: 'text-sky-600',     desc: 'Corrección de conteo físico.' },
]

export default function EditarProductoPage({ params }) {
  const { id } = use(params)
  const router = useRouter()
  const { can } = usePermission()

  const [producto, setProducto] = useState(null)
  const [form, setForm]         = useState(null)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [movSaving, setMovSaving] = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')
  const [movError, setMovError] = useState('')
  const [movSuccess, setMovSuccess] = useState('')

  // Formulario de movimiento de stock
  const [movForm, setMovForm] = useState({ tipo: 'entrada', cantidad: '', motivo: '' })

  useEffect(() => {
    fetch(`/api/farmacia/productos/${id}`)
      .then(r => r.json())
      .then(({ data, error }) => {
        if (error || !data) { setError('Producto no encontrado'); setLoading(false); return }
        setProducto(data)
        setForm({
          nombre:      data.nombre,
          descripcion: data.descripcion || '',
          categoria:   data.categoria   || '',
          sku:         data.sku         || '',
          precio:      String(data.precio),
          costo:       data.costo != null ? String(data.costo) : '',
          stock_minimo: String(data.stock_minimo),
          unidad:      data.unidad,
          activo:      data.activo,
        })
        setLoading(false)
      })
      .catch(() => { setError('Error al cargar'); setLoading(false) })
  }, [id])

  if (!can('gestionar_inventario_farmacia')) {
    return (
      <AppLayout title="Editar producto">
        <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
          Sin permisos para gestionar el inventario.
        </div>
      </AppLayout>
    )
  }

  if (loading) return <AppLayout title="Cargando..."><PageSpinner /></AppLayout>

  function set(key, val) { setForm(f => ({ ...f, [key]: val })) }
  function setMov(key, val) { setMovForm(f => ({ ...f, [key]: val })) }

  // ── Guardar info general ─────────────────────────────────────────────────
  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    const res = await fetch(`/api/farmacia/productos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nombre:      form.nombre,
        descripcion: form.descripcion || null,
        categoria:   form.categoria   || null,
        sku:         form.sku         || null,
        precio:      parseFloat(form.precio),
        costo:       form.costo !== '' ? parseFloat(form.costo) : null,
        stock_minimo: parseInt(form.stock_minimo) || 0,
        unidad:      form.unidad,
        activo:      form.activo,
      }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error || 'Error al guardar'); return }
    setSuccess('Producto actualizado')
    setTimeout(() => setSuccess(''), 3000)
  }

  // ── Registrar movimiento de stock ────────────────────────────────────────
  async function handleMovimiento(e) {
    e.preventDefault()
    if (!movForm.cantidad || parseInt(movForm.cantidad) <= 0) {
      setMovError('La cantidad debe ser mayor a 0')
      return
    }
    setMovSaving(true)
    setMovError('')
    setMovSuccess('')
    const res = await fetch('/api/farmacia/movimientos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        producto_id: id,
        tipo:        movForm.tipo,
        cantidad:    parseInt(movForm.cantidad),
        motivo:      movForm.motivo || null,
      }),
    })
    const json = await res.json()
    setMovSaving(false)
    if (!res.ok) { setMovError(json.error || 'Error al registrar'); return }

    // Actualizar el stock mostrado en pantalla
    setProducto(p => ({ ...p, stock_actual: json.data.stock_despues }))
    setMovForm({ tipo: 'entrada', cantidad: '', motivo: '' })
    setMovSuccess(`Stock actualizado: ${json.data.stock_antes} → ${json.data.stock_despues} ${producto?.unidad}`)
    setTimeout(() => setMovSuccess(''), 4000)
  }

  const tipoMov = TIPOS_MOVIMIENTO.find(t => t.value === movForm.tipo)

  return (
    <AppLayout title="Editar producto">
      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => router.push('/farmacia/inventario')}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Package size={18} className="text-sky-600 flex-shrink-0" />
            <h1 className="text-lg font-bold text-gray-900 truncate">{producto?.nombre}</h1>
          </div>
          <Link
            href={`/farmacia/inventario/log?producto_id=${id}&nombre=${encodeURIComponent(producto?.nombre || '')}`}
            className="flex items-center gap-1.5 text-xs text-sky-600 hover:text-sky-800 transition-colors"
          >
            <History size={14} />
            Ver historial
          </Link>
        </div>

        {/* Stock actual — visual destacado */}
        <div className={cn(
          'rounded-xl border px-5 py-4 mb-5 flex items-center justify-between',
          producto?.stock_actual <= producto?.stock_minimo
            ? 'bg-red-50 border-red-200'
            : 'bg-emerald-50 border-emerald-200'
        )}>
          <div>
            <p className="text-xs font-medium text-gray-500">Stock actual</p>
            <p className={cn(
              'text-3xl font-bold mt-0.5',
              producto?.stock_actual <= producto?.stock_minimo ? 'text-red-600' : 'text-emerald-700'
            )}>
              {producto?.stock_actual}
              <span className="text-base font-normal text-gray-400 ml-1.5">{producto?.unidad}</span>
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-400">Mínimo requerido</p>
            <p className="text-sm font-semibold text-gray-600">{producto?.stock_minimo} {producto?.unidad}</p>
          </div>
        </div>

        {/* Feedback global */}
        {success && (
          <div className="mb-4 flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-sm text-emerald-700">
            <CheckCircle size={14} /> {success}
          </div>
        )}
        {error && (
          <div className="mb-4 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-600">
            <XCircle size={14} /> {error}
          </div>
        )}

        {/* ── Información general ── */}
        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-700">Información general</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="Nombre *"
                value={form.nombre}
                onChange={e => set('nombre', e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Categoría" value={form.categoria} onChange={e => set('categoria', e.target.value)} />
                <Input label="SKU / Código" value={form.sku} onChange={e => set('sku', e.target.value)} />
              </div>
              <Textarea
                label="Descripción"
                value={form.descripcion}
                onChange={e => set('descripcion', e.target.value)}
                rows={2}
              />
            </CardBody>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-700">Precios</h2>
            </CardHeader>
            <CardBody>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Precio de venta *"
                  type="number" min="0" step="0.01"
                  value={form.precio}
                  onChange={e => set('precio', e.target.value)}
                  required
                />
                <Input
                  label="Costo (opcional)"
                  type="number" min="0" step="0.01"
                  value={form.costo}
                  onChange={e => set('costo', e.target.value)}
                />
              </div>
            </CardBody>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-700">Configuración de stock</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Stock mínimo"
                  type="number" min="0"
                  value={form.stock_minimo}
                  onChange={e => set('stock_minimo', e.target.value)}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Unidad</label>
                  <select
                    value={form.unidad}
                    onChange={e => set('unidad', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>
              <p className="text-xs text-gray-400">
                Para cambiar el stock usa la sección "Registrar movimiento" de abajo — queda registrado en el historial.
              </p>
            </CardBody>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-700">Estado</h2>
            </CardHeader>
            <CardBody>
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.activo}
                  onChange={e => set('activo', e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">Producto activo</p>
                  <p className="text-xs text-gray-500">Los productos inactivos no aparecen en el POS.</p>
                </div>
              </label>
            </CardBody>
            <CardFooter>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" type="button" onClick={() => router.push('/farmacia/inventario')}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" loading={saving}>
                  <Save size={13} /> Guardar cambios
                </Button>
              </div>
            </CardFooter>
          </Card>
        </form>

        {/* ── Registrar movimiento de stock ── */}
        <form onSubmit={handleMovimiento} className="mt-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <PackagePlus size={15} className="text-sky-600" />
                  Registrar movimiento de inventario
                </h2>
                <Link
                  href={`/farmacia/inventario/log?producto_id=${id}&nombre=${encodeURIComponent(producto?.nombre || '')}`}
                  className="flex items-center gap-1 text-xs text-sky-600 hover:underline"
                >
                  <ExternalLink size={12} />
                  Ver historial
                </Link>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">
                Cada cambio de stock queda registrado con el motivo y el usuario.
              </p>
            </CardHeader>
            <CardBody className="space-y-4">

              {/* Tipo de movimiento */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Tipo de movimiento</p>
                <div className="flex gap-2">
                  {TIPOS_MOVIMIENTO.map(t => {
                    const Icon = t.icon
                    const selected = movForm.tipo === t.value
                    return (
                      <button
                        key={t.value}
                        type="button"
                        onClick={() => setMov('tipo', t.value)}
                        className={cn(
                          'flex-1 flex flex-col items-center gap-1 py-3 px-2 rounded-xl border-2 text-xs font-medium transition-all',
                          selected
                            ? 'border-sky-500 bg-sky-50 text-sky-700'
                            : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                        )}
                      >
                        <Icon size={18} className={selected ? 'text-sky-600' : 'text-gray-400'} />
                        {t.label}
                      </button>
                    )
                  })}
                </div>
                {tipoMov && (
                  <p className="text-xs text-gray-400 mt-1.5">{tipoMov.desc}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Cantidad *"
                  type="number"
                  min="1"
                  step="1"
                  placeholder="0"
                  value={movForm.cantidad}
                  onChange={e => setMov('cantidad', e.target.value)}
                  required
                />
                <Input
                  label="Motivo (opcional)"
                  placeholder={
                    movForm.tipo === 'entrada' ? 'Ej. Reposición de stock' :
                    movForm.tipo === 'salida'  ? 'Ej. Producto caducado' :
                    'Ej. Conteo físico'
                  }
                  value={movForm.motivo}
                  onChange={e => setMov('motivo', e.target.value)}
                />
              </div>

              {/* Preview del resultado */}
              {movForm.cantidad && parseInt(movForm.cantidad) > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 text-sm">
                  <span className="text-gray-500">Stock resultante: </span>
                  <span className="font-bold text-gray-700">
                    {movForm.tipo === 'salida'
                      ? Math.max(0, (producto?.stock_actual || 0) - parseInt(movForm.cantidad))
                      : (producto?.stock_actual || 0) + parseInt(movForm.cantidad)
                    }
                  </span>
                  <span className="text-gray-400 ml-1">{producto?.unidad}</span>
                  <span className="text-gray-400 mx-2">←</span>
                  <span className="text-gray-400">
                    {movForm.tipo === 'salida' ? '−' : '+'}{movForm.cantidad} del actual {producto?.stock_actual}
                  </span>
                </div>
              )}

              {movError && (
                <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2 text-xs text-red-600">
                  <XCircle size={13} /> {movError}
                </div>
              )}
              {movSuccess && (
                <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2 text-xs text-emerald-700">
                  <CheckCircle size={13} /> {movSuccess}
                </div>
              )}
            </CardBody>
            <CardFooter>
              <div className="flex justify-end">
                <Button type="submit" size="sm" loading={movSaving}>
                  <PackagePlus size={13} /> Registrar movimiento
                </Button>
              </div>
            </CardFooter>
          </Card>
        </form>

      </div>
    </AppLayout>
  )
}
