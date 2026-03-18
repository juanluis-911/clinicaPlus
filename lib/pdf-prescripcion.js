'use client'

import { formatDate, calcAge } from './utils'

// Mapa de paleta → color RGB
const PALETA_RGB = {
  sky:     [2, 132, 199],
  violet:  [124, 58, 237],
  emerald: [5, 150, 105],
  rose:    [225, 29, 72],
  amber:   [217, 119, 6],
}

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

  // ── Leer formato del perfil del médico ──────────────────────────────────────
  const fmt = medico.receta_formato || {}

  const soloBody  = fmt.modo_impresion === 'solo_cuerpo'
  const tamano    = fmt.tamano_papel === 'a4' ? 'a4' : 'letter'
  const headerRGB = PALETA_RGB[config.paleta_color] || PALETA_RGB.sky
  const altRowRGB = headerRGB.map(c => Math.min(255, Math.round(c * 0.12 + 228)))

  // Encabezado
  const showLogo              = !soloBody && fmt.mostrar_logo              !== false
  const showNombreClinica     = !soloBody && fmt.mostrar_nombre_clinica    !== false
  const showEspecialidadCli   = !soloBody && fmt.mostrar_especialidad_clinica !== false
  const showFolio             = !soloBody && fmt.mostrar_folio             !== false
  const showTelClinica        = !soloBody && fmt.mostrar_tel_clinica       !== false
  const showEmailClinica      = !soloBody && fmt.mostrar_email_clinica     !== false
  const showDireccionClinica  = !soloBody && fmt.mostrar_direccion_clinica !== false

  // Médico
  const showEspecialidadMed   = fmt.mostrar_especialidad_medico !== false
  const showCedula            = fmt.mostrar_cedula              !== false
  const showTelMedico         = fmt.mostrar_tel_medico          !== false

  // Paciente
  const showEdadPaciente      = fmt.mostrar_edad_paciente       !== false
  const showTelPaciente       = fmt.mostrar_tel_paciente        !== false

  // Cuerpo
  const showIndicaciones      = fmt.mostrar_indicaciones_especiales !== false
  const showInstrucciones     = fmt.mostrar_instrucciones_generales !== false
  const showVigencia          = fmt.mostrar_vigencia             !== false

  // Pie
  const showFirma             = !soloBody && fmt.mostrar_firma   !== false
  const textoFirma            = fmt.texto_firma?.trim() || 'Firma del médico'
  const notaPie               = fmt.nota_pie?.trim() || ''
  const tituloPrincipal       = fmt.titulo?.trim() || 'RECETA MÉDICA'

  // Márgenes para hoja membretada (cm → mm)
  const membreteTopMM = soloBody ? Math.max(0, (fmt.membrete_superior_cm || 0) * 10) : 0
  const membreteBottomMM = soloBody ? Math.max(0, (fmt.membrete_inferior_cm || 0) * 10) : 0

  // Datos de clínica
  const clinicaNombre       = config.clinica_nombre       || medico.nombre_completo || 'Clínica'
  const clinicaEspecialidad = config.clinica_especialidad || medico.especialidad    || ''
  const clinicaTel          = showTelClinica    ? (config.clinica_telefono || '') : ''
  const clinicaEmail        = showEmailClinica  ? (config.clinica_email    || '') : ''
  const clinicaDireccion    = showDireccionClinica && config.clinica_direccion
    ? `${config.clinica_direccion}${config.clinica_ciudad ? ', ' + config.clinica_ciudad : ''}`
    : ''

  const doc   = new jsPDF({ orientation: 'portrait', unit: 'mm', format: tamano })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 20

  // ── Encabezado (solo modo completo) ──────────────────────────────────────────
  // En modo solo_cuerpo el cursor arranca después del espacio del membrete superior
  let cursorY = soloBody ? Math.max(margin, membreteTopMM + 5) : margin

  if (!soloBody) {
    const HEADER_H = 32
    doc.setFillColor(...headerRGB)
    doc.rect(0, 0, pageW, HEADER_H, 'F')

    const logoDataUrl = showLogo ? await fetchLogoDataUrl() : null
    const LOGO_SIZE   = 22
    const TEXT_X      = logoDataUrl ? margin + LOGO_SIZE + 6 : margin

    if (logoDataUrl) {
      doc.addImage(logoDataUrl, 'PNG', margin, (HEADER_H - LOGO_SIZE) / 2, LOGO_SIZE, LOGO_SIZE)
    }

    doc.setTextColor(255, 255, 255)

    if (showNombreClinica) {
      doc.setFontSize(14)
      doc.setFont('helvetica', 'bold')
      doc.text(clinicaNombre, TEXT_X, HEADER_H / 2 - 1)
    }

    if (showEspecialidadCli && clinicaEspecialidad) {
      doc.setFontSize(8)
      doc.setFont('helvetica', 'normal')
      doc.text(clinicaEspecialidad, TEXT_X, HEADER_H / 2 + 5)
    }

    // Folio + fecha + contacto (derecha)
    doc.setFontSize(8)
    doc.setFont('helvetica', 'normal')
    let rightY = 10
    if (showFolio) {
      doc.text(`Folio: ${prescripcion.id?.slice(0, 8).toUpperCase()}`, pageW - margin, rightY, { align: 'right' })
      rightY += 7
    }
    doc.text(`Fecha: ${formatDate(prescripcion.fecha)}`, pageW - margin, rightY, { align: 'right' })
    rightY += 7

    const contactParts = [clinicaTel, clinicaEmail].filter(Boolean)
    if (contactParts.length) {
      doc.text(contactParts.join('  ·  '), pageW - margin, rightY, { align: 'right' })
      rightY += 6
    }
    if (clinicaDireccion) {
      doc.setFontSize(7)
      doc.text(clinicaDireccion, pageW - margin, rightY, { align: 'right' })
    }

    cursorY = HEADER_H + 9
  }

  // ── Título del documento ────────────────────────────────────────────────────
  doc.setFontSize(10)
  doc.setFont('helvetica', 'bold')
  doc.setTextColor(...headerRGB)
  doc.text(tituloPrincipal, pageW / 2, cursorY, { align: 'center' })
  cursorY += 8

  // ── Datos del médico ────────────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'bold')
  doc.text(medico.nombre_completo || 'Médico', margin, cursorY)
  cursorY += 6

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(80, 80, 80)
  const medicoDetails = [
    showEspecialidadMed && medico.especialidad       && `Especialidad: ${medico.especialidad}`,
    showCedula          && medico.cedula_profesional && `Cédula Prof.: ${medico.cedula_profesional}`,
    showTelMedico       && medico.telefono           && `Tel: ${medico.telefono}`,
  ].filter(Boolean).join('   ')
  if (medicoDetails) {
    doc.text(medicoDetails, margin, cursorY)
    cursorY += 6
  }

  doc.setDrawColor(200, 200, 200)
  doc.line(margin, cursorY, pageW - margin, cursorY)
  cursorY += 8

  // ── Datos del paciente ──────────────────────────────────────────────────────
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
    showEdadPaciente && age      ? `Edad: ${age} años`              : '',
    showTelPaciente  && paciente.telefono ? `Teléfono: ${paciente.telefono}` : '',
  ].filter(Boolean)

  patientLines.forEach(line => {
    doc.text(line, margin, cursorY)
    cursorY += 7
  })
  cursorY += 4

  // ── Tabla de medicamentos ───────────────────────────────────────────────────
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
      m.dosis      || '—',
      m.frecuencia || '—',
      m.duracion   || '—',
    ]),
    headStyles:          { fillColor: headerRGB, textColor: 255, fontStyle: 'bold', fontSize: 9 },
    bodyStyles:          { fontSize: 9, textColor: [30, 30, 30] },
    alternateRowStyles:  { fillColor: altRowRGB },
    columnStyles:        { 0: { cellWidth: 65 }, 1: { cellWidth: 30 }, 2: { cellWidth: 40 }, 3: { cellWidth: 30 } },
  })
  cursorY = doc.lastAutoTable.finalY + 10

  // ── Indicaciones especiales ─────────────────────────────────────────────────
  const withIndications = showIndicaciones ? meds.filter(m => m.indicaciones) : []
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

  // ── Instrucciones generales ─────────────────────────────────────────────────
  if (showInstrucciones && prescripcion.instrucciones) {
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

  // ── Vigencia ────────────────────────────────────────────────────────────────
  if (showVigencia) {
    doc.setFontSize(9)
    doc.setFont('helvetica', 'italic')
    doc.setTextColor(100, 100, 100)
    doc.text(`Vigencia: ${prescripcion.vigencia_dias} días a partir de la fecha de emisión.`, margin, cursorY)
    cursorY += 6
  }

  // ── Nota adicional al pie ───────────────────────────────────────────────────
  if (notaPie) {
    cursorY += 2
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(80, 80, 80)
    const notaLines = doc.splitTextToSize(notaPie, pageW - margin * 2)
    notaLines.forEach((line, i) => doc.text(line, margin, cursorY + i * 5))
    cursorY += notaLines.length * 5 + 4
  }

  // ── Pie de página (solo modo completo) ──────────────────────────────────────
  if (!soloBody) {
    // pageH ya está definida arriba
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, pageH - 25, pageW - margin, pageH - 25)

    if (showFirma) {
      const sigX = pageW - margin - 50
      doc.setDrawColor(100, 100, 100)
      doc.line(sigX, pageH - 15, pageW - margin, pageH - 15)
      doc.setFontSize(8)
      doc.setTextColor(80, 80, 80)
      doc.setFont('helvetica', 'normal')
      doc.text(textoFirma, sigX + 25, pageH - 11, { align: 'center' })
    }

    doc.setFontSize(7)
    doc.setTextColor(150, 150, 150)
    const footerText = clinicaNombre !== 'Clínica'
      ? clinicaNombre
      : 'Generado por MediFlow • mediflow.app'
    doc.text(footerText, pageW / 2, pageH - 6, { align: 'center' })
  }

  // ── Firma en modo solo_cuerpo (encima del espacio del membrete inferior) ────
  if (soloBody && fmt.mostrar_firma !== false) {
    // La firma se coloca justo antes del margen inferior del membrete
    const firmaY = membreteBottomMM > 0
      ? pageH - membreteBottomMM - 12
      : pageH - 25
    const sigX = pageW - margin - 50
    doc.setDrawColor(100, 100, 100)
    doc.line(sigX, firmaY, pageW - margin, firmaY)
    doc.setFontSize(8)
    doc.setTextColor(80, 80, 80)
    doc.setFont('helvetica', 'normal')
    doc.text(textoFirma, sigX + 25, firmaY + 4, { align: 'center' })
  }

  return doc
}

function buildRecetaNombre(prescripcion, paciente) {
  return `receta_${paciente.apellido}_${prescripcion.id?.slice(0, 8)}.pdf`
    .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '')
}

/** Descarga el PDF de la receta */
export async function generarPrescripcionPDF(prescripcion, paciente, medico, config = {}) {
  const doc = await buildRecetaDoc(prescripcion, paciente, medico, config)
  doc.save(buildRecetaNombre(prescripcion, paciente))
}

/** Devuelve { blob, nombre } sin descargar */
export async function generarRecetaPDFBlob(prescripcion, paciente, medico, config = {}) {
  const doc = await buildRecetaDoc(prescripcion, paciente, medico, config)
  const blob = new Blob([doc.output('arraybuffer')], { type: 'application/pdf' })
  return { blob, nombre: buildRecetaNombre(prescripcion, paciente) }
}
