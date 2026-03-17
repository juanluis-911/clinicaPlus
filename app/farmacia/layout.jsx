'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePermission } from '@/hooks/usePermission'
import { PageSpinner } from '@/components/ui/Spinner'
import { useUser } from '@/hooks/useUser'

export default function FarmaciaLayout({ children }) {
  const { can } = usePermission()
  const { loading } = useUser()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !can('ver_farmacia')) {
      router.replace('/dashboard')
    }
  }, [loading, can, router])

  if (loading) return <PageSpinner />
  if (!can('ver_farmacia')) return null

  return <>{children}</>
}
