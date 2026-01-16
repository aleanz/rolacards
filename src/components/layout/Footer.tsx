'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  Facebook,
  Youtube,
  MessageCircle,
  Info,
  Calendar,
  Search,
  ShoppingBag
} from 'lucide-react';

const quickLinks = [
  { name: '¿Por qué Rola Cards?', href: '/#porque-rola-cards' },
  { name: 'Eventos', href: '/#eventos' },
  { name: 'Visítanos', href: '/#visitanos' },
  { name: 'Buscador de Cartas', href: '/buscador-cartas' },
  { name: 'Catálogo', href: '/catalogo' },
  { name: 'Contáctanos', href: '/contacto' },
];

interface StoreSettings {
  address: string;
  city: string;
  state: string;
  phone: string;
  whatsapp: string;
  email: string;
  scheduleWeekday: string;
  scheduleWeekend: string;
}

// Valores por defecto (datos reales de la tienda)
const DEFAULT_SETTINGS: StoreSettings = {
  address: 'Miguel Hidalgo Y Costilla 812, Centro, 66',
  city: 'San Nicolas de los Garza',
  state: 'Nuevo Leon',
  phone: '+52 8110187496',
  whatsapp: '528110187496',
  email: 'info@rolacards.com',
  scheduleWeekday: '6PM - 10PM',
  scheduleWeekend: '6PM - 12AM',
};

export default function Footer() {
  const [settings, setSettings] = useState<StoreSettings>(DEFAULT_SETTINGS);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();

        // Convertir array de settings a objeto
        const settingsObj: any = {};
        data.forEach((setting: any) => {
          const key = setting.key.replace('store_', '');
          settingsObj[key] = setting.value;
        });

        setSettings({
          address: settingsObj.address || 'Tu dirección aquí',
          city: settingsObj.city || 'Ciudad',
          state: settingsObj.state || 'Estado',
          phone: settingsObj.phone || '+52 123 456 7890',
          whatsapp: settingsObj.whatsapp || '521234567890',
          email: settingsObj.email || 'info@rolacards.com',
          scheduleWeekday: settingsObj.scheduleWeekday || '3PM - 9PM',
          scheduleWeekend: settingsObj.scheduleWeekend || '12PM - 9PM',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Mantener valores por defecto (ya establecidos en useState)
    }
  };

  const socialLinks = settings
    ? [
        { name: 'Facebook', href: 'https://www.facebook.com/Rolacards', icon: Facebook },
        { name: 'YouTube', href: 'https://www.youtube.com/@Rolatesta', icon: Youtube },
        { name: 'WhatsApp', href: `https://wa.me/${settings.whatsapp}`, icon: MessageCircle },
      ]
    : [];

  return (
    <footer className="bg-rola-darker border-t border-rola-gray/50">
      {/* Main Footer */}
      <div className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="inline-block group">
              <div className="relative w-32 h-16 transition-all duration-300 group-hover:scale-105 group-hover:brightness-110">
                <Image
                  src="/logo.png"
                  alt="Rola Cards"
                  fill
                  className="object-contain brightness-90 contrast-110"
                  style={{ mixBlendMode: 'lighten' }}
                />
              </div>
            </Link>
            <p className="mt-4 text-gray-400 text-sm leading-relaxed">
              Tu destino para cartas coleccionables TCG. Torneos, eventos y la mejor 
              selección de cartas individuales y producto sellado.
            </p>
            {/* Social Links */}
            <div className="flex gap-3 mt-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-10 h-10 rounded-lg bg-rola-gray/50 flex items-center justify-center text-gray-400 hover:text-rola-gold hover:bg-rola-gray transition-colors"
                  aria-label={social.name}
                >
                  <social.icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display text-white font-semibold mb-4">
              Enlaces Rápidos
            </h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-gray-400 hover:text-rola-gold transition-colors text-sm"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className="font-display text-white font-semibold mb-4">
              Contacto
            </h4>
            {settings ? (
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-rola-gold flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400 text-sm">
                    {settings.address},<br />
                    {settings.city}, {settings.state}
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-rola-gold flex-shrink-0" />
                  <a
                    href={`tel:${settings.phone.replace(/\s/g, '')}`}
                    className="text-gray-400 hover:text-rola-gold text-sm transition-colors"
                  >
                    {settings.phone}
                  </a>
                </li>
                <li className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-rola-gold flex-shrink-0" />
                  <a
                    href={`mailto:${settings.email}`}
                    className="text-gray-400 hover:text-rola-gold text-sm transition-colors"
                  >
                    {settings.email}
                  </a>
                </li>
              </ul>
            ) : (
              <div className="h-32 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-rola-gold border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-display text-white font-semibold mb-4">
              Horario
            </h4>
            {settings ? (
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-rola-gold flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-white font-medium">Lun - Vie</p>
                    <p className="text-gray-400">{settings.scheduleWeekday}</p>
                  </div>
                </li>
                <li className="flex items-start gap-3 ml-8">
                  <div className="text-sm">
                    <p className="text-white font-medium">Sáb - Dom</p>
                    <p className="text-gray-400">{settings.scheduleWeekend}</p>
                  </div>
                </li>
              </ul>
            ) : (
              <div className="h-32 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-rola-gold border-t-transparent rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-rola-gray/50">
        <div className="container-custom py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-gray-500 text-sm">
            © {new Date().getFullYear()} Rola Cards. Todos los derechos reservados.
          </p>
          <div className="flex gap-6 text-sm">
            <Link href="/privacidad" className="text-gray-500 hover:text-gray-300 transition-colors">
              Privacidad
            </Link>
            <Link href="/terminos" className="text-gray-500 hover:text-gray-300 transition-colors">
              Términos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
