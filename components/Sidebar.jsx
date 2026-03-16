'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard, Calendar, Users, FilePlus,
  ChevronLeft, ChevronRight, Stethoscope, Settings, Building2, UsersRound,
} from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { usePermission } from '@/hooks/usePermission'
import { useConfig } from '@/hooks/useConfig'
import { cn, getInitials } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard',            label: 'Panel de Control', icon: LayoutDashboard },
  { href: '/agenda',               label: 'Agenda',           icon: Calendar },
  { href: '/pacientes',            label: 'Pacientes',        icon: Users },
  { href: '/prescripciones',       label: 'Prescripciones',   icon: FilePlus,    requiredAction: 'ver_prescripcion' },
  { href: '/configuracion',        label: 'Mi Clínica',       icon: Building2,   requiredAction: 'ver_configuracion' },
  { href: '/configuracion/equipo', label: 'Equipo',           icon: UsersRound,  requiredAction: 'gestionar_equipo' },
]

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { perfil } = useUser()
  const { can } = usePermission()
  const { config } = useConfig()

  const items = NAV_ITEMS.filter(item => !item.requiredAction || can(item.requiredAction))

  return (
    <aside className={cn(
      'relative flex flex-col bg-gray-900 text-gray-100 transition-all duration-200 min-h-screen',
      collapsed ? 'w-16' : 'w-60'
    )}>
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-gray-800">
        <div className="flex-shrink-0 w-8 h-8 bg-sky-600 rounded-lg flex items-center justify-center">
          <Stethoscope size={18} className="text-white" />
        </div>
        {!collapsed && (
          <span className="font-bold text-lg tracking-tight truncate">
            {config?.clinica_nombre || 'MediFlow'}
          </span>
        )}
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
                'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                active
                  ? 'bg-sky-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
              title={collapsed ? label : undefined}
            >
              <Icon size={18} className="flex-shrink-0" />
              {!collapsed && <span>{label}</span>}
            </Link>
          )
        })}
      </nav>

      {/* User */}
      {perfil && (
        <Link
          href="/perfil"
          className={cn(
            'flex items-center gap-3 px-4 py-4 border-t border-gray-800 hover:bg-gray-800 transition-colors',
            collapsed && 'justify-center'
          )}
          title={collapsed ? 'Mi perfil' : undefined}
        >
          <div className="w-8 h-8 rounded-full bg-sky-700 flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {getInitials(perfil.nombre_completo)}
          </div>
          {!collapsed && (
            <>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-gray-200 truncate">{perfil.nombre_completo}</p>
                <p className="text-xs text-gray-500 capitalize">{perfil.rol}</p>
              </div>
              <Settings size={14} className="text-gray-500 flex-shrink-0" />
            </>
          )}
        </Link>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(c => !c)}
        className="absolute -right-3 top-20 w-6 h-6 bg-gray-700 border border-gray-600 rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors"
        title={collapsed ? 'Expandir' : 'Colapsar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
