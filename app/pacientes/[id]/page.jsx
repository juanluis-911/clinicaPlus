'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Edit2, Save, X, FileText, FolderOpen, Calendar, AlertTriangle, Pill, Activity } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Card, { CardBody, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input, { Textarea } from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { calcAge, formatDate, formatDateShort } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export default function PacienteDetailPage() {
  const { id } = useParams()
  const router = useRouter()
  const [paciente, setPaciente] = useState(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({})
  const [consultas, setConsultas] = useState([])
  const [citas, setCitas] = useState([])

  useEffect(() => {
    async function load() {
      const supabase = createClient()
      const [{ data: p }, { data: cons }, { data: ci }] = await Promise.all([
        supabase.from('pacientes').select('*').eq('id', id).single(),
        supabase.from('consultas').select('id, fecha, motivo_consulta, diagnostico').eq('paciente_id', id).order('fecha', { ascending: false }).limit(5),
        supabase.from('citas').select('id, fecha_hora, tipo, estado').eq('paciente_id', id).gte('fecha_hora', new Date().toISOString()).order('fecha_hora').limit(3),
      ])
      setPaciente(p)
      setForm(p || {})
      setConsultas(cons || [])
      setCitas(ci || [])
      setLoading(false)
    }
    load()
  }, [id])

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSave() {
    setSaving(true)
    const res = await fetch('/api/pacientes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...form }),
    })
    const { data } = await res.json()
    setPaciente(data)
    setEditing(false)
    setSaving(false)
  }

  if (loading) return <AppLayout title="Paciente"><PageSpinner /></AppLayout>
  if (!paciente) return <AppLayout title="Paciente"><p className="text-center py-16 text-gray-400">Paciente no encontrado</p></AppLayout>

  const age = calcAge(paciente.fecha_nacimiento)
  const { ESTADOS_CITA } = require('@/lib/utils')

  return (
    <AppLayout title={`${paciente.nombre} ${paciente.apellido}`}>
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Link href="/pacientes" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft size={14} /> Pacientes
          </Link>
          <div className="flex gap-2">
            <Link href={`/pacientes/${id}/historial`}>
              <Button variant="secondary" size="sm"><FileText size={14} /> Historial</Button>
            </Link>
            <Link href={`/pacientes/${id}/documentos`}>
              <Button variant="secondary" size="sm"><FolderOpen size={14} /> Documentos</Button>
            </Link>
            {!editing ? (
              <Button size="sm" onClick={() => setEditing(true)}><Edit2 size={14} /> Editar</Button>
            ) : (
              <>
                <Button variant="secondary" size="sm" onClick={() => { setEditing(false); setForm(paciente) }}><X size={14} /> Cancelar</Button>
                <Button size="sm" loading={saving} onClick={handleSave}><Save size={14} /> Guardar</Button>
              </>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-5">
          {/* Main info */}
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-sky-100 flex items-center justify-center text-base font-bold text-sky-700">
                    {paciente.nombre[0]}{paciente.apellido[0]}
                  </div>
                  <div>
                    <h2 className="font-semibold text-gray-900 text-lg">{paciente.nombre} {paciente.apellido}</h2>
                    {age !== null && <p className="text-sm text-gray-500">{age} años{paciente.fecha_nacimiento ? ` · ${formatDate(paciente.fecha_nacimiento)}` : ''}</p>}
                  </div>
                </div>
              </CardHeader>
              <CardBody className="space-y-4">
                {editing ? (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Nombre" value={form.nombre || ''} onChange={set('nombre')} />
                      <Input label="Apellido" value={form.apellido || ''} onChange={set('apellido')} />
                    </div>
                    <Input label="Fecha nacimiento" type="date" value={form.fecha_nacimiento || ''} onChange={set('fecha_nacimiento')} />
                    <div className="grid grid-cols-2 gap-4">
                      <Input label="Teléfono" value={form.telefono || ''} onChange={set('telefono')} />
                      <Input label="Email" type="email" value={form.email || ''} onChange={set('email')} />
                    </div>
                    <Input label="Dirección" value={form.direccion || ''} onChange={set('direccion')} />
                  </>
                ) : (
                  <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <DataField label="Teléfono" value={paciente.telefono} />
                    <DataField label="Email" value={paciente.email} />
                    <DataField label="Dirección" value={paciente.direccion} className="col-span-2" />
                  </dl>
                )}
              </CardBody>
            </Card>

            {/* Clinical info */}
            <Card>
              <CardHeader>
                <h3 className="font-semibold text-gray-800">Información clínica</h3>
              </CardHeader>
              <CardBody className="space-y-4">
                {editing ? (
                  <>
                    <Textarea label="Alergias" value={form.alergias || ''} onChange={set('alergias')} rows={2} />
                    <Textarea label="Condiciones crónicas" value={form.condiciones_cronicas || ''} onChange={set('condiciones_cronicas')} rows={2} />
                    <Textarea label="Medicación actual" value={form.medicacion_actual || ''} onChange={set('medicacion_actual')} rows={2} />
                    <Textarea label="Notas" value={form.notas || ''} onChange={set('notas')} rows={2} />
                  </>
                ) : (
                  <div className="space-y-3">
                    <ClinicalField icon={<AlertTriangle size={14} className="text-red-500" />} label="Alergias" value={paciente.alergias} emptyColor="text-green-600" emptyText="Sin alergias registradas" />
                    <ClinicalField icon={<Activity size={14} className="text-amber-500" />} label="Condiciones crónicas" value={paciente.condiciones_cronicas} />
                    <ClinicalField icon={<Pill size={14} className="text-sky-500" />} label="Medicación actual" value={paciente.medicacion_actual} />
                    {paciente.notas && (
                      <div className="bg-gray-50 rounded-lg p-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">Notas</p>
                        <p className="text-sm text-gray-700 whitespace-pre-line">{paciente.notas}</p>
                      </div>
                    )}
                  </div>
                )}
              </CardBody>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-5">
            {/* Upcoming appointments */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5"><Calendar size={14} /> Próximas citas</h3>
                  <Link href="/agenda" className="text-xs text-sky-600 hover:underline">+ Nueva</Link>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                {citas.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-gray-400">Sin citas próximas</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {citas.map(c => {
                      const e = ESTADOS_CITA[c.estado]
                      return (
                        <li key={c.id} className="px-4 py-2.5">
                          <p className="text-xs font-medium text-gray-700">{formatDateShort(c.fecha_hora)}</p>
                          <div className="flex items-center justify-between mt-0.5">
                            <p className="text-xs text-gray-400">{c.tipo}</p>
                            <Badge color={e?.color} className="text-[10px]">{e?.label}</Badge>
                          </div>
                        </li>
                      )
                    })}
                  </ul>
                )}
              </CardBody>
            </Card>

            {/* Recent consultations */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-1.5"><FileText size={14} /> Últimas consultas</h3>
                  <Link href={`/pacientes/${id}/historial`} className="text-xs text-sky-600 hover:underline">Ver todo</Link>
                </div>
              </CardHeader>
              <CardBody className="p-0">
                {consultas.length === 0 ? (
                  <p className="px-4 py-6 text-center text-xs text-gray-400">Sin consultas previas</p>
                ) : (
                  <ul className="divide-y divide-gray-100">
                    {consultas.map(c => (
                      <li key={c.id} className="px-4 py-2.5">
                        <p className="text-xs font-medium text-gray-700">{formatDateShort(c.fecha)}</p>
                        <p className="text-xs text-gray-500 truncate">{c.motivo_consulta}</p>
                        {c.diagnostico && <p className="text-xs text-sky-600 truncate">{c.diagnostico}</p>}
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

function DataField({ label, value, className = '' }) {
  return (
    <div className={className}>
      <dt className="text-xs text-gray-400">{label}</dt>
      <dd className="text-sm text-gray-700 mt-0.5">{value || <span className="text-gray-300">—</span>}</dd>
    </div>
  )
}

function ClinicalField({ icon, label, value, emptyColor = 'text-gray-400', emptyText }) {
  return (
    <div className={`rounded-lg p-3 ${value ? 'bg-gray-50' : 'bg-transparent'}`}>
      <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5 mb-1">{icon}{label}</p>
      {value
        ? <p className="text-sm text-gray-700 whitespace-pre-line">{value}</p>
        : <p className={`text-xs ${emptyColor}`}>{emptyText || 'No registrado'}</p>
      }
    </div>
  )
}
