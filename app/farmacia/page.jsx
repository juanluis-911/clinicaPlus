'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Package, ShoppingCart, History, AlertTriangle, TrendingUp, DollarSign } from 'lucide-react'
import AppLayout from '@/components/AppLayout'
import Card, { CardBody } from '@/components/ui/Card'
import { usePermission } from '@/hooks/usePermission'
import { useConfig } from '@/hooks/useConfig'

export default function FarmaciaPage() {
  const { can } = usePermission()
  const { config } = useConfig()
  const moneda = config?.moneda || 'MXN'

  const [stats, setStats] = useState({ total_productos: 0, stock_bajo: 0, ventas_hoy: 0, ingresos_hoy: 0 })
  const [loadingStats, setLoadingStats] = useState(true)

  useEffect(() => {
    async function loadStats() {
      try {
        const [prodsRes, ventasRes] = await Promise.all([
          fetch('/api/farmacia/productos'),
          fetch(`/api/farmacia/ventas?desde=${new Date().toISOString().slice(0, 10)}T00:00:00Z&limit=200`),
        ])
        const [prodsData, ventasData] = await Promise.all([prodsRes.json(), ventasRes.json()])

        const productos = prodsData.data || []
        const ventas = (ventasData.data || []).filter(v => v.estado === 'completada')

        setStats({
          total_productos: productos.length,
          stock_bajo: productos.filter(p => p.stock_actual <= p.stock_minimo).length,
          ventas_hoy: ventas.length,
          ingresos_hoy: ventas.reduce((a, v) => a + parseFloat(v.total || 0), 0),
        })
      } catch {
        // ignore
      } finally {
        setLoadingStats(false)
      }
    }
    if (can('gestionar_inventario_farmacia')) loadStats()
    else setLoadingStats(false)
  }, [can])

  const fmt = (n) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: moneda }).format(n)

  return (
    <AppLayout title="Farmacia">
      <div className="max-w-3xl mx-auto space-y-6">

        {/* Stats — solo médico dueño */}
        {can('gestionar_inventario_farmacia') && !loadingStats && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <StatCard icon={Package} label="Productos activos" value={stats.total_productos} color="sky" />
            <StatCard icon={AlertTriangle} label="Stock bajo" value={stats.stock_bajo} color={stats.stock_bajo > 0 ? 'amber' : 'emerald'} />
            <StatCard icon={ShoppingCart} label="Ventas hoy" value={stats.ventas_hoy} color="sky" />
            <StatCard icon={DollarSign} label="Ingresos hoy" value={fmt(stats.ingresos_hoy)} color="emerald" isText />
          </div>
        )}

        {/* Accesos rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {can('usar_pos_farmacia') && (
            <QuickLink
              href="/farmacia/pos"
              icon={ShoppingCart}
              title="Punto de Venta"
              desc="Cobrar productos y consultas"
              color="sky"
            />
          )}
          {can('gestionar_inventario_farmacia') && (
            <QuickLink
              href="/farmacia/inventario"
              icon={Package}
              title="Inventario"
              desc="Gestionar productos y stock"
              color="indigo"
            />
          )}
          {can('ver_farmacia') && (
            <QuickLink
              href="/farmacia/ventas"
              icon={History}
              title="Ventas"
              desc="Historial de transacciones"
              color="emerald"
            />
          )}
        </div>

      </div>
    </AppLayout>
  )
}

function StatCard({ icon: Icon, label, value, color, isText }) {
  const colors = {
    sky: 'bg-sky-50 text-sky-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    indigo: 'bg-indigo-50 text-indigo-600',
  }
  return (
    <Card>
      <CardBody className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${colors[color]}`}>
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <p className="text-xs text-gray-500 truncate">{label}</p>
          <p className="text-lg font-bold text-gray-800 truncate">{value}</p>
        </div>
      </CardBody>
    </Card>
  )
}

function QuickLink({ href, icon: Icon, title, desc, color }) {
  const colors = {
    sky: 'bg-sky-600 hover:bg-sky-700',
    indigo: 'bg-indigo-600 hover:bg-indigo-700',
    emerald: 'bg-emerald-600 hover:bg-emerald-700',
  }
  return (
    <Link href={href} className={`${colors[color]} text-white rounded-xl p-5 flex flex-col gap-2 transition-colors`}>
      <Icon size={24} />
      <div>
        <p className="font-semibold text-base">{title}</p>
        <p className="text-xs opacity-80 mt-0.5">{desc}</p>
      </div>
    </Link>
  )
}
