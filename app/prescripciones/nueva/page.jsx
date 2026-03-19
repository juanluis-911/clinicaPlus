'use client'

import { Suspense } from 'react'
import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, Trash2, Printer } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Card, { CardBody, CardHeader, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input, { Textarea } from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import PatientCombobox from '@/components/ui/PatientCombobox'

const FORMAS = [
  { value: 'tableta', label: 'Tableta' },
  { value: 'capsula', label: 'Cápsula' },
  { value: 'jarabe', label: 'Jarabe' },
  { value: 'solucion', label: 'Solución' },
  { value: 'suspension', label: 'Suspensión' },
  { value: 'inyectable', label: 'Inyectable' },
  { value: 'crema', label: 'Crema / Ungüento' },
  { value: 'gotas', label: 'Gotas' },
  { value: 'parche', label: 'Parche' },
  { value: 'otro', label: 'Otro' },
]

const FRECUENCIAS = [
  { value: 'cada 4 horas', label: 'Cada 4 horas' },
  { value: 'cada 6 horas', label: 'Cada 6 horas (4 veces al día)' },
  { value: 'cada 8 horas', label: 'Cada 8 horas (3 veces al día)' },
  { value: 'cada 12 horas', label: 'Cada 12 horas (2 veces al día)' },
  { value: 'cada 24 horas', label: 'Una vez al día' },
  { value: 'al despertar', label: 'Al despertar' },
  { value: 'al dormir', label: 'Al dormir' },
  { value: 'según necesidad', label: 'Según necesidad (SOS)' },
]

function emptyMed() {
  return { nombre: '', concentracion: '', forma: 'tableta', dosis: '', frecuencia: 'cada 8 horas', duracion: '', indicaciones: '' }
}

export default function NuevaPrescripcionPage() {
  return (
    <Suspense>
      <NuevaPrescripcionContent />
    </Suspense>
  )
}

function NuevaPrescripcionContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [selectedPatient, setSelectedPatient] = useState(null)
  const [form, setForm] = useState({
    paciente_id: searchParams.get('paciente_id') || '',
    consulta_id: searchParams.get('consulta_id') || null,
    fecha: new Date().toISOString().slice(0, 10),
    instrucciones: '',
    vigencia_dias: '30',
  })
  const [medicamentos, setMedicamentos] = useState([emptyMed()])

  // Load patient name when pre-filled from URL
  useEffect(() => {
    const preId = searchParams.get('paciente_id')
    if (!preId) return
    fetch(`/api/pacientes?id=${preId}`)
      .then(r => r.json())
      .then(({ data }) => { if (data) setSelectedPatient(data) })
      .catch(() => {})
  }, [])

  // Pre-llenar instrucciones con el plan_tratamiento de la consulta
  useEffect(() => {
    const consultaId = searchParams.get('consulta_id')
    if (!consultaId) return
    import('@/lib/supabase/client').then(({ createClient }) => {
      createClient()
        .from('consultas')
        .select('plan_tratamiento, diagnostico')
        .eq('id', consultaId)
        .single()
        .then(({ data }) => {
          if (!data) return
          setForm(f => ({
            ...f,
            instrucciones: data.plan_tratamiento || '',
          }))
        })
    })
  }, [])

  function setForm2(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })) }
  function setMed(i, field) { return e => setMedicamentos(ms => ms.map((m, j) => j === i ? { ...m, [field]: e.target.value } : m)) }
  function addMed() { setMedicamentos(ms => [...ms, emptyMed()]) }
  function removeMed(i) { setMedicamentos(ms => ms.filter((_, j) => j !== i)) }

  async function handleSave(e) {
    e.preventDefault()
    if (!form.paciente_id) { setError('Selecciona un paciente'); return }
    if (medicamentos.some(m => !m.nombre)) { setError('Todos los medicamentos deben tener nombre'); return }
    setError('')
    setSaving(true)

    const res = await fetch('/api/prescripciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, vigencia_dias: parseInt(form.vigencia_dias), medicamentos }),
    })
    const json = await res.json()
    setSaving(false)

    if (!res.ok) { setError(json.error || 'Error al guardar'); return }

    // Auto-print PDF
    try {
      const { data: rx } = json
      const paciente = selectedPatient
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data: medico } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
      // Fetch fresh config (bypass hook cache) to ensure logo URL is current
      const configRes = await fetch('/api/configuracion')
      const { data: freshConfig } = await configRes.json()
      const { generarPrescripcionPDF } = await import('@/lib/pdf-prescripcion')
      await generarPrescripcionPDF({ ...rx, medicamentos }, paciente || {}, medico || {}, freshConfig || {})
    } catch (pdfErr) {
      console.error('PDF error:', pdfErr)
    }

    router.push('/prescripciones')
  }

  return (
    <AppLayout title="Nueva prescripción">
      <div className="max-w-2xl mx-auto space-y-4">
        <Link href="/prescripciones" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
          <ArrowLeft size={14} /> Prescripciones
        </Link>

        <form onSubmit={handleSave} className="space-y-5">
          {/* Header */}
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-800">Datos generales</h2></CardHeader>
            <CardBody className="space-y-4">
              <PatientCombobox
                label="Paciente"
                required
                value={form.paciente_id}
                initialPatient={selectedPatient}
                onSelect={p => {
                  setSelectedPatient(p)
                  setForm(f => ({ ...f, paciente_id: p?.id || '' }))
                }}
                disabled={!!searchParams.get('paciente_id')}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Fecha" type="date" required value={form.fecha} onChange={setForm2('fecha')} />
                <Input
                  label="Vigencia (días)"
                  type="number" min="1" max="365"
                  value={form.vigencia_dias}
                  onChange={setForm2('vigencia_dias')}
                />
              </div>
            </CardBody>
          </Card>

          {/* Medications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-800">Medicamentos</h2>
                <Button type="button" variant="secondary" size="sm" onClick={addMed}>
                  <Plus size={14} /> Agregar
                </Button>
              </div>
            </CardHeader>
            <CardBody className="space-y-6">
              {medicamentos.map((med, i) => (
                <div key={i} className="relative bg-gray-50 rounded-xl p-4 space-y-3">
                  {medicamentos.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeMed(i)}
                      className="absolute top-3 right-3 p-1 text-gray-300 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      label={`Medicamento ${i + 1}`}
                      placeholder="Metformina"
                      required
                      value={med.nombre}
                      onChange={setMed(i, 'nombre')}
                    />
                    <Input
                      label="Concentración"
                      placeholder="500 mg"
                      value={med.concentracion}
                      onChange={setMed(i, 'concentracion')}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="Forma farmacéutica"
                      value={med.forma}
                      onChange={setMed(i, 'forma')}
                      options={FORMAS}
                    />
                    <Input
                      label="Dosis"
                      placeholder="1 tableta"
                      value={med.dosis}
                      onChange={setMed(i, 'dosis')}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="Frecuencia"
                      value={med.frecuencia}
                      onChange={setMed(i, 'frecuencia')}
                      options={FRECUENCIAS}
                    />
                    <Input
                      label="Duración"
                      placeholder="30 días"
                      value={med.duracion}
                      onChange={setMed(i, 'duracion')}
                    />
                  </div>
                  <Input
                    label="Indicaciones especiales"
                    placeholder="Tomar con alimentos..."
                    value={med.indicaciones}
                    onChange={setMed(i, 'indicaciones')}
                  />
                </div>
              ))}
            </CardBody>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-800">Instrucciones generales</h2></CardHeader>
            <CardBody>
              <Textarea
                placeholder="Instrucciones adicionales para el paciente, dieta, actividad física..."
                value={form.instrucciones}
                onChange={setForm2('instrucciones')}
                rows={3}
              />
            </CardBody>
            <CardFooter>
              {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
              <div className="flex justify-end gap-3">
                <Link href="/prescripciones">
                  <Button variant="secondary" type="button">Cancelar</Button>
                </Link>
                <Button type="submit" loading={saving}>
                  <Printer size={14} /> Guardar e imprimir
                </Button>
              </div>
            </CardFooter>
          </Card>
        </form>
      </div>
    </AppLayout>
  )
}
