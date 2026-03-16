'use client'

import { useState, useEffect, useRef } from 'react'
import {
  Building2, Clock, Ban, Save, DollarSign, Info, Plus, X, Globe,
  Upload, Trash2, ImageIcon,
} from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Card, { CardBody, CardHeader, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input, { Textarea } from '@/components/ui/Input'
import { PageSpinner } from '@/components/ui/Spinner'
import { usePermission } from '@/hooks/usePermission'
import { cn } from '@/lib/utils'

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

const DEFAULT_FORM = {
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

export default function ConfiguracionPage() {
  const { can } = usePermission()
  const [form, setForm] = useState(DEFAULT_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [nuevaFecha, setNuevaFecha] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [logoError, setLogoError] = useState('')
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

  function toggleDia(dia) {
    setForm(f => ({
      ...f,
      dias_consulta: f.dias_consulta.includes(dia)
        ? f.dias_consulta.filter(d => d !== dia)
        : [...f.dias_consulta, dia],
    }))
  }

  function agregarFestivo() {
    if (!nuevaFecha) return
    if (form.dias_festivos.includes(nuevaFecha)) return
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
    // Reset input so the same file can be re-selected if needed
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
    if (form.hora_inicio >= form.hora_fin) { setError('La hora de fin debe ser posterior a la hora de inicio'); return }
    if (form.dias_consulta.length === 0) { setError('Selecciona al menos un día de consulta'); return }

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

  // readOnly para asistentes Y médicos asociados (solo el dueño puede editar)
  const readOnly = !can('editar_configuracion')

  return (
    <AppLayout title="Configuración de Clínica">
      <div className="max-w-2xl mx-auto space-y-5">

        {readOnly && (
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-sm text-amber-700">
            <Info size={15} className="flex-shrink-0" />
            Solo el médico titular puede modificar la configuración de la clínica.
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-5">

          {/* Datos de la clínica */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Building2 size={16} /> Datos de la clínica
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">

              {/* Logo upload */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Logo de la clínica</p>
                <div className="flex items-center gap-4">
                  {/* Preview */}
                  <div className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden bg-gray-50 flex-shrink-0">
                    {logoUrl ? (
                      <img
                        src={logoUrl}
                        alt="Logo"
                        className="w-full h-full object-contain p-1"
                      />
                    ) : (
                      <ImageIcon size={28} className="text-gray-300" />
                    )}
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
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          loading={uploadingLogo}
                          onClick={() => logoInputRef.current?.click()}
                        >
                          <Upload size={13} />
                          {logoUrl ? 'Cambiar logo' : 'Subir logo'}
                        </Button>
                        {logoUrl && (
                          <Button
                            type="button"
                            variant="danger"
                            size="sm"
                            onClick={handleLogoRemove}
                            disabled={uploadingLogo}
                          >
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

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Nombre de la clínica / consultorio"
                  placeholder="Consultorio Dr. García"
                  value={form.clinica_nombre}
                  onChange={set('clinica_nombre')}
                  disabled={readOnly}
                  containerClassName="col-span-2"
                />
                <Input
                  label="Especialidad"
                  placeholder="Medicina General"
                  value={form.clinica_especialidad}
                  onChange={set('clinica_especialidad')}
                  disabled={readOnly}
                  containerClassName="col-span-2"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Teléfono principal"
                  type="tel"
                  placeholder="55 1234 5678"
                  value={form.clinica_telefono}
                  onChange={set('clinica_telefono')}
                  disabled={readOnly}
                />
                <Input
                  label="Teléfono secundario"
                  type="tel"
                  placeholder="55 8765 4321"
                  value={form.clinica_telefono2}
                  onChange={set('clinica_telefono2')}
                  disabled={readOnly}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Email de contacto"
                  type="email"
                  placeholder="clinica@ejemplo.com"
                  value={form.clinica_email}
                  onChange={set('clinica_email')}
                  disabled={readOnly}
                />
                <Input
                  label="Sitio web"
                  type="url"
                  placeholder="https://clinica.com"
                  value={form.clinica_sitio_web}
                  onChange={set('clinica_sitio_web')}
                  disabled={readOnly}
                />
              </div>
              <Input
                label="Dirección"
                placeholder="Av. Insurgentes Sur 1234, Col. Del Valle"
                value={form.clinica_direccion}
                onChange={set('clinica_direccion')}
                disabled={readOnly}
              />
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Ciudad"
                  placeholder="Ciudad de México"
                  value={form.clinica_ciudad}
                  onChange={set('clinica_ciudad')}
                  disabled={readOnly}
                />
                <Input
                  label="Código postal"
                  placeholder="06600"
                  value={form.clinica_cp}
                  onChange={set('clinica_cp')}
                  disabled={readOnly}
                />
              </div>
            </CardBody>
          </Card>

          {/* Horario */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Clock size={16} /> Horario de consulta
              </h2>
            </CardHeader>
            <CardBody className="space-y-5">
              {/* Días de la semana */}
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
                          'px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors',
                          active
                            ? 'bg-sky-600 text-white border-sky-600'
                            : 'bg-white text-gray-500 border-gray-300 hover:border-sky-400',
                          readOnly && 'cursor-default opacity-75'
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
                  required
                  value={form.hora_inicio}
                  onChange={set('hora_inicio')}
                  disabled={readOnly}
                />
                <Input
                  label="Hora de fin"
                  type="time"
                  required
                  value={form.hora_fin}
                  onChange={set('hora_fin')}
                  disabled={readOnly}
                />
              </div>

              {/* Duración y buffer */}
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Duración predeterminada de cita</label>
                  <select
                    value={form.duracion_cita_minutos}
                    onChange={set('duracion_cita_minutos')}
                    disabled={readOnly}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-gray-50 disabled:text-gray-500"
                  >
                    {DURACIONES.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <Input
                  label="Tiempo entre citas (minutos)"
                  type="number"
                  min="0"
                  max="60"
                  value={form.buffer_entre_citas}
                  onChange={set('buffer_entre_citas')}
                  disabled={readOnly}
                  helper="Tiempo de descanso entre consultas"
                />
              </div>

              <Input
                label="Máximo de citas por día"
                type="number"
                min="0"
                max="100"
                value={form.max_citas_dia}
                onChange={set('max_citas_dia')}
                disabled={readOnly}
                helper="0 = sin límite"
              />
            </CardBody>
          </Card>

          {/* Zona horaria */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Globe size={16} /> Zona horaria
              </h2>
            </CardHeader>
            <CardBody className="space-y-3">
              <p className="text-xs text-gray-500">
                Define la zona horaria de tu clínica. Las citas y el panel de control usarán este horario, independientemente del servidor.
              </p>
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Zona horaria</label>
                <select
                  value={form.zona_horaria}
                  onChange={set('zona_horaria')}
                  disabled={readOnly}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-gray-50 disabled:text-gray-500"
                >
                  {ZONAS_HORARIAS.map(z => (
                    <option key={z.value} value={z.value}>{z.label}</option>
                  ))}
                </select>
              </div>
            </CardBody>
          </Card>

          {/* Días festivos */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Ban size={16} /> Días de descanso / festivos
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <p className="text-xs text-gray-500">
                Agrega fechas específicas en las que no habrá consulta (vacaciones, días festivos, etc.).
              </p>

              {!readOnly && (
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={nuevaFecha}
                    onChange={e => setNuevaFecha(e.target.value)}
                    className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <Button type="button" size="sm" variant="secondary" onClick={agregarFestivo}>
                    <Plus size={14} /> Agregar
                  </Button>
                </div>
              )}

              {form.dias_festivos.length === 0 ? (
                <p className="text-xs text-gray-400 text-center py-4">Sin días festivos configurados</p>
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

          {/* Tarifas y políticas */}
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <DollarSign size={16} /> Tarifas y políticas
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Costo de consulta"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="600.00"
                  value={form.costo_consulta}
                  onChange={set('costo_consulta')}
                  disabled={readOnly}
                />
                <div className="flex flex-col gap-1">
                  <label className="text-sm font-medium text-gray-700">Moneda</label>
                  <select
                    value={form.moneda}
                    onChange={set('moneda')}
                    disabled={readOnly}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-gray-50"
                  >
                    <option value="MXN">MXN — Peso mexicano</option>
                    <option value="USD">USD — Dólar</option>
                    <option value="EUR">EUR — Euro</option>
                  </select>
                </div>
              </div>
              <Textarea
                label="Política de cancelación"
                placeholder="Ej: Se requiere aviso con 24 horas de anticipación para cancelar o reprogramar sin cargo..."
                value={form.politica_cancelacion}
                onChange={set('politica_cancelacion')}
                disabled={readOnly}
                rows={3}
              />
              <Textarea
                label="Notas internas (solo visible para el equipo)"
                placeholder="Instrucciones para el equipo, información de estacionamiento, acceso, etc..."
                value={form.notas_internas}
                onChange={set('notas_internas')}
                disabled={readOnly}
                rows={3}
              />
            </CardBody>

            {!readOnly && (
              <CardFooter>
                {error && <p className="text-xs text-red-500 mb-3">{error}</p>}
                {success && <p className="text-xs text-emerald-600 mb-3">Configuración guardada correctamente.</p>}
                <div className="flex justify-end">
                  <Button type="submit" loading={saving}>
                    <Save size={14} /> Guardar configuración
                  </Button>
                </div>
              </CardFooter>
            )}
          </Card>

        </form>
      </div>
    </AppLayout>
  )
}
