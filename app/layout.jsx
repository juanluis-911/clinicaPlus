import { Geist } from 'next/font/google'
import './globals.css'
import { UserProvider } from '@/hooks/useUser'
import { Analytics } from "@vercel/analytics/next"

const geist = Geist({ subsets: ['latin'] })

export const metadata = {
  title: 'MediFlow — Plataforma Médica',
  description: 'Sistema de gestión clínica para médicos y asistentes',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body className={`${geist.className} antialiased`}>
        <UserProvider>
          {children}
        </UserProvider>
        <Analytics />
      </body>
    </html>
  )
}
