'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  Network, Copy, Check, Trash2, UserPlus2, Mail,
  Users, UserCheck, Clock, Share2, Gift, Star,
} from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Badge from '@/components/ui/Badge'
import { usePermission } from '@/hooks/usePermission'

// ─── Tarjeta de stat ──────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, color = 'sky' }) {
  const colors = {
    sky:     'bg-sky-50     border-sky-100     text-sky-700',
    emerald: 'bg-emerald-50 border-emerald-100 text-emerald-700',
    amber:   'bg-amber-50   border-amber-100   text-amber-700',
  }
  return (
    <div className={`flex items-center gap-3 rounded-xl border p-4 ${colors[color]}`}>
      <Icon size={20} className="flex-shrink-0" />
      <div>
        <p className="text-2xl font-extrabold leading-none">{value}</p>
        <p className="text-xs mt-0.5 opacity-80">{label}</p>
      </div>
    </div>
  )
}

// ─── Fila de referido ─────────────────────────────────────────────────────────
function ReferidoRow({ referido: r, onCancelar }) {
  const [copied,  setCopied]  = useState(false)
  const [loading, setLoading] = useState(false)

  function copyLink() {
    navigator.clipboard.writeText(r.link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleCancelar() {
    setLoading(true)
    await onCancelar(r.id)
    setLoading(false)
  }

  const esRegistrado = r.estado === 'registrado'
  const esCancelado  = r.cancelado

  return (
    <div className={`bg-white border rounded-xl p-4 transition-opacity ${esCancelado || esRegistrado ? 'opacity-70' : ''}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            {esRegistrado && <Badge color="emerald">Registrado</Badge>}
            {esCancelado  && <Badge color="gray">Cancelado</Badge>}
            {!esRegistrado && !esCancelado && <Badge color="amber">Pendiente</Badge>}
            {r.nombre && <span className="text-sm font-medium text-gray-700">{r.nombre}</span>}
            {r.email  && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Mail size={11} />{r.email}
              </span>
            )}
          </div>
          <p className="text-xs font-mono text-gray-400 truncate">{r.link}</p>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {!esCancelado && !esRegistrado && (
            <>
              <button
                onClick={copyLink}
                className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:border-sky-300 hover:text-sky-700 transition-colors"
              >
                {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
              <button
                onClick={handleCancelar}
                disabled={loading}
                className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                title="Cancelar invitación"
              >
                <Trash2 size={14} />
              </button>
            </>
          )}
          {esRegistrado && (
            <span className="text-xs text-emerald-600 flex items-center gap-1 font-medium">
              <UserCheck size={13} /> Unido
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Modal nueva invitación personalizada ─────────────────────────────────────
function ModalInvitar({ open, onClose, onCreado }) {
  const [form,    setForm]    = useState({ nombre: '', email: '' })
  const [link,    setLink]    = useState(null)
  const [copied,  setCopied]  = useState(false)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  function reset() {
    setForm({ nombre: '', email: '' })
    setLink(null)
    setCopied(false)
    setError('')
  }

  function handleClose() { reset(); onClose() }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/referidos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Error al generar link')
      setLink(json.data.link)
      onCreado(json.data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function copyLink() {
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <Modal open={open} onClose={handleClose} title="Invitar colega a MediFlow" size="sm">
      {!link ? (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-sky-50 border border-sky-100 rounded-xl px-4 py-3 text-xs text-sky-700">
            Se generará un link único para este colega. Cuando se registre, quedará vinculado a tu cuenta para el programa de beneficios.
          </div>
          <Input
            label="Nombre del colega (opcional)"
            placeholder="Dra. Carmen Torres"
            value={form.nombre}
            onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))}
          />
          <Input
            label="Correo electrónico (opcional)"
            type="email"
            placeholder="carmen@clinica.com"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
          />
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
            <p className="text-sm font-semibold text-emerald-800 mb-1">¡Link listo para compartir!</p>
            <p className="text-xs text-emerald-700">
              Compártelo por WhatsApp, correo o como prefieras.
            </p>
          </div>
          <div className="bg-gray-50 rounded-lg p-3 text-xs font-mono text-gray-600 break-all">
            {link}
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

// ─── Página principal ─────────────────────────────────────────────────────────
export default function MiRedPage() {
  const { isOwner } = usePermission()

  const [data,       setData]       = useState(null)
  const [loading,    setLoading]    = useState(true)
  const [modalOpen,  setModalOpen]  = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/referidos')
      const json = await res.json()
      if (res.ok) setData(json.data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function copyLinkPersonal() {
    if (!data?.linkPersonal) return
    navigator.clipboard.writeText(data.linkPersonal).then(() => {
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2500)
    })
  }

  async function handleCancelar(id) {
    const res = await fetch(`/api/referidos?id=${id}`, { method: 'DELETE' })
    if (res.ok) {
      setData(prev => ({
        ...prev,
        referidos: prev.referidos.map(r =>
          r.id === id ? { ...r, cancelado: true } : r
        ),
        stats: {
          ...prev.stats,
          pendientes: Math.max(0, prev.stats.pendientes - 1),
        }
      }))
    }
  }

  function handleCreado(nuevoRef) {
    setData(prev => ({
      ...prev,
      referidos: [nuevoRef, ...(prev?.referidos || [])],
      stats: {
        total:      (prev?.stats?.total      || 0) + 1,
        registrados: prev?.stats?.registrados || 0,
        pendientes: (prev?.stats?.pendientes  || 0) + 1,
      }
    }))
  }

  // Solo médicos titulares
  if (!isOwner) {
    return (
      <AppLayout title="Mi Red">
        <div className="flex items-center justify-center h-64 text-gray-500 text-sm">
          Solo el médico titular puede gestionar su red de referidos.
        </div>
      </AppLayout>
    )
  }

  const referidosPersonalizados = (data?.referidos || []).filter(r => r.email || r.nombre)
  const stats = data?.stats || { total: 0, registrados: 0, pendientes: 0 }

  return (
    <AppLayout title="Mi Red">
      <div className="max-w-2xl mx-auto space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Network size={20} className="text-sky-600" />
              Mi Red MediFlow
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              Invita a colegas a unirse a la plataforma y crece la red médica.
            </p>
          </div>
          <Button onClick={() => setModalOpen(true)} className="gap-2">
            <UserPlus2 size={16} />
            Invitar colega
          </Button>
        </div>

        {/* Banner de beneficio futuro */}
        <div className="bg-gradient-to-r from-sky-50 to-violet-50 border border-sky-100 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-sky-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Gift size={18} className="text-sky-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                Programa de beneficios
                <span className="text-xs font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">Próximamente</span>
              </p>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                Cuando MediFlow tenga un plan de suscripción,{' '}
                <strong className="text-sky-700">recibirás 3 meses gratis</strong> por cada colega que te refieras y se suscriba.
                Tus referidos actuales ya quedan registrados, por lo que ya estás acumulando beneficios.
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        {loading ? (
          <div className="grid grid-cols-3 gap-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={Users}     label="Total invitados"    value={stats.total}       color="sky"     />
            <StatCard icon={UserCheck} label="Ya registrados"     value={stats.registrados} color="emerald" />
            <StatCard icon={Clock}     label="Pendientes"         value={stats.pendientes}  color="amber"   />
          </div>
        )}

        {/* Link personal permanente */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Share2 size={14} className="text-sky-600" />
            Tu link personal de referido
          </h2>
          <div className="bg-white border rounded-xl p-4">
            <p className="text-xs text-gray-500 mb-3">
              Este link es tuyo para siempre. Compártelo en redes, WhatsApp o donde quieras.
              Cualquier médico que se registre con él quedará vinculado a tu cuenta.
            </p>
            {loading ? (
              <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 text-xs font-mono text-gray-600 truncate">
                  {data?.linkPersonal || '—'}
                </div>
                <button
                  onClick={copyLinkPersonal}
                  disabled={!data?.linkPersonal}
                  className="flex items-center gap-1.5 text-xs px-3 py-2 rounded-lg border border-gray-200 hover:border-sky-300 hover:text-sky-700 transition-colors disabled:opacity-40"
                >
                  {copiedLink ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                  {copiedLink ? 'Copiado' : 'Copiar'}
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Invitaciones personalizadas */}
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Star size={14} className="text-amber-500" />
            Invitaciones personalizadas
            {referidosPersonalizados.length > 0 && (
              <span className="ml-1 bg-gray-100 text-gray-600 text-xs font-medium px-2 py-0.5 rounded-full">
                {referidosPersonalizados.length}
              </span>
            )}
          </h2>

          {loading ? (
            <div className="text-sm text-gray-400 py-6 text-center">Cargando…</div>
          ) : referidosPersonalizados.length === 0 ? (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-xl py-8 text-center">
              <p className="text-sm text-gray-500">Sin invitaciones personalizadas aún.</p>
              <p className="text-xs text-gray-400 mt-1">
                Usa "Invitar colega" para generar links con nombre o correo específico.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {referidosPersonalizados.map(r => (
                <ReferidoRow key={r.id} referido={r} onCancelar={handleCancelar} />
              ))}
            </div>
          )}
        </section>

      </div>

      <ModalInvitar
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreado={handleCreado}
      />
    </AppLayout>
  )
}
