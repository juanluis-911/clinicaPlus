import { Geist } from 'next/font/google'
import './globals.css'
import { UserProvider } from '@/hooks/useUser'
import { Analytics } from "@vercel/analytics/next"
import ThemeApplicator from '@/components/ThemeApplicator'

const geist = Geist({ subsets: ['latin'] })

export const metadata = {
  title: 'MediFlow — Plataforma Médica',
  description: 'Sistema de gestión clínica para médicos y asistentes',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es" data-paleta="sky" data-sidebar="oscuro">
      <body className={`${geist.className} antialiased`}>
        <UserProvider>
          <ThemeApplicator />
          {children}
        </UserProvider>
        <Analytics />
      </body>
    </html>
  )
}
