'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Card, { CardBody, CardHeader, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input, { Textarea } from '@/components/ui/Input'

export default function NuevoPacientePage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    nombre: '', apellido: '', fecha_nacimiento: '',
    telefono: '', email: '', direccion: '',
    alergias: '', condiciones_cronicas: '', medicacion_actual: '', notas: '',
  })

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSaving(true)
    const res = await fetch('/api/pacientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    if (!res.ok) {
      setError(json.error || 'Error al guardar')
      setSaving(false)
      return
    }
    router.push(`/pacientes/${json.data.id}`)
  }

  return (
    <AppLayout title="Nuevo paciente">
      <div className="max-w-2xl mx-auto space-y-4">
        <Link href="/pacientes" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={14} /> Volver a pacientes
        </Link>

        <form onSubmit={handleSubmit}>
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-800">Datos personales</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Nombre" required value={form.nombre} onChange={set('nombre')} placeholder="Juan" />
                <Input label="Apellido" required value={form.apellido} onChange={set('apellido')} placeholder="García" />
              </div>
              <Input label="Fecha de nacimiento" type="date" value={form.fecha_nacimiento} onChange={set('fecha_nacimiento')} />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Teléfono" type="tel" value={form.telefono} onChange={set('telefono')} placeholder="55 1234 5678" />
                <Input label="Email" type="email" value={form.email} onChange={set('email')} placeholder="paciente@email.com" />
              </div>
              <Input label="Dirección" value={form.direccion} onChange={set('direccion')} placeholder="Calle, número, colonia, ciudad" />
            </CardBody>

            <CardHeader className="border-t">
              <h2 className="font-semibold text-gray-800">Información clínica</h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Textarea
                label="Alergias"
                value={form.alergias}
                onChange={set('alergias')}
                placeholder="Penicilina, látex, mariscos..."
                rows={2}
              />
              <Textarea
                label="Condiciones crónicas"
                value={form.condiciones_cronicas}
                onChange={set('condiciones_cronicas')}
                placeholder="Diabetes tipo 2, hipertensión arterial..."
                rows={2}
              />
              <Textarea
                label="Medicación actual"
                value={form.medicacion_actual}
                onChange={set('medicacion_actual')}
                placeholder="Metformina 500mg c/12h, Losartán 50mg c/24h..."
                rows={2}
              />
              <Textarea
                label="Notas adicionales"
                value={form.notas}
                onChange={set('notas')}
                placeholder="Información relevante adicional..."
                rows={2}
              />
            </CardBody>

            <CardFooter>
              {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
              <div className="flex justify-end gap-3">
                <Link href="/pacientes">
                  <Button variant="secondary" type="button">Cancelar</Button>
                </Link>
                <Button type="submit" loading={saving}>Guardar paciente</Button>
              </div>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AppLayout>
  )
}
