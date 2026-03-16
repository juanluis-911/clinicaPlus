'use client'

import { useState, useEffect, use } from 'react'
import { useRouter } from 'next/navigation'
import {
  ArrowLeft, Save, User, Clock, DollarSign, ShieldCheck,
  Ban, ChevronRight, CheckCircle, XCircle, Stethoscope,
} from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Card, { CardBody, CardHeader, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input, { Textarea } from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import { usePermission } from '@/hooks/usePermission'
import { getInitials, cn } from '@/lib/utils'

// ─── Constantes ─────────────────────────────────────────────────────────────
const DIAS_SEMANA = [
  { value: 'lunes',     label: 'Lun' },
  { value: 'martes',    label: 'Mar' },
  { value: 'miercoles', label: 'Mié' },
  { value: 'jueves',    label: 'Jue' },
  { value: 'viernes',   label: 'Vie' },
  { value: 'sabado',    label: 'Sáb' },
  { value: 'domingo',   label: 'Dom' },
]

const DURACIONES = [
  { value: '',   label: 'Usar predeterminado de la clínica' },
  { value: '15', label: '15 min' },
  { value: '20', label: '20 min' },
  { value: '30', label: '30 min' },
  { value: '45', label: '45 min' },
  { value: '60', label: '1 hora' },
  { value: '90', label: '1.5 horas' },
]

const MONEDAS = [
  { value: '',    label: 'Usar moneda de la clínica' },
  { value: 'MXN', label: 'MXN — Peso mexicano' },
  { value: 'USD', label: 'USD — Dólar' },
  { value: 'EUR', label: 'EUR — Euro' },
]

// Permisos configurables para asistentes, agrupados por sección
const PERMISOS_CONFIG = [
  {
    seccion: 'Pacientes',
    items: [
      { key: 'crear_paciente',    label: 'Crear nuevos pacientes',        default: true },
      { key: 'editar_paciente',   label: 'Editar datos de pacientes',     default: true },
      { key: 'eliminar_paciente', label: 'Eliminar pacientes',            default: false },
    ],
  },
  {
    seccion: 'Consultas',
    items: [
      { key: 'ver_consulta',    label: 'Ver notas y diagnósticos',   default: true },
      { key: 'crear_consulta',  label: 'Crear consultas',            default: false },
      { key: 'editar_consulta', label: 'Editar consultas existentes', default: false },
    ],
  },
  {
    seccion: 'Prescripciones',
    items: [
      { key: 'ver_prescripcion', label: 'Ver prescripciones', default: true },
    ],
  },
  {
    seccion: 'Agenda',
    items: [
      { key: 'gestionar_agenda', label: 'Agendar y editar citas', default: true },
    ],
  },
  {
    seccion: 'Documentos',
    items: [
      { key: 'gestionar_documentos', label: 'Subir y gestionar documentos', default: true },
    ],
  },
]

// ─── Toggle switch ───────────────────────────────────────────────────────────
function Toggle({ value, onChange, disabled }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      disabled={disabled}
      onClick={() => onChange(!value)}
      className={cn(
        'relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none',
        value ? 'bg-sky-600' : 'bg-gray-200',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
    >
      <span
        className={cn(
          'pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200',
          value ? 'translate-x-4' : 'translate-x-0'
        )}
      />
    </button>
  )
}

// ─── Página principal ─────────────────────────────────────────────────────────
export default function MiembroDetallePage({ params }) {
  const { id } = use(params)
  const router = useRouter()
  const { isOwner } = usePermission()

  const [miembro, setMiembro]             = useState(null)
  const [loading, setLoading]             = useState(true)
  const [saving, setSaving]               = useState(false)
  const [success, setSuccess]             = useState('')
  const [error, setError]                 = useState('')
  const [doctores, setDoctores]           = useState([])
  const [doctoresAsignados, setDoctoresAsignados] = useState([])

  // Formulario de info personal
  const [infoForm, setInfoForm] = useState({
    especialidad: '', cedula_profesional: '', telefono: '', bio: '',
  })

  // Formulario de horario personal
  const [usaHorarioPropio, setUsaHorarioPropio] = useState(false)
  const [horarioForm, setHorarioForm] = useState({
    horario_hora_inicio: '08:00',
    horario_hora_fin:    '18:00',
    horario_dias:        ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
    horario_duracion_min: '',
  })

  // Honorarios
  const [honorariosForm, setHonorariosForm] = useState({
    costo_consulta_propio: '',
    moneda_propia: '',
  })

  // Permisos (solo asistentes)
  const [permisos, setPermisos] = useState({})

  // ── Cargar datos del miembro + lista de doctores ───────────────────────
  useEffect(() => {
    if (!isOwner) return
    Promise.all([
      fetch(`/api/equipo/${id}`).then(r => r.json()),
      fetch('/api/equipo/doctores').then(r => r.json()),
    ]).then(([{ data, error }, docRes]) => {
        if (error || !data) { setError('Miembro no encontrado'); setLoading(false); return }
        setMiembro(data)
        setDoctores(docRes.data || [])
        setDoctoresAsignados(data.doctores_asignados || [])

        setInfoForm({
          especialidad:       data.especialidad       || '',
          cedula_profesional: data.cedula_profesional || '',
          telefono:           data.telefono           || '',
          bio:                data.bio                || '',
        })

        const tieneHorarioPropio = !!(data.horario_hora_inicio || data.horario_dias?.length)
        setUsaHorarioPropio(tieneHorarioPropio)
        setHorarioForm({
          horario_hora_inicio:  data.horario_hora_inicio  || '08:00',
          horario_hora_fin:     data.horario_hora_fin     || '18:00',
          horario_dias:         data.horario_dias         || ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
          horario_duracion_min: data.horario_duracion_min ? String(data.horario_duracion_min) : '',
        })

        setHonorariosForm({
          costo_consulta_propio: data.costo_consulta_propio != null ? String(data.costo_consulta_propio) : '',
          moneda_propia:         data.moneda_propia || '',
        })

        setPermisos(data.permisos || {})
        setLoading(false)
      })
      .catch(() => { setError('Error al cargar'); setLoading(false) })
  }, [id, isOwner])

  if (!isOwner) {
    return (
      <AppLayout title="Detalle de miembro">
        <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
          Sin permisos para ver esta sección.
        </div>
      </AppLayout>
    )
  }

  // ── Guardar sección ─────────────────────────────────────────────────────
  async function saveSection(payload, label) {
    setSaving(true)
    setError('')
    setSuccess('')
    const res = await fetch(`/api/equipo/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error || 'Error al guardar'); return false }
    setSuccess(label)
    setTimeout(() => setSuccess(''), 3000)
    return true
  }

  // ── Handlers por sección ────────────────────────────────────────────────
  function handleSaveInfo(e) {
    e.preventDefault()
    saveSection(infoForm, 'Información guardada')
  }

  function handleSaveHorario(e) {
    e.preventDefault()
    const payload = usaHorarioPropio
      ? {
          ...horarioForm,
          horario_duracion_min: horarioForm.horario_duracion_min
            ? parseInt(horarioForm.horario_duracion_min) : null,
        }
      : {
          horario_hora_inicio: null, horario_hora_fin: null,
          horario_dias: null, horario_duracion_min: null,
        }
    saveSection(payload, 'Horario guardado')
  }

  function handleSaveHonorarios(e) {
    e.preventDefault()
    saveSection({
      costo_consulta_propio: honorariosForm.costo_consulta_propio
        ? parseFloat(honorariosForm.costo_consulta_propio) : null,
      moneda_propia: honorariosForm.moneda_propia || null,
    }, 'Honorarios guardados')
  }

  function handleSavePermisos(e) {
    e.preventDefault()
    saveSection({ permisos }, 'Permisos guardados')
  }

  async function handleToggleActivo() {
    const ok = await saveSection({ activo: !miembro.activo },
      miembro.activo ? 'Miembro desactivado' : 'Miembro reactivado')
    if (ok) setMiembro(m => ({ ...m, activo: !m.activo }))
  }

  function toggleDoctorAsignado(docId) {
    setDoctoresAsignados(prev =>
      prev.includes(docId) ? prev.filter(id => id !== docId) : [...prev, docId]
    )
  }

  function handleSaveDoctoresAsignados(e) {
    e.preventDefault()
    saveSection({ doctores_asignados: doctoresAsignados }, 'Doctores asignados guardados')
  }

  function toggleDia(dia) {
    setHorarioForm(f => ({
      ...f,
      horario_dias: f.horario_dias.includes(dia)
        ? f.horario_dias.filter(d => d !== dia)
        : [...f.horario_dias, dia],
    }))
  }

  function setPermiso(key, val) {
    setPermisos(p => ({ ...p, [key]: val }))
  }

  // Calcular valor efectivo de un permiso (con fallback al rol)
  const ASISTENTE_DEFAULTS = Object.fromEntries(
    PERMISOS_CONFIG.flatMap(g => g.items.map(i => [i.key, i.default]))
  )
  function getPermisoEfectivo(key) {
    if (key in permisos) return permisos[key]
    return ASISTENTE_DEFAULTS[key] ?? false
  }

  if (loading) return <AppLayout title="Cargando…"><PageSpinner /></AppLayout>

  const rolLabel = miembro.rol === 'medico' ? 'Médico asociado' : 'Asistente'
  const rolColor = miembro.rol === 'medico' ? 'sky' : 'purple'

  return (
    <AppLayout title={miembro.nombre_completo}>
      <div className="max-w-2xl mx-auto space-y-5">

        {/* ── Header ── */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/configuracion/equipo')}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="flex items-center gap-3 flex-1">
            <div className="w-12 h-12 rounded-full bg-sky-700 flex items-center justify-center text-white font-semibold text-base flex-shrink-0">
              {getInitials(miembro.nombre_completo)}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold text-gray-900">{miembro.nombre_completo}</h1>
                <Badge color={rolColor}>{rolLabel}</Badge>
                {!miembro.activo && <Badge color="gray">Inactivo</Badge>}
              </div>
              {miembro.email && <p className="text-sm text-gray-500">{miembro.email}</p>}
            </div>
          </div>
        </div>

        {/* Feedback global */}
        {success && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5 text-sm text-emerald-700">
            <CheckCircle size={14} /> {success}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 text-sm text-red-600">
            <XCircle size={14} /> {error}
          </div>
        )}

        {/* ── 1. Información personal ── */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <User size={15} /> Información profesional
            </h2>
          </CardHeader>
          <form onSubmit={handleSaveInfo}>
            <CardBody className="space-y-4">
              <Input
                label="Especialidad"
                placeholder="Odontología General"
                value={infoForm.especialidad}
                onChange={e => setInfoForm(f => ({ ...f, especialidad: e.target.value }))}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Cédula profesional"
                  placeholder="12345678"
                  value={infoForm.cedula_profesional}
                  onChange={e => setInfoForm(f => ({ ...f, cedula_profesional: e.target.value }))}
                />
                <Input
                  label="Teléfono"
                  type="tel"
                  placeholder="55 1234 5678"
                  value={infoForm.telefono}
                  onChange={e => setInfoForm(f => ({ ...f, telefono: e.target.value }))}
                />
              </div>
              <Textarea
                label="Descripción / Presentación"
                placeholder="Breve descripción para mostrar a pacientes..."
                value={infoForm.bio}
                onChange={e => setInfoForm(f => ({ ...f, bio: e.target.value }))}
                rows={3}
              />
            </CardBody>
            <CardFooter>
              <div className="flex justify-end">
                <Button type="submit" size="sm" loading={saving}>
                  <Save size={13} /> Guardar
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* ── 2. Horario personal ── */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Clock size={15} /> Horario de trabajo
            </h2>
          </CardHeader>
          <form onSubmit={handleSaveHorario}>
            <CardBody className="space-y-4">
              {/* Toggle: horario propio vs clínica */}
              <div className="flex items-center justify-between rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
                <div>
                  <p className="text-sm font-medium text-gray-800">Horario personalizado</p>
                  <p className="text-xs text-gray-500">
                    {usaHorarioPropio
                      ? 'Este miembro tiene su propio horario'
                      : 'Usando el horario general de la clínica'}
                  </p>
                </div>
                <Toggle value={usaHorarioPropio} onChange={setUsaHorarioPropio} />
              </div>

              {usaHorarioPropio && (
                <>
                  {/* Días */}
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">Días de trabajo</p>
                    <div className="flex gap-1.5 flex-wrap">
                      {DIAS_SEMANA.map(({ value, label }) => {
                        const active = horarioForm.horario_dias.includes(value)
                        return (
                          <button
                            key={value}
                            type="button"
                            onClick={() => toggleDia(value)}
                            className={cn(
                              'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                              active
                                ? 'bg-sky-600 text-white border-sky-600'
                                : 'bg-white text-gray-500 border-gray-300 hover:border-sky-400'
                            )}
                          >
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {/* Horas */}
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Hora de inicio"
                      type="time"
                      value={horarioForm.horario_hora_inicio}
                      onChange={e => setHorarioForm(f => ({ ...f, horario_hora_inicio: e.target.value }))}
                    />
                    <Input
                      label="Hora de fin"
                      type="time"
                      value={horarioForm.horario_hora_fin}
                      onChange={e => setHorarioForm(f => ({ ...f, horario_hora_fin: e.target.value }))}
                    />
                  </div>

                  {/* Duración cita */}
                  <div className="flex flex-col gap-1">
                    <label className="text-sm font-medium text-gray-700">Duración predeterminada de cita</label>
                    <select
                      value={horarioForm.horario_duracion_min}
                      onChange={e => setHorarioForm(f => ({ ...f, horario_duracion_min: e.target.value }))}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                    >
                      {DURACIONES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                    </select>
                  </div>
                </>
              )}
            </CardBody>
            <CardFooter>
              <div className="flex justify-end">
                <Button type="submit" size="sm" loading={saving}>
                  <Save size={13} /> Guardar horario
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* ── 3. Honorarios (médicos principalmente) ── */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <DollarSign size={15} /> Honorarios
            </h2>
          </CardHeader>
          <form onSubmit={handleSaveHonorarios}>
            <CardBody className="space-y-4">
              <p className="text-xs text-gray-500">
                Si se deja vacío, se usa el costo configurado en la clínica.
              </p>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Costo de consulta"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Ej. 800.00"
                  value={honorariosForm.costo_consulta_propio}
                  onChange={e => setHonorariosForm(f => ({ ...f, costo_consulta_propio: e.target.value }))}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Moneda</label>
                  <select
                    value={honorariosForm.moneda_propia}
                    onChange={e => setHonorariosForm(f => ({ ...f, moneda_propia: e.target.value }))}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
                  >
                    {MONEDAS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              </div>
            </CardBody>
            <CardFooter>
              <div className="flex justify-end">
                <Button type="submit" size="sm" loading={saving}>
                  <Save size={13} /> Guardar honorarios
                </Button>
              </div>
            </CardFooter>
          </form>
        </Card>

        {/* ── 4. Doctores asignados (solo asistentes, solo si hay más de 1 doctor) ── */}
        {miembro.rol === 'asistente' && doctores.length > 1 && (
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Stethoscope size={15} /> Doctores asignados
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Esta asistente puede gestionar citas para los doctores seleccionados.
                Sin asignación, verá todas las citas de la clínica.
              </p>
            </CardHeader>
            <form onSubmit={handleSaveDoctoresAsignados}>
              <CardBody>
                <div className="space-y-2">
                  {doctores.map(d => {
                    const activo = doctoresAsignados.includes(d.id)
                    return (
                      <label
                        key={d.id}
                        className={cn(
                          'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                          activo
                            ? 'bg-sky-50 border-sky-200'
                            : 'bg-white border-gray-200 hover:border-sky-200'
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={activo}
                          onChange={() => toggleDoctorAsignado(d.id)}
                          className="h-4 w-4 rounded border-gray-300 text-sky-600 focus:ring-sky-500"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{d.nombre_completo}</p>
                          {d.especialidad && (
                            <p className="text-xs text-gray-500">{d.especialidad}</p>
                          )}
                        </div>
                        {d.esDueno && (
                          <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                            Titular
                          </span>
                        )}
                      </label>
                    )
                  })}
                </div>
                {doctoresAsignados.length === 0 && (
                  <p className="text-xs text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2 mt-3">
                    Sin doctores asignados — verá todas las citas de la clínica.
                  </p>
                )}
              </CardBody>
              <CardFooter>
                <div className="flex justify-end">
                  <Button type="submit" size="sm" loading={saving}>
                    <Save size={13} /> Guardar asignación
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* ── 5. Permisos (solo asistentes) ── */}
        {miembro.rol === 'asistente' && (
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <ShieldCheck size={15} /> Permisos
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Ajusta qué puede hacer este asistente en el sistema.
              </p>
            </CardHeader>
            <form onSubmit={handleSavePermisos}>
              <CardBody className="space-y-5">
                {PERMISOS_CONFIG.map(grupo => (
                  <div key={grupo.seccion}>
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                      {grupo.seccion}
                    </p>
                    <div className="space-y-2">
                      {grupo.items.map(item => {
                        const activo = getPermisoEfectivo(item.key)
                        return (
                          <div key={item.key} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                            <div>
                              <p className="text-sm text-gray-800">{item.label}</p>
                              {!item.default && activo && (
                                <p className="text-xs text-sky-600">Permiso adicional habilitado</p>
                              )}
                              {item.default && !activo && (
                                <p className="text-xs text-amber-600">Permiso predeterminado restringido</p>
                              )}
                            </div>
                            <Toggle
                              value={activo}
                              onChange={val => setPermiso(item.key, val)}
                            />
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </CardBody>
              <CardFooter>
                <div className="flex justify-end">
                  <Button type="submit" size="sm" loading={saving}>
                    <Save size={13} /> Guardar permisos
                  </Button>
                </div>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* ── 5. Estado y acciones peligrosas ── */}
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-800 flex items-center gap-2">
              <Ban size={15} /> Estado de la cuenta
            </h2>
          </CardHeader>
          <CardBody>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-800">
                  {miembro.activo ? 'Cuenta activa' : 'Cuenta inactiva'}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {miembro.activo
                    ? 'El miembro puede iniciar sesión y usar el sistema.'
                    : 'El miembro no puede iniciar sesión ni crear citas.'}
                </p>
              </div>
              <Button
                variant={miembro.activo ? 'danger' : 'success'}
                size="sm"
                loading={saving}
                onClick={handleToggleActivo}
              >
                {miembro.activo ? 'Desactivar' : 'Reactivar'}
              </Button>
            </div>
          </CardBody>
        </Card>

      </div>
    </AppLayout>
  )
}
