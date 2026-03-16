'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Stethoscope, CheckCircle } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

function RegistroForm() {
  const [form, setForm] = useState({
    nombre_completo: '',
    email: '',
    password: '',
    rol: 'medico',
    especialidad: '',
    cedula_profesional: '',
    telefono: '',
    medico_empleador_id: '',
  })
  const [invite, setInvite] = useState(null)   // { valid, rol, medico_id, medico_nombre, medico_especialidad }
  const [inviteCodigo, setInviteCodigo] = useState('')
  const [inviteLoading, setInviteLoading] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Leer invite code del URL y validarlo
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

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    // Sin invite: asistente manual requiere ID del empleador
    if (!invite && form.rol === 'asistente' && !form.medico_empleador_id.trim()) {
      setError('Los asistentes deben ingresar el ID del médico al que pertenecen.')
      return
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

    if (signUpError) {
      setError(signUpError.message)
      setLoading(false)
      return
    }

    // Actualizar campos extra del perfil
    if (data.user) {
      await supabase.from('perfiles').update({
        especialidad: form.especialidad || null,
        cedula_profesional: form.cedula_profesional || null,
        telefono: form.telefono || null,
      }).eq('id', data.user.id)
    }

    // Marcar invitación como usada
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 to-blue-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 bg-sky-600 rounded-2xl flex items-center justify-center mb-3 shadow-lg">
            <Stethoscope size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">MediFlow</h1>
          <p className="text-sm text-gray-500 mt-1">Crear cuenta nueva</p>
        </div>

        {/* Banner de invitación */}
        {inviteLoading && (
          <div className="mb-4 bg-sky-50 border border-sky-200 rounded-xl px-4 py-3 text-sm text-sky-700">
            Validando invitación…
          </div>
        )}
        {invite && (
          <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3 flex items-start gap-3">
            <CheckCircle size={18} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-emerald-800">
              <p className="font-semibold">Invitación válida</p>
              <p>Serás <span className="font-medium">{rolLabel}</span> en la clínica de{' '}
                <span className="font-medium">{invite.medico_nombre}</span>
                {invite.medico_especialidad && ` (${invite.medico_especialidad})`}.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Selector de rol: bloqueado si viene de invitación */}
            {!invite ? (
              <Select
                label="Rol"
                required
                value={form.rol}
                onChange={set('rol')}
                options={[
                  { value: 'medico', label: 'Médico' },
                  { value: 'asistente', label: 'Asistente' },
                ]}
              />
            ) : (
              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">Rol</p>
                <p className="text-sm font-semibold text-gray-900 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2">
                  {rolLabel}
                </p>
              </div>
            )}

            <Input
              label="Nombre completo"
              placeholder="Dr. Juan García"
              value={form.nombre_completo}
              onChange={set('nombre_completo')}
              required
            />
            <Input
              label="Correo electrónico"
              type="email"
              placeholder="medico@clinica.com"
              value={form.email}
              onChange={set('email')}
              required
              disabled={!!invite?.email && !!form.email}
            />
            <Input
              label="Contraseña"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={form.password}
              onChange={set('password')}
              required
            />

            {/* Campos solo para médico independiente */}
            {form.rol === 'medico' && !form.medico_empleador_id && (
              <>
                <Input
                  label="Especialidad"
                  placeholder="Medicina General"
                  value={form.especialidad}
                  onChange={set('especialidad')}
                />
                <Input
                  label="Cédula profesional"
                  placeholder="12345678"
                  value={form.cedula_profesional}
                  onChange={set('cedula_profesional')}
                />
              </>
            )}

            {/* Campos para médico asociado */}
            {form.rol === 'medico' && form.medico_empleador_id && (
              <>
                <Input
                  label="Especialidad"
                  placeholder="Medicina General"
                  value={form.especialidad}
                  onChange={set('especialidad')}
                />
                <Input
                  label="Cédula profesional"
                  placeholder="12345678"
                  value={form.cedula_profesional}
                  onChange={set('cedula_profesional')}
                />
              </>
            )}

            {/* ID manual del médico: solo si es asistente sin invite */}
            {form.rol === 'asistente' && !invite && (
              <Input
                label="ID del médico empleador"
                placeholder="UUID del médico"
                value={form.medico_empleador_id}
                onChange={set('medico_empleador_id')}
                required
                helper="Solicita este ID a tu médico en su perfil de MediFlow"
              />
            )}

            <Input
              label="Teléfono"
              type="tel"
              placeholder="55 1234 5678"
              value={form.telefono}
              onChange={set('telefono')}
            />

            {error && (
              <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>
            )}
            <Button type="submit" loading={loading} className="w-full justify-center">
              Crear cuenta
            </Button>
          </form>
          <p className="mt-4 text-center text-xs text-gray-500">
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" className="text-sky-600 font-medium hover:underline">
              Inicia sesión
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
