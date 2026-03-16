'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Upload, FileText, ImageIcon, FlaskConical, Trash2, Download, FolderOpen } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Card, { CardBody, CardHeader } from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Select from '@/components/ui/Select'
import { PageSpinner } from '@/components/ui/Spinner'
import { formatDateTime, TIPOS_DOCUMENTO } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'

const BUCKET = 'documentos-pacientes'

const TIPO_ICONS = {
  laboratorio: <FlaskConical size={18} className="text-purple-500" />,
  imagen:      <ImageIcon size={18} className="text-blue-500" />,
  otro:        <FileText size={18} className="text-gray-400" />,
}

const TIPO_COLORS = { laboratorio: 'purple', imagen: 'blue', otro: 'gray' }

export default function DocumentosPage() {
  const { id } = useParams()
  const [paciente, setPaciente] = useState(null)
  const [documentos, setDocumentos] = useState([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [tipo, setTipo] = useState('otro')
  const fileRef = useRef(null)

  async function loadData() {
    const supabase = createClient()
    const [{ data: p }, { data: docs }] = await Promise.all([
      supabase.from('pacientes').select('id, nombre, apellido, medico_id').eq('id', id).single(),
      supabase.from('documentos').select('*').eq('paciente_id', id).order('created_at', { ascending: false }),
    ])
    setPaciente(p)
    setDocumentos(docs || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [id])

  async function handleUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)

    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    const ext = file.name.split('.').pop()
    const path = `${paciente.medico_id}/${id}/${Date.now()}-${file.name}`

    const { error: uploadError } = await supabase.storage.from(BUCKET).upload(path, file, { upsert: false })
    if (uploadError) { alert('Error al subir archivo: ' + uploadError.message); setUploading(false); return }

    await fetch('/api/documentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paciente_id: id, nombre: file.name, tipo, url: path, tamano: file.size }),
    })

    fileRef.current.value = ''
    setUploading(false)
    loadData()
  }

  async function handleDelete(doc) {
    if (!confirm(`¿Eliminar "${doc.nombre}"?`)) return
    const supabase = createClient()
    await supabase.storage.from(BUCKET).remove([doc.url])
    await fetch(`/api/documentos?id=${doc.id}`, { method: 'DELETE' })
    loadData()
  }

  async function handleDownload(doc) {
    const supabase = createClient()
    const { data } = await supabase.storage.from(BUCKET).createSignedUrl(doc.url, 60)
    if (data?.signedUrl) window.open(data.signedUrl, '_blank')
  }

  function formatSize(bytes) {
    if (!bytes) return ''
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`
  }

  if (loading) return <AppLayout title="Documentos"><PageSpinner /></AppLayout>

  return (
    <AppLayout title={`Documentos — ${paciente?.nombre} ${paciente?.apellido}`}>
      <div className="max-w-3xl mx-auto space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Link href={`/pacientes/${id}`} className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft size={14} /> {paciente?.nombre} {paciente?.apellido}
          </Link>
        </div>

        {/* Upload */}
        <Card>
          <CardHeader><h3 className="font-semibold text-gray-800 flex items-center gap-2"><Upload size={16} /> Subir documento</h3></CardHeader>
          <CardBody>
            <div className="flex flex-wrap items-end gap-3">
              <Select
                label="Tipo"
                value={tipo}
                onChange={e => setTipo(e.target.value)}
                options={TIPOS_DOCUMENTO}
                containerClassName="w-44"
              />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-700 block mb-1">Archivo</label>
                <input
                  ref={fileRef}
                  type="file"
                  onChange={handleUpload}
                  disabled={uploading}
                  accept=".pdf,.jpg,.jpeg,.png,.webp,.doc,.docx,.xlsx,.csv"
                  className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-sky-50 file:text-sky-700 hover:file:bg-sky-100 disabled:opacity-50"
                />
              </div>
              {uploading && <p className="text-xs text-sky-600 animate-pulse">Subiendo...</p>}
            </div>
          </CardBody>
        </Card>

        {/* Document list */}
        <Card>
          <CardHeader>
            <h3 className="font-semibold text-gray-800 flex items-center gap-2">
              <FolderOpen size={16} /> Documentos ({documentos.length})
            </h3>
          </CardHeader>
          {documentos.length === 0 ? (
            <CardBody className="text-center py-12">
              <FolderOpen size={36} className="mx-auto text-gray-300 mb-2" />
              <p className="text-gray-400 text-sm">Sin documentos subidos</p>
            </CardBody>
          ) : (
            <ul className="divide-y divide-gray-100">
              {documentos.map(doc => (
                <li key={doc.id} className="px-6 py-3 flex items-center gap-3">
                  <div className="flex-shrink-0">{TIPO_ICONS[doc.tipo]}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{doc.nombre}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge color={TIPO_COLORS[doc.tipo]} className="text-[10px]">
                        {TIPOS_DOCUMENTO.find(t => t.value === doc.tipo)?.label}
                      </Badge>
                      <span className="text-xs text-gray-400">{formatDateTime(doc.created_at)}</span>
                      {doc.tamano && <span className="text-xs text-gray-400">{formatSize(doc.tamano)}</span>}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      onClick={() => handleDownload(doc)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-sky-600 hover:bg-sky-50 transition-colors"
                      title="Descargar"
                    >
                      <Download size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(doc)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </AppLayout>
  )
}
