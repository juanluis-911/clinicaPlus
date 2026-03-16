'use client'

import { useState } from 'react'
import { Save, User, Shield, Eye, EyeOff } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Card, { CardBody, CardHeader, CardFooter } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge from '@/components/ui/Badge'
import { useUser } from '@/hooks/useUser'
import { createClient } from '@/lib/supabase/client'
import { getInitials } from '@/lib/utils'

export default function PerfilPage() {
  const { user, perfil, rol } = useUser()
  const [form, setForm] = useState(null)
  const [savingPerfil, setSavingPerfil] = useState(false)
  const [savingPassword, setSavingPassword] = useState(false)
  const [successPerfil, setSuccessPerfil] = useState(false)
  const [successPassword, setSuccessPassword] = useState(false)
  const [errorPerfil, setErrorPerfil] = useState('')
  const [errorPassword, setErrorPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [passwords, setPasswords] = useState({ nueva: '', confirmar: '' })

  // Initialize form once perfil loads
  if (perfil && !form) {
    setForm({
      nombre_completo:    perfil.nombre_completo || '',
      telefono:           perfil.telefono || '',
      especialidad:       perfil.especialidad || '',
      cedula_profesional: perfil.cedula_profesional || '',
    })
  }

  function set(field) {
    return e => setForm(f => ({ ...f, [field]: e.target.value }))
  }

  async function handleSavePerfil(e) {
    e.preventDefault()
    if (!form.nombre_completo.trim()) {
      setErrorPerfil('El nombre completo es obligatorio.')
      return
    }
    setErrorPerfil('')
    setSavingPerfil(true)
    const supabase = createClient()
    const { error } = await supabase
      .from('perfiles')
      .update({
        nombre_completo:    form.nombre_completo.trim(),
        telefono:           form.telefono.trim() || null,
        especialidad:       form.especialidad.trim() || null,
        cedula_profesional: form.cedula_profesional.trim() || null,
      })
      .eq('id', user.id)
    setSavingPerfil(false)
    if (error) {
      setErrorPerfil('Error al guardar: ' + error.message)
    } else {
      setSuccessPerfil(true)
      setTimeout(() => setSuccessPerfil(false), 3000)
      // Reload page to refresh UserProvider context
      window.location.reload()
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    setErrorPassword('')
    if (passwords.nueva.length < 6) {
      setErrorPassword('La contraseña debe tener al menos 6 caracteres.')
      return
    }
    if (passwords.nueva !== passwords.confirmar) {
      setErrorPassword('Las contraseñas no coinciden.')
      return
    }
    setSavingPassword(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password: passwords.nueva })
    setSavingPassword(false)
    if (error) {
      setErrorPassword('Error: ' + error.message)
    } else {
      setSuccessPassword(true)
      setPasswords({ nueva: '', confirmar: '' })
      setTimeout(() => setSuccessPassword(false), 3000)
    }
  }

  if (!perfil || !form) {
    return (
      <AppLayout title="Mi Perfil">
        <div className="flex justify-center py-16">
          <div className="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin" />
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout title="Mi Perfil">
      <div className="max-w-xl mx-auto space-y-5">

        {/* Avatar + rol */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-sky-600 flex items-center justify-center text-xl font-bold text-white">
            {getInitials(perfil.nombre_completo)}
          </div>
          <div>
            <p className="font-semibold text-gray-900 text-lg">{perfil.nombre_completo}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge color={rol === 'medico' ? 'sky' : 'purple'}>
                {rol === 'medico' ? 'Médico' : 'Asistente'}
              </Badge>
              <span className="text-xs text-gray-400">{user?.email}</span>
            </div>
          </div>
        </div>

        {/* Datos del perfil */}
        <form onSubmit={handleSavePerfil}>
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <User size={16} /> Información personal
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <Input
                label="Nombre completo"
                required
                value={form.nombre_completo}
                onChange={set('nombre_completo')}
                placeholder="Dr. Juan García"
              />
              <Input
                label="Teléfono"
                type="tel"
                value={form.telefono}
                onChange={set('telefono')}
                placeholder="55 1234 5678"
              />
              {rol === 'medico' && (
                <>
                  <Input
                    label="Especialidad"
                    value={form.especialidad}
                    onChange={set('especialidad')}
                    placeholder="Medicina General"
                  />
                  <Input
                    label="Cédula profesional"
                    value={form.cedula_profesional}
                    onChange={set('cedula_profesional')}
                    placeholder="12345678"
                  />
                </>
              )}
              {rol === 'asistente' && perfil.medico_empleador_id && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">ID médico empleador</p>
                  <p className="text-sm text-gray-600 font-mono bg-gray-50 rounded-lg px-3 py-2 select-all">
                    {perfil.medico_empleador_id}
                  </p>
                </div>
              )}
              {rol === 'medico' && (
                <div>
                  <p className="text-xs font-medium text-gray-500 mb-1">Tu ID de médico</p>
                  <p className="text-xs text-gray-400 mb-1">Comparte este ID con tus asistentes al registrarse</p>
                  <p className="text-sm text-gray-600 font-mono bg-sky-50 border border-sky-200 rounded-lg px-3 py-2 select-all break-all">
                    {user?.id}
                  </p>
                </div>
              )}
            </CardBody>
            <CardFooter>
              {errorPerfil && <p className="text-xs text-red-500 mb-3">{errorPerfil}</p>}
              {successPerfil && <p className="text-xs text-emerald-600 mb-3">Perfil actualizado correctamente.</p>}
              <div className="flex justify-end">
                <Button type="submit" loading={savingPerfil} size="sm">
                  <Save size={14} /> Guardar cambios
                </Button>
              </div>
            </CardFooter>
          </Card>
        </form>

        {/* Cambiar contraseña */}
        <form onSubmit={handleChangePassword}>
          <Card>
            <CardHeader>
              <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                <Shield size={16} /> Cambiar contraseña
              </h2>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="relative">
                <Input
                  label="Nueva contraseña"
                  type={showPassword ? 'text' : 'password'}
                  value={passwords.nueva}
                  onChange={e => setPasswords(p => ({ ...p, nueva: e.target.value }))}
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(v => !v)}
                  className="absolute right-3 top-8 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <Input
                label="Confirmar contraseña"
                type={showPassword ? 'text' : 'password'}
                value={passwords.confirmar}
                onChange={e => setPasswords(p => ({ ...p, confirmar: e.target.value }))}
                placeholder="Repite la contraseña"
              />
            </CardBody>
            <CardFooter>
              {errorPassword && <p className="text-xs text-red-500 mb-3">{errorPassword}</p>}
              {successPassword && <p className="text-xs text-emerald-600 mb-3">Contraseña actualizada correctamente.</p>}
              <div className="flex justify-end">
                <Button type="submit" loading={savingPassword} size="sm" variant="secondary">
                  <Shield size={14} /> Actualizar contraseña
                </Button>
              </div>
            </CardFooter>
          </Card>
        </form>

      </div>
    </AppLayout>
  )
}
