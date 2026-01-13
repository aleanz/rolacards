'use client';

import { useEffect, useState } from 'react';
import { MapPin, Clock, Phone, ChevronRight } from 'lucide-react';

interface StoreSettings {
  address: string;
  city: string;
  state: string;
  mapsUrl: string;
  phone: string;
  whatsapp: string;
  email: string;
  scheduleWeekday: string;
  scheduleWeekend: string;
}

export default function CTASection() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
          mapsUrl: settingsObj.mapsUrl || '#',
          phone: settingsObj.phone || '+52 123 456 7890',
          whatsapp: settingsObj.whatsapp || '521234567890',
          email: settingsObj.email || 'info@rolacards.com',
          scheduleWeekday: settingsObj.scheduleWeekday || '3PM - 9PM',
          scheduleWeekend: settingsObj.scheduleWeekend || '12PM - 9PM',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      // Usar valores por defecto en caso de error
      setSettings({
        address: 'Tu dirección aquí',
        city: 'Ciudad',
        state: 'Estado',
        mapsUrl: '#',
        phone: '+52 123 456 7890',
        whatsapp: '521234567890',
        email: 'info@rolacards.com',
        scheduleWeekday: '3PM - 9PM',
        scheduleWeekend: '12PM - 9PM',
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <section className="section relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rola-gold/10 via-rola-darker to-rola-purple/5" />
        <div className="container-custom relative">
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-rola-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-gray-400">Cargando información...</p>
          </div>
        </div>
      </section>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <section id="visitanos" className="section relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-rola-gold/10 via-rola-darker to-rola-purple/5" />
      <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-5" />
      
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-rola-gold/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-rola-purple/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />

      <div className="container-custom relative">
        <div className="max-w-4xl mx-auto">
          {/* Main CTA Card */}
          <div className="gradient-border p-8 md:p-12 text-center">
            <h2 className="font-display text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
              ¡Visítanos en <span className="text-gradient">Rola Cards</span>!
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto mb-10">
              Te esperamos para que conozcas nuestra tienda, participes en nuestros eventos 
              y formes parte de nuestra comunidad de jugadores.
            </p>

            {/* Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className="bg-rola-darker/50 rounded-xl p-6 border border-rola-gray/30">
                <div className="w-12 h-12 rounded-xl bg-rola-gold/10 flex items-center justify-center mx-auto mb-4">
                  <MapPin className="w-6 h-6 text-rola-gold" />
                </div>
                <h3 className="text-white font-semibold mb-2">Ubicación</h3>
                <p className="text-gray-400 text-sm">
                  {settings.address},<br />
                  {settings.city}, {settings.state}
                </p>
              </div>

              <div className="bg-rola-darker/50 rounded-xl p-6 border border-rola-gray/30">
                <div className="w-12 h-12 rounded-xl bg-rola-gold/10 flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6 text-rola-gold" />
                </div>
                <h3 className="text-white font-semibold mb-2">Horario</h3>
                <p className="text-gray-400 text-sm">
                  Lun-Vie: {settings.scheduleWeekday}<br />
                  Sáb-Dom: {settings.scheduleWeekend}
                </p>
              </div>

              <div className="bg-rola-darker/50 rounded-xl p-6 border border-rola-gray/30">
                <div className="w-12 h-12 rounded-xl bg-rola-gold/10 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-6 h-6 text-rola-gold" />
                </div>
                <h3 className="text-white font-semibold mb-2">Contacto</h3>
                <p className="text-gray-400 text-sm">
                  {settings.phone}<br />
                  {settings.email}
                </p>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href={settings.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary btn-lg"
              >
                Cómo llegar
                <ChevronRight className="w-5 h-5" />
              </a>
              <a
                href={`https://wa.me/${settings.whatsapp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-lg"
              >
                WhatsApp
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
