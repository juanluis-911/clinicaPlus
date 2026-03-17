'use client'

import { useRouter } from 'next/navigation'
import { LogOut, Menu } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import Badge from './ui/Badge'

export default function TopBar({ title, onMenuClick }) {
  const { perfil, rol } = useUser()
  const router = useRouter()
  const supabase = createClient()

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
