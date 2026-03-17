'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Package } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Card, { CardBody, CardHeader, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input, { Textarea } from '@/components/ui/Input'
import { usePermission } from '@/hooks/usePermission'

const UNIDADES = ['pieza', 'caja', 'frasco', 'tableta', 'cápsula', 'ampolleta', 'sobre', 'ml', 'mg', 'g', 'L']

export default function NuevoProductoPage() {
  const router = useRouter()
  const { can } = usePermission()

  const [form, setForm] = useState({
    nombre: '', descripcion: '', categoria: '', sku: '',
    precio: '', costo: '', stock_actual: '0', stock_minimo: '0', unidad: 'pieza',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  if (!can('gestionar_inventario_farmacia')) {
    return (
      <AppLayout title="Nuevo producto">
        <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
          Sin permisos para gestionar el inventario.
        </div>
      </AppLayout>
    )
  }

  function set(key, val) {
    setForm(f => ({ ...f, [key]: val }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.nombre.trim()) { setError('El nombre es requerido'); return }
    if (form.precio === '' || parseFloat(form.precio) < 0) { setError('El precio es requerido'); return }

    setSaving(true)
    setError('')
    const res = await fetch('/api/farmacia/productos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        precio: parseFloat(form.precio),
        costo: form.costo !== '' ? parseFloat(form.costo) : null,
        stock_actual: parseInt(form.stock_actual) || 0,
        stock_minimo: parseInt(form.stock_minimo) || 0,
      }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error || 'Error al guardar'); return }
    router.push('/farmacia/inventario')
  }

  return (
    <AppLayout title="Nuevo producto">
      <div className="max-w-xl mx-auto">
        <div className="flex items-center gap-3 mb-5">
          <button
            onClick={() => router.push('/farmacia/inventario')}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-2">
            <Package size={18} className="text-sky-600" />
            <h1 className="text-lg font-bold text-gray-900">Nuevo producto</h1>
          </div>
        </div>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-700">Información general</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="Nombre *"
                placeholder="Ej. Paracetamol 500mg"
                value={form.nombre}
                onChange={e => set('nombre', e.target.value)}
                required
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Categoría"
                  placeholder="Ej. Analgésicos"
                  value={form.categoria}
                  onChange={e => set('categoria', e.target.value)}
                />
                <Input
                  label="SKU / Código"
                  placeholder="Ej. PAR500"
                  value={form.sku}
                  onChange={e => set('sku', e.target.value)}
                />
              </div>
              <Textarea
                label="Descripción"
                placeholder="Descripción breve del producto..."
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
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Precio de venta *"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.precio}
                  onChange={e => set('precio', e.target.value)}
                  required
                />
                <Input
                  label="Costo (opcional)"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={form.costo}
                  onChange={e => set('costo', e.target.value)}
                />
              </div>
            </CardBody>
          </Card>

          <Card className="mt-4">
            <CardHeader>
              <h2 className="text-sm font-semibold text-gray-700">Inventario</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Input
                  label="Stock actual"
                  type="number"
                  min="0"
                  value={form.stock_actual}
                  onChange={e => set('stock_actual', e.target.value)}
                />
                <Input
                  label="Stock mínimo"
                  type="number"
                  min="0"
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
              <p className="text-xs text-gray-500">
                Se mostrará una alerta cuando el stock sea igual o menor al mínimo.
              </p>
            </CardBody>
            <CardFooter>
              <div className="flex justify-end gap-2">
                <Button variant="secondary" size="sm" type="button" onClick={() => router.push('/farmacia/inventario')}>
                  Cancelar
                </Button>
                <Button type="submit" size="sm" loading={saving}>
                  <Save size={13} /> Guardar producto
                </Button>
              </div>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AppLayout>
  )
}
