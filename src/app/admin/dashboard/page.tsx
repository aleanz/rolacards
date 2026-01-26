'use client';

import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  ShoppingCart,
  Package,
  TrendingUp,
  DollarSign,
} from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';

interface DashboardStats {
  stats: {
    sales: { value: number; change: number };
    products: { value: number; totalStock: number; change: number };
    users: { value: number; change: number };
    events: { value: number; change: number };
  };
  recentActivity: Array<{
    action: string;
    detail: string;
    time: string;
  }>;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const response = await fetch('/api/dashboard/stats');
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatChange = (change: number, isCount: boolean = false) => {
    if (isCount) {
      return change > 0 ? `+${change}` : change.toString();
    }
    return change > 0 ? `+${change.toFixed(1)}%` : `${change.toFixed(1)}%`;
  };

  if (isLoading || !dashboardData) {
    return (
      <div className="space-y-4 sm:space-y-8">
        <PageHeader
          title={`Bienvenido, ${session?.user.name}`}
          description="Cargando estadísticas..."
        />
      </div>
    );
  }

  const stats = [
    {
      name: 'Ventas del Mes',
      value: formatCurrency(dashboardData.stats.sales.value),
      change: formatChange(dashboardData.stats.sales.change),
      icon: DollarSign,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      href: '/admin/ventas',
    },
    {
      name: 'Productos en Stock',
      value: dashboardData.stats.products.value.toLocaleString('es-MX'),
      change: formatChange(dashboardData.stats.products.change),
      icon: Package,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      href: '/admin/inventario',
    },
    {
      name: 'Usuarios Registrados',
      value: dashboardData.stats.users.value.toString(),
      change: `${dashboardData.stats.users.change}% verificados`,
      icon: Users,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      href: '/admin/usuarios',
    },
    {
      name: 'Eventos este Mes',
      value: dashboardData.stats.events.value.toString(),
      change: formatChange(dashboardData.stats.events.change, true),
      icon: Calendar,
      color: 'text-rola-gold',
      bgColor: 'bg-rola-gold/10',
      href: '/admin/eventos',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-8">
      {/* Welcome Header */}
      <PageHeader
        title={`Bienvenido, ${session?.user.name}`}
        description="Aquí está un resumen de tu tienda Rola Cards"
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {stats.map((stat) => (
          <Link key={stat.name} href={stat.href}>
            <div className="card p-6 cursor-pointer hover:bg-rola-gray/40 transition-all hover:scale-105">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                  <stat.icon className={`w-6 h-6 ${stat.color}`} />
                </div>
                <span className={`text-sm font-medium ${
                  stat.change.includes('verificados')
                    ? 'text-purple-400'
                    : stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'
                }`}>
                  {stat.change}
                </span>
              </div>
              <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
              <p className="text-sm text-gray-500">{stat.name}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activity */}
        <div className="card p-6">
          <h2 className="font-display text-xl font-bold text-white mb-4">
            Actividad Reciente
          </h2>
          <div className="space-y-4">
            {dashboardData.recentActivity.length > 0 ? (
              dashboardData.recentActivity.map((item, index) => (
                <div key={index} className="flex items-start gap-3 pb-4 border-b border-rola-gray/30 last:border-0">
                  <div className="w-2 h-2 rounded-full bg-rola-gold mt-2" />
                  <div className="flex-1">
                    <p className="text-white font-medium">{item.action}</p>
                    <p className="text-sm text-gray-400">{item.detail}</p>
                  </div>
                  <span className="text-xs text-gray-500">{item.time}</span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-4">No hay actividad reciente</p>
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className="card p-6">
          <h2 className="font-display text-xl font-bold text-white mb-4">
            Accesos Rápidos
          </h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Nueva Venta', icon: ShoppingCart, href: '/admin/ventas' },
              { name: 'Crear Evento', icon: Calendar, href: '/admin/eventos' },
              { name: 'Ver Inventario', icon: Package, href: '/admin/inventario' },
              { name: 'Ver Reportes', icon: TrendingUp, href: '/admin/reportes' },
            ].map((link) => (
              <a
                key={link.name}
                href={link.href}
                className="flex flex-col items-center gap-3 p-4 rounded-lg bg-rola-gray/30 hover:bg-rola-gray/50 transition-colors group"
              >
                <link.icon className="w-6 h-6 text-rola-gold group-hover:scale-110 transition-transform" />
                <span className="text-sm text-gray-300 text-center">{link.name}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
