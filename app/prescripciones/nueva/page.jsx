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
import MedicamentosCombobox from '@/components/ui/MedicamentosCombobox'
import { calcAge } from '@/lib/utils'

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

// Formatea mg como string: "125 mg" o "125.5 mg"
function formatDosis(mg) {
  const rounded = Math.round(mg * 10) / 10
  return Number.isInteger(rounded) ? `${rounded} mg` : `${rounded.toFixed(1)} mg`
}

// ¿El mg/kg del catálogo es dosis DIARIA (necesita dividirse)?
// Indicador: la nota contiene "dividida" → ej: "dosis/día dividida c/8h"
// Si no tiene "dividida" → el mg/kg ya es POR TOMA (paracetamol, ibuprofeno, etc.)
function isDailyDose(nota = '') {
  return nota.toLowerCase().includes('dividida')
}

// Tomas por día (solo relevante si isDailyDose)
function dosesPerDay(nota = '') {
  const n = nota.toLowerCase()
  if (n.includes('c/4h'))  return 6
  if (n.includes('c/6h'))  return 4
  if (n.includes('c/8h'))  return 3
  if (n.includes('c/12h')) return 2
  return 1
}

// Convierte mg a unidades amigables según concentración y forma
function mgToUnits(mg, concentracion = '', forma = '') {
  const conc  = concentracion.trim()
  const forma_ = forma.toLowerCase()

  // Líquido: "250 mg/5 ml" o "100 mg/ml"
  const liqMatch = conc.match(/(\d+(?:[.,]\d+)?)\s*mg\s*\/\s*(\d+(?:[.,]\d+)?)?\s*ml/i)
  if (liqMatch) {
    const mgPerMl = parseFloat(liqMatch[1]) / (parseFloat(liqMatch[2] || '1') || 1)
    const ml = Math.round((mg / mgPerMl) * 10) / 10
    return `${Number.isInteger(ml) ? ml : ml.toFixed(1)} ml`
  }

  // Sólido: "500 mg"
  const solidMatch = conc.match(/^(\d+(?:[.,]\d+)?)\s*mg$/i)
  if (solidMatch) {
    const mgPerUnit = parseFloat(solidMatch[1])
    const units     = Math.round((mg / mgPerUnit) * 10) / 10
    const unitsStr  = Number.isInteger(units) ? String(units) : units.toFixed(1)
    const label     = forma_.includes('cáps') || forma_.includes('caps') ? 'cápsula'
                    : forma_.includes('table') ? 'tableta'
                    : forma_ || 'tableta'
    const plural    = parseFloat(unitsStr) !== 1
                    ? (label.endsWith('a') ? label.slice(0, -1) + 'as' : label + 's')
                    : label
    return `${unitsStr} ${parseFloat(unitsStr) === 1 ? label : plural}`
  }

  return formatDosis(mg)
}

