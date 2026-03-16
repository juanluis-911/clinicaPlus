'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, X, ChevronDown } from 'lucide-react'
import { cn, calcAge } from '@/lib/utils'

/**
 * Searchable patient selector.
 *
 * Props:
 *   label, required, disabled, error  — standard form props
 *   value          — current patient ID (string | '')
 *   onSelect(p)    — called with the patient object when selected, or null when cleared
 *   initialPatient — { id, nombre, apellido } to pre-populate display without an extra fetch
 */
export default function PatientCombobox({
  label,
  required,
  disabled,
  error,
  value,
  onSelect,
  initialPatient,
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [selected, setSelected] = useState(initialPatient || null)
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const timerRef = useRef(null)

  // Sync selected patient when parent resets value or changes initialPatient
  useEffect(() => {
    if (!value) {
      setSelected(null)
      setQuery('')
    } else if (initialPatient && initialPatient.id === value) {
      setSelected(initialPatient)
    }
  }, [value, initialPatient])

  // Debounced search
  useEffect(() => {
    if (!open) return
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setFetching(true)
      try {
        const res = await fetch(`/api/pacientes?search=${encodeURIComponent(query)}&page=1`)
        const { data } = await res.json()
        setResults(data || [])
      } catch {
        setResults([])
      }
      setFetching(false)
    }, 220)
    return () => clearTimeout(timerRef.current)
  }, [query, open])

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  function openDropdown() {
    if (disabled) return
    setOpen(true)
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  function handleSelect(patient) {
    setSelected(patient)
    setQuery('')
    setOpen(false)
    onSelect(patient)
  }

  function handleClear(e) {
    e.stopPropagation()
    setSelected(null)
    setQuery('')
    setOpen(false)
    onSelect(null)
  }

  const age = selected?.fecha_nacimiento ? calcAge(selected.fecha_nacimiento) : null

  return (
    <div className="flex flex-col gap-1 relative" ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      {/* Trigger / Input */}
      <div
        onClick={openDropdown}
        className={cn(
          'relative w-full rounded-lg border bg-white flex items-center cursor-text transition-all',
          open ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-gray-300',
          error && 'border-red-400',
          disabled && 'bg-gray-50 cursor-not-allowed opacity-70',
        )}
      >
        {selected ? (
          /* ── Selected state ── */
          <div className="flex-1 flex items-center gap-2 px-3 py-2 min-w-0">
            <div className="w-6 h-6 rounded-full bg-sky-100 flex items-center justify-center text-xs font-bold text-sky-700 flex-shrink-0">
              {selected.nombre?.[0]}{selected.apellido?.[0]}
            </div>
            <span className="text-sm text-gray-900 truncate">
              {selected.apellido}, {selected.nombre}
            </span>
            {age != null && (
              <span className="text-xs text-gray-400 flex-shrink-0">{age} años</span>
            )}
          </div>
        ) : (
          /* ── Search input ── */
          <div className="flex-1 flex items-center gap-2 px-3">
            <Search size={14} className="text-gray-400 flex-shrink-0 pointer-events-none" />
            <input
              ref={inputRef}
              type="text"
              className="flex-1 py-2 text-sm bg-transparent outline-none text-gray-900 placeholder:text-gray-400 disabled:cursor-not-allowed"
              placeholder="Buscar paciente por nombre o apellido…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              onFocus={() => setOpen(true)}
              disabled={disabled}
            />
          </div>
        )}

        {/* Right icon */}
        {!disabled && (
          selected ? (
            <button
              type="button"
              onClick={handleClear}
              className="pr-3 text-gray-400 hover:text-gray-600 transition-colors"
              tabIndex={-1}
            >
              <X size={14} />
            </button>
          ) : (
            <span className="pr-3 text-gray-400 pointer-events-none">
              <ChevronDown size={14} className={cn('transition-transform duration-150', open && 'rotate-180')} />
            </span>
          )
        )}
      </div>

      {/* Dropdown */}
      {open && !disabled && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
          style={{ top: '100%', left: 0 }}
        >
          {fetching ? (
            <div className="px-4 py-3 text-xs text-gray-400 flex items-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              Buscando…
            </div>
          ) : results.length === 0 ? (
            <div className="px-4 py-4 text-center text-xs text-gray-400">
              {query.length >= 1 ? `Sin resultados para "${query}"` : 'Escribe para buscar pacientes'}
            </div>
          ) : (
            <ul className="max-h-56 overflow-y-auto divide-y divide-gray-50">
              {results.map(p => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => handleSelect(p)}
                    className="w-full text-left px-4 py-2.5 hover:bg-sky-50 flex items-center gap-3 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-full bg-sky-100 flex items-center justify-center text-xs font-bold text-sky-700 flex-shrink-0">
                      {p.nombre?.[0]}{p.apellido?.[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {p.apellido}, {p.nombre}
                      </p>
                      <p className="text-xs text-gray-400 truncate">
                        {p.fecha_nacimiento ? `${calcAge(p.fecha_nacimiento)} años` : ''}
                        {p.fecha_nacimiento && p.condiciones_cronicas ? ' · ' : ''}
                        {p.condiciones_cronicas ? p.condiciones_cronicas.slice(0, 40) : ''}
                      </p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
