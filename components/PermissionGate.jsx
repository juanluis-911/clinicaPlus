'use client'

import { usePermission } from '@/hooks/usePermission'

export default function PermissionGate({ action, allowedRoles, fallback = null, children }) {
  const { can, isMedico, isAsistente } = usePermission()

  if (action && !can(action)) return fallback
  if (allowedRoles) {
    const rol = isMedico ? 'medico' : 'asistente'
    if (!allowedRoles.includes(rol)) return fallback
  }
  return children
}
