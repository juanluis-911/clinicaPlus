'use client'

import { useState, useEffect } from 'react'
import { Save, FileText, Info, Eye, FileOutput, LayoutTemplate } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Card, { CardBody, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input, { Textarea } from '@/components/ui/Input'
import { PageSpinner } from '@/components/ui/Spinner'
import { usePermission } from '@/hooks/usePermission'
import { useConfig } from '@/hooks/useConfig'
import { useUser } from '@/hooks/useUser'
import { cn } from '@/lib/utils'

// ── Colores de paleta ─────────────────────────────────────────────────────────
const PALETA_HEX = {
  sky:     '#0284c7',
  violet:  '#7c3aed',
  emerald: '#059669',
  rose:    '#e11d48',
  amber:   '#d97706',
}

// ── Valores por defecto ───────────────────────────────────────────────────────
export const DEFAULT_FORMATO = {
  // Modo de impresión
  modo_impresion:            'completo',   // 'completo' | 'solo_cuerpo'

  // Diseño
  tamano_papel:              'letter',     // 'letter' | 'a4'
  titulo:                    '',           // override 'RECETA MÉDICA'

  // Encabezado (solo aplica cuando modo_impresion === 'completo')
  mostrar_logo:              true,
  mostrar_nombre_clinica:    true,
  mostrar_especialidad_clinica: true,
  mostrar_folio:             true,
  mostrar_tel_clinica:       true,
  mostrar_email_clinica:     true,
  mostrar_direccion_clinica: true,

  // Datos del médico
  mostrar_especialidad_medico: true,
  mostrar_cedula:            true,
  mostrar_tel_medico:        true,

  // Datos del paciente
  mostrar_edad_paciente:     true,
  mostrar_tel_paciente:      true,

  // Secciones del cuerpo
  mostrar_indicaciones_especiales:  true,
  mostrar_instrucciones_generales:  true,
  mostrar_vigencia:          true,

  // Márgenes para hoja membretada (solo aplica cuando modo_impresion === 'solo_cuerpo')
  membrete_superior_cm:      0,            // cm a dejar en blanco arriba
  membrete_inferior_cm:      0,            // cm a dejar en blanco abajo

  // Pie (solo aplica cuando modo_impresion === 'completo')
  mostrar_firma:             true,
  texto_firma:               '',           // override 'Firma del médico'
  nota_pie:                  '',
}

// ── Componente de toggle group ────────────────────────────────────────────────
function ToggleGroup({ label, helper, items, fmt, onChange, disabled }) {
  return (
    <div>
      {label && <p className="text-sm font-medium text-gray-700 mb-1">{label}</p>}
      {helper && <p className="text-xs text-gray-400 mb-2">{helper}</p>}
      <div className="space-y-2">
        {items.map(({ field, label: itemLabel, sub }) => {
          const checked = fmt[field] !== false
          return (
            <label
              key={field}
              className={cn(
                'flex items-start gap-3 p-3 rounded-xl border transition-colors',
                checked ? 'border-[var(--brand-200)] bg-[var(--brand-50)]' : 'border-gray-200 bg-white',
                disabled ? 'cursor-default opacity-75' : 'cursor-pointer hover:border-gray-300'
              )}
            >
              <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={e => onChange(field, e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[var(--brand-600)] focus:ring-[var(--brand-500)] cursor-pointer"
              />
              <div>
                <p className="text-sm font-medium text-gray-700">{itemLabel}</p>
                {sub && <p className="text-xs text-gray-400">{sub}</p>}
              </div>
            </label>
          )
        })}
      </div>
    </div>
  )
}

// ── Preview visual ────────────────────────────────────────────────────────────
// Escala para el preview: 1 cm real → ~6px en preview
const CM_TO_PX = 6

function RecetaPreview({ fmt, config, nombre }) {
  const paleta  = config?.paleta_color || 'sky'
  const color   = PALETA_HEX[paleta] || PALETA_HEX.sky
  const altBg   = `${color}18`
  const soloBody = fmt.modo_impresion === 'solo_cuerpo'
  const titulo  = fmt.titulo?.trim() || 'RECETA MÉDICA'
  const topPx   = soloBody ? Math.round((fmt.membrete_superior_cm || 0) * CM_TO_PX) : 0
  const botPx   = soloBody ? Math.round((fmt.membrete_inferior_cm || 0) * CM_TO_PX) : 0

  return (
    <div
      className="bg-white border border-gray-200 rounded-lg overflow-hidden"
      style={{ fontSize: '9px', fontFamily: 'sans-serif', lineHeight: 1.4 }}
    >
      {/* Membrete superior simulado */}
      {topPx > 0 && (
        <div style={{
          height: topPx,
          background: 'repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 4px, #e5e7eb 4px, #e5e7eb 8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '7px', color: '#9ca3af', borderBottom: '1px dashed #d1d5db'
        }}>
          membrete superior ({fmt.membrete_superior_cm} cm)
        </div>
      )}

      {/* Header */}
      {!soloBody && (
        <div style={{ backgroundColor: color, padding: '8px 12px', color: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: 4 }}>
            <div>
              {fmt.mostrar_nombre_clinica !== false && (
                <div style={{ fontWeight: 700, fontSize: '11px' }}>
                  {config?.clinica_nombre || 'Clínica Médica'}
                </div>
              )}
              {fmt.mostrar_especialidad_clinica !== false && (
                <div style={{ opacity: 0.85, fontSize: '8px' }}>
                  {config?.clinica_especialidad || 'Medicina General'}
                </div>
              )}
            </div>
            <div style={{ textAlign: 'right', fontSize: '7px', opacity: 0.9 }}>
              {fmt.mostrar_folio !== false && <div>Folio: A1B2C3D4</div>}
              <div>Fecha: {new Date().toLocaleDateString('es-MX')}</div>
              {fmt.mostrar_tel_clinica !== false && config?.clinica_telefono && (
                <div>{config.clinica_telefono}</div>
              )}
              {fmt.mostrar_email_clinica !== false && config?.clinica_email && (
                <div>{config.clinica_email}</div>
              )}
              {fmt.mostrar_direccion_clinica !== false && config?.clinica_direccion && (
                <div style={{ fontSize: '6px' }}>{config.clinica_direccion}</div>
              )}
            </div>
          </div>
        </div>
      )}

      <div style={{ padding: '8px 12px' }}>
        {/* Título del documento */}
        <div style={{ textAlign: 'center', fontWeight: 700, color, marginBottom: 6, fontSize: '10px' }}>
          {titulo}
        </div>

        {/* Médico */}
        <div style={{ marginBottom: 5 }}>
          <div style={{ fontWeight: 700, fontSize: '10px' }}>
            {nombre || 'Dr. Nombre Apellido'}
          </div>
          <div style={{ color: '#555', display: 'flex', gap: 6, flexWrap: 'wrap', fontSize: '8px' }}>
            {fmt.mostrar_especialidad_medico !== false && <span>Especialidad: Medicina General</span>}
            {fmt.mostrar_cedula !== false && <span>Cédula: 12345678</span>}
            {fmt.mostrar_tel_medico !== false && <span>Tel: 55 1234 5678</span>}
          </div>
        </div>

        <div style={{ borderBottom: '1px solid #ddd', marginBottom: 5 }} />

        {/* Paciente */}
        <div style={{ marginBottom: 5 }}>
          <div style={{ fontWeight: 700, fontSize: '9px', marginBottom: 2 }}>DATOS DEL PACIENTE</div>
          <div style={{ color: '#333' }}>Nombre: María Ejemplo García</div>
          {fmt.mostrar_edad_paciente !== false && <div style={{ color: '#333' }}>Edad: 45 años</div>}
          {fmt.mostrar_tel_paciente !== false && <div style={{ color: '#333' }}>Teléfono: 55 9876 5432</div>}
        </div>

        {/* Medicamentos */}
        <div style={{ marginBottom: 5 }}>
          <div style={{ fontWeight: 700, fontSize: '9px', marginBottom: 2 }}>MEDICAMENTOS PRESCRITOS</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '7.5px' }}>
            <thead>
              <tr style={{ backgroundColor: color, color: '#fff' }}>
                <th style={{ padding: '2px 4px', textAlign: 'left' }}>Medicamento</th>
                <th style={{ padding: '2px 4px', textAlign: 'left' }}>Dosis</th>
                <th style={{ padding: '2px 4px', textAlign: 'left' }}>Frecuencia</th>
                <th style={{ padding: '2px 4px', textAlign: 'left' }}>Duración</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ backgroundColor: altBg }}>
                <td style={{ padding: '2px 4px' }}>Metformina 500 mg</td>
                <td style={{ padding: '2px 4px' }}>1 tableta</td>
                <td style={{ padding: '2px 4px' }}>c/12 hrs</td>
                <td style={{ padding: '2px 4px' }}>30 días</td>
              </tr>
              <tr>
                <td style={{ padding: '2px 4px' }}>Losartán 50 mg</td>
                <td style={{ padding: '2px 4px' }}>1 tableta</td>
                <td style={{ padding: '2px 4px' }}>c/24 hrs</td>
                <td style={{ padding: '2px 4px' }}>30 días</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Indicaciones especiales */}
        {fmt.mostrar_indicaciones_especiales !== false && (
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontWeight: 700, fontSize: '9px', marginBottom: 1 }}>INDICACIONES ESPECIALES</div>
            <div style={{ color: '#555', fontSize: '7.5px' }}>• Metformina: Tomar con los alimentos principales</div>
          </div>
        )}

        {/* Instrucciones generales */}
        {fmt.mostrar_instrucciones_generales !== false && (
          <div style={{ marginBottom: 4 }}>
            <div style={{ fontWeight: 700, fontSize: '9px', marginBottom: 1 }}>INSTRUCCIONES GENERALES</div>
            <div style={{ color: '#555', fontSize: '7.5px' }}>Dieta baja en carbohidratos, ejercicio 30 min diarios.</div>
          </div>
        )}

        {/* Vigencia */}
        {fmt.mostrar_vigencia !== false && (
          <div style={{ color: '#888', fontStyle: 'italic', marginBottom: 4, fontSize: '7.5px' }}>
            Vigencia: 30 días a partir de la fecha de emisión.
          </div>
        )}

        {/* Nota al pie */}
        {fmt.nota_pie?.trim() && (
          <div style={{ color: '#555', marginBottom: 5, fontSize: '7.5px' }}>
            {fmt.nota_pie}
          </div>
        )}

        {/* Firma + footer */}
        {!soloBody && fmt.mostrar_firma !== false && (
          <div style={{ borderTop: '1px solid #ccc', paddingTop: 8, marginTop: 6, textAlign: 'right' }}>
            <div style={{
              display: 'inline-block', borderTop: '1px solid #666',
              paddingTop: 2, minWidth: 80, textAlign: 'center', fontSize: '7px', color: '#555'
            }}>
              {fmt.texto_firma?.trim() || 'Firma del médico'}
            </div>
          </div>
        )}

        {!soloBody && (
          <div style={{
            borderTop: '1px solid #e5e7eb', paddingTop: 5, marginTop: 6,
            textAlign: 'center', fontSize: '6.5px', color: '#aaa'
          }}>
            {config?.clinica_nombre || 'Generado por MediFlow'}
          </div>
        )}
      </div>

      {/* Membrete inferior simulado */}
      {botPx > 0 && (
        <div style={{
          height: botPx,
          background: 'repeating-linear-gradient(45deg, #f3f4f6, #f3f4f6 4px, #e5e7eb 4px, #e5e7eb 8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '7px', color: '#9ca3af', borderTop: '1px dashed #d1d5db'
        }}>
          membrete inferior ({fmt.membrete_inferior_cm} cm)
        </div>
      )}
    </div>
  )
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function RecetaFormatoPage() {
  const { can }       = usePermission()
  const { config }    = useConfig()
  const { perfil }    = useUser()
  const [fmt, setFmt] = useState(DEFAULT_FORMATO)
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [success, setSuccess]   = useState(false)
  const [error, setError]       = useState('')

  useEffect(() => {
    fetch('/api/receta-formato')
      .then(r => r.json())
      .then(({ data }) => {
        if (data && Object.keys(data).length > 0) {
          setFmt({ ...DEFAULT_FORMATO, ...data })
        }
        setLoading(false)
      })
  }, [])

  function set(field, value) {
    setFmt(f => ({ ...f, [field]: value }))
  }

  async function handleSave() {
    setSaving(true)
    setError('')
    const res = await fetch('/api/receta-formato', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(fmt),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setError(json.error || 'Error al guardar'); return }
    setSuccess(true)
    setTimeout(() => setSuccess(false), 3000)
  }

  if (loading) return <AppLayout title="Formato de Receta"><PageSpinner /></AppLayout>

  const canEdit = can('crear_prescripcion')
  const soloBody = fmt.modo_impresion === 'solo_cuerpo'

  return (
    <AppLayout title="Formato de Receta">
      <div className="max-w-5xl mx-auto">

        {!canEdit && (
          <div className="mb-4 flex items-start gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2.5 text-xs text-amber-700">
            <Info size={12} className="flex-shrink-0 mt-0.5" />
            Solo los médicos pueden configurar su formato de receta.
          </div>
        )}

        <div className="flex gap-6 items-start">

          {/* ── Panel de configuración ─────────────────────────────── */}
          <div className="flex-1 min-w-0 space-y-4">

            {/* Modo de impresión */}
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <LayoutTemplate size={15} /> Modo de impresión
                </h2>
              </CardHeader>
              <CardBody className="space-y-3">
                <p className="text-xs text-gray-500">
                  Si utilizas hoja membretada con tu logo y datos impresos, elige "Solo cuerpo" para imprimir únicamente el contenido de la receta sin encabezado ni pie.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    {
                      value: 'completo',
                      icon: LayoutTemplate,
                      label: 'Formato completo',
                      sub: 'Incluye encabezado con datos de la clínica, tabla de medicamentos y pie con firma.',
                    },
                    {
                      value: 'solo_cuerpo',
                      icon: FileOutput,
                      label: 'Solo cuerpo',
                      sub: 'Para hojas membretadas. Solo imprime los datos del médico, paciente, medicamentos y secciones elegidas.',
                    },
                  ].map(op => {
                    const active = (fmt.modo_impresion || 'completo') === op.value
                    return (
                      <button
                        key={op.value}
                        type="button"
                        disabled={!canEdit}
                        onClick={() => set('modo_impresion', op.value)}
                        className={cn(
                          'flex flex-col items-start gap-1.5 p-4 rounded-xl border-2 text-left transition-all',
                          active
                            ? 'border-[var(--brand-600)] bg-[var(--brand-50)] shadow-sm'
                            : 'border-gray-200 bg-white hover:border-gray-300',
                          !canEdit && 'cursor-default opacity-75'
                        )}
                      >
                        <div className={cn('flex items-center gap-2 font-medium text-sm', active ? 'text-[var(--brand-700)]' : 'text-gray-700')}>
                          <op.icon size={14} />
                          {op.label}
                        </div>
                        <p className="text-xs text-gray-400 leading-snug">{op.sub}</p>
                      </button>
                    )
                  })}
                </div>

                {/* Márgenes para hoja membretada */}
                {soloBody && (
                  <div className="border-t border-gray-100 pt-4 space-y-3">
                    <div>
                      <p className="text-sm font-medium text-gray-700 mb-0.5">Espacio del membrete</p>
                      <p className="text-xs text-gray-400">
                        Indica cuántos centímetros ocupa tu membrete impreso para que el contenido no lo tape.
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input
                        label="Membrete superior (cm)"
                        type="number"
                        min="0"
                        max="15"
                        step="0.5"
                        placeholder="0"
                        value={fmt.membrete_superior_cm ?? 0}
                        onChange={e => set('membrete_superior_cm', parseFloat(e.target.value) || 0)}
                        disabled={!canEdit}
                        helper="Ej: 4 cm"
                      />
                      <Input
                        label="Membrete inferior (cm)"
                        type="number"
                        min="0"
                        max="10"
                        step="0.5"
                        placeholder="0"
                        value={fmt.membrete_inferior_cm ?? 0}
                        onChange={e => set('membrete_inferior_cm', parseFloat(e.target.value) || 0)}
                        disabled={!canEdit}
                        helper="Ej: 2 cm"
                      />
                    </div>
                  </div>
                )}
              </CardBody>
            </Card>

            {/* Diseño general */}
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-800">Diseño general</h2>
              </CardHeader>
              <CardBody className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Tamaño de papel</p>
                  <div className="flex gap-3">
                    {[
                      { value: 'letter', label: 'Carta', sub: '21.6 × 27.9 cm' },
                      { value: 'a4',     label: 'A4',    sub: '21 × 29.7 cm' },
                    ].map(op => {
                      const active = (fmt.tamano_papel || 'letter') === op.value
                      return (
                        <button
                          key={op.value}
                          type="button"
                          disabled={!canEdit}
                          onClick={() => set('tamano_papel', op.value)}
                          className={cn(
                            'flex flex-col items-center gap-1 px-5 py-3 rounded-xl border-2 text-sm transition-all',
                            active
                              ? 'border-[var(--brand-600)] bg-[var(--brand-50)] text-[var(--brand-700)] font-medium shadow-sm'
                              : 'border-gray-200 text-gray-500 hover:border-gray-300',
                            !canEdit && 'cursor-default opacity-75'
                          )}
                        >
                          <span>{op.label}</span>
                          <span className="text-xs opacity-60">{op.sub}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
                <Input
                  label="Título del documento"
                  placeholder="RECETA MÉDICA"
                  value={fmt.titulo || ''}
                  onChange={e => set('titulo', e.target.value)}
                  disabled={!canEdit}
                  helper='Por defecto: "RECETA MÉDICA"'
                />
              </CardBody>
            </Card>

            {/* Encabezado — solo si modo completo */}
            {!soloBody && (
              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-gray-800">Encabezado</h2>
                </CardHeader>
                <CardBody>
                  <ToggleGroup
                    helper="Datos de la clínica que aparecen en la barra superior del documento"
                    fmt={fmt}
                    onChange={canEdit ? set : () => {}}
                    disabled={!canEdit}
                    items={[
                      { field: 'mostrar_logo',               label: 'Logo de la clínica',         sub: 'Aparece a la izquierda del encabezado' },
                      { field: 'mostrar_nombre_clinica',     label: 'Nombre de la clínica',       sub: 'Texto principal del encabezado' },
                      { field: 'mostrar_especialidad_clinica', label: 'Especialidad / tipo de clínica', sub: 'Texto debajo del nombre' },
                      { field: 'mostrar_folio',              label: 'Número de folio',             sub: 'Identificador único de la receta' },
                      { field: 'mostrar_tel_clinica',        label: 'Teléfono de la clínica',     sub: 'Teléfono principal de contacto' },
                      { field: 'mostrar_email_clinica',      label: 'Email de la clínica',        sub: 'Correo electrónico de contacto' },
                      { field: 'mostrar_direccion_clinica',  label: 'Dirección de la clínica',    sub: 'Dirección del consultorio' },
                    ]}
                  />
                </CardBody>
              </Card>
            )}

            {/* Datos del médico */}
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-800">Datos del médico</h2>
              </CardHeader>
              <CardBody>
                <ToggleGroup
                  helper="Información del médico debajo del encabezado"
                  fmt={fmt}
                  onChange={canEdit ? set : () => {}}
                  disabled={!canEdit}
                  items={[
                    { field: 'mostrar_especialidad_medico', label: 'Especialidad del médico',  sub: 'Tomada del perfil personal' },
                    { field: 'mostrar_cedula',              label: 'Cédula profesional',       sub: 'Número de cédula del médico' },
                    { field: 'mostrar_tel_medico',          label: 'Teléfono del médico',      sub: 'Teléfono del perfil personal' },
                  ]}
                />
              </CardBody>
            </Card>

            {/* Datos del paciente */}
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-800">Datos del paciente</h2>
              </CardHeader>
              <CardBody>
                <ToggleGroup
                  helper="Campos del paciente que se muestran en la receta"
                  fmt={fmt}
                  onChange={canEdit ? set : () => {}}
                  disabled={!canEdit}
                  items={[
                    { field: 'mostrar_edad_paciente', label: 'Edad del paciente', sub: 'Calculada desde la fecha de nacimiento' },
                    { field: 'mostrar_tel_paciente',  label: 'Teléfono del paciente', sub: 'Número de contacto del paciente' },
                  ]}
                />
              </CardBody>
            </Card>

            {/* Secciones del cuerpo */}
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-gray-800">Secciones</h2>
              </CardHeader>
              <CardBody>
                <ToggleGroup
                  helper="Bloques opcionales que aparecen debajo de la tabla de medicamentos"
                  fmt={fmt}
                  onChange={canEdit ? set : () => {}}
                  disabled={!canEdit}
                  items={[
                    { field: 'mostrar_indicaciones_especiales', label: 'Indicaciones especiales por medicamento', sub: 'Solo aparece si algún medicamento las tiene' },
                    { field: 'mostrar_instrucciones_generales', label: 'Instrucciones generales',                 sub: 'Bloque al final de los medicamentos' },
                    { field: 'mostrar_vigencia',               label: 'Vigencia de la receta',                  sub: 'Ej: "Vigencia: 30 días a partir de la emisión"' },
                  ]}
                />
              </CardBody>
            </Card>

            {/* Pie de página — solo si modo completo */}
            {!soloBody && (
              <Card>
                <CardHeader>
                  <h2 className="font-semibold text-gray-800">Pie de página y firma</h2>
                </CardHeader>
                <CardBody className="space-y-4">
                  <ToggleGroup
                    fmt={fmt}
                    onChange={canEdit ? set : () => {}}
                    disabled={!canEdit}
                    items={[
                      { field: 'mostrar_firma', label: 'Línea de firma del médico', sub: 'Línea horizontal con texto al final' },
                    ]}
                  />
                  {fmt.mostrar_firma !== false && (
                    <Input
                      label="Texto de la firma"
                      placeholder="Firma del médico"
                      value={fmt.texto_firma || ''}
                      onChange={e => set('texto_firma', e.target.value)}
                      disabled={!canEdit}
                      helper='Por defecto: "Firma del médico"'
                    />
                  )}
                  <div className="border-t border-gray-100 pt-4">
                    <Textarea
                      label="Nota adicional al pie"
                      placeholder="Ej: Este medicamento requiere receta médica. No automedicarse."
                      value={fmt.nota_pie || ''}
                      onChange={e => set('nota_pie', e.target.value)}
                      disabled={!canEdit}
                      rows={3}
                      helper="Texto libre que aparece antes de la firma. Útil para avisos legales."
                    />
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Nota color */}
            <p className="text-xs text-gray-400 flex items-start gap-1.5 px-1">
              <Info size={12} className="flex-shrink-0 mt-0.5" />
              El color del encabezado y de la tabla sigue la paleta configurada en Configuración de Clínica → Apariencia.
            </p>

            {/* Guardar */}
            {canEdit && (
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white border border-gray-200 rounded-2xl px-4 py-4 shadow-sm">
                <div className="text-sm min-h-[1.25rem]">
                  {error   && <p className="text-red-500">{error}</p>}
                  {success && <p className="text-emerald-600">Formato guardado correctamente.</p>}
                </div>
                <Button onClick={handleSave} loading={saving} className="w-full sm:w-auto">
                  <Save size={14} /> Guardar formato
                </Button>
              </div>
            )}
          </div>

          {/* ── Preview ────────────────────────────────────────────── */}
          <div className="hidden lg:block w-72 flex-shrink-0 sticky top-4">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-3">
              <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5 mb-3">
                <Eye size={12} /> Vista previa
              </p>
              <RecetaPreview fmt={fmt} config={config} nombre={perfil?.nombre_completo} />
            </div>
          </div>

        </div>
      </div>
    </AppLayout>
  )
}
