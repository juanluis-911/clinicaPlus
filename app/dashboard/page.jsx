export const dynamic = 'force-dynamic'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { Calendar, Users, FileText, AlertCircle, Clock, CheckCircle2, Plus } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Card, { CardBody, CardHeader } from '@/components/ui/Card'
import Badge from '@/components/ui/Badge'
import { formatTime, formatDateShort, todayBoundariesInTZ, ESTADOS_CITA } from '@/lib/utils'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/auth/login')

  // Fetch clinic config to get the configured timezone
  const { data: perfil } = await supabase.from('perfiles').select('rol, medico_empleador_id').eq('id', user.id).single()
  const medicoId = perfil?.rol === 'medico' ? user.id : perfil?.medico_empleador_id
  const { data: config } = await supabase.from('configuracion_clinica').select('zona_horaria').eq('id', medicoId).maybeSingle()
  const timezone = config?.zona_horaria || 'America/Mexico_City'

  const { inicio: inicioDia, fin: finDia } = todayBoundariesInTZ(timezone)

  const [
    { data: citasHoy },
    { data: citasPendientes },
    { data: pacientesRecientes },
    { count: totalPacientes },
  ] = await Promise.all([
    supabase.from('citas')
      .select('*, pacientes(nombre, apellido)')
      .gte('fecha_hora', inicioDia)
      .lte('fecha_hora', finDia)
      .order('fecha_hora'),
    supabase.from('citas')
      .select('*, pacientes(nombre, apellido)')
      .eq('estado', 'programada')
      .gte('fecha_hora', new Date().toISOString())
      .order('fecha_hora')
      .limit(5),
    supabase.from('pacientes')
      .select('id, nombre, apellido, created_at')
      .order('created_at', { ascending: false })
      .limit(5),
    supabase.from('pacientes').select('*', { count: 'exact', head: true }),
  ])

  const completadasHoy = citasHoy?.filter(c => c.estado === 'completada').length || 0
  const pendientesHoy = citasHoy?.filter(c => c.estado !== 'cancelada' && c.estado !== 'completada').length || 0

  return (
    <AppLayout title="Panel de Control">
      <div className="space-y-6">
        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Calendar className="text-sky-600" size={20} />}
            label="Citas hoy"
            value={citasHoy?.length || 0}
            bg="bg-sky-50"
          />
          <StatCard
            icon={<CheckCircle2 className="text-emerald-600" size={20} />}
            label="Completadas"
            value={completadasHoy}
            bg="bg-emerald-50"
          />
          <StatCard
            icon={<Clock className="text-amber-600" size={20} />}
            label="Pendientes hoy"
            value={pendientesHoy}
            bg="bg-amber-50"
          />
          <StatCard
            icon={<Users className="text-purple-600" size={20} />}
            label="Total pacientes"
            value={totalPacientes || 0}
            bg="bg-purple-50"
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Today's appointments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Calendar size={16} /> Citas de hoy
                </h2>
                <Link href="/agenda" className="text-xs text-sky-600 hover:underline">Ver agenda →</Link>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {!citasHoy?.length ? (
                <p className="px-6 py-8 text-center text-sm text-gray-400">No hay citas para hoy</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {citasHoy.map(cita => {
                    const estado = ESTADOS_CITA[cita.estado] || ESTADOS_CITA.programada
                    return (
                      <li key={cita.id} className="px-6 py-3 flex items-center justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {cita.pacientes?.nombre} {cita.pacientes?.apellido}
                          </p>
                          <p className="text-xs text-gray-500">{formatTime(cita.fecha_hora, timezone)} · {cita.tipo}</p>
                        </div>
                        <Badge color={estado.color}>{estado.label}</Badge>
                      </li>
                    )
                  })}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* Upcoming appointments */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Clock size={16} /> Próximas citas
                </h2>
                <Link href="/agenda" className="text-xs text-sky-600 hover:underline flex items-center gap-1">
                  <Plus size={12} /> Nueva
                </Link>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {!citasPendientes?.length ? (
                <p className="px-6 py-8 text-center text-sm text-gray-400">No hay citas próximas</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {citasPendientes.map(cita => (
                    <li key={cita.id} className="px-6 py-3">
                      <p className="text-sm font-medium text-gray-900">
                        {cita.pacientes?.nombre} {cita.pacientes?.apellido}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDateShort(cita.fecha_hora, timezone)} · {formatTime(cita.fecha_hora, timezone)}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>

          {/* Recent patients */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-gray-800 flex items-center gap-2">
                  <Users size={16} /> Pacientes recientes
                </h2>
                <Link href="/pacientes" className="text-xs text-sky-600 hover:underline">Ver todos →</Link>
              </div>
            </CardHeader>
            <CardBody className="p-0">
              {!pacientesRecientes?.length ? (
                <p className="px-6 py-8 text-center text-sm text-gray-400">Sin pacientes registrados</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {pacientesRecientes.map(p => (
                    <li key={p.id}>
                      <Link
                        href={`/pacientes/${p.id}`}
                        className="px-6 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors"
                      >
                        <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-xs font-semibold text-sky-700">
                          {p.nombre[0]}{p.apellido[0]}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.nombre} {p.apellido}</p>
                          <p className="text-xs text-gray-400">Registrado {formatDateShort(p.created_at)}</p>
                        </div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </AppLayout>
  )
}

function StatCard({ icon, label, value, bg }) {
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>{icon}</div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </CardBody>
    </Card>
  )
}
