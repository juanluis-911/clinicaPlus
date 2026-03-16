import { createClient, createServiceClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

const BUCKET = 'logos-clinica'

// GET /api/logo — returns the clinic logo as a base64 data URL.
// Uses the service client to download from storage directly (bypasses bucket policies & CORS).
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase.from('perfiles').select('rol, medico_empleador_id').eq('id', user.id).single()
  const medicoId = perfil?.rol === 'medico' ? user.id : perfil?.medico_empleador_id
  if (!medicoId) return NextResponse.json({ dataUrl: null })

  const service = createServiceClient()

  // Try each possible extension — only one will exist per user
  for (const ext of ['png', 'jpg', 'jpeg', 'webp']) {
    const path = `${medicoId}/logo.${ext}`
    const { data: fileData, error } = await service.storage.from(BUCKET).download(path)
    if (error || !fileData) continue

    const arrayBuffer = await fileData.arrayBuffer()
    const base64 = Buffer.from(arrayBuffer).toString('base64')
    const mime = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : `image/${ext}`
    return NextResponse.json({ dataUrl: `data:${mime};base64,${base64}` })
  }

  return NextResponse.json({ dataUrl: null })
}
const ALLOWED_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/svg+xml']
const MAX_SIZE_BYTES = 2 * 1024 * 1024 // 2 MB

export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'medico') {
    return NextResponse.json({ error: 'Solo los médicos pueden subir el logo' }, { status: 403 })
  }

  const formData = await request.formData()
  const file = formData.get('file')
  if (!file) return NextResponse.json({ error: 'No se envió archivo' }, { status: 400 })

  if (!ALLOWED_TYPES.includes(file.type)) {
    return NextResponse.json({ error: 'Formato no permitido. Usa PNG, JPG o WebP.' }, { status: 400 })
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json({ error: 'El archivo supera el límite de 2 MB.' }, { status: 400 })
  }

  const ext = file.type === 'image/svg+xml' ? 'svg' : file.type.split('/')[1].replace('jpeg', 'jpg')
  const path = `${user.id}/logo.${ext}`
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  const service = createServiceClient()

  // Remove any previous logos for this user (any extension)
  const exts = ['png', 'jpg', 'jpeg', 'webp', 'svg']
  await service.storage.from(BUCKET).remove(exts.map(e => `${user.id}/logo.${e}`))

  const { error: uploadError } = await service.storage
    .from(BUCKET)
    .upload(path, buffer, { contentType: file.type, upsert: true })

  if (uploadError) return NextResponse.json({ error: uploadError.message }, { status: 500 })

  const { data: { publicUrl } } = service.storage.from(BUCKET).getPublicUrl(path)

  // Append cache-buster so browsers pick up the new image
  const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`

  await supabase.from('configuracion_clinica')
    .upsert({ id: user.id, clinica_logo_url: urlWithCacheBust }, { onConflict: 'id' })

  return NextResponse.json({ url: urlWithCacheBust })
}

export async function DELETE() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { data: perfil } = await supabase.from('perfiles').select('rol').eq('id', user.id).single()
  if (perfil?.rol !== 'medico') {
    return NextResponse.json({ error: 'Solo los médicos pueden eliminar el logo' }, { status: 403 })
  }

  const service = createServiceClient()
  const exts = ['png', 'jpg', 'jpeg', 'webp', 'svg']
  await service.storage.from(BUCKET).remove(exts.map(e => `${user.id}/logo.${e}`))

  await supabase.from('configuracion_clinica')
    .update({ clinica_logo_url: null })
    .eq('id', user.id)

  return NextResponse.json({ success: true })
}
