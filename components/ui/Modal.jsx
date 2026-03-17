'use client'

import { useEffect } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function Modal({ open, onClose, title, children, size = 'md' }) {
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose?.() }
    if (open) document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])

  // Bloquea el scroll del body cuando el modal está abierto
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [open])

  if (!open) return null

  const sizes = {
    sm:   'sm:max-w-sm',
    md:   'sm:max-w-lg',
    lg:   'sm:max-w-2xl',
    xl:   'sm:max-w-4xl',
    full: 'sm:max-w-full sm:mx-4',
  }

  return (
    // Móvil: alineado abajo (bottom sheet). Desktop: centrado.
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className={cn(
        'modal-enter relative bg-white w-full overflow-y-auto shadow-2xl',
        // Móvil: esquinas superiores redondeadas (bottom sheet)
        'rounded-t-3xl max-h-[90vh]',
        // Desktop: totalmente redondeado con tamaño máximo
        'sm:rounded-2xl sm:max-h-[90vh]',
        sizes[size]
      )}>
        {/* Drag handle — solo móvil */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden" aria-hidden="true">
          <div className="w-10 h-1 rounded-full bg-gray-300" />
        </div>

        {title && (
          <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-900">{title}</h2>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}
        <div className="px-4 py-4 sm:px-6">{children}</div>
      </div>
    </div>
  )
}
