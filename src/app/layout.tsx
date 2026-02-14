import type { Metadata } from 'next';
import './globals.css';
import SessionProvider from '@/components/providers/SessionProvider';
import { Analytics } from '@vercel/analytics/react';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: {
    default: 'Rola Cards | Tu tienda de cartas TCG',
    template: '%s | Rola Cards',
  },
  description: 'Tienda especializada en cartas coleccionables TCG. Torneos, eventos, cartas individuales y producto sellado.',
  keywords: ['TCG', 'Yu-Gi-Oh', 'Pokemon', 'Magic', 'cartas coleccionables', 'torneos', 'tienda de cartas'],
  authors: [{ name: 'Rola Cards' }],
  icons: {
    icon: '/logo.png',
    shortcut: '/logo.png',
    apple: '/logo.png',
  },
  openGraph: {
    type: 'website',
    locale: 'es_MX',
    siteName: 'Rola Cards',
    title: 'Rola Cards | Tu tienda de cartas TCG',
    description: 'Tienda especializada en cartas coleccionables TCG. Torneos, eventos, cartas individuales y producto sellado.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Rola Cards Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Rola Cards | Tu tienda de cartas TCG',
    description: 'Tienda especializada en cartas coleccionables TCG. Torneos, eventos, cartas individuales y producto sellado.',
    images: ['/logo.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="dark">
      <body className="min-h-screen bg-rola-black text-gray-100 antialiased overflow-x-hidden">
        <SessionProvider>
          {/* Noise overlay for texture */}
          <div className="noise-overlay" aria-hidden="true" />

          {/* Main content */}
          <div className="relative z-10">
            {children}
          </div>

          {/* Toast notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1a1a1a',
                color: '#fff',
                border: '1px solid #2a2a2a',
                borderRadius: '0.5rem',
                padding: '1rem',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#d4af37',
                  secondary: '#1a1a1a',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#1a1a1a',
                },
              },
            }}
          />
        </SessionProvider>
        <Analytics />
      </body>
    </html>
  );
}
// Updated: Wed Jan 14 10:39:46 CST 2026
