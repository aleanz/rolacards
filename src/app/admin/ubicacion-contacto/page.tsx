'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { MapPin, Clock, Phone, Mail, Save, ExternalLink } from 'lucide-react';
import PageHeader from '@/components/admin/PageHeader';

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

export default function UbicacionContactoPage() {
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState<StoreSettings>({
    address: '',
    city: '',
    state: '',
    mapsUrl: '',
    phone: '',
    whatsapp: '',
    email: '',
    scheduleWeekday: '',
    scheduleWeekend: '',
  });
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const settings = await response.json();

        // Convertir array de settings a objeto
        const settingsObj: any = {};
        settings.forEach((setting: any) => {
          const key = setting.key.replace('store_', '');
          settingsObj[key] = setting.value;
        });

        setFormData({
          address: settingsObj.address || '',
          city: settingsObj.city || '',
          state: settingsObj.state || '',
          mapsUrl: settingsObj.mapsUrl || '',
          phone: settingsObj.phone || '',
          whatsapp: settingsObj.whatsapp || '',
          email: settingsObj.email || '',
          scheduleWeekday: settingsObj.scheduleWeekday || '',
          scheduleWeekend: settingsObj.scheduleWeekend || '',
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      // Convertir objeto a array de settings
      const settings = Object.entries(formData).map(([key, value]) => ({
        key: `store_${key}`,
        value: value,
        type: 'STRING',
      }));

      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (!response.ok) {
        const error = await response.json();
        setErrorMessage(error.error || 'Error al guardar configuración');
        return;
      }

      setSuccessMessage('Configuración guardada correctamente');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage('Ocurrió un error. Intenta de nuevo.');
    } finally {
      setIsSaving(false);
    }
  };

  const isAdmin = session?.user.role === 'ADMIN';

  if (!isAdmin) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No tienes permisos para acceder a esta página</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="w-12 h-12 border-4 border-rola-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-400">Cargando configuración...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <PageHeader
        title="Ubicación & Contacto"
        description="Configura la información de contacto y ubicación de la tienda"
        action={
          <button
            type="submit"
            form="ubicacion-form"
            disabled={isSaving}
            className="btn btn-primary btn-sm sm:btn w-full sm:w-auto"
          >
            <Save className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden sm:inline">{isSaving ? 'Guardando...' : 'Guardar cambios'}</span>
            <span className="sm:hidden">{isSaving ? 'Guardando...' : 'Guardar'}</span>
          </button>
        }
      />

      {/* Messages */}
      {successMessage && (
        <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-400">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400">
          {errorMessage}
        </div>
      )}

      <form id="ubicacion-form" onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Ubicación */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-rola-gold/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-rola-gold" />
            </div>
            <h2 className="font-display text-xl font-bold text-white">Ubicación</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Dirección *
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                placeholder="Ej: Calle Principal #123"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ciudad *
                </label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                  placeholder="Ej: Ciudad de México"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Estado *
                </label>
                <input
                  type="text"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                  placeholder="Ej: CDMX"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                URL de Google Maps *
              </label>
              <input
                type="url"
                value={formData.mapsUrl}
                onChange={(e) => setFormData({ ...formData, mapsUrl: e.target.value })}
                className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                placeholder="https://maps.google.com/..."
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Copia el enlace de Google Maps para la ubicación de tu tienda
              </p>
            </div>

            {formData.mapsUrl && (
              <a
                href={formData.mapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-rola-gold hover:text-rola-gold/80 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Probar enlace de mapa
              </a>
            )}
          </div>
        </div>

        {/* Horarios */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-rola-gold/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-rola-gold" />
            </div>
            <h2 className="font-display text-xl font-bold text-white">Horarios</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Lunes a Viernes *
              </label>
              <input
                type="text"
                value={formData.scheduleWeekday}
                onChange={(e) => setFormData({ ...formData, scheduleWeekday: e.target.value })}
                className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                placeholder="Ej: 3PM - 9PM"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Sábado y Domingo *
              </label>
              <input
                type="text"
                value={formData.scheduleWeekend}
                onChange={(e) => setFormData({ ...formData, scheduleWeekend: e.target.value })}
                className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                placeholder="Ej: 12PM - 9PM"
                required
              />
            </div>
          </div>
        </div>

        {/* Contacto */}
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-rola-gold/10 flex items-center justify-center">
              <Phone className="w-5 h-5 text-rola-gold" />
            </div>
            <h2 className="font-display text-xl font-bold text-white">Contacto</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Teléfono *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                placeholder="+52 123 456 7890"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                WhatsApp *
              </label>
              <input
                type="tel"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                placeholder="521234567890 (sin espacios ni +)"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Número de WhatsApp en formato internacional sin espacios (ej: 521234567890)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                placeholder="info@rolacards.com"
                required
              />
            </div>
          </div>
        </div>

      </form>
    </div>
  );
}
