'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  HeartPulse, Eye, EyeOff, ArrowRight, CheckCircle,
  Stethoscope, Building2, UserCheck,
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/* ── Pequeño input reutilizable dentro del formulario ─────────────────────── */
function Field({ label, helper, error, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-slate-700 mb-1.5">{label}</label>
      {children}
      {helper && <p className="mt-1 text-[11px] text-slate-400">{helper}</p>}
      {error  && <p className="mt-1 text-[11px] text-red-500">{error}</p>}
    </div>
  )
}

const inputCls =
  'w-full h-11 px-4 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/30 focus:border-sky-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed'

/* ── Formulario principal ─────────────────────────────────────────────────── */
function RegistroForm() {
  const [form, setForm] = useState({
    nombre_completo: '',
    email:           '',
    password:        '',
    rol:             'medico',
    especialidad:    '',
    cedula_profesional: '',
    telefono:        '',
    medico_empleador_id: '',
  })
  const [showPwd,        setShowPwd]        = useState(false)
  const [invite,         setInvite]         = useState(null)
  const [inviteCodigo,   setInviteCodigo]   = useState('')
  const [inviteLoading,  setInviteLoading]  = useState(false)
  const [error,          setError]          = useState('')
  const [loading,        setLoading]        = useState(false)

  const router       = useRouter()
  const searchParams = useSearchParams()
  const supabase     = createClient()

  /* Validar invite del URL */
  useEffect(() => {
    const codigo = searchParams.get('invite')
    if (!codigo) return
    setInviteCodigo(codigo)
    setInviteLoading(true)
    fetch(`/api/invitaciones/validate?codigo=${codigo}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) {
          setInvite(data)
          setForm(f => ({
            ...f,
            rol: data.rol,
            medico_empleador_id: data.medico_id,
            email: data.email || f.email,
            nombre_completo: data.nombre || f.nombre_completo,
          }))
        } else {
          setError(data.error || 'Invitación inválida o expirada.')
        }
      })
      .catch(() => setError('No se pudo validar la invitación.'))
      .finally(() => setInviteLoading(false))
  }, [])

  const set = field => e => setForm(f => ({ ...f, [field]: e.target.value }))

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); return }
    if (!invite && form.rol === 'asistente' && !form.medico_empleador_id.trim()) {
      setError('Los asistentes deben ingresar el ID del médico al que pertenecen.'); return
    }
    setLoading(true)

    const needsEmpleador = form.rol === 'asistente' || (form.rol === 'medico' && form.medico_empleador_id)
    const metadata = {
      nombre_completo: form.nombre_completo,
      rol: form.rol,
      ...(needsEmpleador && { medico_empleador_id: form.medico_empleador_id }),
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: metadata },
    })

    if (signUpError) { setError(signUpError.message); setLoading(false); return }

    if (data.user) {
      await supabase.from('perfiles').update({
        especialidad:       form.especialidad       || null,
        cedula_profesional: form.cedula_profesional || null,
        telefono:           form.telefono           || null,
      }).eq('id', data.user.id)
    }

    if (inviteCodigo) {
      await fetch('/api/invitaciones/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo: inviteCodigo }),
      })
    }

    router.push('/dashboard')
  }

  const rolLabel = form.rol === 'medico' && form.medico_empleador_id
    ? 'Médico asociado'
    : form.rol === 'medico' ? 'Médico' : 'Asistente'

  const esMedico    = form.rol === 'medico'
  const esAsistente = form.rol === 'asistente'

  return (
    <div className="min-h-screen flex">

      {/* ── Panel izquierdo (branding) ────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-[44%] relative bg-slate-950 flex-col justify-between p-12 overflow-hidden">
        {/* Orbs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[-15%] right-[-10%] w-[450px] h-[450px] bg-sky-500/20 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-5%] left-[-5%] w-[350px] h-[350px] bg-violet-500/15 rounded-full blur-[100px]" />
        </div>
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

        {/* Perfiles */}
        <div className="relative">
          <p className="text-sky-400 text-xs font-semibold uppercase tracking-widest mb-5">¿Quién eres?</p>
          <div className="space-y-4">
            {[
              { icon: Stethoscope, title: 'Médico independiente', desc: 'Gestiona tu consulta desde cero' },
              { icon: Building2,   title: 'Clínica u hospital',   desc: 'Multi-usuario, multi-consultorio' },
              { icon: UserCheck,   title: 'Asistente médica',     desc: 'Soporte a tu médico desde la app' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex items-center gap-3">
                <div className="w-9 h-9 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Icon size={16} className="text-sky-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{title}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-slate-600">© 2025 MediFlow · Hecho en México</p>
      </div>

      {/* ── Panel derecho (formulario) ────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto flex flex-col justify-center items-center bg-white px-6 py-12">
        {/* Logo móvil */}
        <div className="lg:hidden flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-sky-500 rounded-xl flex items-center justify-center shadow-sm shadow-sky-200">
            <HeartPulse size={18} className="text-white" />
          </div>
          <span className="text-lg font-bold text-slate-900">MediFlow</span>
        </div>

        <div className="w-full max-w-md">
          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-slate-900 mb-1">Crear cuenta gratis</h1>
            <p className="text-sm text-slate-500">Configura tu clínica en menos de 5 minutos</p>
          </div>

          {/* Banner invite loading */}
          {inviteLoading && (
            <div className="mb-5 flex items-center gap-2.5 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 text-sm text-sky-700">
              <span className="w-4 h-4 border-2 border-sky-400/40 border-t-sky-500 rounded-full animate-spin flex-shrink-0" />
              Validando invitación…
            </div>
          )}

          {/* Banner invite válida */}
          {invite && (
            <div className="mb-5 flex items-start gap-3 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3.5">
              <CheckCircle size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-emerald-800">
                <p className="font-semibold mb-0.5">Invitación válida ✓</p>
                <p className="text-xs text-emerald-700">
                  Serás <span className="font-medium">{rolLabel}</span> en la clínica de{' '}
                  <span className="font-medium">{invite.medico_nombre}</span>
                  {invite.medico_especialidad && ` · ${invite.medico_especialidad}`}.
                </p>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Rol */}
            {!invite ? (
              <Field label="Soy…">
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { value: 'medico',    label: 'Médico',    icon: Stethoscope },
                    { value: 'asistente', label: 'Asistente', icon: UserCheck   },
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, rol: value }))}
                      className={`flex items-center gap-2.5 h-11 px-4 rounded-xl border text-sm font-semibold transition-all ${
                        form.rol === value
                          ? 'border-sky-400 bg-sky-50 text-sky-700 ring-2 ring-sky-500/20'
                          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      <Icon size={15} />
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
            ) : (
              <Field label="Rol">
                <div className="h-11 px-4 rounded-xl border border-slate-200 bg-slate-100 text-sm font-semibold text-slate-700 flex items-center">
                  {rolLabel}
                </div>
              </Field>
            )}

            {/* Nombre */}
            <Field label="Nombre completo">
              <input
                type="text"
                placeholder="Dr. Juan García"
                value={form.nombre_completo}
                onChange={set('nombre_completo')}
                required
                className={inputCls}
              />
            </Field>

            {/* Email */}
            <Field label="Correo electrónico">
              <input
                type="email"
                placeholder="medico@clinica.com"
                value={form.email}
                onChange={set('email')}
                required
                disabled={!!invite?.email && !!form.email}
                autoComplete="email"
                className={inputCls}
              />
            </Field>

            {/* Contraseña */}
            <Field label="Contraseña">
              <div className="relative">
                <input
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={form.password}
                  onChange={set('password')}
                  required
                  className={`${inputCls} pr-11`}
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
            </Field>

            {/* Campos para médico */}
            {esMedico && (
              <div className="grid grid-cols-2 gap-3">
                <Field label="Especialidad">
                  <input
                    type="text"
                    placeholder="Medicina General"
                    value={form.especialidad}
                    onChange={set('especialidad')}
                    className={inputCls}
                  />
                </Field>
                <Field label="Cédula profesional">
                  <input
                    type="text"
                    placeholder="12345678"
                    value={form.cedula_profesional}
                    onChange={set('cedula_profesional')}
                    className={inputCls}
                  />
                </Field>
              </div>
            )}

            {/* ID empleador para asistente sin invite */}
            {esAsistente && !invite && (
              <Field
                label="ID del médico empleador"
                helper="Solicita este ID a tu médico en su perfil de MediFlow"
              >
                <input
                  type="text"
                  placeholder="UUID del médico"
                  value={form.medico_empleador_id}
                  onChange={set('medico_empleador_id')}
                  required
                  className={inputCls}
                />
              </Field>
            )}

            {/* Teléfono */}
            <Field label="Teléfono (opcional)">
              <input
                type="tel"
                placeholder="55 1234 5678"
                value={form.telefono}
                onChange={set('telefono')}
                className={inputCls}
              />
            </Field>

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
              className="w-full h-11 bg-sky-500 hover:bg-sky-600 disabled:opacity-60 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors shadow-md shadow-sky-200 mt-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <>Crear cuenta <ArrowRight size={15} /></>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="text-sky-600 font-semibold hover:text-sky-700 transition-colors">
              Iniciar sesión
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function RegistroPage() {
  return (
    <Suspense>
      <RegistroForm />
    </Suspense>
  )
}
