'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  UserPlus, Copy, Check, Trash2, UserCheck, UserX,
  Stethoscope, ClipboardList, Clock, Mail, Settings,
} from 'lucide-react'
import Link from 'next/link'
import AppLayout from '@/components/AppLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import { usePermission } from '@/hooks/usePermission'
import { getInitials } from '@/lib/utils'

// ─── helpers ───────────────────────────────────────────────────────────────
function rolLabel(rol, conEmpleador) {
  if (rol === 'medico' && conEmpleador) return 'Médico asociado'
  if (rol === 'medico') return 'Médico'
  return 'Asistente'
}

function formatExpira(dateStr) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })
}

// ─── Tarjeta de miembro ────────────────────────────────────────────────────
function MiembroCard({ miembro, doctores, onToggle, onAsignar }) {
  const [loading, setLoading]     = useState(false)
  const [assigning, setAssigning] = useState(false)

  async function toggle() {
    setLoading(true)
    await onToggle(miembro.id, !miembro.activo)
    setLoading(false)
  }

  async function handleToggleDoctor(docId) {
    const actual = miembro.doctores_asignados || []
    const nuevo  = actual.includes(docId)
      ? actual.filter(id => id !== docId)
      : [...actual, docId]
    setAssigning(true)
    await onAsignar(miembro.id, nuevo)
    setAssigning(false)
  }

  const etiquetaRol = rolLabel(miembro.rol, true)
  const colorRol    = miembro.rol === 'medico' ? 'sky' : 'purple'
  const asignados   = miembro.doctores_asignados || []

  return (
    <div className={`bg-white border rounded-xl p-4 transition-opacity ${!miembro.activo ? 'opacity-60' : ''}`}>
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="w-10 h-10 rounded-full bg-sky-700 flex items-center justify-center text-white text-sm font-semibold flex-shrink-0">
          {getInitials(miembro.nombre_completo)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-gray-900">{miembro.nombre_completo}</p>
            <Badge color={colorRol}>{etiquetaRol}</Badge>
            {!miembro.activo && <Badge color="gray">Inactivo</Badge>}
          </div>
          {miembro.especialidad && (
            <p className="text-xs text-gray-500 mt-0.5">{miembro.especialidad}</p>
          )}
          {miembro.telefono && (
            <p className="text-xs text-gray-400">{miembro.telefono}</p>
          )}
        </div>

        {/* Acciones */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/configuracion/equipo/${miembro.id}`}>
            <Button size="sm" variant="secondary" className="gap-1.5">
              <Settings size={13} /> Configurar
            </Button>
          </Link>
          <Button
            size="sm"
            variant={miembro.activo ? 'ghost' : 'primary'}
            loading={loading}
            onClick={toggle}
            className="gap-1.5"
          >
            {miembro.activo ? <UserX size={13} /> : <UserCheck size={13} />}
          </Button>
        </div>
      </div>

      {/* Asignación múltiple de doctores (solo asistentes con más de 1 doctor en clínica) */}
      {miembro.rol === 'asistente' && doctores.length > 1 && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="flex items-center gap-1.5 mb-2">
            <Stethoscope size={12} className="text-gray-400" />
            <span className="text-xs text-gray-500">Doctores asignados:</span>
            {assigning && <span className="text-xs text-gray-400 ml-auto">Guardando…</span>}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {doctores.map(d => {
              const activo = asignados.includes(d.id)
              return (
                <button
                  key={d.id}
                  type="button"
                  disabled={assigning}
                  onClick={() => handleToggleDoctor(d.id)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors disabled:opacity-50 ${
                    activo
                      ? 'bg-sky-100 text-sky-700 border-sky-300 font-medium'
                      : 'bg-white text-gray-500 border-gray-200 hover:border-sky-300 hover:text-sky-600'
                  }`}
                >
                  {d.nombre_completo.split(' ').slice(0, 2).join(' ')}
                  {d.especialidad ? ` · ${d.especialidad}` : ''}
                </button>
              )
            })}
          </div>
          {asignados.length === 0 && (
            <p className="text-xs text-amber-600 mt-1.5">
              Sin asignar — verá todas las citas de la clínica.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Fila de invitación ────────────────────────────────────────────────────
function InvitacionRow({ inv, onCancel }) {
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(inv.link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function cancel() {
    setLoading(true)
    await onCancel(inv.id)
    setLoading(false)
  }

  const etiquetaRol = inv.rol === 'medico' ? 'Médico asociado' : 'Asistente'
  const colorRol = inv.rol === 'medico' ? 'sky' : 'purple'

  return (
    <div className="bg-white border rounded-xl p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge color={colorRol}>{etiquetaRol}</Badge>
            {inv.nombre && <span className="text-sm font-medium text-gray-700">{inv.nombre}</span>}
            {inv.email && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Mail size={11} />{inv.email}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            <Clock size={11} /> Expira {formatExpira(inv.expires_at)}
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={copyLink}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:border-sky-300 hover:text-sky-700 transition-colors"
          >
            {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
            {copied ? 'Copiado' : 'Copiar link'}
          </button>
          <button
            onClick={cancel}
            disabled={loading}
            className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Cancelar invitación"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {/* Link truncado */}
      <p className="mt-2 text-xs text-gray-400 font-mono truncate bg-gray-50 rounded px-2 py-1">
        {inv.link}
      </p>
    </div>
  )
}

// ─── Modal nueva invitación ────────────────────────────────────────────────
function ModalInvitar({ open, onClose, onCreated }) {
  const [form, setForm] = useState({ rol: 'asistente', email: '', nombre: '' })
  const [resultado, setResultado] = useState(null)   // { link } tras crear
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  function reset() {
    setForm({ rol: 'asistente', email: '', nombre: '' })
    setResultado(null)
    setCopied(false)
    setError('')
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/invitaciones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al crear invitación')
      setResultado(json.data)
      onCreated(json.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(resultado.link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <Modal open={open} onClose={handleClose} title="Nueva invitación" size="sm">
      {!resultado ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <Select
            label="Rol"
            required
            value={form.rol}
            onChange={e => setForm(f => ({ ...f, rol: e.target.value }))}
            options={[
              { value: 'asistente', label: 'Asistente' },
              { value: 'medico',    label: 'Médico asociado' },
            ]}
          />
          <Input
            label="Nombre (opcional)"
            placeholder="Dr. María López"
            value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
          />
          <Input
            label="Correo electrónico (opcional)"
            type="email"
            placeholder="maria@clinica.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          />
          <p className="text-xs text-gray-500">
            El link generado expira en <strong>7 días</strong>. Puedes enviarlo por WhatsApp, correo o como prefieras.
          </p>
          {error && (
            <p className="text-xs text-red-500 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
          )}
          <div className="flex gap-2 pt-1">
            <Button variant="secondary" type="button" onClick={handleClose} className="flex-1 justify-center">
              Cancelar
            </Button>
            <Button type="submit" loading={loading} className="flex-1 justify-center">
              Generar link
            </Button>
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <p className="text-sm font-semibold text-emerald-800 mb-1">¡Link generado!</p>
            <p className="text-xs text-emerald-700">
              Comparte este link con {resultado.nombre || 'la persona invitada'}.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-600 break-all">
            {resultado.link}
          </div>
          <Button onClick={copyLink} className="w-full justify-center gap-2">
            {copied
              ? <><Check size={15} className="text-white" /> Copiado</>
              : <><Copy size={15} /> Copiar link</>
            }
          </Button>
          <Button variant="secondary" onClick={handleClose} className="w-full justify-center">
            Cerrar
          </Button>
        </div>
      )}
    </Modal>
  )
}

// ─── Página principal ──────────────────────────────────────────────────────
export default function EquipoPage() {
  const { isOwner } = usePermission()
  const [miembros, setMiembros]         = useState([])
  const [invitaciones, setInvitaciones] = useState([])
  const [doctores, setDoctores]         = useState([])
  const [loadingData, setLoadingData]   = useState(true)
  const [modalOpen, setModalOpen]       = useState(false)

  const fetchData = useCallback(async () => {
    setLoadingData(true)
    const [eqRes, invRes, docRes] = await Promise.all([
      fetch('/api/equipo'),
      fetch('/api/invitaciones'),
      fetch('/api/equipo/doctores'),
    ])
    const [eq, inv, doc] = await Promise.all([eqRes.json(), invRes.json(), docRes.json()])
    setMiembros(eq.data || [])
    setInvitaciones(inv.data || [])
    setDoctores(doc.data || [])
    setLoadingData(false)
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  async function handleToggleActivo(id, activo) {
    const res = await fetch('/api/equipo', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, activo }),
    })
    if (res.ok) {
      setMiembros(prev => prev.map(m => m.id === id ? { ...m, activo } : m))
    }
  }

  async function handleAsignarDoctor(id, doctores_asignados) {
    const res = await fetch('/api/equipo', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, doctores_asignados }),
    })
    if (res.ok) {
      const { data } = await res.json()
      setMiembros(prev => prev.map(m => m.id === id ? { ...m, doctores_asignados: data.doctores_asignados } : m))
    }
  }

  async function handleCancelInv(id) {
    const res = await fetch(`/api/invitaciones?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setInvitaciones(prev => prev.filter(i => i.id !== id))
    }
  }

  function handleInvCreated(data) {
    setInvitaciones(prev => [data, ...prev])
  }

  if (!isOwner) {
    return (
      <AppLayout title="Equipo">
        <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
          Solo el médico titular puede gestionar el equipo.
        </div>
      </AppLayout>
    )
  }

  const activos   = miembros.filter(m => m.activo)
  const inactivos = miembros.filter(m => !m.activo)

  return (
    <AppLayout title="Equipo">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-gray-900">Gestión de equipo</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Invita asistentes y médicos asociados a tu clínica.
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <UserPlus size={16} />
            Invitar
          </Button>
        </div>

        {/* Miembros activos */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Stethoscope size={15} className="text-sky-600" />
            Miembros activos
            {activos.length > 0 && (
              <span className="ml-1 bg-sky-100 text-sky-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {activos.length}
              </span>
            )}
          </h2>
          {loadingData ? (
            <div className="text-sm text-gray-400 py-6 text-center">Cargando…</div>
          ) : activos.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl py-8 text-center">
              <p className="text-sm text-gray-500">Aún no hay miembros en el equipo.</p>
              <p className="text-xs text-gray-400 mt-1">Usa "Invitar" para agregar asistentes o médicos.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activos.map(m => (
                <MiembroCard key={m.id} miembro={m} doctores={doctores} onToggle={handleToggleActivo} onAsignar={handleAsignarDoctor} />
              ))}
            </div>
          )}
        </section>

        {/* Miembros inactivos */}
        {inactivos.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 mb-3 flex items-center gap-2">
              <UserX size={15} />
              Inactivos
            </h2>
            <div className="space-y-3">
              {inactivos.map(m => (
                <MiembroCard key={m.id} miembro={m} doctores={doctores} onToggle={handleToggleActivo} onAsignar={handleAsignarDoctor} />
              ))}
            </div>
          </section>
        )}

        {/* Invitaciones pendientes */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <ClipboardList size={15} className="text-amber-600" />
            Invitaciones pendientes
            {invitaciones.length > 0 && (
              <span className="ml-1 bg-amber-100 text-amber-700 text-xs font-medium px-2 py-0.5 rounded-full">
                {invitaciones.length}
              </span>
            )}
          </h2>
          {loadingData ? (
            <div className="text-sm text-gray-400 py-4 text-center">Cargando…</div>
          ) : invitaciones.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl py-6 text-center">
              <p className="text-sm text-gray-400">No hay invitaciones pendientes.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {invitaciones.map(inv => (
                <InvitacionRow key={inv.id} inv={inv} onCancel={handleCancelInv} />
              ))}
            </div>
          )}
        </section>
      </div>

      <ModalInvitar
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleInvCreated}
      />
    </AppLayout>
  )
}
