import { createServiceClient } from '@/lib/supabase/server'
import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// This route triggers sending pending reminders (called by cron or manually)
export async function POST(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const body = await request.json()
  const { cita_id } = body

  // Get cita with patient info
  const { data: cita, error: citaError } = await supabase
    .from('citas')
    .select('*, pacientes(nombre, apellido, email, telefono)')
    .eq('id', cita_id)
    .single()

  if (citaError || !cita) {
    return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 })
  }

  if (!cita.pacientes?.email) {
    return NextResponse.json({ error: 'El paciente no tiene email registrado' }, { status: 400 })
  }

  // Send email via Resend (optional integration)
  const RESEND_API_KEY = process.env.RESEND_API_KEY
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://mediflow.app'

  if (RESEND_API_KEY) {
    const fechaFormateada = new Intl.DateTimeFormat('es-MX', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    }).format(new Date(cita.fecha_hora))

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'MediFlow <no-reply@mediflow.app>',
        to: [cita.pacientes.email],
        subject: 'Recordatorio de tu cita médica',
        html: `
          <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
            <h2 style="color: #0284c7;">Recordatorio de cita</h2>
            <p>Hola <strong>${cita.pacientes.nombre} ${cita.pacientes.apellido}</strong>,</p>
            <p>Este es un recordatorio de tu cita médica programada para:</p>
            <div style="background: #f0f9ff; border-radius: 8px; padding: 16px; margin: 16px 0;">
              <p style="margin: 0; font-size: 18px; font-weight: bold; color: #0369a1;">${fechaFormateada}</p>
              ${cita.notas ? `<p style="margin: 8px 0 0; color: #64748b;">${cita.notas}</p>` : ''}
            </div>
            <p style="color: #64748b; font-size: 14px;">Si necesitas cancelar o reprogramar, contacta a tu médico.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;">
            <p style="color: #94a3b8; font-size: 12px;">MediFlow — ${appUrl}</p>
          </div>
        `,
      }),
    })

    if (res.ok) {
      const service = createServiceClient()
      await service.from('recordatorios')
        .update({ estado: 'enviado', enviado_en: new Date().toISOString() })
        .eq('cita_id', cita_id)
        .eq('estado', 'pendiente')
      return NextResponse.json({ success: true, message: 'Recordatorio enviado' })
    } else {
      const service = createServiceClient()
      await service.from('recordatorios')
        .update({ estado: 'fallido' })
        .eq('cita_id', cita_id)
        .eq('estado', 'pendiente')
      return NextResponse.json({ error: 'Error al enviar el correo' }, { status: 500 })
    }
  }

  return NextResponse.json({ message: 'RESEND_API_KEY no configurado — recordatorio en cola' })
}

export async function GET(request) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'No autenticado' }, { status: 401 })

  const { searchParams } = new URL(request.url)
  const citaId = searchParams.get('cita_id')

  let query = supabase.from('recordatorios').select('*').order('created_at', { ascending: false })
  if (citaId) query = query.eq('cita_id', citaId)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
