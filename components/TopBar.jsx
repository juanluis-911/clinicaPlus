'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import { LogOut, Menu, Network, Copy, Check, ArrowRight, Sparkles } from 'lucide-react'
import Link from 'next/link'
import { useUser } from '@/hooks/useUser'
import { usePermission } from '@/hooks/usePermission'
import { createClient } from '@/lib/supabase/client'
import Badge from './ui/Badge'

// ─── Popover de invitación ────────────────────────────────────────────────────
function InvitePopover({ onClose }) {
  const [link,    setLink]    = useState('')
  const [loading, setLoading] = useState(true)
  const [copied,  setCopied]  = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    fetch('/api/referidos')
      .then(r => r.json())
      .then(json => setLink(json.data?.linkPersonal || ''))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  // Cierra al hacer click fuera
  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [onClose])

  function copy() {
    if (!link) return
    navigator.clipboard.writeText(link).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div
      ref={ref}
      className="absolute right-0 top-[calc(100%+10px)] w-80 z-50 rounded-2xl shadow-2xl shadow-sky-900/10 border border-gray-100 bg-white overflow-hidden"
    >
      {/* Cabecera con gradiente */}
      <div className="bg-gradient-to-br from-sky-500 via-sky-400 to-violet-500 px-5 py-4">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-7 h-7 bg-white/20 rounded-lg flex items-center justify-center">
            <Network size={14} className="text-white" />
          </div>
          <p className="text-sm font-bold text-white">Invita a un colega</p>
        </div>
        <p className="text-xs text-sky-100 leading-snug">
          Comparte tu link y crece la red. Cuando haya suscripción,
          ganas <strong className="text-white">3 meses gratis</strong> por cada médico que se una.
        </p>
      </div>

      {/* Link */}
      <div className="px-4 py-4 space-y-3">
        {loading ? (
          <div className="h-9 bg-gray-100 rounded-xl animate-pulse" />
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1 min-w-0 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-[11px] font-mono text-gray-500 truncate">
              {link || '—'}
            </div>
            <button
              onClick={copy}
              disabled={!link}
              className={`flex-shrink-0 flex items-center gap-1 text-xs font-semibold px-3 py-2 rounded-xl transition-all disabled:opacity-40 ${
                copied
                  ? 'bg-emerald-500 text-white'
                  : 'bg-sky-500 hover:bg-sky-600 text-white'
              }`}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />}
              {copied ? 'Ok' : 'Copiar'}
            </button>
          </div>
        )}

        <Link
          href="/red"
          onClick={onClose}
          className="flex items-center justify-between w-full text-xs text-gray-500 hover:text-sky-600 transition-colors group"
        >
          <span>Ver todos mis referidos y estadísticas</span>
          <ArrowRight size={13} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      </div>
    </div>
  )
}

// ─── TopBar ───────────────────────────────────────────────────────────────────
export default function TopBar({ title, onMenuClick }) {
  const { perfil, rol } = useUser()
  const { isOwner } = usePermission()
  const router = useRouter()
  const supabase = createClient()
  const [popoverOpen, setPopoverOpen] = useState(false)

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <header className="sticky top-0 z-20 h-14 backdrop-blur-md bg-white/85 border-b border-gray-200/70 flex items-center justify-between px-3 md:px-6">
      <div className="flex items-center gap-2">
        {/* Hamburger — solo móvil */}
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-1 rounded-xl text-gray-500 hover:bg-gray-100 transition-colors"
          aria-label="Abrir menú"
        >
          <Menu size={20} />
        </button>
        <h1 className="text-base font-semibold text-gray-900 tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {rol && (
          <Badge color={rol === 'medico' ? 'sky' : 'purple'} className="hidden sm:flex">
            {rol === 'medico' ? 'Médico' : 'Asistente'}
          </Badge>
        )}
        {perfil && (
          <span className="text-sm text-gray-600 hidden md:block">{perfil.nombre_completo}</span>
        )}

        {/* Botón invitar colega — solo médico titular */}
        {isOwner && (
          <div className="relative">
            <button
              onClick={() => setPopoverOpen(v => !v)}
              aria-label="Invitar colega"
              className={`
                relative flex items-center gap-2 h-8 pl-2.5 pr-3 rounded-full text-xs font-semibold text-white
                bg-gradient-to-r from-sky-500 to-violet-500
                shadow-md shadow-sky-400/30
                hover:shadow-sky-400/50 hover:scale-[1.03]
                active:scale-[0.97]
                transition-all duration-200
                overflow-hidden
                ${popoverOpen ? 'scale-[0.97]' : ''}
              `}
            >
              {/* Shimmer sweep */}
              <span
                aria-hidden="true"
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent animate-[shimmer_2.4s_ease-in-out_infinite]"
              />
              <Sparkles size={13} className="flex-shrink-0 relative" />
              <span className="relative hidden sm:block">Invitar colega</span>
              <span className="relative sm:hidden">Invitar</span>
            </button>

            {popoverOpen && (
              <InvitePopover onClose={() => setPopoverOpen(false)} />
            )}
          </div>
        )}

        <button
          onClick={handleLogout}
          className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Cerrar sesión"
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  )
}
