'use client'

import { useEffect } from 'react'
import { useConfig } from '@/hooks/useConfig'

/**
 * Aplica los atributos de tema al elemento <html>:
 *   data-paleta   → activa las CSS variables --brand-* de color
 *   data-sidebar  → activa las CSS variables --sb-* de la barra lateral
 *
 * Renderiza null — solo efectos secundarios en el DOM.
 */
export default function ThemeApplicator() {
  const { paleta, temaSidebar } = useConfig()

  useEffect(() => {
    document.documentElement.setAttribute('data-paleta', paleta)
  }, [paleta])

  useEffect(() => {
    document.documentElement.setAttribute('data-sidebar', temaSidebar)
  }, [temaSidebar])

  return null
}
