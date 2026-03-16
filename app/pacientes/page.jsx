'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Search, Plus, User, Phone, Mail } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Card, { CardBody } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import { PageSpinner } from '@/components/ui/Spinner'
import { calcAge, formatDateShort } from '@/lib/utils'

export default function PacientesPage() {
  const [pacientes, setPacientes] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  const fetchPacientes = useCallback(async () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    const res = await fetch(`/api/pacientes?${params}`)
    const { data, count } = await res.json()
    setPacientes(data || [])
    setTotal(count || 0)
    setLoading(false)
  }, [search])

  useEffect(() => {
    const t = setTimeout(fetchPacientes, 300)
    return () => clearTimeout(t)
  }, [fetchPacientes])

  return (
    <AppLayout title="Pacientes">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre o email..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">{total} paciente{total !== 1 ? 's' : ''}</span>
            <Link href="/pacientes/nuevo">
              <Button size="sm"><Plus size={14} /> Nuevo paciente</Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <PageSpinner />
        ) : pacientes.length === 0 ? (
          <Card>
            <CardBody className="text-center py-16">
              <User size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">
                {search ? 'Sin resultados para tu búsqueda' : 'Aún no hay pacientes registrados'}
              </p>
              {!search && (
                <Link href="/pacientes/nuevo">
                  <Button className="mt-4" size="sm">Agregar primer paciente</Button>
                </Link>
              )}
            </CardBody>
          </Card>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pacientes.map(p => {
              const age = calcAge(p.fecha_nacimiento)
              return (
                <Link key={p.id} href={`/pacientes/${p.id}`}>
                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                    <CardBody className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-sky-100 flex items-center justify-center text-sm font-semibold text-sky-700 flex-shrink-0">
                          {p.nombre[0]}{p.apellido[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 truncate">{p.nombre} {p.apellido}</p>
                          {age !== null && <p className="text-xs text-gray-400">{age} años</p>}
                        </div>
                      </div>
                      <div className="space-y-1">
                        {p.telefono && (
                          <p className="text-xs text-gray-500 flex items-center gap-1.5">
                            <Phone size={12} /> {p.telefono}
                          </p>
                        )}
                        {p.email && (
                          <p className="text-xs text-gray-500 flex items-center gap-1.5 truncate">
                            <Mail size={12} /> {p.email}
                          </p>
                        )}
                      </div>
                      {p.condiciones_cronicas && (
                        <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-2 py-1 truncate">
                          {p.condiciones_cronicas}
                        </p>
                      )}
                    </CardBody>
                  </Card>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </AppLayout>
  )
}
