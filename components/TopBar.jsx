'use client'

import { useRouter } from 'next/navigation'
import { LogOut, User } from 'lucide-react'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import Badge from './ui/Badge'

export default function TopBar({ title }) {
  const { perfil, rol } = useUser()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/auth/login')
  }

  return (
    <header className="h-14 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <h1 className="text-sm font-semibold text-gray-800">{title}</h1>
      <div className="flex items-center gap-3">
        {rol && (
          <Badge color={rol === 'medico' ? 'sky' : 'purple'}>
            {rol === 'medico' ? 'Médico' : 'Asistente'}
          </Badge>
        )}
        {perfil && (
          <span className="text-sm text-gray-600 hidden sm:block">{perfil.nombre_completo}</span>
        )}
        <button
          onClick={handleLogout}
          className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
          title="Cerrar sesión"
        >
          <LogOut size={16} />
        </button>
      </div>
    </header>
  )
}
