'use client'

import { useState, useEffect, useRef } from 'react'
import { Search, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Input con autocompletado para nombres de medicamentos.
 *
 * Props:
 *   label          — etiqueta del campo
 *   required       — agrega asterisco rojo
 *   value          — valor actual (string, el nombre del medicamento)
 *   onTextChange   — llamado con el string mientras el médico escribe
 *   onSelect(item) — llamado con el objeto completo del catálogo al seleccionar
 *                    item = { nombre, concentracion, forma, mg_kg_min, mg_kg_max, nota_dosis }
 *                    o { nombre } si se agrega uno nuevo
 */
export default function MedicamentosCombobox({ label, required, value, onTextChange, onSelect }) {
  const [query, setQuery] = useState(value || '')
  const [results, setResults] = useState([])
  const [open, setOpen] = useState(false)
  const [fetching, setFetching] = useState(false)
  const inputRef = useRef(null)
  const containerRef = useRef(null)
  const timerRef = useRef(null)

  // Sync cuando el padre resetea el valor externamente
  useEffect(() => {
    setQuery(value || '')
  }, [value])

  // Búsqueda con debounce
  useEffect(() => {
    if (!open || query.length < 1) {
      setResults([])
      return
    }
    clearTimeout(timerRef.current)
    timerRef.current = setTimeout(async () => {
      setFetching(true)
      try {
        const res = await fetch(`/api/catalogo-medicamentos?q=${encodeURIComponent(query)}`)
        const { data } = await res.json()
        setResults(data || [])
      } catch {
        setResults([])
      }
      setFetching(false)
    }, 220)
    return () => clearTimeout(timerRef.current)
  }, [query, open])

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function onMouseDown(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [])

  function handleInputChange(e) {
    const v = e.target.value
    setQuery(v)
    onTextChange?.(v)
    setOpen(true)
  }

  function handleSelect(item) {
    setQuery(item.nombre)
    setOpen(false)
    onSelect?.(item)
  }

  async function handleAddNew() {
    const nombre = query.trim()
    if (!nombre) return
    // Guardar en catálogo en segundo plano
    fetch('/api/catalogo-medicamentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nombre }),
    }).catch(() => {})
    handleSelect({ nombre })
  }

  const queryTrimmed = query.trim()
  const exactMatch = results.some(r => r.nombre.toLowerCase() === queryTrimmed.toLowerCase())
  const showAddOption = queryTrimmed.length > 0 && !exactMatch

  return (
    <div className="flex flex-col gap-1 relative" ref={containerRef}>
      {label && (
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div
        className={cn(
          'relative w-full rounded-lg border bg-white flex items-center transition-all',
          open ? 'border-sky-500 ring-2 ring-sky-500/20' : 'border-gray-300',
        )}
      >
        <Search size={14} className="ml-3 text-gray-400 flex-shrink-0 pointer-events-none" />
        <input
          ref={inputRef}
          type="text"
          className="flex-1 px-2 py-2 text-sm bg-transparent outline-none text-gray-900 placeholder:text-gray-400"
          placeholder="Buscar o escribir medicamento…"
          value={query}
          onChange={handleInputChange}
          onFocus={() => setOpen(true)}
          required={required}
        />
      </div>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute z-50 w-full bg-white border border-gray-200 rounded-lg shadow-xl overflow-hidden"
          style={{ top: '100%', left: 0, marginTop: 4 }}
        >
          {fetching ? (
            <div className="px-4 py-3 text-xs text-gray-400 flex items-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-sky-400 border-t-transparent rounded-full animate-spin" />
              Buscando…
            </div>
          ) : (
            <ul className="max-h-56 overflow-y-auto">
              {results.map((item, idx) => (
                <li key={idx}>
                  <button
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="w-full text-left px-4 py-2.5 hover:bg-sky-50 transition-colors flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-sm text-gray-800 truncate">{item.nombre}</span>
                      {item.mg_kg_min != null && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-sky-100 text-sky-700 flex-shrink-0">
                          mg/kg
                        </span>
                      )}
                    </div>
                    {item.concentracion && (
                      <span className="text-xs text-gray-400 flex-shrink-0">{item.concentracion}</span>
                    )}
                  </button>
                </li>
              ))}
              {showAddOption && results.length === 0 && (
                <li>
                  <button
                    type="button"
                    onClick={handleAddNew}
                    className="w-full text-left px-4 py-2.5 text-sm text-sky-700 font-medium hover:bg-sky-50 transition-colors flex items-center gap-2 border-t border-gray-100"
                  >
                    <Plus size={13} />
                    Agregar &ldquo;{queryTrimmed}&rdquo; al catálogo
                  </button>
                </li>
              )}
              {showAddOption && results.length > 0 && (
                <li>
                  <button
                    type="button"
                    onClick={handleAddNew}
                    className="w-full text-left px-4 py-2.5 text-xs text-gray-400 hover:bg-gray-50 transition-colors flex items-center gap-2 border-t border-gray-100"
                  >
                    <Plus size={11} />
                    Guardar &ldquo;{queryTrimmed}&rdquo; como nuevo
                  </button>
                </li>
              )}
              {!fetching && results.length === 0 && !showAddOption && (
                <li className="px-4 py-3 text-xs text-gray-400 text-center">
                  Escribe el nombre del medicamento
                </li>
              )}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
