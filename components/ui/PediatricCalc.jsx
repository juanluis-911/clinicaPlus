'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

const PEDIATRIC_DRUGS = [
  { id: 'paracetamol',  label: 'Paracetamol',        minMgKg: 10,   maxMgKg: 15,   note: 'c/4-6h, máx 5 dosis/día' },
  { id: 'ibuprofeno',   label: 'Ibuprofeno',          minMgKg: 5,    maxMgKg: 10,   note: 'c/6-8h con alimentos' },
  { id: 'amoxicilina',  label: 'Amoxicilina',         minMgKg: 25,   maxMgKg: 50,   note: 'dosis/día dividida c/8h' },
  { id: 'azitromicina', label: 'Azitromicina',        minMgKg: 10,   maxMgKg: 10,   note: '1 vez/día × 3-5 días' },
  { id: 'amoxiclav',    label: 'Amox/Clavulanato',   minMgKg: 40,   maxMgKg: 45,   note: 'dosis/día dividida c/8h' },
  { id: 'cetirizina',   label: 'Cetirizina',          minMgKg: 0.25, maxMgKg: 0.25, note: '1 vez/día' },
  { id: 'salbutamol',   label: 'Salbutamol (nebul.)', minMgKg: 0.15, maxMgKg: 0.3,  note: 'c/20min en crisis' },
  { id: 'prednisolona', label: 'Prednisolona',        minMgKg: 1,    maxMgKg: 2,    note: '1-2 mg/kg/día, máx 40mg' },
  { id: 'metronidazol', label: 'Metronidazol',        minMgKg: 20,   maxMgKg: 30,   note: 'dosis/día dividida c/8h' },
  { id: 'dexametasona', label: 'Dexametasona',        minMgKg: 0.15, maxMgKg: 0.6,  note: 'según indicación' },
]

/**
 * Panel de calculadora pediátrica de dosis.
 *
 * Props:
 *   weight      — peso del paciente en kg (number)
 *   onApply(s)  — callback con el string de dosis calculada, ej: "125 mg"
 */
export default function PediatricCalcPanel({ weight, onApply }) {
  const [mgKg, setMgKg] = useState('')
  const [preset, setPreset] = useState(null)

  const parsedMgKg = parseFloat(mgKg)
  const totalMg = weight > 0 && parsedMgKg > 0
    ? Math.round(parsedMgKg * weight * 10) / 10
    : null

  function handlePreset(drug) {
    setPreset(drug)
    const mid = (drug.minMgKg + drug.maxMgKg) / 2
    setMgKg(String(mid))
  }

  function apply() {
    if (!totalMg) return
    const display = Number.isInteger(totalMg) ? `${totalMg} mg` : `${totalMg.toFixed(1)} mg`
    onApply(display)
  }

  const rangeLabel = preset
    ? preset.minMgKg === preset.maxMgKg
      ? `${preset.minMgKg} mg/kg`
      : `${preset.minMgKg}–${preset.maxMgKg} mg/kg`
    : null

  return (
    <div className="mt-2 p-3 bg-sky-50 border border-sky-100 rounded-xl space-y-2.5">
      <p className="text-xs font-semibold text-sky-700">Calculadora pediátrica</p>

      {/* Chips de medicamentos frecuentes */}
      <div className="flex flex-wrap gap-1.5">
        {PEDIATRIC_DRUGS.map(drug => (
          <button
            key={drug.id}
            type="button"
            onClick={() => handlePreset(drug)}
            className={cn(
              'px-2 py-1 rounded-lg text-xs border transition-colors',
              preset?.id === drug.id
                ? 'bg-sky-600 text-white border-sky-600'
                : 'bg-white text-gray-600 border-gray-200 hover:border-sky-400 hover:text-sky-700',
            )}
          >
            {drug.label}
          </button>
        ))}
      </div>

      {/* Input mg/kg + peso + rango */}
      <div className="flex items-end gap-3 flex-wrap">
        <div className="w-28">
          <label className="text-xs text-gray-500 mb-0.5 block">mg / kg</label>
          <input
            type="number"
            step="0.01"
            min="0"
            value={mgKg}
            onChange={e => { setMgKg(e.target.value); setPreset(null) }}
            placeholder={rangeLabel || 'ej. 10'}
            className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          />
        </div>

        <div className="text-sm pb-1.5">
          <span className="text-gray-400">×</span>{' '}
          {weight > 0
            ? <span className="font-medium text-gray-700">{weight} kg</span>
            : <span className="text-amber-500 text-xs">sin peso</span>}
        </div>

        {preset && (
          <div className="text-xs text-sky-600 pb-1.5 flex-shrink-0">
            Rango: {rangeLabel} · {preset.note}
          </div>
        )}
      </div>

      {/* Resultado y botón */}
      {totalMg !== null ? (
        <div className="flex items-center justify-between pt-2 border-t border-sky-100">
          <span className="text-sm font-semibold text-gray-800">
            Total:{' '}
            <span className="text-sky-700">
              {Number.isInteger(totalMg) ? `${totalMg} mg` : `${totalMg.toFixed(1)} mg`}
            </span>
          </span>
          <button
            type="button"
            onClick={apply}
            className="px-3 py-1.5 text-xs font-medium bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors"
          >
            Aplicar a dosis →
          </button>
        </div>
      ) : weight === 0 ? (
        <p className="text-xs text-amber-600">Ingresa el peso del paciente para calcular.</p>
      ) : null}
    </div>
  )
}
