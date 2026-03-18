'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, FilePlus, Printer, Eye, Share2 } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Card, { CardBody } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { PageSpinner } from '@/components/ui/Spinner'
import PermissionGate from '@/components/PermissionGate'
import { formatDate, formatDateShort, normalizarTelefonoMX } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

export default function PrescripcionesPage() {
  const [prescripciones, setPrescripciones] = useState([])
  const [loading, setLoading]               = useState(true)
  const [selected, setSelected]             = useState(null)
  const [sharing, setSharing]               = useState(null) // id de la receta en proceso

  useEffect(() => {
    fetch('/api/prescripciones')
      .then(r => r.json())
      .then(({ data }) => { setPrescripciones(data || []); setLoading(false) })
  }, [])

  // ── Descargar PDF ──────────────────────────────────────────────────────────
  async function handlePrint(rx) {
    const supabase = createClient()
    const { data: medico } = await supabase.from('perfiles').select('*').eq('id', rx.medico_id).single()
    const { data: config } = await supabase.from('configuracion_clinica').select('*').eq('id', rx.medico_id).maybeSingle()
    const { generarPrescripcionPDF } = await import('@/lib/pdf-prescripcion')
    await generarPrescripcionPDF(rx, rx.pacientes, medico || {}, config || {})
  }

  // ── Compartir por WhatsApp ─────────────────────────────────────────────────
  async function handleCompartir(rx) {
    setSharing(rx.id)
    try {
      const supabase = createClient()
      const { data: { user } }  = await supabase.auth.getUser()
      const { data: medico }    = await supabase.from('perfiles').select('*').eq('id', rx.medico_id).single()
      const { data: config }    = await supabase.from('configuracion_clinica').select('*').eq('id', rx.medico_id).maybeSingle()

      const { generarRecetaPDFBlob } = await import('@/lib/pdf-prescripcion')
      const { blob, nombre } = await generarRecetaPDFBlob(rx, rx.pacientes, medico || {}, config || {})
      const file = new File([blob], nombre, { type: 'application/pdf' })

      const pacienteNombre = `${rx.pacientes?.nombre ?? ''} ${rx.pacientes?.apellido ?? ''}`.trim()
      const telefonoWA     = normalizarTelefonoMX(rx.pacientes?.telefono)
      const isMobile       = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)

      const buildWaUrl = (msg, phone) => {
        const encodedMsg = encodeURIComponent(msg)
        if (phone) {
          return isMobile
            ? `whatsapp://send?phone=${phone}&text=${encodedMsg}`
            : `https://web.whatsapp.com/send?phone=${phone}&text=${encodedMsg}`
        }
        return isMobile
          ? `whatsapp://send?text=${encodedMsg}`
          : `https://web.whatsapp.com/send?text=${encodedMsg}`
      }

      const openWA = (url) => {
        if (isMobile) window.location.href = url
        else window.open(url, '_blank')
      }

      // ── Opción 1: Web Share API con archivo (share sheet nativo) ──────────
      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: `Receta — ${pacienteNombre}` })
          return
        } catch (err) {
          if (err.name === 'AbortError') return
        }
      }

      // ── Opción 2: Subir a Storage → enlace firmado → WhatsApp directo ─────
      const path = `${user.id}/receta_${rx.id}.pdf`
      const { error: uploadError } = await supabase.storage
        .from('expedientes-temp')
        .upload(path, blob, { contentType: 'application/pdf', upsert: true })

      if (!uploadError) {
        const { data: signed } = await supabase.storage
          .from('expedientes-temp')
          .createSignedUrl(path, 86400) // válido 24 horas

        if (signed?.signedUrl) {
          const msg =
            `Estimado/a ${pacienteNombre}, le comparto su receta médica del ${formatDate(rx.fecha)}.\n\n` +
            `Descargue el PDF aquí (válido 24 hrs):\n${signed.signedUrl}`
          openWA(buildWaUrl(msg, telefonoWA))
          return
        }
      }

      // ── Opción 3: Fallback — solo descargar ───────────────────────────────
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = nombre; a.click()
      URL.revokeObjectURL(url)

    } finally {
      setSharing(null)
    }
  }

  return (
    <AppLayout title="Prescripciones">
      <div className="space-y-4">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <p className="text-sm text-gray-500">
            {prescripciones.length} receta{prescripciones.length !== 1 ? 's' : ''}
          </p>
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
              {prescripciones.map(rx => {
                const isSharing = sharing === rx.id
                const tieneTel  = !!rx.pacientes?.telefono
                return (
                  <li key={rx.id} className="px-4 sm:px-6 py-4 flex items-center gap-3">
                    <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FilePlus size={18} className="text-sky-600" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {rx.pacientes?.nombre} {rx.pacientes?.apellido}
                      </p>
                      <p className="text-xs text-gray-400">
                        {formatDateShort(rx.fecha)}
                        {' · '}{rx.medicamentos?.length || 0} med.
                        {' · '}{rx.vigencia_dias} días
                      </p>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Ver detalle */}
                      <button
                        onClick={() => setSelected(rx)}
                        className="p-2 text-gray-400 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        title="Ver detalle"
                      >
                        <Eye size={15} />
                      </button>

                      {/* Descargar PDF */}
                      <button
                        onClick={() => handlePrint(rx)}
                        className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Descargar PDF"
                      >
                        <Printer size={15} />
                      </button>

                      {/* Compartir por WhatsApp */}
                      <button
                        onClick={() => handleCompartir(rx)}
                        disabled={isSharing}
                        title={tieneTel
                          ? `Enviar al paciente · ${rx.pacientes.telefono}`
                          : 'Compartir por WhatsApp'}
                        className="p-2 rounded-lg transition-colors disabled:opacity-50 text-gray-400 hover:text-green-600 hover:bg-green-50 relative"
                      >
                        {isSharing
                          ? <span className="w-3.5 h-3.5 border-2 border-green-400 border-t-transparent rounded-full animate-spin inline-block" />
                          : (
                            <span className="relative">
                              <Share2 size={15} />
                              {/* Indicador de que tiene teléfono */}
                              {tieneTel && (
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-green-400 rounded-full" />
                              )}
                            </span>
                          )}
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </Card>
        )}
      </div>

      {/* ── Modal de detalle ──────────────────────────────────────────────── */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="Detalle de prescripción" size="md">
        {selected && (
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs text-gray-400">Paciente</p>
                <p className="font-semibold text-gray-900">
                  {selected.pacientes?.nombre} {selected.pacientes?.apellido}
                </p>
                {selected.pacientes?.telefono && (
                  <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                    📱 {selected.pacientes.telefono}
                  </p>
                )}
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0 mt-1">{formatDate(selected.fecha)}</span>
            </div>

            <div>
              <p className="text-xs text-gray-400 mb-2">Medicamentos</p>
              <div className="space-y-2">
                {selected.medicamentos?.map((m, i) => (
                  <div key={i} className="bg-sky-50 rounded-xl p-3">
                    <p className="text-sm font-semibold text-sky-800">{m.nombre} {m.concentracion}</p>
                    <p className="text-xs text-sky-600">{[m.forma, m.dosis, m.frecuencia, m.duracion].filter(Boolean).join(' · ')}</p>
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

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
              <Button variant="secondary" className="justify-center" onClick={() => handlePrint(selected)}>
                <Printer size={14} /> PDF
              </Button>
              <Button
                className="justify-center !bg-green-500 hover:!bg-green-600"
                onClick={() => { setSelected(null); handleCompartir(selected) }}
                disabled={sharing === selected?.id}
              >
                <Share2 size={14} />
                {selected?.pacientes?.telefono ? 'Al paciente' : 'WhatsApp'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </AppLayout>
  )
}
