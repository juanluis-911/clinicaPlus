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

// Color principal del PDF (sky-600)
const BRAND = [2, 132, 199]
const BRAND_LIGHT = [224, 242, 254]
const RED_ALERT = [220, 38, 38]
const RED_ALERT_BG = [254, 226, 226]

// ── Helpers ───────────────────────────────────────────────────────────────────

function sectionTitle(doc, text, y, margin, pageW) {
  doc.setFillColor(...BRAND)
  doc.rect(margin, y, pageW - margin * 2, 6, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8)
  doc.text(text, margin + 3, y + 4.2)
  doc.setTextColor(30, 30, 30)
  return y + 10
}

function labelValue(doc, label, value, x, y, pageW, margin) {
  if (!value) return y
  const maxW = pageW - margin * 2 - 25
  doc.setFont('helvetica', 'bold')
  doc.setFontSize(8.5)
  doc.setTextColor(80, 80, 80)
  doc.text(`${label}:`, x, y)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(30, 30, 30)
  const lines = doc.splitTextToSize(String(value), maxW)
  lines.forEach((line, i) => doc.text(line, x + 25, y + i * 4.8))
  return y + lines.length * 4.8 + 1.5
}

function checkY(doc, y, margin, pageH, pageW, headerH) {
  if (y > pageH - 30) {
    doc.addPage()
    // Mini header en páginas adicionales
    doc.setFillColor(...BRAND)
    doc.rect(0, 0, pageW, 8, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'italic')
    doc.text('Expediente Clínico — Confidencial', pageW / 2, 5.5, { align: 'center' })
    doc.setTextColor(30, 30, 30)
    return margin + 10
  }
  return y
}

// ── Generador principal ───────────────────────────────────────────────────────

