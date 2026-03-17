'use client'

import { usePathname } from 'next/navigation'

/**
 * Envuelve el contenido de cada página con una animación de entrada.
 * Al cambiar `pathname`, React desmonta/remonta el div (key={pathname}),
 * lo que reinicia la animación CSS en cada navegación.
 */
export default function PageTransition({ children }) {
  const pathname = usePathname()

  return (
    <div key={pathname} className="page-enter h-full">
      {children}
    </div>
  )
}
