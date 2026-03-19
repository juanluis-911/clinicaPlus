'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  ArrowLeft, Plus, User, BookOpen, Stethoscope, Activity,
  FolderOpen, FileText, Save, X, Edit2, AlertTriangle, Pill,
  Heart, Thermometer, Wind, Droplets, Scale, Ruler,
  ChevronDown, ChevronRight, ClipboardList, Download, Share2,
} from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Card, { CardBody, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input, { Textarea } from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { PageSpinner } from '@/components/ui/Spinner'
import PermissionGate from '@/components/PermissionGate'
import { formatDate, formatDateShort, calcAge } from '@/lib/utils'
import { descargarExpedientePDF, generarExpedientePDFBlob } from '@/lib/pdf-expediente'
import { createClient } from '@/lib/supabase/client'

// ── Constantes ────────────────────────────────────────────────────────────────

const SECCIONES = [
  { id: 'resumen',      label: 'Resumen',     icon: User },
  { id: 'antecedentes', label: 'Antecedentes',icon: BookOpen },
  { id: 'consultas',    label: 'Consultas',   icon: Stethoscope },
  { id: 'vitales',      label: 'Vitales',     icon: Activity },
  { id: 'documentos',   label: 'Documentos',  icon: FolderOpen },
  { id: 'recetas',      label: 'Recetas',     icon: FileText },
]

const TIPOS_CONSULTA = [
  { value: 'primera_vez',   label: 'Primera vez' },
  { value: 'seguimiento',   label: 'Seguimiento' },
  { value: 'urgencia',      label: 'Urgencia' },
  { value: 'procedimiento', label: 'Procedimiento' },
  { value: 'resultado',     label: 'Resultado de lab.' },
]

const EMPTY_CONSULTA = {
  fecha: new Date().toISOString().slice(0, 10),
  tipo_consulta: 'seguimiento',
  motivo_consulta: '',
  exploracion_fisica: '',
  diagnostico: '',
  cie10_codigo: '',
  cie10_descripcion: '',
  plan_tratamiento: '',
  notas: '',
}

const EMPTY_VITALES = {
  peso: '', talla: '', ta_sistolica: '', ta_diastolica: '',
  fc: '', fr: '', temperatura: '', saturacion_o2: '', glucosa: '', perimetro_abd: '',
}

const EMPTY_ANT = {
  diabetes: false, hipertension: false, cardiopatia: false,
  asma_epoc: false, cancer: false, otras_enfermedades: '',
  cirugias: '', hospitalizaciones: '', antecedentes_fam: '',
  alergias_medicamentos: '', alergias_alimentos: '', alergias_otras: '',
  tabaquismo: 'no', tabaquismo_cigarros: '', tabaquismo_anos: '',
  alcoholismo: 'no', ejercicio: 'no',
  gestas: '', partos: '', cesareas: '', abortos: '', fum: '',
  medicacion_cronica: '',
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function ExpedienteClinico() {
  const { id } = useParams()
  const [loading, setLoading]           = useState(true)
  const [seccion, setSeccion]           = useState('resumen')
  const [paciente, setPaciente]         = useState(null)
  const [consultas, setConsultas]       = useState([])
  const [vitales, setVitales]           = useState([])
  const [antecedentes, setAntecedentes] = useState(null)
  const [documentos, setDocumentos]     = useState([])
  const [recetas, setRecetas]           = useState([])

  // Modal nueva consulta
  const [modalConsulta, setModalConsulta]   = useState(false)
  const [formConsulta, setFormConsulta]     = useState(EMPTY_CONSULTA)
  const [formVitalesC, setFormVitalesC]     = useState(EMPTY_VITALES)
  const [savingConsulta, setSavingConsulta] = useState(false)
  const [expandedId, setExpandedId]         = useState(null)

  // Antecedentes
  const [editingAnt, setEditingAnt] = useState(false)
  const [formAnt, setFormAnt]       = useState(EMPTY_ANT)
  const [savingAnt, setSavingAnt]   = useState(false)

  // Modal editar consulta
  const [editingConsulta, setEditingConsulta] = useState(null) // consulta objeto o null
  const [savingEdit, setSavingEdit]           = useState(false)

  // Editar datos del paciente
  const [editingPaciente, setEditingPaciente] = useState(false)
  const [formPaciente, setFormPaciente]       = useState({})
  const [savingPaciente, setSavingPaciente]   = useState(false)

  // Modal signos vitales
  const [modalVitales, setModalVitales]   = useState(false)
  const [formNuevosV, setFormNuevosV]     = useState({ ...EMPTY_VITALES, fecha: new Date().toISOString().slice(0, 10) })
  const [savingVitales, setSavingVitales] = useState(false)

  // PDF
  const [generandoPDF, setGenerandoPDF]       = useState(false)
  const [compartiendoPDF, setCompartiendoPDF] = useState(false)

  // ── Carga de datos ──────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    const supabase = createClient()
    const [
      { data: p }, { data: cons }, { data: sv },
      { data: ant }, { data: docs }, { data: rxs },
    ] = await Promise.all([
      supabase.from('pacientes').select('*').eq('id', id).single(),
      supabase.from('consultas').select('*').eq('paciente_id', id).order('fecha', { ascending: false }),
      supabase.from('signos_vitales').select('*').eq('paciente_id', id).order('fecha', { ascending: false }),
      supabase.from('antecedentes').select('*').eq('paciente_id', id).maybeSingle(),
      supabase.from('documentos').select('*').eq('paciente_id', id).order('created_at', { ascending: false }),
      supabase.from('prescripciones').select('*').eq('paciente_id', id).order('fecha', { ascending: false }),
    ])
    setPaciente(p)
    setFormPaciente(p || {})
    setConsultas(cons || [])
    setVitales(sv || [])
    setAntecedentes(ant)
    setFormAnt(ant ? { ...EMPTY_ANT, ...ant } : EMPTY_ANT)
    setDocumentos(docs || [])
    setRecetas(rxs || [])
    setLoading(false)
  }, [id])

  useEffect(() => { loadAll() }, [loadAll])

  // ── Helpers de form ─────────────────────────────────────────────────────────
  const setC   = f => e => setFormConsulta(p => ({ ...p, [f]: e.target.value }))
  const setVC  = f => e => setFormVitalesC(p => ({ ...p, [f]: e.target.value }))
  const setA   = f => e => setFormAnt(p => ({ ...p, [f]: e.target.value }))
  const setACh = f => e => setFormAnt(p => ({ ...p, [f]: e.target.checked }))
  const setNV  = f => e => setFormNuevosV(p => ({ ...p, [f]: e.target.value }))

  async function handleSaveConsulta(e) {
    e.preventDefault()
    setSavingConsulta(true)
    const res = await fetch('/api/consultas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formConsulta, paciente_id: id, signos_vitales: formVitalesC }),
    })
    setSavingConsulta(false)
    if (res.ok) {
      setModalConsulta(false)
      setFormConsulta(EMPTY_CONSULTA)
      setFormVitalesC(EMPTY_VITALES)
      loadAll()
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
      loadAll()
    }
  }

  async function handleSavePaciente() {
    setSavingPaciente(true)
    const res = await fetch('/api/pacientes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...formPaciente }),
    })
    setSavingPaciente(false)
    if (res.ok) {
      const { data } = await res.json()
      setPaciente(data)
      setEditingPaciente(false)
    }
  }

  async function handleSaveAnt() {
    setSavingAnt(true)
    const res = await fetch('/api/antecedentes', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paciente_id: id, ...formAnt }),
    })
    setSavingAnt(false)
    if (res.ok) {
      const { data } = await res.json()
      setAntecedentes(data)
      setEditingAnt(false)
    }
  }

  async function handleSaveVitales(e) {
    e.preventDefault()
    setSavingVitales(true)
    const res = await fetch('/api/signos-vitales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...formNuevosV, paciente_id: id }),
    })
    setSavingVitales(false)
    if (res.ok) {
      setModalVitales(false)
      setFormNuevosV({ ...EMPTY_VITALES, fecha: new Date().toISOString().slice(0, 10) })
      loadAll()
    }
  }

  // ── PDF helpers ─────────────────────────────────────────────────────────────
  async function getPDFConfig() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const [{ data: medico }, { data: config }] = await Promise.all([
      supabase.from('perfiles').select('*').eq('id', user.id).single(),
      supabase.from('configuracion_clinica').select('*').eq('medico_id', user.id).maybeSingle(),
    ])
    return { medico, config: config || {} }
  }

  async function handleDescargar() {
    setGenerandoPDF(true)
    try {
      const { medico, config } = await getPDFConfig()
      await descargarExpedientePDF({ paciente, antecedentes, consultas, vitales, recetas, documentos, medico, config })
    } finally {
      setGenerandoPDF(false)
    }
  }

  async function handleCompartir() {
    setCompartiendoPDF(true)
    try {
      const supabase   = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      const { medico, config } = await getPDFConfig()
      const pacienteNombre = `${paciente.nombre} ${paciente.apellido}`

      // Generar PDF como blob
      const { blob, nombre } = await generarExpedientePDFBlob({
        paciente, antecedentes, consultas, vitales, recetas, documentos, medico, config,
      })
      const file = new File([blob], nombre, { type: 'application/pdf' })
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

      // ── Opción 1: Web Share API — solo en móvil (en desktop falla con diálogo del SO) ───
      if (isMobile && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: `Expediente — ${pacienteNombre}` })
          return
        } catch (err) {
          if (err.name === 'AbortError') return
          // Si falla, seguir con siguiente opción
        }
      }

      // ── Opción 2: Subir a Supabase Storage y compartir enlace ──────────
      // El receptor recibe un link real en WhatsApp que abre el PDF
      const path = `${user.id}/${Date.now()}_${id}.pdf`
      const { error: uploadError } = await supabase.storage
        .from('expedientes-temp')
        .upload(path, blob, { contentType: 'application/pdf', upsert: true })

      if (!uploadError) {
        const { data: signed } = await supabase.storage
          .from('expedientes-temp')
          .createSignedUrl(path, 86400) // válido 24 horas

        if (signed?.signedUrl) {
          const msg = encodeURIComponent(
            `📋 *Expediente clínico — ${pacienteNombre}*\n\n` +
            `Descarga el PDF aquí (válido por 24 horas):\n${signed.signedUrl}`
          )
          if (isMobile) {
            // Deeplink que abre la app de WhatsApp instalada
            window.location.href = `whatsapp://send?text=${msg}`
          } else {
            window.open(`https://web.whatsapp.com/send?text=${msg}`, '_blank')
          }
          return
        }
      }

      // ── Opción 3: Fallback — solo descargar ────────────────────────────
      const url = URL.createObjectURL(blob)
      const a   = document.createElement('a')
      a.href    = url
      a.download = nombre
      a.click()
      URL.revokeObjectURL(url)

    } finally {
      setCompartiendoPDF(false)
    }
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  if (loading) return <AppLayout title="Expediente Clínico"><PageSpinner /></AppLayout>
  if (!paciente) return (
    <AppLayout title="Expediente Clínico">
      <p className="text-center py-16 text-gray-400">Paciente no encontrado</p>
    </AppLayout>
  )

  const age       = calcAge(paciente.fecha_nacimiento)
  const lastVital = vitales[0] || null
  const imc       = lastVital?.peso && lastVital?.talla
    ? (lastVital.peso / ((lastVital.talla / 100) ** 2)).toFixed(1) : null

  return (
    <AppLayout title={`Expediente — ${paciente.nombre} ${paciente.apellido}`}>
      <div className="max-w-5xl mx-auto">

        {/* ── Cabecera ────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href="/pacientes"
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 transition-colors text-gray-500 flex-shrink-0"
            >
              <ArrowLeft size={15} />
            </Link>
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                style={{ backgroundColor: 'var(--brand-100)', color: 'var(--brand-700)' }}
              >
                {paciente.nombre[0]}{paciente.apellido[0]}
              </div>
              <div className="min-w-0">
                <h1 className="font-semibold text-gray-900 leading-tight truncate text-base">
                  {paciente.nombre} {paciente.apellido}
                </h1>
                <p className="text-xs text-gray-400 truncate">
                  {age !== null ? `${age} años` : 'Sin edad'}
                  {' · '}Expediente clínico
                </p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Compartir PDF (WhatsApp) */}
            <button
              onClick={handleCompartir}
              disabled={compartiendoPDF || generandoPDF}
              title="Compartir expediente por WhatsApp"
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-green-500 hover:bg-green-600 active:bg-green-700 text-white transition-colors disabled:opacity-50"
            >
              {compartiendoPDF
                ? <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                : <Share2 size={14} />}
            </button>

            {/* Descargar PDF */}
            <button
              onClick={handleDescargar}
              disabled={generandoPDF || compartiendoPDF}
              title="Descargar expediente en PDF"
              className="w-8 h-8 rounded-xl flex items-center justify-center bg-gray-100 hover:bg-gray-200 active:bg-gray-300 text-gray-600 transition-colors disabled:opacity-50"
            >
              {generandoPDF
                ? <span className="w-3.5 h-3.5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
                : <Download size={14} />}
            </button>

            <PermissionGate action="crear_consulta">
              <Button size="sm" onClick={() => setModalConsulta(true)}>
                <Plus size={14} />
                <span className="hidden sm:inline"> Nueva consulta</span>
              </Button>
            </PermissionGate>
          </div>
        </div>

        {/* ── Nav móvil: scroll horizontal de tabs ─────────────────────── */}
        <div className="md:hidden -mx-6 px-6 mb-4">
          <div className="flex gap-1.5 overflow-x-auto pb-2 scrollbar-hide">
            {SECCIONES.map(({ id: sid, label, icon: Icon }) => {
              const active = seccion === sid
              return (
                <button
                  key={sid}
                  onClick={() => setSeccion(sid)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap flex-shrink-0 transition-colors"
                  style={active
                    ? { backgroundColor: 'var(--brand-600)', color: '#fff' }
                    : { backgroundColor: '#f3f4f6', color: '#6b7280' }}
                >
                  <Icon size={13} />
                  {label}
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Layout desktop: aside + contenido ───────────────────────────── */}
        <div className="flex gap-5 items-start">

          {/* Nav lateral — solo desktop */}
          <aside className="hidden md:block w-44 flex-shrink-0 sticky top-4">
            <nav className="space-y-0.5">
              {SECCIONES.map(({ id: sid, label, icon: Icon }) => {
                const active = seccion === sid
                return (
                  <button
                    key={sid}
                    onClick={() => setSeccion(sid)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-medium text-left transition-colors"
                    style={active
                      ? { backgroundColor: 'var(--brand-50)', color: 'var(--brand-700)' }
                      : {}}
                  >
                    <Icon size={15} className={active ? '' : 'text-gray-400'} />
                    <span className={active ? 'font-semibold' : 'text-gray-500'}>
                      {label}
                    </span>
                  </button>
                )
              })}
            </nav>
            {/* Contadores rápidos */}
            <div className="mt-4 space-y-1 border-t border-gray-100 pt-4">
              {[
                { label: 'Consultas',   count: consultas.length },
                { label: 'S. Vitales',  count: vitales.length },
                { label: 'Documentos',  count: documentos.length },
                { label: 'Recetas',     count: recetas.length },
              ].map(({ label, count }) => (
                <div key={label} className="flex items-center justify-between px-1">
                  <span className="text-xs text-gray-400">{label}</span>
                  <span className="text-xs font-semibold text-gray-600">{count}</span>
                </div>
              ))}
            </div>
          </aside>

          {/* Contenido */}
          <div className="flex-1 min-w-0">
            {seccion === 'resumen' && (
              <SeccionResumen
                paciente={paciente}
                antecedentes={antecedentes}
                consultas={consultas}
                lastVital={lastVital}
                imc={imc}
                editingPaciente={editingPaciente}
                setEditingPaciente={setEditingPaciente}
                formPaciente={formPaciente}
                setFormPaciente={setFormPaciente}
                savingPaciente={savingPaciente}
                onSavePaciente={handleSavePaciente}
              />
            )}
            {seccion === 'antecedentes' && (
              <SeccionAntecedentes
                editing={editingAnt}
                setEditing={setEditingAnt}
                form={formAnt}
                setA={setA}
                setACh={setACh}
                setFormAnt={setFormAnt}
                antecedentes={antecedentes}
                saving={savingAnt}
                onSave={handleSaveAnt}
              />
            )}
            {seccion === 'consultas' && (
              <SeccionConsultas
                consultas={consultas}
                vitales={vitales}
                expandedId={expandedId}
                setExpandedId={setExpandedId}
                onNew={() => setModalConsulta(true)}
                onEdit={c => setEditingConsulta({ ...c })}
                pacienteId={id}
              />
            )}
            {seccion === 'vitales' && (
              <SeccionVitales vitales={vitales} onNew={() => setModalVitales(true)} />
            )}
            {seccion === 'documentos' && (
              <SeccionDocumentos documentos={documentos} pacienteId={id} />
            )}
            {seccion === 'recetas' && (
              <SeccionRecetas recetas={recetas} pacienteId={id} />
            )}
          </div>
        </div>
      </div>

      {/* ── Modal: Nueva consulta ─────────────────────────────────────────── */}
      <Modal open={modalConsulta} onClose={() => setModalConsulta(false)} title="Nueva consulta" size="xl">
        <form onSubmit={handleSaveConsulta} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Fecha" type="date" required value={formConsulta.fecha} onChange={setC('fecha')} />
            <FieldSelect
              label="Tipo de consulta"
              value={formConsulta.tipo_consulta}
              onChange={setC('tipo_consulta')}
              options={TIPOS_CONSULTA.map(t => [t.value, t.label])}
            />
          </div>

          <Textarea
            label="Motivo de consulta" required
            value={formConsulta.motivo_consulta} onChange={setC('motivo_consulta')}
            rows={2} placeholder="Motivo por el que el paciente acude a consulta..."
          />

          {/* Signos vitales colapsables */}
          <details className="group border border-gray-100 rounded-xl overflow-hidden">
            <summary className="cursor-pointer select-none list-none flex items-center gap-2 px-4 py-3 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <Activity size={14} className="text-gray-400" />
              Signos vitales
              <span className="text-xs text-gray-400 font-normal ml-1">(opcional)</span>
              <ChevronRight size={13} className="ml-auto text-gray-400 group-open:rotate-90 transition-transform duration-200" />
            </summary>
            <div className="px-4 pb-4 pt-3 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-3 gap-3">
              <Input label="Peso (kg)"       type="number" step="0.1" value={formVitalesC.peso}          onChange={setVC('peso')}          placeholder="70.5" />
              <Input label="Talla (cm)"      type="number"            value={formVitalesC.talla}         onChange={setVC('talla')}         placeholder="170" />
              <Input label="T.A. sistólica"  type="number"            value={formVitalesC.ta_sistolica}  onChange={setVC('ta_sistolica')}  placeholder="120" />
              <Input label="T.A. diastólica" type="number"            value={formVitalesC.ta_diastolica} onChange={setVC('ta_diastolica')} placeholder="80" />
              <Input label="FC (lpm)"        type="number"            value={formVitalesC.fc}            onChange={setVC('fc')}            placeholder="72" />
              <Input label="FR (rpm)"        type="number"            value={formVitalesC.fr}            onChange={setVC('fr')}            placeholder="16" />
              <Input label="Temp. (°C)"      type="number" step="0.1" value={formVitalesC.temperatura}   onChange={setVC('temperatura')}   placeholder="36.5" />
              <Input label="SpO₂ (%)"        type="number" step="0.1" value={formVitalesC.saturacion_o2} onChange={setVC('saturacion_o2')} placeholder="98" />
              <Input label="Glucosa (mg/dL)" type="number"            value={formVitalesC.glucosa}       onChange={setVC('glucosa')}       placeholder="90" />
            </div>
          </details>

          <Textarea label="Exploración física" value={formConsulta.exploracion_fisica} onChange={setC('exploracion_fisica')} rows={3} placeholder="Hallazgos a la exploración..." />

          <Textarea label="Diagnóstico" value={formConsulta.diagnostico} onChange={setC('diagnostico')} rows={2} placeholder="Diagnóstico principal y secundarios..." />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 -mt-2">
            <Input label="Código CIE-10" value={formConsulta.cie10_codigo} onChange={setC('cie10_codigo')} placeholder="Ej. J06.9" />
            <Input label="Descripción CIE-10" value={formConsulta.cie10_descripcion} onChange={setC('cie10_descripcion')} placeholder="Ej. IRA de vías superiores" />
          </div>

          <Textarea label="Plan de tratamiento" value={formConsulta.plan_tratamiento} onChange={setC('plan_tratamiento')} rows={3} placeholder="Medicamentos, indicaciones..." />
          <Textarea label="Notas adicionales" value={formConsulta.notas} onChange={setC('notas')} rows={2} />

          <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
            <Button variant="secondary" type="button" onClick={() => setModalConsulta(false)}>Cancelar</Button>
            <Button type="submit" loading={savingConsulta}>Guardar consulta</Button>
          </div>
        </form>
      </Modal>

      {/* ── Modal: Editar consulta ───────────────────────────────────────── */}
      <Modal open={!!editingConsulta} onClose={() => setEditingConsulta(null)} title="Editar consulta" size="xl">
        {editingConsulta && (
          <form onSubmit={handleUpdateConsulta} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Fecha" type="date" required
                value={editingConsulta.fecha}
                onChange={e => setEditingConsulta(p => ({ ...p, fecha: e.target.value }))} />
              <FieldSelect
                label="Tipo de consulta"
                value={editingConsulta.tipo_consulta}
                onChange={e => setEditingConsulta(p => ({ ...p, tipo_consulta: e.target.value }))}
                options={TIPOS_CONSULTA.map(t => [t.value, t.label])}
              />
            </div>

            <Textarea
              label="Motivo de consulta" required
              value={editingConsulta.motivo_consulta || ''}
              onChange={e => setEditingConsulta(p => ({ ...p, motivo_consulta: e.target.value }))}
              rows={2} placeholder="Motivo por el que el paciente acude a consulta..."
            />

            <Textarea label="Exploración física"
              value={editingConsulta.exploracion_fisica || ''}
              onChange={e => setEditingConsulta(p => ({ ...p, exploracion_fisica: e.target.value }))}
              rows={3} placeholder="Hallazgos a la exploración..." />

            <Textarea label="Diagnóstico"
              value={editingConsulta.diagnostico || ''}
              onChange={e => setEditingConsulta(p => ({ ...p, diagnostico: e.target.value }))}
              rows={2} placeholder="Diagnóstico principal y secundarios..." />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 -mt-2">
              <Input label="Código CIE-10"
                value={editingConsulta.cie10_codigo || ''}
                onChange={e => setEditingConsulta(p => ({ ...p, cie10_codigo: e.target.value }))}
                placeholder="Ej. J06.9" />
              <Input label="Descripción CIE-10"
                value={editingConsulta.cie10_descripcion || ''}
                onChange={e => setEditingConsulta(p => ({ ...p, cie10_descripcion: e.target.value }))}
                placeholder="Ej. IRA de vías superiores" />
            </div>

            <Textarea label="Plan de tratamiento"
              value={editingConsulta.plan_tratamiento || ''}
              onChange={e => setEditingConsulta(p => ({ ...p, plan_tratamiento: e.target.value }))}
              rows={3} placeholder="Medicamentos, indicaciones..." />
            <Textarea label="Notas adicionales"
              value={editingConsulta.notas || ''}
              onChange={e => setEditingConsulta(p => ({ ...p, notas: e.target.value }))}
              rows={2} />

            <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
              <Button variant="secondary" type="button" onClick={() => setEditingConsulta(null)}>Cancelar</Button>
              <Button type="submit" loading={savingEdit}>Guardar cambios</Button>
            </div>
          </form>
        )}
      </Modal>

      {/* ── Modal: Signos vitales ────────────────────────────────────────── */}
      <Modal open={modalVitales} onClose={() => setModalVitales(false)} title="Registrar signos vitales">
        <form onSubmit={handleSaveVitales} className="space-y-4">
          <Input label="Fecha" type="date" required value={formNuevosV.fecha} onChange={setNV('fecha')} />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Peso (kg)"         type="number" step="0.1" value={formNuevosV.peso}          onChange={setNV('peso')}          placeholder="70.5" />
            <Input label="Talla (cm)"        type="number"            value={formNuevosV.talla}         onChange={setNV('talla')}         placeholder="170" />
            <Input label="T.A. sistólica"    type="number"            value={formNuevosV.ta_sistolica}  onChange={setNV('ta_sistolica')}  placeholder="120" />
            <Input label="T.A. diastólica"   type="number"            value={formNuevosV.ta_diastolica} onChange={setNV('ta_diastolica')} placeholder="80" />
            <Input label="FC (lpm)"          type="number"            value={formNuevosV.fc}            onChange={setNV('fc')}            placeholder="72" />
            <Input label="FR (rpm)"          type="number"            value={formNuevosV.fr}            onChange={setNV('fr')}            placeholder="16" />
            <Input label="Temp. (°C)"        type="number" step="0.1" value={formNuevosV.temperatura}   onChange={setNV('temperatura')}   placeholder="36.5" />
            <Input label="SpO₂ (%)"          type="number" step="0.1" value={formNuevosV.saturacion_o2} onChange={setNV('saturacion_o2')} placeholder="98" />
            <Input label="Glucosa (mg/dL)"   type="number"            value={formNuevosV.glucosa}       onChange={setNV('glucosa')}       placeholder="90" />
            <Input label="P. abd. (cm)"      type="number" step="0.1" value={formNuevosV.perimetro_abd} onChange={setNV('perimetro_abd')} placeholder="85" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" type="button" onClick={() => setModalVitales(false)}>Cancelar</Button>
            <Button type="submit" loading={savingVitales}>Guardar</Button>
          </div>
        </form>
      </Modal>
    </AppLayout>
  )
}

// ── Sección: Resumen ──────────────────────────────────────────────────────────

function SeccionResumen({ paciente, antecedentes, consultas, lastVital, imc,
  editingPaciente, setEditingPaciente, formPaciente, setFormPaciente, savingPaciente, onSavePaciente,
}) {
  const tieneAlergias = antecedentes?.alergias_medicamentos || paciente.alergias
  const setP = field => e => setFormPaciente(p => ({ ...p, [field]: e.target.value }))

  return (
    <div className="space-y-4">

      {/* ── Datos del paciente ──────────────────────────────────────────── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <User size={14} /> Datos del paciente
            </h3>
            {!editingPaciente ? (
              <button
                onClick={() => setEditingPaciente(true)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
              >
                <Edit2 size={12} /> Editar
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={() => { setEditingPaciente(false); setFormPaciente(paciente) }}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 px-2 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                >
                  <X size={12} /> Cancelar
                </button>
                <button
                  onClick={onSavePaciente}
                  disabled={savingPaciente}
                  className="flex items-center gap-1 text-xs font-medium text-white px-3 py-1 rounded-lg transition-colors disabled:opacity-50"
                  style={{ backgroundColor: 'var(--brand-600)' }}
                >
                  {savingPaciente
                    ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <Save size={12} />}
                  Guardar
                </button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardBody>
          {editingPaciente ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Input label="Nombre"   value={formPaciente.nombre   || ''} onChange={setP('nombre')} />
                <Input label="Apellido" value={formPaciente.apellido || ''} onChange={setP('apellido')} />
              </div>
              <Input label="Fecha de nacimiento" type="date" value={formPaciente.fecha_nacimiento || ''} onChange={setP('fecha_nacimiento')} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="Teléfono" value={formPaciente.telefono || ''} onChange={setP('telefono')} />
                <Input label="Email"    type="email" value={formPaciente.email || ''} onChange={setP('email')} />
              </div>
              <Input label="Dirección" value={formPaciente.direccion || ''} onChange={setP('direccion')} />
            </div>
          ) : (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
              {paciente.telefono && (
                <div>
                  <dt className="text-xs text-gray-400">Teléfono</dt>
                  <dd className="text-sm text-gray-700 mt-0.5">{paciente.telefono}</dd>
                </div>
              )}
              {paciente.email && (
                <div>
                  <dt className="text-xs text-gray-400">Email</dt>
                  <dd className="text-sm text-gray-700 mt-0.5 truncate">{paciente.email}</dd>
                </div>
              )}
              {paciente.fecha_nacimiento && (
                <div>
                  <dt className="text-xs text-gray-400">Fecha de nacimiento</dt>
                  <dd className="text-sm text-gray-700 mt-0.5">{formatDate(paciente.fecha_nacimiento)}</dd>
                </div>
              )}
              {paciente.direccion && (
                <div className="col-span-2">
                  <dt className="text-xs text-gray-400">Dirección</dt>
                  <dd className="text-sm text-gray-700 mt-0.5">{paciente.direccion}</dd>
                </div>
              )}
              {!paciente.telefono && !paciente.email && !paciente.fecha_nacimiento && !paciente.direccion && (
                <p className="text-xs text-gray-400 col-span-2">Sin datos de contacto registrados</p>
              )}
            </dl>
          )}
        </CardBody>
      </Card>

      {tieneAlergias && (
        <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl px-4 py-3">
          <AlertTriangle size={16} className="text-red-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-xs font-semibold text-red-700 mb-0.5">Alergias registradas</p>
            <p className="text-xs text-red-600 whitespace-pre-line">
              {antecedentes?.alergias_medicamentos || paciente.alergias}
            </p>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
            <Activity size={14} /> Condiciones crónicas
          </h3>
        </CardHeader>
        <CardBody>
          <div className="flex flex-wrap gap-2">
            {antecedentes?.diabetes    && <Badge color="amber">Diabetes</Badge>}
            {antecedentes?.hipertension && <Badge color="red">Hipertensión</Badge>}
            {antecedentes?.cardiopatia  && <Badge color="red">Cardiopatía</Badge>}
            {antecedentes?.asma_epoc    && <Badge color="blue">Asma / EPOC</Badge>}
            {antecedentes?.cancer       && <Badge color="purple">Cáncer</Badge>}
            {!antecedentes && paciente.condiciones_cronicas
              ? <p className="text-sm text-gray-600">{paciente.condiciones_cronicas}</p>
              : (!antecedentes?.diabetes && !antecedentes?.hipertension &&
                !antecedentes?.cardiopatia && !antecedentes?.asma_epoc && !antecedentes?.cancer &&
                !paciente.condiciones_cronicas) && (
                  <p className="text-sm text-gray-400">Sin condiciones crónicas registradas</p>
                )
            }
          </div>
          {antecedentes?.otras_enfermedades && (
            <p className="text-sm text-gray-600 mt-2 pt-2 border-t border-gray-100">
              {antecedentes.otras_enfermedades}
            </p>
          )}
        </CardBody>
      </Card>

      {lastVital && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Activity size={14} /> Últimos signos vitales
              </h3>
              <span className="text-xs text-gray-400">{formatDate(lastVital.fecha)}</span>
            </div>
          </CardHeader>
          <CardBody>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {lastVital.ta_sistolica  && <VitalChip icon={<Heart size={12} />}       label="T.A."    value={`${lastVital.ta_sistolica}/${lastVital.ta_diastolica}`} unit="mmHg" />}
              {lastVital.fc            && <VitalChip icon={<Activity size={12} />}    label="FC"      value={lastVital.fc}           unit="lpm" />}
              {lastVital.temperatura   && <VitalChip icon={<Thermometer size={12} />} label="Temp."   value={lastVital.temperatura}  unit="°C" />}
              {lastVital.saturacion_o2 && <VitalChip icon={<Droplets size={12} />}   label="SpO₂"    value={lastVital.saturacion_o2} unit="%" />}
              {lastVital.peso          && <VitalChip icon={<Scale size={12} />}       label="Peso"    value={lastVital.peso}         unit="kg" />}
              {imc                     && <VitalChip icon={<Ruler size={12} />}       label="IMC"     value={imc}                    unit="" imcValue={parseFloat(imc)} />}
              {lastVital.glucosa       && <VitalChip icon={<Droplets size={12} />}   label="Glucosa" value={lastVital.glucosa}      unit="mg/dL" />}
              {lastVital.fr            && <VitalChip icon={<Wind size={12} />}        label="FR"      value={lastVital.fr}           unit="rpm" />}
            </div>
          </CardBody>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Stethoscope size={14} /> Historial de consultas
            </h3>
            <span className="text-xs text-gray-400">{consultas.length} total</span>
          </div>
        </CardHeader>
        <CardBody className="p-0">
          {consultas.length === 0 ? (
            <p className="text-center text-xs text-gray-400 py-8">Sin consultas registradas</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {consultas.slice(0, 6).map(c => (
                <li key={c.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: 'var(--brand-50)' }}>
                    <Stethoscope size={11} style={{ color: 'var(--brand-600)' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{c.motivo_consulta}</p>
                    {c.diagnostico && <p className="text-xs text-sky-600 truncate">{c.diagnostico}</p>}
                  </div>
                  <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{formatDateShort(c.fecha)}</span>
                </li>
              ))}
            </ul>
          )}
        </CardBody>
      </Card>

      {(antecedentes?.medicacion_cronica || paciente.medicacion_actual) && (
        <Card>
          <CardHeader>
            <h3 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
              <Pill size={14} /> Medicación crónica
            </h3>
          </CardHeader>
          <CardBody>
            <p className="text-sm text-gray-700 whitespace-pre-line">
              {antecedentes?.medicacion_cronica || paciente.medicacion_actual}
            </p>
          </CardBody>
        </Card>
      )}
    </div>
  )
}

// ── Sección: Antecedentes ────────────────────────────────────────────────────

function SeccionAntecedentes({ editing, setEditing, form, setA, setACh, setFormAnt, antecedentes, saving, onSave }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Antecedentes médicos</h3>
            {!editing ? (
              <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>
                <Edit2 size={13} /> Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => {
                  setEditing(false)
                  setFormAnt(antecedentes ? { ...EMPTY_ANT, ...antecedentes } : EMPTY_ANT)
                }}>
                  <X size={13} /> Cancelar
                </Button>
                <Button size="sm" loading={saving} onClick={onSave}>
                  <Save size={13} /> Guardar
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardBody className="space-y-6">

          <AntSection title="Personales patológicos">
            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                  {[
                    ['diabetes',    'Diabetes'],
                    ['hipertension','Hipertensión'],
                    ['cardiopatia', 'Cardiopatía'],
                    ['asma_epoc',   'Asma / EPOC'],
                    ['cancer',      'Cáncer'],
                  ].map(([field, label]) => (
                    <label key={field} className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
                      <input type="checkbox" checked={form[field] || false} onChange={setACh(field)}
                        className="rounded border-gray-300 text-sky-600 focus:ring-sky-500" />
                      {label}
                    </label>
                  ))}
                </div>
                <Textarea label="Otras enfermedades" value={form.otras_enfermedades || ''} onChange={setA('otras_enfermedades')} rows={2} />
              </div>
            ) : (
              <div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {antecedentes?.diabetes    && <Badge color="amber">Diabetes</Badge>}
                  {antecedentes?.hipertension && <Badge color="red">Hipertensión</Badge>}
                  {antecedentes?.cardiopatia  && <Badge color="red">Cardiopatía</Badge>}
                  {antecedentes?.asma_epoc    && <Badge color="blue">Asma / EPOC</Badge>}
                  {antecedentes?.cancer       && <Badge color="purple">Cáncer</Badge>}
                  {!antecedentes?.diabetes && !antecedentes?.hipertension && !antecedentes?.cardiopatia &&
                   !antecedentes?.asma_epoc && !antecedentes?.cancer && (
                    <span className="text-sm text-gray-400">Ninguna registrada</span>
                  )}
                </div>
                {antecedentes?.otras_enfermedades && (
                  <p className="text-sm text-gray-600">{antecedentes.otras_enfermedades}</p>
                )}
              </div>
            )}
          </AntSection>

          <AntSection title="Alergias">
            {editing ? (
              <div className="space-y-3">
                <Input label="Medicamentos" value={form.alergias_medicamentos || ''} onChange={setA('alergias_medicamentos')} placeholder="Penicilina, AINES..." />
                <Input label="Alimentos"    value={form.alergias_alimentos    || ''} onChange={setA('alergias_alimentos')}    placeholder="Mariscos, nueces..." />
                <Input label="Otras"        value={form.alergias_otras        || ''} onChange={setA('alergias_otras')}        placeholder="Polen, látex..." />
              </div>
            ) : (
              <div className="space-y-1.5">
                {antecedentes?.alergias_medicamentos && <AntRow label="Medicamentos" value={antecedentes.alergias_medicamentos} />}
                {antecedentes?.alergias_alimentos    && <AntRow label="Alimentos"    value={antecedentes.alergias_alimentos} />}
                {antecedentes?.alergias_otras        && <AntRow label="Otras"        value={antecedentes.alergias_otras} />}
                {!antecedentes?.alergias_medicamentos && !antecedentes?.alergias_alimentos && !antecedentes?.alergias_otras && (
                  <p className="text-sm text-green-600">Sin alergias conocidas</p>
                )}
              </div>
            )}
          </AntSection>

          <AntSection title="Quirúrgicos y hospitalarios">
            {editing ? (
              <div className="space-y-3">
                <Textarea label="Cirugías previas"  value={form.cirugias         || ''} onChange={setA('cirugias')}         rows={2} placeholder="Apendicectomía (2015)..." />
                <Textarea label="Hospitalizaciones" value={form.hospitalizaciones || ''} onChange={setA('hospitalizaciones')} rows={2} />
              </div>
            ) : (
              <div className="space-y-1.5">
                {antecedentes?.cirugias         && <AntRow label="Cirugías"         value={antecedentes.cirugias} />}
                {antecedentes?.hospitalizaciones && <AntRow label="Hospitalizaciones" value={antecedentes.hospitalizaciones} />}
                {!antecedentes?.cirugias && !antecedentes?.hospitalizaciones && (
                  <p className="text-sm text-gray-400">Sin antecedentes quirúrgicos</p>
                )}
              </div>
            )}
          </AntSection>

          <AntSection title="Heredofamiliares">
            {editing ? (
              <Textarea value={form.antecedentes_fam || ''} onChange={setA('antecedentes_fam')} rows={2} placeholder="DM en padre, HTA en madre..." />
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {antecedentes?.antecedentes_fam || <span className="text-gray-400">No registrado</span>}
              </p>
            )}
          </AntSection>

          <AntSection title="Hábitos">
            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <FieldSelect label="Tabaquismo" value={form.tabaquismo || 'no'} onChange={setA('tabaquismo')}
                    options={[['no','No fuma'],['ex','Ex-fumador'],['activo','Activo']]} />
                  <FieldSelect label="Alcoholismo" value={form.alcoholismo || 'no'} onChange={setA('alcoholismo')}
                    options={[['no','No'],['social','Social'],['habitual','Habitual']]} />
                  <FieldSelect label="Ejercicio" value={form.ejercicio || 'no'} onChange={setA('ejercicio')}
                    options={[['no','No practica'],['ocasional','Ocasional'],['regular','Regular']]} />
                </div>
                {(form.tabaquismo === 'activo' || form.tabaquismo === 'ex') && (
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Cigarros / día" type="number" value={form.tabaquismo_cigarros || ''} onChange={setA('tabaquismo_cigarros')} />
                    <Input label="Años fumando"   type="number" value={form.tabaquismo_anos     || ''} onChange={setA('tabaquismo_anos')} />
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-700">
                <span>
                  <span className="text-xs text-gray-400 mr-1.5">Tabaquismo</span>
                  {antecedentes?.tabaquismo === 'activo' ? `Activo${antecedentes.tabaquismo_cigarros ? ` · ${antecedentes.tabaquismo_cigarros} cig/día` : ''}`
                    : antecedentes?.tabaquismo === 'ex' ? 'Ex-fumador' : 'No'}
                </span>
                <span>
                  <span className="text-xs text-gray-400 mr-1.5">Alcohol</span>
                  {antecedentes?.alcoholismo === 'social' ? 'Social' : antecedentes?.alcoholismo === 'habitual' ? 'Habitual' : 'No'}
                </span>
                <span>
                  <span className="text-xs text-gray-400 mr-1.5">Ejercicio</span>
                  {antecedentes?.ejercicio === 'regular' ? 'Regular' : antecedentes?.ejercicio === 'ocasional' ? 'Ocasional' : 'No practica'}
                </span>
              </div>
            )}
          </AntSection>

          <AntSection title="Gineco-obstétrico">
            {editing ? (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <Input label="Gestas"   type="number" value={form.gestas   || ''} onChange={setA('gestas')} />
                  <Input label="Partos"   type="number" value={form.partos   || ''} onChange={setA('partos')} />
                  <Input label="Cesáreas" type="number" value={form.cesareas || ''} onChange={setA('cesareas')} />
                  <Input label="Abortos"  type="number" value={form.abortos  || ''} onChange={setA('abortos')} />
                </div>
                <Input label="FUM" type="date" value={form.fum || ''} onChange={setA('fum')} />
              </div>
            ) : (
              <div className="flex flex-wrap gap-4 text-sm text-gray-700">
                {antecedentes?.gestas   != null && <span><span className="text-xs text-gray-400 mr-1">G</span>{antecedentes.gestas}</span>}
                {antecedentes?.partos   != null && <span><span className="text-xs text-gray-400 mr-1">P</span>{antecedentes.partos}</span>}
                {antecedentes?.cesareas != null && <span><span className="text-xs text-gray-400 mr-1">C</span>{antecedentes.cesareas}</span>}
                {antecedentes?.abortos  != null && <span><span className="text-xs text-gray-400 mr-1">A</span>{antecedentes.abortos}</span>}
                {antecedentes?.fum && <span><span className="text-xs text-gray-400 mr-1">FUM</span>{formatDate(antecedentes.fum)}</span>}
                {!antecedentes?.gestas && !antecedentes?.partos && !antecedentes?.cesareas &&
                 !antecedentes?.abortos && !antecedentes?.fum && (
                  <span className="text-gray-400">No registrado</span>
                )}
              </div>
            )}
          </AntSection>

          <AntSection title="Medicación crónica">
            {editing ? (
              <Textarea value={form.medicacion_cronica || ''} onChange={setA('medicacion_cronica')} rows={3}
                placeholder="Metformina 850 mg c/12h, Losartán 50 mg c/24h..." />
            ) : (
              <p className="text-sm text-gray-700 whitespace-pre-line">
                {antecedentes?.medicacion_cronica || <span className="text-gray-400">No registrado</span>}
              </p>
            )}
          </AntSection>

        </CardBody>
      </Card>
    </div>
  )
}

// ── Sección: Consultas ────────────────────────────────────────────────────────

function SeccionConsultas({ consultas, vitales, expandedId, setExpandedId, onNew, onEdit, pacienteId }) {
  const vitalesPorConsulta = {}
  vitales.forEach(v => { if (v.consulta_id) vitalesPorConsulta[v.consulta_id] = v })

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {consultas.length} consulta{consultas.length !== 1 ? 's' : ''} registrada{consultas.length !== 1 ? 's' : ''}
        </p>
        <PermissionGate action="crear_consulta">
          <Button size="sm" onClick={onNew}><Plus size={13} /> Nueva</Button>
        </PermissionGate>
      </div>

      {consultas.length === 0 ? (
        <Card>
          <CardBody className="text-center py-14">
            <Stethoscope size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">Sin consultas registradas</p>
          </CardBody>
        </Card>
      ) : consultas.map(c => {
        const sv        = vitalesPorConsulta[c.id]
        const isOpen    = expandedId === c.id
        const tipoLabel = TIPOS_CONSULTA.find(t => t.value === c.tipo_consulta)?.label || 'Consulta'
        return (
          <Card key={c.id} className="overflow-hidden">
            <button
              className="w-full px-4 py-3.5 flex items-start gap-3 text-left hover:bg-gray-50 transition-colors"
              onClick={() => setExpandedId(isOpen ? null : c.id)}
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{ backgroundColor: 'var(--brand-50)' }}>
                <Stethoscope size={14} style={{ color: 'var(--brand-600)' }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-0.5">
                  <p className="text-sm font-semibold text-gray-900 truncate max-w-[180px] sm:max-w-none">
                    {c.motivo_consulta}
                  </p>
                  <Badge color="gray" className="text-[10px] flex-shrink-0">{tipoLabel}</Badge>
                </div>
                <p className="text-xs text-gray-400">{formatDate(c.fecha)}</p>
                {c.diagnostico && !isOpen && (
                  <p className="text-xs text-sky-600 truncate mt-0.5">{c.diagnostico}</p>
                )}
              </div>
              {isOpen
                ? <ChevronDown  size={15} className="text-gray-400 flex-shrink-0 mt-1" />
                : <ChevronRight size={15} className="text-gray-400 flex-shrink-0 mt-1" />}
            </button>

            {isOpen && (
              <div className="px-4 pb-4 border-t border-gray-100 pt-4 space-y-4">
                {sv && (
                  <div className="bg-gray-50 rounded-xl p-3">
                    <p className="text-xs font-medium text-gray-500 mb-2 flex items-center gap-1.5">
                      <Activity size={12} /> Signos vitales
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-gray-700">
                      {sv.ta_sistolica  && <span><span className="text-gray-400">T.A.</span> {sv.ta_sistolica}/{sv.ta_diastolica} mmHg</span>}
                      {sv.fc            && <span><span className="text-gray-400">FC</span> {sv.fc} lpm</span>}
                      {sv.fr            && <span><span className="text-gray-400">FR</span> {sv.fr} rpm</span>}
                      {sv.temperatura   && <span><span className="text-gray-400">Temp.</span> {sv.temperatura}°C</span>}
                      {sv.saturacion_o2 && <span><span className="text-gray-400">SpO₂</span> {sv.saturacion_o2}%</span>}
                      {sv.peso          && <span><span className="text-gray-400">Peso</span> {sv.peso} kg</span>}
                      {sv.glucosa       && <span><span className="text-gray-400">Glucosa</span> {sv.glucosa} mg/dL</span>}
                    </div>
                  </div>
                )}
                <ConsultaCampo label="Exploración física"  value={c.exploracion_fisica} />
                <ConsultaCampo label="Diagnóstico"         value={c.diagnostico} highlight />
                {(c.cie10_codigo || c.cie10_descripcion) && (
                  <div>
                    <p className="text-xs font-medium text-gray-400 mb-1">CIE-10</p>
                    <p className="text-sm text-gray-700">
                      {c.cie10_codigo && (
                        <span className="font-mono bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded mr-2">
                          {c.cie10_codigo}
                        </span>
                      )}
                      {c.cie10_descripcion}
                    </p>
                  </div>
                )}
                <ConsultaCampo label="Plan de tratamiento" value={c.plan_tratamiento} />
                <ConsultaCampo label="Notas adicionales"   value={c.notas} />
                <PermissionGate action="crear_consulta">
                  <div className="pt-3 border-t border-gray-100 flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={e => { e.stopPropagation(); onEdit(c) }}
                      className="flex items-center gap-1.5 text-xs font-medium text-sky-600 hover:text-sky-700 bg-sky-50 hover:bg-sky-100 transition-colors px-3 py-1.5 rounded-lg border border-sky-200"
                    >
                      <Edit2 size={12} /> Editar consulta
                    </button>
                    <Link
                      href={`/prescripciones/nueva?paciente_id=${pacienteId}&consulta_id=${c.id}`}
                      onClick={e => e.stopPropagation()}
                      className="flex items-center gap-1.5 text-xs font-medium text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors px-3 py-1.5 rounded-lg border border-emerald-200"
                    >
                      <FileText size={12} /> Crear receta
                    </Link>
                  </div>
                </PermissionGate>
              </div>
            )}
          </Card>
        )
      })}
    </div>
  )
}

// ── Sección: Signos Vitales ───────────────────────────────────────────────────

function SeccionVitales({ vitales, onNew }) {
  const imcColor = v => {
    if (!v) return 'text-gray-500'
    if (v < 18.5) return 'text-blue-600'
    if (v < 25)   return 'text-green-600'
    if (v < 30)   return 'text-amber-600'
    return 'text-red-600'
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{vitales.length} registro{vitales.length !== 1 ? 's' : ''}</p>
        <PermissionGate action="crear_consulta">
          <Button size="sm" onClick={onNew}><Plus size={13} /> Registrar</Button>
        </PermissionGate>
      </div>

      {vitales.length === 0 ? (
        <Card>
          <CardBody className="text-center py-14">
            <Activity size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">Sin signos vitales registrados</p>
          </CardBody>
        </Card>
      ) : (
        /* En móvil: tarjetas apiladas. En desktop: tabla */
        <>
          {/* Vista móvil: cards */}
          <div className="space-y-3 md:hidden">
            {vitales.map(v => {
              const imc = v.peso && v.talla
                ? (v.peso / ((v.talla / 100) ** 2)).toFixed(1) : null
              return (
                <Card key={v.id}>
                  <CardBody>
                    <p className="text-xs font-semibold text-gray-500 mb-3">{formatDate(v.fecha)}</p>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                      {v.ta_sistolica  && <span><span className="text-xs text-gray-400">T.A. </span><span className="font-mono font-medium">{v.ta_sistolica}/{v.ta_diastolica}</span> <span className="text-xs text-gray-400">mmHg</span></span>}
                      {v.fc            && <span><span className="text-xs text-gray-400">FC </span><span className="font-medium">{v.fc}</span> <span className="text-xs text-gray-400">lpm</span></span>}
                      {v.temperatura   && <span><span className="text-xs text-gray-400">Temp. </span><span className="font-medium">{v.temperatura}</span><span className="text-xs text-gray-400">°C</span></span>}
                      {v.saturacion_o2 && <span><span className="text-xs text-gray-400">SpO₂ </span><span className="font-medium">{v.saturacion_o2}</span><span className="text-xs text-gray-400">%</span></span>}
                      {v.peso          && <span><span className="text-xs text-gray-400">Peso </span><span className="font-medium">{v.peso}</span><span className="text-xs text-gray-400"> kg</span></span>}
                      {v.talla         && <span><span className="text-xs text-gray-400">Talla </span><span className="font-medium">{v.talla}</span><span className="text-xs text-gray-400"> cm</span></span>}
                      {imc             && <span><span className="text-xs text-gray-400">IMC </span><span className={`font-semibold ${imcColor(parseFloat(imc))}`}>{imc}</span></span>}
                      {v.glucosa       && <span><span className="text-xs text-gray-400">Glucosa </span><span className="font-medium">{v.glucosa}</span><span className="text-xs text-gray-400"> mg/dL</span></span>}
                      {v.fr            && <span><span className="text-xs text-gray-400">FR </span><span className="font-medium">{v.fr}</span><span className="text-xs text-gray-400"> rpm</span></span>}
                    </div>
                  </CardBody>
                </Card>
              )
            })}
          </div>

          {/* Vista desktop: tabla */}
          <Card className="hidden md:block overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50">
                    {['Fecha','T.A.','FC','FR','Temp.','SpO₂','Peso','Talla','IMC','Glucosa','P.Abd.'].map(h => (
                      <th key={h} className="text-left text-xs font-medium text-gray-400 px-3 py-2.5 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {vitales.map(v => {
                    const imc = v.peso && v.talla
                      ? (v.peso / ((v.talla / 100) ** 2)).toFixed(1) : null
                    return (
                      <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 py-2.5 text-xs text-gray-500 whitespace-nowrap font-medium">{formatDate(v.fecha)}</td>
                        <td className="px-3 py-2.5 font-mono text-xs text-gray-700 whitespace-nowrap">{v.ta_sistolica ? `${v.ta_sistolica}/${v.ta_diastolica}` : '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-700">{v.fc           || '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-700">{v.fr           || '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-700">{v.temperatura   ? `${v.temperatura}°` : '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-700">{v.saturacion_o2 ? `${v.saturacion_o2}%` : '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-700">{v.peso          ? `${v.peso} kg` : '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-700">{v.talla         ? `${v.talla} cm` : '—'}</td>
                        <td className={`px-3 py-2.5 text-xs font-semibold ${imcColor(imc)}`}>{imc || '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-700">{v.glucosa       ? `${v.glucosa}` : '—'}</td>
                        <td className="px-3 py-2.5 text-xs text-gray-700">{v.perimetro_abd ? `${v.perimetro_abd} cm` : '—'}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}

// ── Sección: Documentos ───────────────────────────────────────────────────────

function SeccionDocumentos({ documentos, pacienteId }) {
  const TIPO_EMOJI = { laboratorio: '🧪', imagen: '🩻', otro: '📄' }
  const TIPO_COLOR = { laboratorio: 'blue', imagen: 'purple', otro: 'gray' }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {documentos.length} documento{documentos.length !== 1 ? 's' : ''}
        </p>
        <Link href={`/pacientes/${pacienteId}/documentos`}>
          <Button size="sm" variant="secondary"><FolderOpen size={13} /> Gestionar</Button>
        </Link>
      </div>

      {documentos.length === 0 ? (
        <Card>
          <CardBody className="text-center py-14">
            <FolderOpen size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">Sin documentos adjuntos</p>
            <Link href={`/pacientes/${pacienteId}/documentos`} className="text-xs text-sky-600 hover:underline mt-1 inline-block">
              Subir primer documento
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {documentos.map(d => (
            <Card key={d.id}>
              <CardBody className="flex items-center gap-3 !py-3">
                <span className="text-2xl flex-shrink-0">{TIPO_EMOJI[d.tipo] || '📄'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{d.nombre}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Badge color={TIPO_COLOR[d.tipo] || 'gray'} className="text-[10px]">{d.tipo}</Badge>
                    <span className="text-xs text-gray-400">{formatDate(d.created_at)}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Sección: Recetas ──────────────────────────────────────────────────────────

function SeccionRecetas({ recetas, pacienteId }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {recetas.length} prescripción{recetas.length !== 1 ? 'es' : ''}
        </p>
        <Link href={`/prescripciones/nueva?paciente=${pacienteId}`}>
          <Button size="sm"><Plus size={13} /> Nueva receta</Button>
        </Link>
      </div>

      {recetas.length === 0 ? (
        <Card>
          <CardBody className="text-center py-14">
            <FileText size={32} className="mx-auto text-gray-200 mb-3" />
            <p className="text-sm text-gray-400">Sin prescripciones registradas</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {recetas.map(r => (
            <Card key={r.id}>
              <CardBody>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <ClipboardList size={14} className="text-gray-400" />
                    <span className="text-sm font-medium text-gray-700">{formatDate(r.fecha)}</span>
                  </div>
                  <Badge color="sky">{r.vigencia_dias} días</Badge>
                </div>
                <ul className="space-y-1.5">
                  {(r.medicamentos || []).map((m, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <Pill size={13} className="text-sky-400 mt-0.5 flex-shrink-0" />
                      <span>
                        <span className="font-medium">{m.nombre}</span>
                        {m.dosis && <span className="text-gray-500"> — {m.dosis}</span>}
                        {m.indicaciones && <span className="text-gray-400 text-xs"> · {m.indicaciones}</span>}
                      </span>
                    </li>
                  ))}
                </ul>
                {r.instrucciones && (
                  <p className="text-xs text-gray-500 mt-2 pt-2 border-t border-gray-100">{r.instrucciones}</p>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Componentes auxiliares ────────────────────────────────────────────────────

function VitalChip({ icon, label, value, unit, imcValue }) {
  const imcColor = imcValue
    ? imcValue < 18.5 ? 'text-blue-700'
    : imcValue < 25   ? 'text-green-700'
    : imcValue < 30   ? 'text-amber-700'
    : 'text-red-700'
    : 'text-gray-800'

  return (
    <div className="flex flex-col items-center bg-gray-50 rounded-xl py-2.5 px-2 text-center">
      <div className="text-gray-400 mb-1">{icon}</div>
      <p className={`text-sm font-semibold leading-tight ${imcValue ? imcColor : 'text-gray-800'}`}>
        {value}
        {unit && <span className="text-[10px] font-normal text-gray-400 ml-0.5">{unit}</span>}
      </p>
      <p className="text-[10px] text-gray-400 mt-0.5">{label}</p>
    </div>
  )
}

function AntSection({ title, children }) {
  return (
    <div className="border-b border-gray-100 pb-5 last:border-0 last:pb-0">
      <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{title}</h4>
      {children}
    </div>
  )
}

function AntRow({ label, value }) {
  return (
    <p className="text-sm text-gray-700">
      <span className="text-xs font-medium text-gray-400 mr-2">{label}:</span>
      {value}
    </p>
  )
}

function ConsultaCampo({ label, value, highlight }) {
  if (!value) return null
  return (
    <div>
      <p className="text-xs font-medium text-gray-400 mb-1">{label}</p>
      <p className={`text-sm whitespace-pre-line ${highlight ? 'text-sky-700 font-medium' : 'text-gray-700'}`}>
        {value}
      </p>
    </div>
  )
}

function FieldSelect({ label, value, onChange, options }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <select
        value={value} onChange={onChange}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--brand-500)] bg-white"
      >
        {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
      </select>
    </div>
  )
}
