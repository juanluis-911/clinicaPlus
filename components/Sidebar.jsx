'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Calendar, Users, FilePlus,
  ChevronLeft, ChevronRight, Stethoscope, Settings, Building2, UsersRound, Pill,
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { usePermission } from '@/hooks/usePermission'
import { useConfig } from '@/hooks/useConfig'
import { cn, getInitials } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard',            label: 'Panel de Control', icon: LayoutDashboard },
  { href: '/farmacia',             label: 'Farmacia',         icon: Pill,        requiredAction: 'ver_farmacia' },
  { href: '/agenda',               label: 'Agenda',           icon: Calendar },
  { href: '/pacientes',            label: 'Pacientes',        icon: Users },
  { href: '/prescripciones',       label: 'Prescripciones',   icon: FilePlus,    requiredAction: 'ver_prescripcion' },
  { href: '/configuracion',        label: 'Mi Clínica',       icon: Building2,   requiredAction: 'ver_configuracion' },
  { href: '/configuracion/equipo', label: 'Equipo',           icon: UsersRound,  requiredAction: 'gestionar_equipo' },
]

export default function Sidebar({ mobileOpen = false, onMobileClose }) {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { perfil } = useUser()
  const { can } = usePermission()
  const { config } = useConfig()

  const items = NAV_ITEMS.filter(item => !item.requiredAction || can(item.requiredAction))

  return (
    <>
      {/* ── Backdrop móvil ─────────────────────────────────────────── */}
      <div
        className={cn(
          'fixed inset-0 z-20 bg-black/50 backdrop-blur-sm md:hidden',
          'transition-opacity duration-300',
          mobileOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={onMobileClose}
        aria-hidden="true"
      />

      {/* ── Panel lateral ──────────────────────────────────────────── */}
      <aside className={cn(
        'flex flex-col bg-[var(--sb-bg)] text-[var(--sb-text)]',
        // Móvil: drawer fijo que entra desde la izquierda
        'fixed inset-y-0 left-0 z-30 w-[280px]',
        'transition-transform duration-300 ease-out',
        mobileOpen ? 'translate-x-0' : '-translate-x-full',
        // Desktop: dentro del flujo flex, colapsable
        'md:relative md:inset-auto md:left-auto md:z-auto',
        'md:translate-x-0 md:min-h-screen',
        'md:transition-[width] md:duration-200',
        collapsed ? 'md:w-16' : 'md:w-60',
      )}>

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-[var(--sb-border)]">
          <div className="flex-shrink-0 w-8 h-8 bg-[var(--brand-600)] rounded-lg flex items-center justify-center">
            <Stethoscope size={18} className="text-white" />
          </div>
          <span className={cn('font-bold text-lg tracking-tight truncate', collapsed && 'md:hidden')}>
            {config?.clinica_nombre || 'MediFlow'}
          </span>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {items.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || pathname.startsWith(href + '/')
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors',
                  active
                    ? 'bg-[var(--brand-600)] text-white'
                    : 'text-[var(--sb-text-dim)] hover:bg-[var(--sb-hover)] hover:text-[var(--sb-text-hover)]'
                )}
                title={collapsed ? label : undefined}
              >
                <Icon size={18} className="flex-shrink-0" />
                <span className={cn(collapsed && 'md:hidden')}>{label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User */}
        {perfil && (
          <Link
            href="/perfil"
            className={cn(
              'flex items-center gap-3 px-4 py-4 border-t border-[var(--sb-border)] hover:bg-[var(--sb-hover)] transition-colors',
              collapsed && 'md:justify-center'
            )}
            title={collapsed ? 'Mi perfil' : undefined}
          >
            <div className="w-9 h-9 rounded-full bg-[var(--brand-700)] flex items-center justify-center text-xs font-semibold flex-shrink-0">
              {getInitials(perfil.nombre_completo)}
            </div>
            <div className={cn('min-w-0 flex-1', collapsed && 'md:hidden')}>
              <p className="text-xs font-medium text-[var(--sb-text)] truncate">{perfil.nombre_completo}</p>
              <p className="text-xs text-[var(--sb-text-dim)] capitalize">{perfil.rol}</p>
            </div>
            <Settings size={14} className={cn('text-[var(--sb-text-dim)] flex-shrink-0', collapsed && 'md:hidden')} />
          </Link>
        )}

        {/* Collapse toggle — solo desktop */}
        <button
          onClick={() => setCollapsed(c => !c)}
          className="hidden md:flex absolute -right-3 top-20 w-6 h-6 rounded-full items-center justify-center transition-colors bg-[var(--sb-toggle-bg)] border border-[var(--sb-border)] hover:bg-[var(--sb-hover)] text-[var(--sb-text-dim)]"
          title={collapsed ? 'Expandir' : 'Colapsar'}
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </aside>
    </>
  )
}
