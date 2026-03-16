'use client'

import { useState, useEffect } from 'react'

let cachedConfig = null

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
    timezone: config?.zona_horaria || 'America/Mexico_City',
    loading,
  }
}
