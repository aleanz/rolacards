'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { Tooltip } from '@/components/ui/Tooltip';
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
  ChevronDown,
  Menu,
  BarChart3,
  FileCheck,
  ShoppingBag,
  Settings,
  Handshake,
  Trophy,
  Store,
  Users2,
  Cog,
  type LucideIcon,
} from 'lucide-react';

interface MenuItem {
  name: string;
  href: string;
  icon: LucideIcon;
  showBadge?: boolean;
  badgeType?: 'orders' | 'registrations';
}

interface MenuSection {
  name: string;
  icon: LucideIcon;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    name: 'Principal',
    icon: LayoutDashboard,
    items: [
      {
        name: 'Dashboard',
        href: '/admin/dashboard',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    name: 'Operaciones',
    icon: Store,
    items: [
      {
        name: 'Ventas',
        href: '/admin/ventas',
        icon: ShoppingCart,
      },
      {
        name: 'Inventario',
        href: '/admin/inventario',
        icon: Package,
      },
      {
        name: 'Reportes',
        href: '/admin/reportes',
        icon: BarChart3,
      },
      {
        name: 'Órdenes',
        href: '/admin/ordenes',
        icon: ShoppingBag,
        showBadge: true,
        badgeType: 'orders',
      },
    ],
  },
  {
    name: 'Comunidad',
    icon: Users2,
    items: [
      {
        name: 'Usuarios',
        href: '/admin/usuarios',
        icon: Users,
      },
      {
        name: 'Eventos',
        href: '/admin/eventos',
        icon: Calendar,
      },
      {
        name: 'Torneos',
        href: '/admin/torneos',
        icon: Trophy,
      },
      {
        name: 'Solicitudes',
        href: '/admin/solicitudes',
        icon: FileCheck,
        showBadge: true,
        badgeType: 'registrations',
      },
    ],
  },
  {
    name: 'Configuración',
    icon: Cog,
    items: [
      {
        name: 'Ubicación & Contacto',
        href: '/admin/ubicacion-contacto',
        icon: MapPin,
      },
      {
        name: 'Buscador de Cartas',
        href: '/admin/buscador-cartas',
        icon: CreditCard,
      },
      {
        name: 'Sponsors',
        href: '/admin/sponsors',
        icon: Handshake,
      },
      {
        name: 'Ajustes',
        href: '/admin/configuracion',
        icon: Settings,
      },
    ],
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
  const [expandedSections, setExpandedSections] = useState<string[]>(['Principal', 'Operaciones', 'Comunidad', 'Configuración']);

  // Auto-expand section based on current path
  useEffect(() => {
    const currentSection = menuSections.find(section =>
      section.items.some(item => pathname === item.href || pathname.startsWith(item.href + '/'))
    );
    if (currentSection && !expandedSections.includes(currentSection.name)) {
      setExpandedSections(prev => [...prev, currentSection.name]);
    }
  }, [pathname]);

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

    const interval = setInterval(() => {
      fetchPendingCount();
      fetchPendingOrdersCount();
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const toggleSection = (sectionName: string) => {
    setExpandedSections(prev =>
      prev.includes(sectionName)
        ? prev.filter(s => s !== sectionName)
        : [...prev, sectionName]
    );
  };

  const getBadgeCount = (item: MenuItem) => {
    if (!item.showBadge) return 0;
    return item.badgeType === 'orders' ? pendingOrdersCount : pendingCount;
  };

  const getSectionBadgeCount = (section: MenuSection) => {
    return section.items.reduce((total, item) => total + getBadgeCount(item), 0);
  };

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
          'lg:translate-x-0',
          isCollapsed ? 'lg:w-20' : 'lg:w-64',
          'w-72 lg:w-auto',
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="h-16 flex items-center justify-center border-b border-rola-gray/50 px-4">
            {!isCollapsed ? (
              <Link href="/" className="flex items-center gap-2">
                <div className="relative w-28 h-12">
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
              <Tooltip content="Rola Cards" side="right">
                <Link href="/" className="w-10 h-10 rounded-lg bg-gradient-to-br from-rola-gold to-rola-gold-dark flex items-center justify-center">
                  <span className="text-rola-black font-bold text-sm">RC</span>
                </Link>
              </Tooltip>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto py-4 px-2 scrollbar-thin scrollbar-thumb-rola-gray scrollbar-track-transparent">
            <div className="space-y-1">
              {menuSections.map((section) => {
                const isExpanded = expandedSections.includes(section.name);
                const sectionBadgeCount = getSectionBadgeCount(section);
                const hasActiveItem = section.items.some(item =>
                  pathname === item.href || pathname.startsWith(item.href + '/')
                );

                // En modo colapsado, mostrar solo los iconos de los items
                if (isCollapsed) {
                  return (
                    <div key={section.name} className="space-y-1">
                      {section.items.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        const badgeCount = getBadgeCount(item);

                        return (
                          <Tooltip key={item.href} content={item.name} side="right">
                            <Link
                              href={item.href}
                              onClick={() => setIsMobileMenuOpen(false)}
                              className={cn(
                                'flex items-center justify-center p-3 rounded-lg transition-all duration-200 relative',
                                isActive
                                  ? 'bg-rola-gold text-rola-black'
                                  : 'text-gray-400 hover:text-white hover:bg-rola-gray/50'
                              )}
                            >
                              <item.icon className="w-5 h-5" />
                              {badgeCount > 0 && (
                                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[10px] font-bold bg-red-500 text-white rounded-full flex items-center justify-center">
                                  {badgeCount > 9 ? '9+' : badgeCount}
                                </span>
                              )}
                            </Link>
                          </Tooltip>
                        );
                      })}
                      {section.name !== 'Configuración' && (
                        <div className="my-2 border-b border-rola-gray/30" />
                      )}
                    </div>
                  );
                }

                // Modo expandido - mostrar secciones colapsables
                return (
                  <div key={section.name} className="mb-2">
                    {/* Section Header */}
                    <button
                      onClick={() => toggleSection(section.name)}
                      className={cn(
                        'w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group',
                        hasActiveItem
                          ? 'text-rola-gold'
                          : 'text-gray-500 hover:text-gray-300'
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <section.icon className="w-4 h-4" />
                        <span className="text-xs font-semibold uppercase tracking-wider">
                          {section.name}
                        </span>
                        {sectionBadgeCount > 0 && !isExpanded && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-red-500 text-white rounded-full">
                            {sectionBadgeCount}
                          </span>
                        )}
                      </div>
                      <ChevronDown
                        className={cn(
                          'w-4 h-4 transition-transform duration-200',
                          isExpanded && 'rotate-180'
                        )}
                      />
                    </button>

                    {/* Section Items */}
                    <div
                      className={cn(
                        'overflow-hidden transition-all duration-200',
                        isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                      )}
                    >
                      <ul className="mt-1 space-y-0.5 pl-2">
                        {section.items.map((item) => {
                          const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                          const badgeCount = getBadgeCount(item);

                          return (
                            <li key={item.href}>
                              <Link
                                href={item.href}
                                onClick={() => setIsMobileMenuOpen(false)}
                                className={cn(
                                  'flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group relative',
                                  isActive
                                    ? 'bg-rola-gold text-rola-black font-medium'
                                    : 'text-gray-400 hover:text-white hover:bg-rola-gray/50'
                                )}
                              >
                                <item.icon
                                  className={cn(
                                    'w-4 h-4 flex-shrink-0',
                                    isActive ? 'text-rola-black' : 'group-hover:scale-110 transition-transform'
                                  )}
                                />
                                <span className="flex-1 text-sm">{item.name}</span>
                                {badgeCount > 0 && (
                                  <span className="px-2 py-0.5 text-xs font-bold bg-red-500 text-white rounded-full">
                                    {badgeCount}
                                  </span>
                                )}
                              </Link>
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  </div>
                );
              })}
            </div>
          </nav>

          {/* User section */}
          <div className="border-t border-rola-gray/50 p-3">
            {user && !isCollapsed && (
              <div className="mb-3 px-2">
                <p className="text-sm font-medium text-white truncate">{user.name}</p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded bg-rola-gold/20 text-rola-gold">
                  {user.role}
                </span>
              </div>
            )}

            <Tooltip content={isCollapsed ? "Cerrar sesión" : null} side="right">
              <button
                onClick={onSignOut}
                className={cn(
                  'w-full flex items-center gap-3 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-colors',
                  isCollapsed && 'justify-center'
                )}
              >
                <LogOut className="w-5 h-5" />
                {!isCollapsed && <span className="text-sm">Cerrar Sesión</span>}
              </button>
            </Tooltip>
          </div>

          {/* Collapse toggle - Desktop only */}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex absolute -right-3 top-20 w-6 h-6 rounded-full bg-rola-gray border border-rola-gray/50 items-center justify-center text-gray-400 hover:text-white hover:bg-rola-gold hover:border-rola-gold transition-all"
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
