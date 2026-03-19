'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Plus, ChevronDown, ChevronRight, Stethoscope, Edit2 } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Card, { CardBody, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input, { Textarea } from '@/components/ui/Input'
import { PageSpinner } from '@/components/ui/Spinner'
import PermissionGate from '@/components/PermissionGate'
import { formatDate, formatDateShort } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export default function HistorialPage() {
  const { id } = useParams()
  const [paciente, setPaciente] = useState(null)
  const [consultas, setConsultas] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    fecha: new Date().toISOString().slice(0, 10),
    motivo_consulta: '', exploracion_fisica: '',
    diagnostico: '', plan_tratamiento: '', notas: '',
  })

  // Editar consulta
  const [editingConsulta, setEditingConsulta] = useState(null)
  const [savingEdit, setSavingEdit] = useState(false)

  async function loadData() {
    const supabase = createClient()
    const [{ data: p }, { data: cons }] = await Promise.all([
      supabase.from('pacientes').select('id, nombre, apellido').eq('id', id).single(),
      supabase.from('consultas').select('*').eq('paciente_id', id).order('fecha', { ascending: false }),
    ])
    setPaciente(p)
    setConsultas(cons || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [id])

  function set(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })) }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { error } = await supabase.from('consultas').insert({
      ...form, paciente_id: id,
      medico_id: user.id, creado_por: user.id,
    })
    setSaving(false)
    if (!error) {
      setModalOpen(false)
      setForm({ fecha: new Date().toISOString().slice(0, 10), motivo_consulta: '', exploracion_fisica: '', diagnostico: '', plan_tratamiento: '', notas: '' })
      loadData()
    }
  }

  async function handleUpdateConsulta(e) {
    e.preventDefault()
    setSavingEdit(true)
    const res = await fetch('/api/consultas', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingConsulta),
    })
    setSavingEdit(false)
    if (res.ok) {
      setEditingConsulta(null)
      loadData()
    }
  }

  if (loading) return <AppLayout title="Historial de consultas"><PageSpinner /></AppLayout>

  return (
    <AppLayout title={`Historial — ${paciente?.nombre} ${paciente?.apellido}`}>
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Link href={`/pacientes/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft size={14} /> {paciente?.nombre} {paciente?.apellido}
          </Link>
          <PermissionGate action="crear_consulta">
            <Button size="sm" onClick={() => setModalOpen(true)}>
              <Plus size={14} /> Nueva consulta
            </Button>
          </PermissionGate>
        </div>

        {consultas.length === 0 ? (
          <Card>
            <CardBody className="text-center py-16">
              <Stethoscope size={36} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Sin consultas registradas</p>
            </CardBody>
          </Card>
        ) : (
          <div className="space-y-3">
            {consultas.map(c => (
              <Card key={c.id} className="overflow-hidden">
                <button
                  className="w-full px-5 py-4 flex items-center gap-3 text-left hover:bg-gray-50 transition-colors"
                  onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                >
                  <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Stethoscope size={14} className="text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{c.motivo_consulta}</p>
                    <p className="text-xs text-gray-400">{formatDate(c.fecha)}</p>
                  </div>
                  {c.diagnostico && (
                    <span className="hidden sm:block text-xs text-sky-600 truncate max-w-[140px]">{c.diagnostico}</span>
                  )}
                  {expanded === c.id ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
                </button>

                {expanded === c.id && (
                  <div className="px-5 pb-5 border-t border-gray-100 pt-4 space-y-4">
                    <ConsultaField label="Exploración física" value={c.exploracion_fisica} />
                    <ConsultaField label="Diagnóstico" value={c.diagnostico} highlight />
                    <ConsultaField label="Plan de tratamiento" value={c.plan_tratamiento} />
                    <ConsultaField label="Notas" value={c.notas} />
                    <PermissionGate action="crear_consulta">
                      <div className="pt-3 border-t border-gray-100 flex justify-end">
                        <button
                          type="button"
                          onClick={e => { e.stopPropagation(); setEditingConsulta({ ...c }) }}
                          className="flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 transition-colors px-3 py-1.5 rounded-lg border border-sky-200"
                        >
                          <Edit2 size={12} /> Editar consulta
                        </button>
                      </div>
                    </PermissionGate>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Nueva consulta" size="lg">
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Fecha" type="date" required value={form.fecha} onChange={set('fecha')} />
          <Textarea label="Motivo de consulta" required value={form.motivo_consulta} onChange={set('motivo_consulta')} placeholder="Descripción del motivo de la visita..." />
          <Textarea label="Exploración física" value={form.exploracion_fisica} onChange={set('exploracion_fisica')} placeholder="Signos vitales, hallazgos..." />
          <Textarea label="Diagnóstico" value={form.diagnostico} onChange={set('diagnostico')} placeholder="CIE-10, descripción..." />
          <Textarea label="Plan de tratamiento" value={form.plan_tratamiento} onChange={set('plan_tratamiento')} placeholder="Medicamentos, indicaciones, seguimiento..." />
          <Textarea label="Notas adicionales" value={form.notas} onChange={set('notas')} placeholder="Observaciones relevantes..." />
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button type="submit" loading={saving}>Guardar consulta</Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Editar consulta ───────────────────────────────────────── */}
      <Modal open={!!editingConsulta} onClose={() => setEditingConsulta(null)} title="Editar consulta" size="lg">
        {editingConsulta && (
          <form onSubmit={handleUpdateConsulta} className="space-y-4">
            <Input label="Fecha" type="date" required
              value={editingConsulta.fecha}
              onChange={e => setEditingConsulta(p => ({ ...p, fecha: e.target.value }))} />
            <Textarea label="Motivo de consulta" required
              value={editingConsulta.motivo_consulta || ''}
              onChange={e => setEditingConsulta(p => ({ ...p, motivo_consulta: e.target.value }))}
              placeholder="Descripción del motivo de la visita..." />
            <Textarea label="Exploración física"
              value={editingConsulta.exploracion_fisica || ''}
              onChange={e => setEditingConsulta(p => ({ ...p, exploracion_fisica: e.target.value }))}
              placeholder="Signos vitales, hallazgos..." />
            <Textarea label="Diagnóstico"
              value={editingConsulta.diagnostico || ''}
              onChange={e => setEditingConsulta(p => ({ ...p, diagnostico: e.target.value }))}
              placeholder="CIE-10, descripción..." />
            <Textarea label="Plan de tratamiento"
              value={editingConsulta.plan_tratamiento || ''}
              onChange={e => setEditingConsulta(p => ({ ...p, plan_tratamiento: e.target.value }))}
              placeholder="Medicamentos, indicaciones, seguimiento..." />
            <Textarea label="Notas adicionales"
              value={editingConsulta.notas || ''}
              onChange={e => setEditingConsulta(p => ({ ...p, notas: e.target.value }))}
              placeholder="Observaciones relevantes..." />
            <div className="flex justify-end gap-2 pt-2 border-t border-gray-100">
              <Button variant="secondary" type="button" onClick={() => setEditingConsulta(null)}>Cancelar</Button>
              <Button type="submit" loading={savingEdit}>Guardar cambios</Button>
            </div>
          </form>
        )}
      </Modal>
    </AppLayout>
  )
}

function ConsultaField({ label, value, highlight }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
      <p className={`text-sm whitespace-pre-line ${highlight ? 'text-sky-700 font-medium' : 'text-gray-700'}`}>{value}</p>
    </div>
  )
}