export async function generarExpedientePDF({
  paciente, antecedentes, consultas, vitales,
  recetas, documentos, medico, config = {},
}) {
  const { jsPDF } = await import('jspdf')
  const { default: autoTable } = await import('jspdf-autotable')

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'letter' })
  const pageW = doc.internal.pageSize.getWidth()
  const pageH = doc.internal.pageSize.getHeight()
  const margin = 18
  const logoDataUrl = await fetchLogoDataUrl()

  const clinicaNombre = config.clinica_nombre || medico?.nombre_completo || 'MediFlow'
  const age = calcAge(paciente.fecha_nacimiento)

  // ── Encabezado ─────────────────────────────────────────────────────────────
  const HEADER_H = 30
  doc.setFillColor(...BRAND)
  doc.rect(0, 0, pageW, HEADER_H, 'F')

  const LOGO_SIZE = 20
  const TEXT_X = logoDataUrl ? margin + LOGO_SIZE + 6 : margin

  if (logoDataUrl) {
    doc.addImage(logoDataUrl, 'PNG', margin, (HEADER_H - LOGO_SIZE) / 2, LOGO_SIZE, LOGO_SIZE)
  }

  doc.setTextColor(255, 255, 255)
  doc.setFontSize(13)
  doc.setFont('helvetica', 'bold')
  doc.text(clinicaNombre, TEXT_X, HEADER_H / 2 - 2)

  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  if (config.clinica_especialidad) {
    doc.text(config.clinica_especialidad, TEXT_X, HEADER_H / 2 + 4)
  }

  // Lado derecho del header
  doc.setFontSize(7.5)
  const hdrRight = [
    `Generado: ${formatDate(new Date().toISOString().slice(0, 10))}`,
    config.clinica_telefono || medico?.telefono || '',
    config.clinica_email || '',
  ].filter(Boolean)
  hdrRight.forEach((line, i) => {
    doc.text(line, pageW - margin, 8 + i * 5.5, { align: 'right' })
  })

  let y = HEADER_H + 8

  // ── Título del documento ───────────────────────────────────────────────────
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(14)
  doc.setFont('helvetica', 'bold')
  doc.text('EXPEDIENTE CLÍNICO', pageW / 2, y, { align: 'center' })
  y += 4
  doc.setFontSize(8)
  doc.setFont('helvetica', 'normal')
  doc.setTextColor(100, 100, 100)
  doc.text('Documento confidencial — para uso médico exclusivo', pageW / 2, y, { align: 'center' })
  y += 7

  doc.setDrawColor(200, 200, 200)
  doc.line(margin, y, pageW - margin, y)
  y += 6

  // ── Datos del paciente ─────────────────────────────────────────────────────
  y = sectionTitle(doc, 'DATOS DEL PACIENTE', y, margin, pageW)

  // Box con datos
  const boxH = 22
  doc.setFillColor(248, 250, 252)
  doc.rect(margin, y, pageW - margin * 2, boxH, 'F')
  doc.setDrawColor(225, 225, 225)
  doc.rect(margin, y, pageW - margin * 2, boxH, 'S')

  doc.setFont('helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(20, 20, 20)
  doc.text(`${paciente.nombre} ${paciente.apellido}`, margin + 4, y + 7)

  doc.setFont('helvetica', 'normal')
  doc.setFontSize(8.5)
  doc.setTextColor(60, 60, 60)
  const col1 = [
    age     ? `Edad: ${age} años` : '',
    paciente.fecha_nacimiento ? `F. Nac.: ${formatDate(paciente.fecha_nacimiento)}` : '',
    paciente.telefono ? `Tel.: ${paciente.telefono}` : '',
  ].filter(Boolean).join('   |   ')

  const col2 = [
    paciente.email    ? `Email: ${paciente.email}` : '',
    paciente.direccion ? `Dir.: ${paciente.direccion}` : '',
    medico ? `Médico tratante: ${medico.nombre_completo || ''}` : '',
  ].filter(Boolean)

  if (col1) doc.text(col1, margin + 4, y + 13)
  col2.forEach((line, i) => doc.text(line, margin + 4, y + 18 + i * 4))

  y += boxH + 6

  // ── Alerta de alergias ────────────────────────────────────────────────────
  const alergias = antecedentes?.alergias_medicamentos || paciente.alergias
  if (alergias) {
    doc.setFillColor(...RED_ALERT_BG)
    doc.setDrawColor(...RED_ALERT)
    const alergiaLines = doc.splitTextToSize(`⚠  ALERGIAS: ${alergias}`, pageW - margin * 2 - 8)
    const alergiaH = alergiaLines.length * 5 + 6
    doc.rect(margin, y, pageW - margin * 2, alergiaH, 'FD')
    doc.setTextColor(...RED_ALERT)
    doc.setFont('helvetica', 'bold')
    doc.setFontSize(8.5)
    alergiaLines.forEach((line, i) => doc.text(line, margin + 4, y + 5 + i * 5))
    doc.setTextColor(30, 30, 30)
    y += alergiaH + 5
  }

  // ── Condiciones crónicas ──────────────────────────────────────────────────
  const condiciones = []
  if (antecedentes?.diabetes)    condiciones.push('Diabetes')
  if (antecedentes?.hipertension) condiciones.push('Hipertensión')
  if (antecedentes?.cardiopatia)  condiciones.push('Cardiopatía')
  if (antecedentes?.asma_epoc)    condiciones.push('Asma/EPOC')
  if (antecedentes?.cancer)       condiciones.push('Cáncer')
  if (antecedentes?.otras_enfermedades) condiciones.push(antecedentes.otras_enfermedades)
  if (!condiciones.length && paciente.condiciones_cronicas) condiciones.push(paciente.condiciones_cronicas)

  if (condiciones.length) {
    y = sectionTitle(doc, 'CONDICIONES CRÓNICAS', y, margin, pageW)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(30, 30, 30)
    doc.text(condiciones.join('   ·   '), margin + 2, y)
    y += 8
  }

  // ── Antecedentes ──────────────────────────────────────────────────────────
  if (antecedentes) {
    y = checkY(doc, y, margin, pageH, pageW)
    y = sectionTitle(doc, 'ANTECEDENTES', y, margin, pageW)

    const antData = [
      antecedentes.cirugias         && ['Cirugías', antecedentes.cirugias],
      antecedentes.hospitalizaciones && ['Hospitalizaciones', antecedentes.hospitalizaciones],
      antecedentes.antecedentes_fam  && ['Heredofamiliares', antecedentes.antecedentes_fam],
      antecedentes.alergias_alimentos && ['Alergia alimentos', antecedentes.alergias_alimentos],
      antecedentes.alergias_otras    && ['Otras alergias', antecedentes.alergias_otras],
      antecedentes.medicacion_cronica && ['Medicación crónica', antecedentes.medicacion_cronica],
      antecedentes.tabaquismo && antecedentes.tabaquismo !== 'no' &&
        ['Tabaquismo', antecedentes.tabaquismo === 'activo'
          ? `Activo${antecedentes.tabaquismo_cigarros ? ` · ${antecedentes.tabaquismo_cigarros} cig/día` : ''}` : 'Ex-fumador'],
      antecedentes.alcoholismo && antecedentes.alcoholismo !== 'no' &&
        ['Alcoholismo', antecedentes.alcoholismo],
    ].filter(Boolean)

    if (antData.length) {
      antData.forEach(([label, value]) => {
        y = checkY(doc, y, margin, pageH, pageW)
        y = labelValue(doc, label, value, margin + 2, y, pageW, margin)
      })
      y += 4
    }

    // G.O.
    const goItems = [
      antecedentes.gestas   != null && `G${antecedentes.gestas}`,
      antecedentes.partos   != null && `P${antecedentes.partos}`,
      antecedentes.cesareas != null && `C${antecedentes.cesareas}`,
      antecedentes.abortos  != null && `A${antecedentes.abortos}`,
      antecedentes.fum      && `FUM: ${formatDate(antecedentes.fum)}`,
    ].filter(Boolean)
    if (goItems.length) {
      y = labelValue(doc, 'G.O.', goItems.join('  '), margin + 2, y, pageW, margin)
      y += 4
    }
  }

  // ── Últimos signos vitales ─────────────────────────────────────────────────
  const lastV = vitales?.[0]
  if (lastV) {
    y = checkY(doc, y, margin, pageH, pageW)
    y = sectionTitle(doc, `SIGNOS VITALES — ${formatDate(lastV.fecha)}`, y, margin, pageW)

    const svItems = [
      lastV.ta_sistolica  ? `T.A. ${lastV.ta_sistolica}/${lastV.ta_diastolica} mmHg` : null,
      lastV.fc            ? `FC ${lastV.fc} lpm` : null,
      lastV.fr            ? `FR ${lastV.fr} rpm` : null,
      lastV.temperatura   ? `Temp. ${lastV.temperatura}°C` : null,
      lastV.saturacion_o2 ? `SpO₂ ${lastV.saturacion_o2}%` : null,
      lastV.peso          ? `Peso ${lastV.peso} kg` : null,
      lastV.talla         ? `Talla ${lastV.talla} cm` : null,
      lastV.peso && lastV.talla
        ? `IMC ${(lastV.peso / ((lastV.talla / 100) ** 2)).toFixed(1)}` : null,
      lastV.glucosa       ? `Glucosa ${lastV.glucosa} mg/dL` : null,
    ].filter(Boolean)

    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(30, 30, 30)

    // Dos columnas de vitales
    const col = Math.ceil(svItems.length / 2)
    svItems.forEach((item, i) => {
      const cx = i < col ? margin + 2 : pageW / 2
      const cy = y + (i % col) * 5.5
      doc.text(`• ${item}`, cx, cy)
    })
    y += col * 5.5 + 4
  }

  // ── Consultas ─────────────────────────────────────────────────────────────
  if (consultas?.length) {
    y = checkY(doc, y, margin, pageH, pageW)
    y = sectionTitle(doc, 'HISTORIAL DE CONSULTAS', y, margin, pageW)

    const rows = consultas.slice(0, 20).map(c => [
      formatDate(c.fecha),
      c.tipo_consulta || 'Consulta',
      c.motivo_consulta || '—',
      [c.diagnostico, c.cie10_codigo ? `(${c.cie10_codigo})` : ''].filter(Boolean).join(' ') || '—',
      c.plan_tratamiento ? doc.splitTextToSize(c.plan_tratamiento, 60).slice(0, 2).join(' ') : '—',
    ])

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      head: [['Fecha', 'Tipo', 'Motivo', 'Diagnóstico', 'Plan']],
      body: rows,
      headStyles: { fillColor: BRAND, textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
      bodyStyles: { fontSize: 7.5, textColor: [30, 30, 30], cellPadding: 2 },
      alternateRowStyles: { fillColor: [240, 249, 255] },
      columnStyles: {
        0: { cellWidth: 18 },
        1: { cellWidth: 20 },
        2: { cellWidth: 38 },
        3: { cellWidth: 42 },
        4: { cellWidth: 38 },
      },
      didDrawPage: (data) => {
        // Mini header on new pages
        doc.setFillColor(...BRAND)
        doc.rect(0, 0, pageW, 8, 'F')
        doc.setTextColor(255, 255, 255)
        doc.setFontSize(7)
        doc.setFont('helvetica', 'italic')
        doc.text('Expediente Clínico — Confidencial', pageW / 2, 5.5, { align: 'center' })
      },
    })
    y = doc.lastAutoTable.finalY + 6
  }

  // ── Recetas recientes ──────────────────────────────────────────────────────
  if (recetas?.length) {
    y = checkY(doc, y, margin, pageH, pageW)
    y = sectionTitle(doc, 'PRESCRIPCIONES RECIENTES', y, margin, pageW)

    const rxRows = recetas.slice(0, 5).flatMap(r =>
      (r.medicamentos || []).map((m, i) => [
        i === 0 ? formatDate(r.fecha) : '',
        m.nombre || '—',
        m.dosis || '—',
        m.frecuencia || '—',
      ])
    )

    if (rxRows.length) {
      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Fecha', 'Medicamento', 'Dosis', 'Frecuencia']],
        body: rxRows,
        headStyles: { fillColor: BRAND, textColor: 255, fontStyle: 'bold', fontSize: 7.5 },
        bodyStyles: { fontSize: 7.5, textColor: [30, 30, 30], cellPadding: 2 },
        alternateRowStyles: { fillColor: [240, 249, 255] },
        columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 65 }, 2: { cellWidth: 30 }, 3: { cellWidth: 40 } },
      })
      y = doc.lastAutoTable.finalY + 6
    }
  }

  // ── Footer en todas las páginas ────────────────────────────────────────────
  const totalPages = doc.internal.getNumberOfPages()
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i)
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, pageH - 12, pageW - margin, pageH - 12)
    doc.setFontSize(7)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(150, 150, 150)
    doc.text(`${clinicaNombre} — Documento confidencial`, margin, pageH - 7)
    doc.text(`Página ${i} de ${totalPages}`, pageW - margin, pageH - 7, { align: 'right' })
    doc.text(
      `Generado por MediFlow • ${formatDate(new Date().toISOString().slice(0, 10))}`,
      pageW / 2, pageH - 7, { align: 'center' }
    )
  }

  return doc
}

