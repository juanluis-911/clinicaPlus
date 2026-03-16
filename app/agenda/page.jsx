'use client'

import { useState, useEffect, useCallback } from 'react'
import { ChevronLeft, ChevronRight, Plus, Stethoscope } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Spinner from '@/components/ui/Spinner'
import {
  formatDateShort, ESTADOS_CITA, TIPOS_CITA,
  getDatePartsInTZ, localToUTC, utcToLocalInput, getInitials,
} from '@/lib/utils'
import { useConfig } from '@/hooks/useConfig'
import { useUser } from '@/hooks/useUser'
import PatientCombobox from '@/components/ui/PatientCombobox'

const HORAS = Array.from({ length: 13 }, (_, i) => i + 7) // 7:00 – 19:00

export default function AgendaPage() {
  const { timezone } = useConfig()
  const { perfil } = useUser()

  const [view, setView]               = useState('semana')
  const [currentDate, setCurrentDate] = useState(new Date())
  const [citas, setCitas]             = useState([])
  const [loading, setLoading]         = useState(true)
  const [modalOpen, setModalOpen]     = useState(false)
  const [selectedCita, setSelectedCita] = useState(null)
  const [modalPatient, setModalPatient] = useState(null)
  const [saving, setSaving]           = useState(false)

  // Doctores de la clínica
  const [doctores, setDoctores]         = useState([])
  // Filtro de agenda (null = todos)
  const [filtroDoctor, setFiltroDoctor] = useState(null)

  const [form, setForm] = useState({
    paciente_id: '', fecha_hora: '', duracion_minutos: '30',
    tipo: 'consulta', estado: 'programada', notas: '', medico_id: '',
  })

  // ── Cargar lista de doctores ────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/equipo/doctores')
      .then(r => r.json())
      .then(({ data }) => {
        const docs = data || []
        setDoctores(docs)
        // Pre-filtrar por el propio doctor si el usuario es médico
        if (perfil?.rol === 'medico') {
          setFiltroDoctor(perfil.id)
        }
      })
  }, [perfil?.id, perfil?.rol])

  // ── Semana ──────────────────────────────────────────────────────────────
  function getWeekDays(date) {
    const day = date.getDay()
    const monday = new Date(date)
    monday.setDate(date.getDate() - (day === 0 ? 6 : day - 1))
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(monday)
      d.setDate(monday.getDate() + i)
      return d
    })
  }

  const days = view === 'semana' ? getWeekDays(currentDate) : [currentDate]

  // ── Fetch citas ─────────────────────────────────────────────────────────
  const fetchCitas = useCallback(async () => {
    setLoading(true)
    const desde = localToUTC(
      utcToLocalInput(days[0].toISOString(), timezone).slice(0, 10) + 'T00:00', timezone
    )
    const hasta = localToUTC(
      utcToLocalInput(days[days.length - 1].toISOString(), timezone).slice(0, 10) + 'T23:59', timezone
    )

    let url = `/api/citas?desde=${desde}&hasta=${hasta}`
    if (filtroDoctor) url += `&medico_id=${filtroDoctor}`

    const res = await fetch(url)
    const { data } = await res.json()
    setCitas(data || [])
    setLoading(false)
  }, [currentDate, view, timezone, filtroDoctor])

  useEffect(() => { fetchCitas() }, [fetchCitas])

  // ── Navegación ──────────────────────────────────────────────────────────
  function navigate(dir) {
    const d = new Date(currentDate)
    if (view === 'semana') d.setDate(d.getDate() + dir * 7)
    else d.setDate(d.getDate() + dir)
    setCurrentDate(d)
  }

  // ── Slots ───────────────────────────────────────────────────────────────
  function getCitasForSlot(day, hora) {
    const dayParts = getDatePartsInTZ(day, timezone)
    return citas.filter(c => {
      const p = getDatePartsInTZ(c.fecha_hora, timezone)
      return (
        p.year  === dayParts.year &&
        p.month === dayParts.month &&
        p.day   === dayParts.day &&
        p.hour  === hora
      )
    })
  }

  // ── Doctor por defecto en modal ─────────────────────────────────────────
  function getDefaultDoctorId() {
    if (filtroDoctor) return filtroDoctor
    if (perfil?.rol === 'medico') return perfil.id
    if (perfil?.doctor_asignado_id) return perfil.doctor_asignado_id
    return doctores[0]?.id || ''
  }

  // ── Modales ─────────────────────────────────────────────────────────────
  function openNew(day, hora) {
    const dayParts = getDatePartsInTZ(day, timezone)
    const pad = n => String(n).padStart(2, '0')
    const local = `${dayParts.year}-${pad(dayParts.month)}-${pad(dayParts.day)}T${pad(hora)}:00`
    setSelectedCita(null)
    setModalPatient(null)
    setForm({
      paciente_id: '', fecha_hora: local, duracion_minutos: '30',
      tipo: 'consulta', estado: 'programada', notas: '',
      medico_id: getDefaultDoctorId(),
    })
    setModalOpen(true)
  }

  function openEdit(cita) {
    setSelectedCita(cita)
    setModalPatient(
      cita.pacientes
        ? { id: cita.paciente_id, nombre: cita.pacientes.nombre, apellido: cita.pacientes.apellido }
        : null
    )
    setForm({
      paciente_id:      cita.paciente_id,
      fecha_hora:       utcToLocalInput(cita.fecha_hora, timezone),
      duracion_minutos: String(cita.duracion_minutos),
      tipo:             cita.tipo,
      estado:           cita.estado,
      notas:            cita.notas || '',
      medico_id:        cita.medico_id || getDefaultDoctorId(),
    })
    setModalOpen(true)
  }

  // ── Guardar / eliminar ──────────────────────────────────────────────────
  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    const payload = {
      ...form,
      fecha_hora:       localToUTC(form.fecha_hora, timezone),
      duracion_minutos: parseInt(form.duracion_minutos),
    }
    const res = selectedCita
      ? await fetch('/api/citas', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: selectedCita.id, ...payload }),
        })
      : await fetch('/api/citas', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
    setSaving(false)
    if (res.ok) { setModalOpen(false); fetchCitas() }
  }

  async function handleDelete() {
    if (!selectedCita || !confirm('¿Eliminar esta cita?')) return
    await fetch(`/api/citas?id=${selectedCita.id}`, { method: 'DELETE' })
    setModalOpen(false)
    fetchCitas()
  }

  // ── Visuales ────────────────────────────────────────────────────────────
  const TODAY_STR = new Date().toDateString()
  const DIAS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']
  const colorMap = {
    blue:  'bg-blue-100 border-blue-300 text-blue-800',
    green: 'bg-emerald-100 border-emerald-300 text-emerald-800',
    red:   'bg-red-100 border-red-300 text-red-700',
    gray:  'bg-gray-100 border-gray-300 text-gray-600',
  }

  const hayVariosDoctores = doctores.length > 1

  return (
    <AppLayout title="Agenda">
      <div className="space-y-4">

        {/* ── Barra superior ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">

          {/* Navegación */}
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
              <ChevronLeft size={16} />
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setCurrentDate(new Date())}>
              Hoy
            </Button>
            <Button variant="secondary" size="sm" onClick={() => navigate(1)}>
              <ChevronRight size={16} />
            </Button>
            <span className="text-sm font-medium text-gray-700 ml-2">
              {view === 'semana'
                ? `${formatDateShort(days[0], timezone)} – ${formatDateShort(days[6], timezone)}`
                : formatDateShort(currentDate, timezone)}
            </span>
          </div>

          {/* Filtros + vistas + nueva cita */}
          <div className="flex items-center gap-2 flex-wrap">

            {/* Filtro por doctor */}
            {hayVariosDoctores && (
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-lg px-2.5 py-1.5">
                <Stethoscope size={13} className="text-gray-400 flex-shrink-0" />
                <select
                  value={filtroDoctor || ''}
                  onChange={e => setFiltroDoctor(e.target.value || null)}
                  className="text-xs text-gray-700 bg-transparent focus:outline-none max-w-[180px]"
                >
                  <option value="">Todos los doctores</option>
                  {doctores.map(d => (
                    <option key={d.id} value={d.id}>
                      {d.nombre_completo}{d.especialidad ? ` (${d.especialidad})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Vista día/semana */}
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setView('dia')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === 'dia' ? 'bg-sky-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >Día</button>
              <button
                onClick={() => setView('semana')}
                className={`px-3 py-1.5 text-xs font-medium transition-colors ${view === 'semana' ? 'bg-sky-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
              >Semana</button>
            </div>

            <Button size="sm" onClick={() => openNew(currentDate, 9)}>
              <Plus size={14} /> Nueva cita
            </Button>
          </div>
        </div>

        {/* ── Cuadrícula ── */}
        <Card className="overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16"><Spinner size="lg" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="w-16 py-3 text-xs text-gray-400 font-normal"></th>
                    {days.map((day, i) => {
                      const isToday = day.toDateString() === TODAY_STR
                      return (
                        <th key={i} className="py-3 text-center">
                          <div className="flex flex-col items-center">
                            <span className="text-xs text-gray-400">{DIAS[i]}</span>
                            <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-semibold mt-0.5 ${isToday ? 'bg-sky-600 text-white' : 'text-gray-700'}`}>
                              {day.getDate()}
                            </span>
                          </div>
                        </th>
                      )
                    })}
                  </tr>
                </thead>
                <tbody>
                  {HORAS.map(hora => (
                    <tr key={hora} className="border-b border-gray-50 hover:bg-gray-50/50">
                      <td className="py-2 pr-3 text-right text-xs text-gray-400 align-top pt-3">
                        {hora}:00
                      </td>
                      {days.map((day, di) => {
                        const slotCitas = getCitasForSlot(day, hora)
                        return (
                          <td
                            key={di}
                            className="border-l border-gray-100 p-1 align-top min-h-[52px] cursor-pointer"
                            onClick={() => openNew(day, hora)}
                          >
                            <div className="space-y-0.5" onClick={e => e.stopPropagation()}>
                              {slotCitas.map(cita => {
                                const estado = ESTADOS_CITA[cita.estado]
                                // Mostrar iniciales del doctor solo cuando se ven todos
                                const docIniciales = hayVariosDoctores && !filtroDoctor
                                  ? (() => {
                                      const d = doctores.find(x => x.id === cita.medico_id)
                                      return d ? getInitials(d.nombre_completo) : null
                                    })()
                                  : null
                                return (
                                  <button
                                    key={cita.id}
                                    onClick={() => openEdit(cita)}
                                    className={`w-full text-left px-2 py-1 rounded border text-xs ${colorMap[estado?.color] || colorMap.blue}`}
                                  >
                                    <span className="truncate block">
                                      {cita.pacientes?.nombre} {cita.pacientes?.apellido?.slice(0, 1)}.
                                    </span>
                                    {docIniciales && (
                                      <span className="text-[10px] opacity-60">{docIniciales}</span>
                                    )}
                                  </button>
                                )
                              })}
                            </div>
                          </td>
                        )
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>

      {/* ── Modal ── */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={selectedCita ? 'Editar cita' : 'Nueva cita'}
      >
        <form onSubmit={handleSave} className="space-y-4">

          {/* Selector de doctor — solo cuando hay más de uno */}
          {hayVariosDoctores && (
            <Select
              label="Doctor"
              required
              value={form.medico_id}
              onChange={e => setForm(f => ({ ...f, medico_id: e.target.value }))}
              options={doctores.map(d => ({
                value: d.id,
                label: `${d.nombre_completo}${d.especialidad ? ` — ${d.especialidad}` : ''}`,
              }))}
            />
          )}

          <PatientCombobox
            label="Paciente"
            required
            value={form.paciente_id}
            onSelect={p => setForm(f => ({ ...f, paciente_id: p?.id || '' }))}
            initialPatient={modalPatient}
          />
          <Input
            label="Fecha y hora"
            type="datetime-local"
            required
            value={form.fecha_hora}
            onChange={e => setForm(f => ({ ...f, fecha_hora: e.target.value }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Select
              label="Duración"
              value={form.duracion_minutos}
              onChange={e => setForm(f => ({ ...f, duracion_minutos: e.target.value }))}
              options={[
                { value: '15', label: '15 min' },
                { value: '30', label: '30 min' },
                { value: '45', label: '45 min' },
                { value: '60', label: '1 hora' },
                { value: '90', label: '1.5 horas' },
              ]}
            />
            <Select
              label="Tipo"
              value={form.tipo}
              onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
              options={TIPOS_CITA}
            />
          </div>
          <Select
            label="Estado"
            value={form.estado}
            onChange={e => setForm(f => ({ ...f, estado: e.target.value }))}
            options={Object.entries(ESTADOS_CITA).map(([v, { label }]) => ({ value: v, label }))}
          />
          <Input
            label="Notas"
            value={form.notas}
            onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
            placeholder="Motivo, instrucciones..."
          />
          <div className="flex justify-between pt-2">
            {selectedCita && (
              <Button variant="danger" size="sm" type="button" onClick={handleDelete}>
                Eliminar
              </Button>
            )}
            <div className="flex gap-2 ml-auto">
              <Button variant="secondary" size="sm" type="button" onClick={() => setModalOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" size="sm" loading={saving}>
                {selectedCita ? 'Guardar cambios' : 'Crear cita'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}
