'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { HeartPulse, Eye, EyeOff, ArrowRight, Calendar, Users, FileText } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function LoginPage() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [showPwd, setShowPwd]   = useState(false)
  const [error, setError]       = useState('')
  const [loading, setLoading]   = useState(false)
  const router  = useRouter()
  const supabase = createClient()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const { error: err } = await supabase.auth.signInWithPassword({ email, password })
    if (err) {
      if (err.code === 'email_not_confirmed') {
        setError('Debes confirmar tu correo electrónico antes de iniciar sesión. Revisa tu bandeja de entrada (y carpeta de spam).')
      } else {
        setError('Credenciales incorrectas. Verifica tu email y contraseña.')
      }
      setLoading(false)
    } else {
      router.push('/dashboard')
    }
  }

  return (
    <div className="min-h-screen flex">

      {/* ── Panel izquierdo (branding) ──────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[52%] relative bg-slate-950 flex-col justify-between p-12 overflow-hidden">
        {/* Orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] bg-sky-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-violet-500/15 rounded-full blur-[100px]" />
        </div>
        {/* Grid */}
        <div className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
            backgroundSize: '50px 50px',
          }}
        />

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="w-10 h-10 bg-sky-500 rounded-2xl flex items-center justify-center shadow-lg shadow-sky-500/30">
            <HeartPulse size={20} className="text-white" />
          </div>
          <span className="text-xl font-bold text-white tracking-tight">MediFlow</span>
        </div>

        {/* Copy central */}
        <div className="relative">
          <h2 className="text-4xl font-extrabold text-white leading-tight mb-6">
            Tu consulta,<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-400 to-cyan-300">
              siempre organizada.
            </span>
          </h2>
          <div className="space-y-4">
            {[
              { icon: Calendar, text: 'Agenda y citas en un solo lugar' },
              { icon: Users,    text: 'Expediente clínico completo por paciente' },
              { icon: FileText, text: 'Recetas digitales listas en segundos' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 text-slate-300">
                <div className="w-8 h-8 bg-sky-500/15 border border-sky-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon size={15} className="text-sky-400" />
                </div>
                <span className="text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="relative">
          <p className="text-xs text-slate-600">© 2025 MediFlow · Hecho en México</p>
        </div>
      </div>

      {/* ── Panel derecho (formulario) ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-center items-center bg-white px-6 py-12">
        {/* Logo móvil */}
        <div className="lg:hidden flex items-center gap-2.5 mb-10">
          <div className="w-9 h-9 bg-sky-500 rounded-xl flex items-center justify-center shadow-sm shadow-sky-200">
            <HeartPulse size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">MediFlow</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Bienvenido de vuelta</h1>
            <p className="text-sm text-slate-500">Ingresa tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Correo electrónico
              </label>
              <input
                type="email"
                placeholder="medico@clinica.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
              />
            </div>

            {/* Contraseña */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full h-11 px-4 pr-11 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3.5 py-3">
                <span className="mt-0.5 w-4 h-4 flex-shrink-0 rounded-full bg-red-200 flex items-center justify-center font-bold text-red-600">!</span>
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md shadow-sky-200"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>Iniciar sesión <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            ¿No tienes cuenta?{' '}
            <Link href="/auth/registro" className="text-sky-600 font-semibold hover:text-sky-700 transition-colors">
              Regístrate gratis
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
