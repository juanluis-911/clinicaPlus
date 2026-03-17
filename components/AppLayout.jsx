'use client'

import { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import PageTransition from './PageTransition'
import { PageSpinner } from './ui/Spinner'

export default function AppLayout({ title, children }) {
  const { user, loading } = useUser()
  const router = useRouter()
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/auth/login')
  }, [user, loading, router])

  // Cierra el sidebar móvil al cambiar de página
  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <PageSpinner />
      </div>
    )
  }

  if (!user) return null

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar
        mobileOpen={sidebarOpen}
        onMobileClose={() => setSidebarOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <TopBar title={title} onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <PageTransition>
            <div className="p-4 md:p-6">
              {children}
            </div>
          </PageTransition>
        </main>
      </div>
    </div>
  )
}
