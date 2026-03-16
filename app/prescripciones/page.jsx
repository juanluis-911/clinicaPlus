'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Plus, FilePlus, Printer, Eye } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Card, { CardBody, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import PermissionGate from '@/components/PermissionGate'
import { formatDate, formatDateShort } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export default function PrescripcionesPage() {
  const [prescripciones, setPrescripciones] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    fetch('/api/prescripciones')
      .then(r => r.json())
      .then(({ data }) => { setPrescripciones(data || []); setLoading(false) })
  }, [])

  async function handlePrint(rx) {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const { data: medico } = await supabase.from('perfiles').select('*').eq('id', rx.medico_id).single()
    const { generarPrescripcionPDF } = await import('@/lib/pdf-prescripcion')
    await generarPrescripcionPDF(rx, rx.pacientes, medico || {})
  }

  return (
    <AppLayout title="Prescripciones">
      <div className="space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <p className="text-sm text-gray-500">{prescripciones.length} receta{prescripciones.length !== 1 ? 's' : ''}</p>
          <PermissionGate action="crear_prescripcion">
            <Link href="/prescripciones/nueva">
              <Button size="sm"><Plus size={14} /> Nueva receta</Button>
            </Link>
          </PermissionGate>
        </div>

        {loading ? (
          <PageSpinner />
        ) : prescripciones.length === 0 ? (
          <Card>
            <CardBody className="text-center py-16">
              <FilePlus size={40} className="mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500">Sin prescripciones registradas</p>
              <PermissionGate action="crear_prescripcion">
                <Link href="/prescripciones/nueva">
                  <Button className="mt-4" size="sm">Crear primera receta</Button>
                </Link>
              </PermissionGate>
            </CardBody>
          </Card>
        ) : (
          <Card>
            <ul className="divide-y divide-gray-100">
              {prescripciones.map(rx => (
                <li key={rx.id} className="px-6 py-4 flex items-center gap-4">
                  <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <FilePlus size={18} className="text-sky-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {rx.pacientes?.nombre} {rx.pacientes?.apellido}
                    </p>
                    <p className="text-xs text-gray-400">
                      {formatDateShort(rx.fecha)} · {rx.medicamentos?.length || 0} medicamento{rx.medicamentos?.length !== 1 ? 's' : ''} · Vigencia {rx.vigencia_dias} días
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelected(rx)}
                      className="p-1.5 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                      title="Ver detalle"
                    >
                      <Eye size={15} />
                    </button>
                    <button
                      onClick={() => handlePrint(rx)}
                      className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                      title="Imprimir PDF"
                    >
                      <Printer size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        )}
      </div>

      {/* Detail modal */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalle de prescripción" size="md">
        {selected && (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-gray-400">Paciente</p>
              <p className="font-semibold text-gray-900">{selected.pacientes?.nombre} {selected.pacientes?.apellido}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-2">Medicamentos</p>
              <div className="space-y-2">
                {selected.medicamentos?.map((m, i) => (
                  <div key={i} className="bg-sky-50 rounded-lg p-3">
                    <p className="text-sm font-semibold text-sky-800">{m.nombre} {m.concentracion}</p>
                    <p className="text-xs text-sky-600">{m.forma} · {m.dosis} · {m.frecuencia} · {m.duracion}</p>
                    {m.indicaciones && <p className="text-xs text-gray-600 mt-1">{m.indicaciones}</p>}
                  </div>
                ))}
              </div>
            </div>
            {selected.instrucciones && (
              <div>
                <p className="text-xs text-gray-400 mb-1">Instrucciones generales</p>
                <p className="text-sm text-gray-700">{selected.instrucciones}</p>
              </div>
            )}
            <Button className="w-full justify-center" variant="secondary" onClick={() => handlePrint(selected)}>
              <Printer size={14} /> Imprimir PDF
            </Button>
          </div>
        )}
      </Modal>
    </AppLayout>
  )
}
