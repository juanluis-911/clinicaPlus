'use client'

import { useState, useEffect } from 'react'

let cachedConfig = null

/** Limpia el caché al hacer logout o cambio de cuenta */
export function clearConfigCache() {
  cachedConfig = null
}

/** Actualiza el caché tras guardar configuración sin necesidad de re-fetch */
export function updateConfigCache(data) {
  cachedConfig = data || {}
}

export function useConfig() {
  const [config, setConfig] = useState(cachedConfig)
  const [loading, setLoading] = useState(!cachedConfig)

  useEffect(() => {
    if (cachedConfig) return
    fetch('/api/configuracion')
      .then(r => r.json())
      .then(({ data }) => {
        cachedConfig = data || {}
        setConfig(cachedConfig)
        setLoading(false)
      })
      .catch(() => {
        cachedConfig = {}
        setConfig(cachedConfig)
        setLoading(false)
      })
  }, [])

  return {
    config,
    timezone:    config?.zona_horaria  || 'America/Mexico_City',
    paleta:      config?.paleta_color  || 'sky',
    temaSidebar: config?.tema_sidebar  || 'oscuro',
    loading,
  }
}
