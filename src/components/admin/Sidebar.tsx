'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Calendar,
  Users,
  MapPin,
  CreditCard,
  ShoppingCart,
  Package,
  LogOut,
  ChevronLeft,
  Menu,
  BarChart3,
  FileCheck,
  ShoppingBag,
} from 'lucide-react';

const menuItems = [
  {
    name: 'Dashboard',
    href: '/admin/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Usuarios',
    href: '/admin/usuarios',
    icon: Users,
  },
  {
    name: 'Ventas',
    href: '/admin/ventas',
    icon: ShoppingCart,
  },
  {
    name: 'Reportes',
    href: '/admin/reportes',
    icon: BarChart3,
  },
  {
    name: 'Inventario',
    href: '/admin/inventario',
    icon: Package,
  },
  {
    name: 'Ubicación & Contacto',
    href: '/admin/ubicacion-contacto',
    icon: MapPin,
  },
  {
    name: 'Eventos',
    href: '/admin/eventos',
    icon: Calendar,
  },
  {
    name: 'Solicitudes',
    href: '/admin/solicitudes',
    icon: FileCheck,
    showBadge: true,
  },
  {
    name: 'Órdenes de Compra',
    href: '/admin/ordenes',
    icon: ShoppingBag,
    showBadge: true,
    badgeType: 'orders',
  },
  {
    name: 'Buscador de Cartas',
    href: '/admin/buscador-cartas',
    icon: CreditCard,
  },
];

interface SidebarProps {
  user?: {
    name: string;
    email: string;
    role: string;
  };
  onSignOut: () => void;
  isCollapsed: boolean;
  setIsCollapsed: (value: boolean) => void;
}

export default function Sidebar({ user, onSignOut, isCollapsed, setIsCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingOrdersCount, setPendingOrdersCount] = useState(0);

  useEffect(() => {
    const fetchPendingCount = async () => {
      try {
        const response = await fetch('/api/admin/registrations?status=PENDIENTE');
        if (!response.ok) return;
        const data = await response.json();
        setPendingCount(data.registrations.length);
      } catch (error) {
        console.error('Error fetching pending count:', error);
      }
    };

    const fetchPendingOrdersCount = async () => {
      try {
        const response = await fetch('/api/orders?status=PENDING');
        if (!response.ok) return;
        const data = await response.json();
        setPendingOrdersCount(data.length);
      } catch (error) {
        console.error('Error fetching pending orders count:', error);
      }
    };

    fetchPendingCount();
    fetchPendingOrdersCount();

    // Actualizar cada 30 segundos
    const interval = setInterval(() => {
      fetchPendingCount();
      fetchPendingOrdersCount();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-rola-darker border border-rola-gray/50 text-gray-400 hover:text-white hover:bg-rola-gold hover:border-rola-gold transition-all"
        aria-label="Toggle menu"
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen bg-rola-darker border-r border-rola-gray/50 transition-all duration-300',
          // Desktop behavior
          'lg:translate-x-0',
          isCollapsed ? 'lg:w-20' : 'lg:w-64',
          // Mobile behavior
          'w-64 lg:w-auto',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-20 flex items-center justify-center border-b border-rola-gray/50 px-4">
            {!isCollapsed ? (
              <Link href="/">
                <div className="relative w-32 h-16">
                  <Image
                    src="/logo.png"
                    alt="Rola Cards"
                    fill
                    className="object-contain brightness-90 contrast-110"
                    style={{ mixBlendMode: 'lighten' }}
                  />
                </div>
              </Link>
            ) : (
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-rola-gold to-rola-gold-dark flex items-center justify-center">
                <span className="text-rola-black font-bold">RC</span>
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-6 px-3">
            <ul className="space-y-1">
              {menuItems.map((item) => {
                const isActive = pathname === item.href;
                const badgeCount = (item as any).badgeType === 'orders' ? pendingOrdersCount : pendingCount;
                const showNotification = item.showBadge && badgeCount > 0;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        'flex items-center gap-3 px-3 py-3 rounded-lg transition-all duration-200 group relative',
                        isActive
                          ? 'bg-rola-gold text-rola-black font-medium'
                          : 'text-gray-400 hover:text-white hover:bg-rola-gray/50'
                      )}
                      title={isCollapsed ? item.name : undefined}
                    >
                      <div className="relative">
                        <item.icon
                          className={cn(
                            'w-5 h-5 flex-shrink-0',
                            isActive ? 'text-rola-black' : 'group-hover:scale-110 transition-transform'
                          )}
                        />
                        {showNotification && (
                          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                        )}
                      </div>
                      <span className={cn('flex-1', isCollapsed && 'lg:hidden')}>{item.name}</span>
                      {showNotification && !isCollapsed && (
                        <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                          {badgeCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User section */}
          <div className="border-t border-rola-gray/50 p-4">
            {user && (
              <div className={cn('mb-4', isCollapsed && 'lg:hidden')}>
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-rola-gold/20 text-rola-gold">
                  {user.role}
                </span>
              </div>
            )}

            <button
              onClick={onSignOut}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors',
                isCollapsed && 'lg:justify-center'
              )}
              title="Cerrar sesión"
            >
              <LogOut className="w-5 h-5" />
              <span className={cn(isCollapsed && 'lg:hidden')}>Cerrar Sesión</span>
            </button>
          </div>

          {/* Collapse toggle - Desktop only */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3 top-24 w-6 h-6 rounded-full bg-rola-gray border border-rola-gray/50 items-center justify-center text-gray-400 hover:text-white hover:bg-rola-gold hover:border-rola-gold transition-all"
          >
            <ChevronLeft
              className={cn('w-4 h-4 transition-transform', isCollapsed && 'rotate-180')}
            />
          </button>
        </div>
      </aside>
    </>
  );
}
