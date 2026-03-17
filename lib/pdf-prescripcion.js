'use client'

import { formatDate, calcAge } from './utils'

async function fetchLogoDataUrl() {
  try {
    const res = await fetch('/api/logo')
    if (!res.ok) return null
    const { dataUrl } = await res.json()
    return dataUrl || null
  } catch {
    return null
  }
}

async function buildRecetaDoc(prescripcion, paciente, medico, config = {}) {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const pageW = doc.internal.pageSize.getWidth()
  const margin = 20

  const clinicaNombre = config.clinica_nombre || medico.nombre_completo || 'Clínica'
  const clinicaEspecialidad = config.clinica_especialidad || medico.especialidad || ''
  const clinicaTel = config.clinica_telefono || medico.telefono || ''
  const clinicaEmail = config.clinica_email || ''
  const clinicaDireccion = config.clinica_direccion
    ? `${config.clinica_direccion}${config.clinica_ciudad ? ', ' + config.clinica_ciudad : ''}`
    : ''

  // ── Header bar ──────────────────────────────────────────────
  const HEADER_H = 32
  doc.setFillColor(2, 132, 199) // sky-600
  doc.rect(0, 0, pageW, HEADER_H, 'F')

  // Always try to fetch logo via server proxy — returns null if none exists
  const logoDataUrl = await fetchLogoDataUrl()

  const LOGO_SIZE = 22
  const TEXT_X = logoDataUrl ? margin + LOGO_SIZE + 6 : margin

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', margin, (HEADER_H - LOGO_SIZE) / 2, LOGO_SIZE, LOGO_SIZE)
  }

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text(clinicaNombre, TEXT_X, HEADER_H / 2 - 1)
  if (clinicaEspecialidad) {
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    doc.text(clinicaEspecialidad, TEXT_X, HEADER_H / 2 + 5)
  }

  // Folio + date (right)
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.text(`Folio: ${prescripcion.id?.slice(0, 8).toUpperCase()}`, pageW - margin, 10, { align: 'right' })
  doc.text(`Fecha: ${formatDate(prescripcion.fecha)}`, pageW - margin, 17, { align: 'right' })
  const contactParts = [clinicaTel, clinicaEmail].filter(Boolean)
  if (contactParts.length) {
    doc.text(contactParts.join('  ·  '), pageW - margin, 23, { align: 'right' })
  }
  if (clinicaDireccion) {
    doc.setFontSize(7)
    doc.text(clinicaDireccion, pageW - margin, 29, { align: 'right' })
  }

  // ── Doctor info ──────────────────────────────────────────────
  let cursorY = HEADER_H + 12
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(medico.nombre_completo || 'Médico', margin, cursorY)
  cursorY += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  const medicoDetails = [
    medico.especialidad && `Especialidad: ${medico.especialidad}`,
    medico.cedula_profesional && `Cédula Prof.: ${medico.cedula_profesional}`,
    medico.telefono && `Tel: ${medico.telefono}`,
  ].filter(Boolean).join('   ')
  if (medicoDetails) {
    doc.text(medicoDetails, margin, cursorY)
    cursorY += 6
  }

  doc.setDrawColor(200, 200, 200)
  doc.line(margin, cursorY, pageW - margin, cursorY)
  cursorY += 8

  // ── Patient info ──────────────────────────────────────────────
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(30, 30, 30)
  doc.text('DATOS DEL PACIENTE', margin, cursorY)
  cursorY += 6
  doc.setFont('helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(50, 50, 50)

  const age = calcAge(paciente.fecha_nacimiento)
  const patientLines = [
    `Nombre: ${paciente.nombre} ${paciente.apellido}`,
    age ? `Edad: ${age} años` : '',
    paciente.telefono ? `Teléfono: ${paciente.telefono}` : '',
  ].filter(Boolean)

  patientLines.forEach(line => {
    doc.text(line, margin, cursorY)
    cursorY += 7
  })
  cursorY += 4

  // ── Medications table ──────────────────────────────────────────
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(30, 30, 30)
  doc.text('MEDICAMENTOS PRESCRITOS', margin, cursorY)
  cursorY += 6

  const meds = prescripcion.medicamentos || []
  autoTable(doc, {
    startY: cursorY,
    margin: { left: margin, right: margin },
    head: [['Medicamento', 'Dosis', 'Frecuencia', 'Duración']],
    body: meds.map(m => [
      `${m.nombre}${m.concentracion ? ` ${m.concentracion}` : ''}${m.forma ? ` (${m.forma})` : ''}`,
      m.dosis || '—',
      m.frecuencia || '—',
      m.duracion || '—',
    ]),
    headStyles: { fillColor: [2, 132, 199], textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles: { fontSize: 9, textColor: [30, 30, 30] },
    alternateRowStyles: { fillColor: [240, 249, 255] },
    columnStyles: { 0: { cellWidth: 65 }, 1: { cellWidth: 30 }, 2: { cellWidth: 40 }, 3: { cellWidth: 30 } },
  })

  cursorY = doc.lastAutoTable.finalY + 10

  // ── Special indications ────────────────────────────────────────
  const withIndications = meds.filter(m => m.indicaciones)
  if (withIndications.length > 0) {
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    doc.text('INDICACIONES ESPECIALES', margin, cursorY)
    cursorY += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(60, 60, 60)
    withIndications.forEach(m => {
      doc.setFont('helvetica', 'bold')
      doc.text(`• ${m.nombre}:`, margin, cursorY)
      doc.setFont('helvetica', 'normal')
      const lines = doc.splitTextToSize(m.indicaciones, pageW - margin * 2 - 20)
      lines.forEach((line, i) => doc.text(line, margin + 5, cursorY + 6 + i * 5))
      cursorY += 6 + lines.length * 5 + 3
    })
  }

  // ── General instructions ────────────────────────────────────────
  if (prescripcion.instrucciones) {
    cursorY += 4
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(10)
    doc.setTextColor(30, 30, 30)
    doc.text('INSTRUCCIONES GENERALES', margin, cursorY)
    cursorY += 6
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(60, 60, 60)
    const instrLines = doc.splitTextToSize(prescripcion.instrucciones, pageW - margin * 2)
    instrLines.forEach((line, i) => doc.text(line, margin, cursorY + i * 5))
    cursorY += instrLines.length * 5 + 6
  }

  // ── Validity ────────────────────────────────────────────────────
  doc.setFontSize(9)
  doc.setFont('helvetica', 'italic')
  doc.setTextColor(100, 100, 100)
  doc.text(`Vigencia: ${prescripcion.vigencia_dias} días a partir de la fecha de emisión.`, margin, cursorY)

  // ── Footer ──────────────────────────────────────────────────────
  const pageH = doc.internal.pageSize.getHeight()
  doc.setDrawColor(200, 200, 200)
  doc.line(margin, pageH - 25, pageW - margin, pageH - 25)

  const sigX = pageW - margin - 50
  doc.setDrawColor(100, 100, 100)
  doc.line(sigX, pageH - 15, pageW - margin, pageH - 15)
  doc.setFontSize(8)
  doc.setTextColor(80, 80, 80)
  doc.setFont('helvetica', 'normal')
  doc.text('Firma del médico', sigX + 25, pageH - 11, { align: 'center' })

  doc.setFontSize(7)
  doc.setTextColor(150, 150, 150)
  const footerText = clinicaNombre !== 'Clínica'
    ? clinicaNombre
    : 'Generado por MediFlow • mediflow.app'
  doc.text(footerText, pageW / 2, pageH - 6, { align: 'center' })

  return doc
}

function buildRecetaNombre(prescripcion, paciente) {
  return `receta_${paciente.apellido}_${prescripcion.id?.slice(0, 8)}.pdf`
    .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '')
}

/** Descarga el PDF de la receta (comportamiento original) */
export async function generarPrescripcionPDF(prescripcion, paciente, medico, config = {}) {
  const doc = await buildRecetaDoc(prescripcion, paciente, medico, config)
  doc.save(buildRecetaNombre(prescripcion, paciente))
}

/** Devuelve { blob, nombre } sin descargar ni abrir nada */
export async function generarRecetaPDFBlob(prescripcion, paciente, medico, config = {}) {
  const doc = await buildRecetaDoc(prescripcion, paciente, medico, config)
  const blob = new Blob([doc.output('arraybuffer')], { type: 'application/pdf' })
  return { blob, nombre: buildRecetaNombre(prescripcion, paciente) }
}
