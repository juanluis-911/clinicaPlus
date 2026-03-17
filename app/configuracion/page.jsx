'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Building2, Clock, Ban, Save, DollarSign, Info, Plus, X, Globe,
  Upload, Trash2, ImageIcon, Palette, Check,
} from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Card, { CardBody, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input, { Textarea } from '@/components/ui/Input'
import { PageSpinner } from '@/components/ui/Spinner'
import { usePermission } from '@/hooks/usePermission'
import { cn } from '@/lib/utils'

// ── Constantes ────────────────────────────────────────────────────────────────
const DIAS_SEMANA = [
  { value: 'lunes',     label: 'Lunes' },
  { value: 'martes',    label: 'Martes' },
  { value: 'miercoles', label: 'Miércoles' },
  { value: 'jueves',    label: 'Jueves' },
  { value: 'viernes',   label: 'Viernes' },
  { value: 'sabado',    label: 'Sábado' },
  { value: 'domingo',   label: 'Domingo' },
]

const ZONAS_HORARIAS = [
  { value: 'America/Mexico_City',  label: 'CDMX / Centro (UTC-6/-5)' },
  { value: 'America/Monterrey',    label: 'Monterrey / Noreste (UTC-6/-5)' },
  { value: 'America/Cancun',       label: 'Cancún / Quintana Roo (UTC-5)' },
  { value: 'America/Chihuahua',    label: 'Chihuahua (UTC-7/-6)' },
  { value: 'America/Hermosillo',   label: 'Sonora / Hermosillo (UTC-7)' },
  { value: 'America/Mazatlan',     label: 'Mazatlán / Sinaloa (UTC-7/-6)' },
  { value: 'America/Tijuana',      label: 'Tijuana / Baja California (UTC-8/-7)' },
  { value: 'America/Bogota',       label: 'Colombia (UTC-5)' },
  { value: 'America/Lima',         label: 'Perú (UTC-5)' },
  { value: 'America/Guayaquil',    label: 'Ecuador (UTC-5)' },
  { value: 'America/Caracas',      label: 'Venezuela (UTC-4)' },
  { value: 'America/Santiago',     label: 'Chile (UTC-4/-3)' },
  { value: 'America/Argentina/Buenos_Aires', label: 'Argentina (UTC-3)' },
  { value: 'America/Sao_Paulo',    label: 'Brasil / São Paulo (UTC-3/-2)' },
  { value: 'America/Guatemala',    label: 'Guatemala (UTC-6)' },
  { value: 'America/El_Salvador',  label: 'El Salvador (UTC-6)' },
  { value: 'America/Costa_Rica',   label: 'Costa Rica (UTC-6)' },
  { value: 'America/Panama',       label: 'Panamá (UTC-5)' },
]

const DURACIONES = [
  { value: '15',  label: '15 min' },
  { value: '20',  label: '20 min' },
  { value: '30',  label: '30 min' },
  { value: '45',  label: '45 min' },
  { value: '60',  label: '1 hora' },
  { value: '90',  label: '1.5 horas' },
]

const PALETAS = [
  { value: 'sky',     label: 'Cielo',     hex: '#0284c7' },
  { value: 'violet',  label: 'Violeta',   hex: '#7c3aed' },
  { value: 'emerald', label: 'Esmeralda', hex: '#059669' },
  { value: 'rose',    label: 'Rosa',      hex: '#e11d48' },
  { value: 'amber',   label: 'Ámbar',     hex: '#d97706' },
]

const TEMAS_SIDEBAR = [
  { value: 'oscuro',  label: 'Oscuro',  bgNav: '#111827', bgItem: '#1f2937' },
  { value: 'claro',   label: 'Claro',   bgNav: '#ffffff', bgItem: '#f3f4f6' },
  { value: 'sistema', label: 'Sistema' },
]

const SECCIONES = [
  { id: 'apariencia', label: 'Apariencia',   icon: Palette    },
  { id: 'clinica',    label: 'Clínica',      icon: Building2  },
  { id: 'horario',    label: 'Horario',      icon: Clock      },
  { id: 'timezone',   label: 'Zona horaria', icon: Globe      },
  { id: 'festivos',   label: 'Festivos',     icon: Ban        },
  { id: 'tarifas',    label: 'Tarifas',      icon: DollarSign },
]

const DEFAULT_FORM = {
  paleta_color:  'sky',
  tema_sidebar:  'oscuro',
  clinica_nombre: '',
  clinica_especialidad: '',
  clinica_telefono: '',
  clinica_telefono2: '',
  clinica_email: '',
  clinica_direccion: '',
  clinica_ciudad: '',
  clinica_cp: '',
  clinica_sitio_web: '',
  hora_inicio: '08:00',
  hora_fin: '18:00',
  duracion_cita_minutos: '30',
  dias_consulta: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'],
  dias_festivos: [],
  buffer_entre_citas: '0',
  max_citas_dia: '0',
  politica_cancelacion: '',
  notas_internas: '',
  costo_consulta: '',
  moneda: 'MXN',
  zona_horaria: 'America/Mexico_City',
}

// ── Select inline reutilizable ────────────────────────────────────────────────
function FieldSelect({ label, value, onChange, disabled, children }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-700">{label}</label>}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] disabled:bg-gray-50 disabled:text-gray-500"
      >
        {children}
      </select>
    </div>
  )
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function ConfiguracionPage() {
  const { can } = usePermission()
  const [seccion, setSeccion] = useState('apariencia')
  const [form, setForm]       = useState(DEFAULT_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving]   = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError]     = useState('')
  const [nuevaFecha, setNuevaFecha] = useState('')
  const [logoUrl, setLogoUrl]           = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoError, setLogoError]         = useState('')
  const logoInputRef = useRef(null)

  useEffect(() => {
    fetch('/api/configuracion')
      .then(r => r.json())
      .then(({ data }) => {
        if (data) {
          setForm({
            ...DEFAULT_FORM,
            ...data,
            duracion_cita_minutos: String(data.duracion_cita_minutos || 30),
            buffer_entre_citas:    String(data.buffer_entre_citas ?? 0),
            max_citas_dia:         String(data.max_citas_dia ?? 0),
            costo_consulta:        data.costo_consulta != null ? String(data.costo_consulta) : '',
            dias_consulta:         data.dias_consulta || DEFAULT_FORM.dias_consulta,
            dias_festivos:         data.dias_festivos || [],
          })
          setLogoUrl(data.clinica_logo_url || '')
        }
        setLoading(false)
      })
  }, [])

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  function selectPaleta(value) {
    setForm(f => ({ ...f, paleta_color: value }))
    document.documentElement.setAttribute('data-paleta', value)
  }

  function selectTema(value) {
    setForm(f => ({ ...f, tema_sidebar: value }))
    document.documentElement.setAttribute('data-sidebar', value)
  }

  function toggleDia(dia) {
    setForm(f => ({
      ...f,
      dias_consulta: f.dias_consulta.includes(dia)
        ? f.dias_consulta.filter(d => d !== dia)
        : [...f.dias_consulta, dia],
    }))
  }

  function agregarFestivo() {
    if (!nuevaFecha || form.dias_festivos.includes(nuevaFecha)) return
    setForm(f => ({ ...f, dias_festivos: [...f.dias_festivos, nuevaFecha].sort() }))
    setNuevaFecha('')
  }

  function eliminarFestivo(fecha) {
    setForm(f => ({ ...f, dias_festivos: f.dias_festivos.filter(d => d !== fecha) }))
  }

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoError('')
    setUploadingLogo(true)
    const fd = new FormData()
    fd.append('file', file)
    const res = await fetch('/api/logo', { method: 'POST', body: fd })
    const json = await res.json()
    setUploadingLogo(false)
    if (!res.ok) { setLogoError(json.error || 'Error al subir el logo'); return }
    setLogoUrl(json.url)
    e.target.value = ''
  }

  async function handleLogoRemove() {
    if (!confirm('¿Eliminar el logo de la clínica?')) return
    setUploadingLogo(true)
    await fetch('/api/logo', { method: 'DELETE' })
    setUploadingLogo(false)
    setLogoUrl('')
  }

  async function handleSave(e) {
    e.preventDefault()
    setError('')
    if (!form.hora_inicio || !form.hora_fin) { setError('Horario de inicio y fin son obligatorios'); return }
    if (form.hora_inicio >= form.hora_fin)   { setError('La hora de fin debe ser posterior a la de inicio'); return }
    if (form.dias_consulta.length === 0)     { setError('Selecciona al menos un día de consulta'); return }

    setSaving(true)
    const res = await fetch('/api/configuracion', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        duracion_cita_minutos: parseInt(form.duracion_cita_minutos),
        buffer_entre_citas:    parseInt(form.buffer_entre_citas) || 0,
        max_citas_dia:         parseInt(form.max_citas_dia) || 0,
        costo_consulta:        form.costo_consulta ? parseFloat(form.costo_consulta) : null,
      }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error || 'Error al guardar'); return }
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (loading) return <AppLayout title="Configuración de Clínica"><PageSpinner /></AppLayout>

  const readOnly = !can('editar_configuracion')

  return (
    <AppLayout title="Configuración de Clínica">
      <form onSubmit={handleSave}>
        <div className="max-w-4xl mx-auto">

          {/* ── Aviso solo lectura ── */}
          {readOnly && (
            <div className="mb-3 flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-700 leading-snug">
              <Info size={12} className="flex-shrink-0 mt-0.5" />
              Solo el médico titular puede editar la configuración.
            </div>
          )}

          {/* ── Navegación móvil: tabs con scroll horizontal ── */}
          <nav className="flex md:hidden overflow-x-auto gap-1 bg-white border border-gray-200 rounded-2xl p-1 shadow-sm mb-4"
            style={{ scrollbarWidth: 'none' }}>
            {SECCIONES.map(({ id, label, icon: Icon }) => {
              const activa = seccion === id
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => setSeccion(id)}
                  className={cn(
                    'flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-colors flex-shrink-0',
                    activa ? 'text-white shadow-sm' : 'text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                  )}
                  style={activa ? { backgroundColor: 'var(--brand-600)' } : {}}
                >
                  <Icon size={12} className="flex-shrink-0" />
                  {label}
                </button>
              )
            })}
          </nav>

          {/* ── Layout principal ── */}
          <div className="flex gap-6 items-start">

            {/* ── Navegación lateral desktop ── */}
            <aside className="hidden md:block w-44 flex-shrink-0 sticky top-4">
              <nav className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
                {SECCIONES.map(({ id, label, icon: Icon }) => {
                  const activa = seccion === id
                  return (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setSeccion(id)}
                      className={cn(
                        'w-full flex items-center gap-2.5 px-3 py-2.5 text-sm text-left transition-colors border-l-2',
                        activa
                          ? 'border-[var(--brand-600)] font-medium'
                          : 'border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700'
                      )}
                      style={activa ? {
                        backgroundColor: 'var(--brand-50)',
                        color: 'var(--brand-700)',
                      } : {}}
                    >
                      <Icon size={14} className="flex-shrink-0" />
                      {label}
                    </button>
                  )
                })}
              </nav>
            </aside>

            {/* ── Contenido ── */}
            <div className="flex-1 min-w-0 space-y-4">

              {/* ── Apariencia ── */}
              {seccion === 'apariencia' && (
                <Card>
                  <CardHeader>
                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                      <Palette size={16} /> Apariencia
                    </h2>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <p className="text-xs text-gray-500">
                      Elige el color principal de la interfaz. El cambio se aplica al instante — puedes previsualizar antes de guardar.
                    </p>

                    {/* ── Paleta de color ── */}
                    <div>
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Color de acento</p>
                      <div className="flex flex-wrap gap-2 sm:gap-3">
                        {PALETAS.map(p => {
                          const activa = form.paleta_color === p.value
                          return (
                            <button
                              key={p.value}
                              type="button"
                              disabled={readOnly}
                              onClick={() => selectPaleta(p.value)}
                              className={cn(
                                'relative flex flex-col items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border-2 transition-all',
                                activa
                                  ? 'border-gray-400 bg-gray-50 shadow-sm'
                                  : 'border-gray-200 bg-white hover:border-gray-300',
                                readOnly && 'cursor-default opacity-75'
                              )}
                            >
                              <div className="w-12 h-9 sm:w-14 sm:h-10 rounded-lg bg-gray-900 p-1.5 flex flex-col gap-1 overflow-hidden">
                                <div className="h-2 rounded-sm w-full" style={{ backgroundColor: p.hex }} />
                                <div className="h-1.5 rounded-sm w-4/5 bg-gray-700" />
                                <div className="h-1.5 rounded-sm w-3/5 bg-gray-700" />
                              </div>
                              <span className="text-xs font-medium text-gray-600">{p.label}</span>
                              {activa && (
                                <span
                                  className="absolute -top-2 -right-2 w-5 h-5 rounded-full flex items-center justify-center text-white shadow-sm"
                                  style={{ backgroundColor: p.hex }}
                                >
                                  <Check size={11} strokeWidth={3} />
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* ── Tema de la barra lateral ── */}
                    <div className="pt-4 border-t border-gray-100">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Barra lateral</p>
                      <div className="flex gap-2 sm:gap-3">
                        {TEMAS_SIDEBAR.map(t => {
                          const activo = form.tema_sidebar === t.value
                          const paletaHex = PALETAS.find(p => p.value === form.paleta_color)?.hex || '#0284c7'
                          return (
                            <button
                              key={t.value}
                              type="button"
                              disabled={readOnly}
                              onClick={() => selectTema(t.value)}
                              className={cn(
                                'relative flex flex-col items-center gap-2 px-3 py-2.5 sm:px-4 sm:py-3 rounded-xl border-2 transition-all',
                                activo
                                  ? 'border-gray-400 bg-gray-50 shadow-sm'
                                  : 'border-gray-200 bg-white hover:border-gray-300',
                                readOnly && 'cursor-default opacity-75'
                              )}
                            >
                              <div
                                className="w-12 h-9 sm:w-14 sm:h-10 rounded-lg overflow-hidden"
                                style={t.value === 'sistema'
                                  ? { background: 'linear-gradient(135deg, #111827 50%, #ffffff 50%)', border: '1px solid #e5e7eb' }
                                  : { backgroundColor: t.bgNav, border: t.value === 'claro' ? '1px solid #e5e7eb' : 'none' }
                                }
                              >
                                {t.value !== 'sistema' && (
                                  <div className="p-1.5 flex flex-col gap-1">
                                    <div className="h-2 rounded-sm w-full" style={{ backgroundColor: paletaHex }} />
                                    <div className="h-1.5 rounded-sm w-4/5" style={{ backgroundColor: t.bgItem }} />
                                    <div className="h-1.5 rounded-sm w-3/5" style={{ backgroundColor: t.bgItem }} />
                                  </div>
                                )}
                              </div>
                              <span className="text-xs font-medium text-gray-600">{t.label}</span>
                              {activo && (
                                <span className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-gray-700 flex items-center justify-center text-white shadow-sm">
                                  <Check size={11} strokeWidth={3} />
                                </span>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* ── Clínica ── */}
              {seccion === 'clinica' && (
                <Card>
                  <CardHeader>
                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                      <Building2 size={16} /> Datos de la clínica
                    </h2>
                  </CardHeader>
                  <CardBody className="space-y-4">

                    {/* Logo */}
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Logo de la clínica</p>
                      <div className="flex items-center gap-4">
                        <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
                          {logoUrl
                            ? <img src={logoUrl} alt="Logo" className="w-full h-full object-contain p-1" />
                            : <ImageIcon size={28} className="text-gray-300" />
                          }
                        </div>
                        <div className="flex flex-col gap-2">
                          {!readOnly && (
                            <>
                              <input
                                ref={logoInputRef}
                                type="file"
                                accept="image/png,image/jpeg,image/jpg,image/webp"
                                className="hidden"
                                onChange={handleLogoUpload}
                                disabled={uploadingLogo}
                              />
                              <Button type="button" variant="secondary" size="sm" loading={uploadingLogo}
                                onClick={() => logoInputRef.current?.click()}>
                                <Upload size={13} />
                                {logoUrl ? 'Cambiar logo' : 'Subir logo'}
                              </Button>
                              {logoUrl && (
                                <Button type="button" variant="danger" size="sm"
                                  onClick={handleLogoRemove} disabled={uploadingLogo}>
                                  <Trash2 size={13} /> Eliminar
                                </Button>
                              )}
                            </>
                          )}
                          <p className="text-xs text-gray-400">PNG, JPG o WebP · máx. 2 MB</p>
                          {logoError && <p className="text-xs text-red-500">{logoError}</p>}
                        </div>
                      </div>
                    </div>

                    <Input
                      label="Nombre de la clínica / consultorio"
                      placeholder="Consultorio Dr. García"
                      value={form.clinica_nombre}
                      onChange={set('clinica_nombre')}
                      disabled={readOnly}
                    />
                    <Input
                      label="Especialidad"
                      placeholder="Medicina General"
                      value={form.clinica_especialidad}
                      onChange={set('clinica_especialidad')}
                      disabled={readOnly}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Teléfono principal" type="tel" placeholder="55 1234 5678"
                        value={form.clinica_telefono} onChange={set('clinica_telefono')} disabled={readOnly} />
                      <Input label="Teléfono secundario" type="tel" placeholder="55 8765 4321"
                        value={form.clinica_telefono2} onChange={set('clinica_telefono2')} disabled={readOnly} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Email de contacto" type="email" placeholder="clinica@ejemplo.com"
                        value={form.clinica_email} onChange={set('clinica_email')} disabled={readOnly} />
                      <Input label="Sitio web" type="url" placeholder="https://clinica.com"
                        value={form.clinica_sitio_web} onChange={set('clinica_sitio_web')} disabled={readOnly} />
                    </div>
                    <Input label="Dirección" placeholder="Av. Insurgentes Sur 1234, Col. Del Valle"
                      value={form.clinica_direccion} onChange={set('clinica_direccion')} disabled={readOnly} />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Ciudad" placeholder="Ciudad de México"
                        value={form.clinica_ciudad} onChange={set('clinica_ciudad')} disabled={readOnly} />
                      <Input label="Código postal" placeholder="06600"
                        value={form.clinica_cp} onChange={set('clinica_cp')} disabled={readOnly} />
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* ── Horario ── */}
              {seccion === 'horario' && (
                <Card>
                  <CardHeader>
                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                      <Clock size={16} /> Horario de consulta
                    </h2>
                  </CardHeader>
                  <CardBody className="space-y-5">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-2">Días de consulta</p>
                      <div className="flex flex-wrap gap-2">
                        {DIAS_SEMANA.map(({ value, label }) => {
                          const active = form.dias_consulta.includes(value)
                          return (
                            <button
                              key={value}
                              type="button"
                              disabled={readOnly}
                              onClick={() => toggleDia(value)}
                              className={cn(
                                'px-3 py-2 rounded-xl text-xs font-medium border transition-colors',
                                active
                                  ? 'bg-[var(--brand-600)] text-white border-[var(--brand-600)]'
                                  : 'bg-white text-gray-500 border-gray-300 hover:border-[var(--brand-400)]',
                                readOnly && 'cursor-default opacity-75'
                              )}
                            >
                              {label}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Hora de inicio" type="time" required
                        value={form.hora_inicio} onChange={set('hora_inicio')} disabled={readOnly} />
                      <Input label="Hora de fin" type="time" required
                        value={form.hora_fin} onChange={set('hora_fin')} disabled={readOnly} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FieldSelect
                        label="Duración predeterminada de cita"
                        value={form.duracion_cita_minutos}
                        onChange={set('duracion_cita_minutos')}
                        disabled={readOnly}
                      >
                        {DURACIONES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                      </FieldSelect>
                      <Input label="Tiempo entre citas (min)" type="number" min="0" max="60"
                        value={form.buffer_entre_citas} onChange={set('buffer_entre_citas')}
                        disabled={readOnly} helper="Descanso entre consultas" />
                    </div>
                    <Input label="Máximo de citas por día" type="number" min="0" max="100"
                      value={form.max_citas_dia} onChange={set('max_citas_dia')}
                      disabled={readOnly} helper="0 = sin límite" />
                  </CardBody>
                </Card>
              )}

              {/* ── Zona horaria ── */}
              {seccion === 'timezone' && (
                <Card>
                  <CardHeader>
                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                      <Globe size={16} /> Zona horaria
                    </h2>
                  </CardHeader>
                  <CardBody className="space-y-3">
                    <p className="text-xs text-gray-500">
                      Las citas y el panel de control usarán este horario, independientemente del servidor.
                    </p>
                    <FieldSelect
                      label="Zona horaria"
                      value={form.zona_horaria}
                      onChange={set('zona_horaria')}
                      disabled={readOnly}
                    >
                      {ZONAS_HORARIAS.map(z => (
                        <option key={z.value} value={z.value}>{z.label}</option>
                      ))}
                    </FieldSelect>
                  </CardBody>
                </Card>
              )}

              {/* ── Festivos ── */}
              {seccion === 'festivos' && (
                <Card>
                  <CardHeader>
                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                      <Ban size={16} /> Días de descanso / festivos
                    </h2>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <p className="text-xs text-gray-500">
                      Fechas específicas en las que no habrá consulta (vacaciones, días festivos, etc.).
                    </p>
                    {!readOnly && (
                      <div className="flex gap-2">
                        <input
                          type="date"
                          value={nuevaFecha}
                          onChange={e => setNuevaFecha(e.target.value)}
                          className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)]"
                        />
                        <Button type="button" size="sm" variant="secondary" onClick={agregarFestivo}>
                          <Plus size={14} /> Agregar
                        </Button>
                      </div>
                    )}
                    {form.dias_festivos.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-6">Sin días festivos configurados</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {form.dias_festivos.map(fecha => {
                          const d = new Date(fecha + 'T12:00:00')
                          const label = d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
                          return (
                            <span key={fecha} className="inline-flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-700 rounded-lg px-2.5 py-1 text-xs font-medium">
                              <Ban size={11} />
                              {label}
                              {!readOnly && (
                                <button type="button" onClick={() => eliminarFestivo(fecha)} className="ml-0.5 hover:text-red-900">
                                  <X size={11} />
                                </button>
                              )}
                            </span>
                          )
                        })}
                      </div>
                    )}
                  </CardBody>
                </Card>
              )}

              {/* ── Tarifas ── */}
              {seccion === 'tarifas' && (
                <Card>
                  <CardHeader>
                    <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                      <DollarSign size={16} /> Tarifas y políticas
                    </h2>
                  </CardHeader>
                  <CardBody className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input label="Costo de consulta" type="number" min="0" step="0.01" placeholder="600.00"
                        value={form.costo_consulta} onChange={set('costo_consulta')} disabled={readOnly} />
                      <FieldSelect
                        label="Moneda"
                        value={form.moneda}
                        onChange={set('moneda')}
                        disabled={readOnly}
                      >
                        <option value="MXN">MXN — Peso mexicano</option>
                        <option value="USD">USD — Dólar</option>
                        <option value="EUR">EUR — Euro</option>
                      </FieldSelect>
                    </div>
                    <Textarea
                      label="Política de cancelación"
                      placeholder="Ej: Se requiere aviso con 24 horas de anticipación..."
                      value={form.politica_cancelacion}
                      onChange={set('politica_cancelacion')}
                      disabled={readOnly}
                      rows={3}
                    />
                    <Textarea
                      label="Notas internas (solo visible para el equipo)"
                      placeholder="Instrucciones para el equipo, acceso, estacionamiento..."
                      value={form.notas_internas}
                      onChange={set('notas_internas')}
                      disabled={readOnly}
                      rows={3}
                    />
                  </CardBody>
                </Card>
              )}

              {/* ── Guardar ── */}
              {!readOnly && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-200 rounded-2xl px-4 sm:px-5 py-4 shadow-sm">
                  <div className="text-sm min-h-[1.25rem]">
                    {error   && <p className="text-red-500">{error}</p>}
                    {success && <p className="text-emerald-600">Configuración guardada correctamente.</p>}
                  </div>
                  <Button type="submit" loading={saving} className="w-full sm:w-auto">
                    <Save size={14} /> Guardar configuración
                  </Button>
                </div>
              )}

            </div>
          </div>
        </div>
      </form>
    </AppLayout>
  )
}
