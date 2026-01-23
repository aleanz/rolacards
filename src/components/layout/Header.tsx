'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';
import { cn } from '@/lib/utils';
import {
  Menu,
  X,
  Calendar,
  Search,
  ShoppingBag,
  MapPin,
  Mail,
  LogIn,
  Info,
  LayoutDashboard,
  User,
  LogOut,
  ChevronDown,
  Layers,
  ClipboardList
} from 'lucide-react';

const navigation = [
  { name: 'Eventos', href: '/eventos', icon: Calendar },
  { name: 'Visítanos', href: '/#visitanos', icon: MapPin },
  { name: 'Buscador de Cartas', href: '/buscador-cartas', icon: Search },
  { name: 'Catálogo', href: '/catalogo', icon: ShoppingBag },
  { name: 'Contáctanos', href: '/contacto', icon: Mail },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const { data: session } = useSession();

  const isCliente = session?.user?.role === 'CLIENTE';
  const isAdminOrStaff = session?.user?.role === 'ADMIN' || session?.user?.role === 'STAFF';

  const handleLogout = async () => {
    await signOut({ callbackUrl: '/' });
  };

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header
      className={cn(
        'fixed top-0 left-0 right-0 z-50 transition-all duration-300',
        isScrolled
          ? 'bg-rola-black/95 backdrop-blur-md shadow-lg border-b border-rola-gray/50'
          : 'bg-transparent'
      )}
    >
      <nav className="container-custom">
        <div className="flex items-center justify-between h-20 relative">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center group flex-shrink-0 z-10"
          >
            <div className="relative w-20 h-10 sm:w-24 sm:h-12 md:w-28 md:h-14 lg:w-32 lg:h-16 transition-all duration-300 group-hover:scale-105 group-hover:brightness-110">
              <Image
                src="/logo.png"
                alt="Rola Cards"
                fill
                className="object-contain brightness-90 contrast-110"
                priority
                style={{ mixBlendMode: 'lighten' }}
              />
            </div>
          </Link>

          {/* Desktop Navigation - Centered */}
          <div className="hidden lg:flex items-center gap-0.5 absolute left-1/2 -translate-x-1/2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'px-2.5 py-2 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap',
                  'text-gray-300 hover:text-white hover:bg-rola-gray/50'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Auth button - Right side */}
          <div className="hidden lg:flex items-center gap-3 flex-shrink-0 z-10">
            {!session && (
              <Link href="/auth/login" className="btn btn-primary btn-sm">
                <LogIn className="w-4 h-4" />
                Ingresar
              </Link>
            )}

            {isAdminOrStaff && (
              <Link href="/admin/dashboard" className="btn btn-primary btn-sm">
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </Link>
            )}

            {isCliente && (
              <div className="relative">
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-300 hover:text-white hover:bg-rola-gray/50 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full overflow-hidden bg-rola-gray border border-rola-gold flex-shrink-0">
                    {session.user.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'Usuario'}
                        width={32}
                        height={32}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-400" />
                      </div>
                    )}
                  </div>
                  <span>{session.user.name}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {isUserMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsUserMenuOpen(false)}
                    />
                    <div className="absolute right-0 mt-2 w-48 bg-rola-black/95 backdrop-blur-md border border-rola-gray/50 rounded-lg shadow-xl z-20">
                      <div className="p-3 border-b border-rola-gray/50">
                        <p className="text-sm font-medium text-white">{session.user.name}</p>
                        <p className="text-xs text-gray-400">{session.user.email}</p>
                      </div>
                      <Link
                        href="/perfil"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-rola-gray/50 transition-colors"
                      >
                        <User className="w-4 h-4" />
                        Mi Perfil
                      </Link>
                      <Link
                        href="/mazos"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-rola-gray/50 transition-colors"
                      >
                        <Layers className="w-4 h-4" />
                        Mis Mazos
                      </Link>
                      <Link
                        href="/mis-inscripciones"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-rola-gray/50 transition-colors"
                      >
                        <ClipboardList className="w-4 h-4" />
                        Mis Inscripciones
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-rola-gray/50 transition-colors border-t border-rola-gray/50"
                      >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-rola-gray/50 transition-colors z-10 flex-shrink-0"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu Overlay */}
        {isMobileMenuOpen && (
          <div
            className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
            onClick={() => setIsMobileMenuOpen(false)}
          />
        )}

        {/* Mobile Menu */}
        <div
          className={cn(
            'lg:hidden fixed top-20 left-0 right-0 z-50 bg-rola-black/95 backdrop-blur-md border-t border-rola-gray/50 shadow-2xl transition-all duration-300 ease-in-out',
            isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
          )}
        >
          <div className="container-custom py-4 space-y-1 max-h-[calc(100vh-5rem)] overflow-y-auto">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-rola-gray/50 rounded-lg transition-colors"
              >
                {item.icon && <item.icon className="w-5 h-5 text-rola-gold" />}
                <span className="text-sm font-medium">{item.name}</span>
              </Link>
            ))}
            <div className="pt-2 mt-2 border-t border-rola-gray/50">
              {!session && (
                <Link
                  href="/auth/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-rola-gold hover:bg-rola-gray/50 rounded-lg transition-colors"
                >
                  <LogIn className="w-5 h-5" />
                  <span className="text-sm font-medium">Ingresar</span>
                </Link>
              )}

              {isAdminOrStaff && (
                <Link
                  href="/admin/dashboard"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 text-rola-gold hover:bg-rola-gray/50 rounded-lg transition-colors"
                >
                  <LayoutDashboard className="w-5 h-5" />
                  <span className="text-sm font-medium">Dashboard</span>
                </Link>
              )}

              {isCliente && (
                <>
                  <div className="px-4 py-3">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-12 h-12 rounded-full overflow-hidden bg-rola-gray border-2 border-rola-gold flex-shrink-0">
                        {session.user.image ? (
                          <Image
                            src={session.user.image}
                            alt={session.user.name || 'Usuario'}
                            width={48}
                            height={48}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">{session.user.name}</p>
                        <p className="text-xs text-gray-400">{session.user.email}</p>
                      </div>
                    </div>
                  </div>
                  <Link
                    href="/perfil"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-rola-gray/50 rounded-lg transition-colors"
                  >
                    <User className="w-5 h-5" />
                    <span className="text-sm font-medium">Mi Perfil</span>
                  </Link>
                  <Link
                    href="/mazos"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-rola-gray/50 rounded-lg transition-colors"
                  >
                    <Layers className="w-5 h-5" />
                    <span className="text-sm font-medium">Mis Mazos</span>
                  </Link>
                  <Link
                    href="/mis-inscripciones"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-rola-gray/50 rounded-lg transition-colors"
                  >
                    <ClipboardList className="w-5 h-5" />
                    <span className="text-sm font-medium">Mis Inscripciones</span>
                  </Link>
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      handleLogout();
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-rola-gray/50 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span className="text-sm font-medium">Cerrar sesión</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
