export function cn(...classes) {
  return classes.filter(Boolean).join(' ')
}

export function formatDate(date, opts = {}) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric', month: 'long', day: 'numeric',
    ...opts,
  }).format(new Date(date))
}

export function formatDateShort(date, timezone) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    ...(timezone ? { timeZone: timezone } : {}),
  }).format(new Date(date))
}

export function formatTime(date, timezone) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-MX', {
    hour: '2-digit', minute: '2-digit', hour12: true,
    ...(timezone ? { timeZone: timezone } : {}),
  }).format(new Date(date))
}

export function formatDateTime(date, timezone) {
  if (!date) return '—'
  return new Intl.DateTimeFormat('es-MX', {
    year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
    ...(timezone ? { timeZone: timezone } : {}),
  }).format(new Date(date))
}

// Returns date parts (year, month, day, hour, minute, second) in the given timezone
export function getDatePartsInTZ(date, timezone = 'America/Mexico_City') {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).formatToParts(new Date(date))
  const get = type => parseInt(parts.find(p => p.type === type).value)
  return {
    year: get('year'), month: get('month'), day: get('day'),
    hour: get('hour') % 24, minute: get('minute'), second: get('second'),
  }
}

// Returns UTC ISO strings for the start and end of today in the given timezone
export function todayBoundariesInTZ(timezone = 'America/Mexico_City') {
  const now = new Date()
  const p = getDatePartsInTZ(now, timezone)
  // Offset: difference between real UTC time and what "local time treated as UTC" would be
  const localAsUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  const offsetMs = now.getTime() - localAsUTC
  const midnightUTC = Date.UTC(p.year, p.month - 1, p.day, 0, 0, 0)
  return {
    inicio: new Date(midnightUTC + offsetMs).toISOString(),
    fin: new Date(midnightUTC + offsetMs + 86400000 - 1).toISOString(),
  }
}

// Converts a datetime-local string ("YYYY-MM-DDTHH:mm") representing time in `timezone` to UTC ISO
export function localToUTC(datetimeLocalStr, timezone = 'America/Mexico_City') {
  if (!datetimeLocalStr) return ''
  const [datePart, timePart] = datetimeLocalStr.split('T')
  const [year, month, day] = datePart.split('-').map(Number)
  const [hour, minute] = timePart.split(':').map(Number)
  // Use an approximate UTC to calculate the timezone offset at that local time
  const approxUTC = new Date(Date.UTC(year, month - 1, day, hour, minute, 0))
  const p = getDatePartsInTZ(approxUTC, timezone)
  const localAsUTC = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  const offsetMs = approxUTC.getTime() - localAsUTC
  return new Date(Date.UTC(year, month - 1, day, hour, minute, 0) + offsetMs).toISOString()
}

// Converts a UTC ISO string to a datetime-local input value ("YYYY-MM-DDTHH:mm") in `timezone`
export function utcToLocalInput(dateStr, timezone = 'America/Mexico_City') {
  if (!dateStr) return ''
  const p = getDatePartsInTZ(new Date(dateStr), timezone)
  const pad = n => String(n).padStart(2, '0')
  return `${p.year}-${pad(p.month)}-${pad(p.day)}T${pad(p.hour)}:${pad(p.minute)}`
}

export function calcAge(fechaNacimiento) {
  if (!fechaNacimiento) return null
  const today = new Date()
  const birth = new Date(fechaNacimiento)
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export function formatPhone(phone) {
  if (!phone) return '—'
  const cleaned = phone.replace(/\D/g, '')
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0,3)}) ${cleaned.slice(3,6)}-${cleaned.slice(6)}`
  }
  return phone
}

export function getInitials(name) {
  if (!name) return '??'
  return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

export const ESTADOS_CITA = {
  programada:  { label: 'Programada',  color: 'blue' },
  confirmada:  { label: 'Confirmada',  color: 'green' },
  cancelada:   { label: 'Cancelada',   color: 'red' },
  completada:  { label: 'Completada',  color: 'gray' },
}

export const TIPOS_CITA = [
  { value: 'consulta',     label: 'Consulta' },
  { value: 'seguimiento',  label: 'Seguimiento' },
  { value: 'urgencia',     label: 'Urgencia' },
  { value: 'bloqueo',      label: 'Bloqueo de agenda' },
]

export const TIPOS_DOCUMENTO = [
  { value: 'laboratorio', label: 'Laboratorio' },
  { value: 'imagen',      label: 'Imagen / Radiografía' },
  { value: 'otro',        label: 'Otro' },
]