// Calcula la dosis POR TOMA en unidades amigables para el paciente
function calcDosisPorToma(item, pesoKg) {
  if (item.mg_kg_min == null || !pesoKg) return null

  const baseMg    = ((item.mg_kg_min + item.mg_kg_max) / 2) * pesoKg
  const perDoseMg = isDailyDose(item.nota_dosis)
    ? baseMg / dosesPerDay(item.nota_dosis)
    : baseMg  // ya es por toma

  return mgToUnits(perDoseMg, item.concentracion || '', item.forma || '')
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
  const [pesoKg, setPesoKg] = useState('')

  // Detección de paciente pediátrico
  const patientAge = selectedPatient?.fecha_nacimiento ? calcAge(selectedPatient.fecha_nacimiento) : null
  const isPediatric = patientAge !== null && patientAge < 18
  const peso = parseFloat(pesoKg) || 0

  // Load patient name when pre-filled from URL
  useEffect(() => {
    const preId = searchParams.get('paciente_id')
    if (!preId) return
    fetch(`/api/pacientes?id=${preId}`)
      .then(r => r.json())
      .then(({ data }) => { if (data) setSelectedPatient(data) })
      .catch(() => {})
  }, [])

  // Pre-llenar instrucciones con el diagnóstico de la consulta
  useEffect(() => {
    const consultaId = searchParams.get('consulta_id')
    if (!consultaId) return
    import('@/lib/supabase/client').then(({ createClient }) => {
      createClient()
        .from('consultas')
        .select('diagnostico')
        .eq('id', consultaId)
        .single()
        .then(({ data }) => {
          if (!data) return
          setForm(f => ({ ...f, instrucciones: data.diagnostico || '' }))
        })
    })
  }, [])

  function setForm2(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })) }
  function setMed(i, field) { return e => setMedicamentos(ms => ms.map((m, j) => j === i ? { ...m, [field]: e.target.value } : m)) }
  function updateMed(i, updates) { setMedicamentos(ms => ms.map((m, j) => j === i ? { ...m, ...updates } : m)) }

  // Cuando el médico cambia la concentración manualmente, recalcular la dosis si hay datos mg/kg
  function handleConcChange(i, value) {
    setMedicamentos(ms => ms.map((m, j) => {
      if (j !== i) return m
      const updated = { ...m, concentracion: value }
      if (isPediatric && peso > 0 && m._mgKgMin != null) {
        const item = { mg_kg_min: m._mgKgMin, mg_kg_max: m._mgKgMax, nota_dosis: m._notaDosis, concentracion: value, forma: m.forma }
        updated.dosis = calcDosisPorToma(item, peso) ?? formatDosis(((m._mgKgMin + m._mgKgMax) / 2) * peso)
      }
      return updated
    }))
  }
  function addMed() { setMedicamentos(ms => [...ms, emptyMed()]) }
  function removeMed(i) { setMedicamentos(ms => ms.filter((_, j) => j !== i)) }

  // Cuando el médico selecciona un medicamento del catálogo
  function handleMedSelect(i, item) {
    const updates = {
      nombre:      item.nombre,
      _mgKgMin:    item.mg_kg_min  ?? null,
      _mgKgMax:    item.mg_kg_max  ?? null,
      _notaDosis:  item.nota_dosis ?? null,
    }
    if (item.concentracion) updates.concentracion = item.concentracion
    if (item.forma)         updates.forma = item.forma
    if (isPediatric && peso > 0 && item.mg_kg_min != null) {
      updates.dosis = calcDosisPorToma(item, peso) ?? formatDosis(((item.mg_kg_min + item.mg_kg_max) / 2) * peso)
    }
    updateMed(i, updates)
  }

  // Recalcular dosis cuando cambia el peso (solo meds con datos mg/kg)
  useEffect(() => {
    if (!isPediatric || peso <= 0) return
    setMedicamentos(ms => ms.map(m => {
      if (m._mgKgMin == null) return m
      const item = { mg_kg_min: m._mgKgMin, mg_kg_max: m._mgKgMax, nota_dosis: m._notaDosis, concentracion: m.concentracion, forma: m.forma }
      return { ...m, dosis: calcDosisPorToma(item, peso) ?? formatDosis(((m._mgKgMin + m._mgKgMax) / 2) * peso) }
    }))
  }, [pesoKg]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSave(e) {
    e.preventDefault()
    if (!form.paciente_id) { setError('Selecciona un paciente'); return }
    const desdeConsulta = !!searchParams.get('consulta_id')
    // Limpiar campos internos (_) antes de enviar al API
    const medsValidos = medicamentos
      .filter(m => m.nombre.trim())
      .map(({ _mgKgMin, _mgKgMax, _notaDosis, ...rest }) => rest)
    if (!desdeConsulta && medsValidos.length === 0) { setError('Agrega al menos un medicamento'); return }
    setError('')
    setSaving(true)

    const res = await fetch('/api/prescripciones', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, vigencia_dias: parseInt(form.vigencia_dias), medicamentos: medsValidos }),
    })
    const json = await res.json()
    setSaving(false)

    if (!res.ok) { setError(json.error || 'Error al guardar'); return }

    // Guardar nombres nuevos en el catálogo (en segundo plano)
    const nombresNuevos = medsValidos.map(m => m.nombre.trim()).filter(Boolean)
    Promise.allSettled(nombresNuevos.map(nombre =>
      fetch('/api/catalogo-medicamentos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre }),
      })
    )).catch(() => {})

    // Auto-print PDF
    try {
      const { data: rx } = json
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { data: medico } = await supabase.from('perfiles').select('*').eq('id', user.id).single()
      const configRes = await fetch('/api/configuracion')
      const { data: freshConfig } = await configRes.json()
      const { generarPrescripcionPDF } = await import('@/lib/pdf-prescripcion')
      await generarPrescripcionPDF({ ...rx, medicamentos }, selectedPatient || {}, medico || {}, freshConfig || {})
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
          {/* Datos generales */}
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
                  setPesoKg('')
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

              {/* Badge pediátrico + peso */}
              {isPediatric && (
                <div className="flex items-center gap-4 p-3 bg-sky-50 rounded-xl border border-sky-100">
                  <span className="text-xs text-sky-700 font-medium flex-shrink-0">
                    Paciente pediátrico · {patientAge} {patientAge === 1 ? 'año' : 'años'}
                  </span>
                  <div className="w-36">
                    <Input
                      label="Peso (kg)"
                      type="number"
                      min="0.5"
                      max="150"
                      step="0.1"
                      placeholder="12.5"
                      value={pesoKg}
                      onChange={e => setPesoKg(e.target.value)}
                    />
                  </div>
                  {peso === 0 && (
                    <p className="text-xs text-sky-600 flex-1">
                      Ingresa el peso para calcular dosis automáticamente
                    </p>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {/* Medicamentos */}
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
                    <MedicamentosCombobox
                      label={`Medicamento ${i + 1}`}
                      required
                      value={med.nombre}
                      onTextChange={nombre => updateMed(i, { nombre })}
                      onSelect={item => handleMedSelect(i, item)}
                    />
                    <Input
                      label="Concentración"
                      placeholder="500 mg"
                      value={med.concentracion}
                      onChange={e => handleConcChange(i, e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="Forma farmacéutica"
                      value={med.forma}
                      onChange={setMed(i, 'forma')}
                      options={FORMAS}
                    />
                    <div className="flex flex-col gap-1">
                      <Input
                        label="Dosis"
                        placeholder={isPediatric && peso > 0 ? 'Se calcula al elegir med.' : '1 tableta'}
                        value={med.dosis}
                        onChange={setMed(i, 'dosis')}
                      />
                      {/* Hint de cálculo pediátrico */}
                      {isPediatric && med._mgKgMin != null && peso > 0 && (() => {
                        const item      = { mg_kg_min: med._mgKgMin, mg_kg_max: med._mgKgMax, nota_dosis: med._notaDosis, concentracion: med.concentracion, forma: med.forma }
                        const baseMg    = ((med._mgKgMin + med._mgKgMax) / 2) * peso
                        const esDialia  = isDailyDose(med._notaDosis)
                        const perDoseMg = esDialia ? baseMg / dosesPerDay(med._notaDosis) : baseMg
                        const porToma   = calcDosisPorToma(item, peso)
                        const mgLabel   = med._mgKgMin === med._mgKgMax ? `${med._mgKgMin}` : `${med._mgKgMin}–${med._mgKgMax}`
                        return (
                          <p className="text-xs text-sky-600 leading-snug">
                            {esDialia
                              ? <>Ref: {mgLabel} mg/kg × {peso} kg = <strong>{formatDosis(baseMg)}/día</strong> → <strong>{porToma}</strong> por toma</>
                              : <>Ref: {mgLabel} mg/kg × {peso} kg = <strong>{porToma}</strong> por toma</>
                            }
                            {med._notaDosis && <span className="text-gray-400"> · {med._notaDosis}</span>}
                          </p>
                        )
                      })()}
                      {isPediatric && med._mgKgMin != null && peso === 0 && (
                        <p className="text-xs text-amber-500">Ingresa el peso para calcular la dosis</p>
                      )}
                      {isPediatric && med._mgKgMin == null && med.nombre && peso > 0 && (
                        <p className="text-xs text-gray-400">Sin datos mg/kg — ingresa la dosis manualmente</p>
                      )}
                    </div>
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

          {/* Instrucciones generales */}
          <Card>
            <CardHeader><h2 className="font-semibold text-gray-800">Instrucciones generales</h2></CardHeader>
            <CardBody>
              <Textarea
                placeholder="Instrucciones adicionales para el paciente, dieta, actividad física..."
                value={form.instrucciones}
                onChange={setForm2('instrucciones')}
                rows={6}
                className="text-xs"
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
