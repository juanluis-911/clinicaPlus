'use client'

import { useUser } from './useUser'

const PERMISSIONS = {
  medico: [
    'crear_paciente', 'editar_paciente', 'eliminar_paciente', 'ver_paciente',
    'crear_consulta', 'editar_consulta', 'ver_consulta',
    'crear_prescripcion', 'editar_prescripcion', 'ver_prescripcion',
    'gestionar_documentos', 'ver_documentos',
    'gestionar_agenda', 'ver_agenda',
    'configurar_recordatorios',
    'ver_dashboard',
    'ver_configuracion', 'editar_configuracion',
    'gestionar_equipo',
  ],
  asistente: [
    'crear_paciente', 'editar_paciente', 'ver_paciente',
    'ver_consulta',
    'ver_prescripcion',
    'gestionar_documentos', 'ver_documentos',
    'gestionar_agenda', 'ver_agenda',
    'configurar_recordatorios',
    'ver_dashboard',
    'ver_configuracion',
  ],
}

// Permisos que el médico asociado (con medico_empleador_id) no tiene
const PERMISOS_SOLO_DUENO = ['editar_configuracion', 'gestionar_equipo']

export function usePermission() {
  const { rol, perfil } = useUser()
  const isOwner = rol === 'medico' && !perfil?.medico_empleador_id
  let allowed = new Set(PERMISSIONS[rol] || [])

  // Médico asociado: quitar permisos exclusivos del dueño
  if (rol === 'medico' && perfil?.medico_empleador_id) {
    PERMISOS_SOLO_DUENO.forEach(p => allowed.delete(p))
  }

  // Aplicar permisos granulares del perfil (para asistentes principalmente)
  // { "crear_consulta": true }  → agrega el permiso
  // { "eliminar_paciente": false } → quita el permiso
  if (perfil?.permisos && typeof perfil.permisos === 'object') {
    for (const [action, grant] of Object.entries(perfil.permisos)) {
      if (grant === true)  allowed.add(action)
      if (grant === false) allowed.delete(action)
    }
  }

  return {
    can: (action) => allowed.has(action),
    isMedico: rol === 'medico',
    isAsistente: rol === 'asistente',
    isOwner,
  }
}