function buildNombre(paciente) {
  return `expediente_${paciente.apellido}_${paciente.nombre}.pdf`
    .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '')
}

export async function descargarExpedientePDF(data) {
  const doc = await generarExpedientePDF(data)
  doc.save(buildNombre(data.paciente))
}

/** Devuelve { blob, nombre } sin descargar ni abrir nada */
export async function generarExpedientePDFBlob(data) {
  const doc = await generarExpedientePDF(data)
  const blob = new Blob([doc.output('arraybuffer')], { type: 'application/pdf' })
  return { blob, nombre: buildNombre(data.paciente) }
}

export async function compartirExpedientePDF(data) {
  const doc = await generarExpedientePDF(data)
  const nombre = `expediente_${data.paciente.apellido}_${data.paciente.nombre}.pdf`
    .toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_.-]/g, '')

  const blob = new Blob([doc.output('arraybuffer')], { type: 'application/pdf' })
  const file = new File([blob], nombre, { type: 'application/pdf' })

  const pacienteNombre = `${data.paciente.nombre} ${data.paciente.apellido}`
  const msg = encodeURIComponent(
    `Expediente clínico de ${pacienteNombre}. El PDF ha sido descargado en tu dispositivo.`
  )

  // ── Opción 1: Web Share API con archivo ─────────────────────────────────
  // Funciona en: Chrome Android 86+, Safari iOS 15+, Samsung Internet 12+
  if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: `Expediente clínico — ${pacienteNombre}`,
        text: `Expediente clínico de ${pacienteNombre}`,
      })
      return
    } catch (err) {
      if (err.name === 'AbortError') return  // el usuario canceló, no hacer nada
      // Si falla por otro motivo, seguir con el siguiente fallback
    }
  }

  // ── Opción 2: Web Share API sin archivo (texto solamente) ───────────────
  // Más compatible: abre el share sheet nativo en Android/iOS con texto
  if (navigator.share) {
    try {
      // Primero descargamos el PDF para que el usuario lo tenga
      doc.save(nombre)
      await navigator.share({
        title: `Expediente clínico — ${pacienteNombre}`,
        text: `Expediente clínico de ${pacienteNombre}. El PDF fue descargado en tu dispositivo.`,
      })
      return
    } catch (err) {
      if (err.name === 'AbortError') return
    }
  }

  // ── Opción 3: Fallback — descargar PDF + abrir WhatsApp ─────────────────
  doc.save(nombre)

  const isAndroid = /Android/i.test(navigator.userAgent)
  const isIOS     = /iPhone|iPad|iPod/i.test(navigator.userAgent)

  if (isAndroid) {
    // Deeplink que abre directamente la app de WhatsApp en Android
    window.location.href = `whatsapp://send?text=${msg}`
  } else if (isIOS) {
    // Deeplink para iOS
    window.location.href = `whatsapp://send?text=${msg}`
  } else {
    // Desktop: abrir WhatsApp Web
    window.open(`https://web.whatsapp.com/send?text=${msg}`, '_blank')
  }
}
