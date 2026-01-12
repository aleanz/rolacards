'use client';

import { useSession } from 'next-auth/react';
import {
  Users,
  Calendar,
  ShoppingCart,
  Package,
  TrendingUp,
  DollarSign,
} from 'lucide-react';

const stats = [
  {
    name: 'Ventas del Mes',
    value: '$12,450',
    change: '+12.5%',
    icon: DollarSign,
    color: 'text-green-500',
    bgColor: 'bg-green-500/10',
  },
  {
    name: 'Productos en Stock',
    value: '1,234',
    change: '-5.2%',
    icon: Package,
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/10',
  },
  {
    name: 'Usuarios Activos',
    value: '143',
    change: '+8.1%',
    icon: Users,
    color: 'text-purple-500',
    bgColor: 'bg-purple-500/10',
  },
  {
    name: 'Eventos este Mes',
    value: '8',
    change: '+2',
    icon: Calendar,
    color: 'text-rola-gold',
    bgColor: 'bg-rola-gold/10',
  },
];

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-white mb-2">
          Bienvenido, {session?.user.name}
        </h1>
        <p className="text-gray-400">
          Aquí está un resumen de tu tienda Rola Cards
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <span className={`text-sm font-medium ${stat.change.startsWith('+') ? 'text-green-500' : 'text-red-500'}`}>
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
            <p className="text-sm text-gray-500">{stat.name}</p>
          </div>
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
            {[
              { action: 'Nueva venta', detail: 'Producto: Booster Box', time: 'Hace 5 min' },
              { action: 'Usuario registrado', detail: 'juan@example.com', time: 'Hace 20 min' },
              { action: 'Evento creado', detail: 'Torneo Semanal', time: 'Hace 1 hora' },
              { action: 'Inventario actualizado', detail: '+50 cartas añadidas', time: 'Hace 2 horas' },
            ].map((item, index) => (
              <div key={index} className="flex items-start gap-3 pb-4 border-b border-rola-gray/30 last:border-0">
                <div className="w-2 h-2 rounded-full bg-rola-gold mt-2" />
                <div className="flex-1">
                  <p className="text-white font-medium">{item.action}</p>
                  <p className="text-sm text-gray-400">{item.detail}</p>
                </div>
                <span className="text-xs text-gray-500">{item.time}</span>
              </div>
            ))}
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
              { name: 'Ver Reportes', icon: TrendingUp, href: '/admin/ventas' },
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
