'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import {
  Menu,
  X,
  Calendar,
  Newspaper,
  ShoppingBag,
  ImageIcon,
  LogIn,
  ChevronDown
} from 'lucide-react';

const navigation = [
  { name: 'Inicio', href: '/' },
  { name: 'Eventos', href: '/eventos', icon: Calendar },
  { name: 'Noticias', href: '/noticias', icon: Newspaper },
  { name: 'Catálogo', href: '/catalogo', icon: ShoppingBag },
  { name: 'Galería', href: '/galeria', icon: ImageIcon },
];

export default function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center group flex-shrink-0"
          >
            <div className="relative w-24 h-12 sm:w-32 sm:h-16 transition-all duration-300 group-hover:scale-105 group-hover:brightness-110">
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
          <div className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                  'text-gray-300 hover:text-white hover:bg-rola-gray/50'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Admin button - Right side */}
          <Link
            href="/auth/login"
            className="hidden lg:flex btn btn-ghost btn-sm flex-shrink-0"
          >
            <LogIn className="w-4 h-4" />
            Admin
          </Link>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden p-2 rounded-lg text-gray-300 hover:text-white hover:bg-rola-gray/50 transition-colors"
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            'lg:hidden overflow-hidden transition-all duration-300 ease-in-out',
            isMobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          )}
        >
          <div className="py-4 space-y-1 border-t border-rola-gray/50">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-gray-300 hover:text-white hover:bg-rola-gray/50 rounded-lg transition-colors"
              >
                {item.icon && <item.icon className="w-5 h-5 text-rola-gold" />}
                {item.name}
              </Link>
            ))}
            <div className="pt-4 border-t border-rola-gray/50">
              <Link
                href="/auth/login"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 text-rola-gold hover:bg-rola-gray/50 rounded-lg transition-colors"
              >
                <LogIn className="w-5 h-5" />
                Acceso Admin
              </Link>
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
