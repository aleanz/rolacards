'use client';

import { useEffect, useState } from 'react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare } from 'lucide-react';
//
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

export default function ContactoPage() {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });
  const [isSending, setIsSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendStatus(null);

    if (!formData.name || !formData.email || !formData.message) {
      setSendStatus({
        type: 'error',
        message: 'Por favor completa todos los campos obligatorios',
      });
      return;
    }

    setIsSending(true);

    try {
      // Aquí puedes integrar con tu API de envío de correos
      // Por ahora, simulamos el envío
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setSendStatus({
        type: 'success',
        message: '¡Mensaje enviado correctamente! Te responderemos pronto.',
      });

      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      setSendStatus({
        type: 'error',
        message: 'Hubo un error al enviar el mensaje. Por favor intenta de nuevo.',
      });
    } finally {
      setIsSending(false);
    }
  };

  const sendWhatsApp = () => {
    if (!settings) return;
    const message = `Hola, me gustaría obtener más información sobre Rola Cards.`;
    window.open(`https://wa.me/${settings.whatsapp}?text=${encodeURIComponent(message)}`, '_blank');
  };

  if (isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-20">
          <div className="section">
            <div className="container-custom">
              <div className="text-center py-12 card">
                <div className="w-12 h-12 border-4 border-rola-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Cargando información...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!settings) {
    return null;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <div className="section">
          <div className="container-custom">
            {/* Header */}
            <div className="text-center mb-12">
              <h1 className="font-display text-3xl md:text-4xl font-bold text-white mb-4">
                <span className="text-gradient">Contáctanos</span>
              </h1>
              <p className="text-gray-400 max-w-2xl mx-auto">
                ¿Tienes alguna pregunta o comentario? Estamos aquí para ayudarte.
                Envíanos un mensaje o contáctanos por WhatsApp.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Contact Info */}
              <div className="space-y-6">
                {/* Ubicación */}
                <div className="card p-6">
                  <div className="w-12 h-12 rounded-xl bg-rola-gold/10 flex items-center justify-center mb-4">
                    <MapPin className="w-6 h-6 text-rola-gold" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">Ubicación</h3>
                  <p className="text-gray-400 mb-4">
                    {settings.address}
                    <br />
                    {settings.city}, {settings.state}
                  </p>
                  <a
                    href={settings.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-rola-gold hover:text-rola-gold-light transition-colors text-sm"
                  >
                    Ver en Google Maps →
                  </a>
                </div>

                {/* Horario */}
                <div className="card p-6">
                  <div className="w-12 h-12 rounded-xl bg-rola-purple/10 flex items-center justify-center mb-4">
                    <Clock className="w-6 h-6 text-rola-purple-light" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">Horario</h3>
                  <div className="space-y-2 text-gray-400">
                    <p>
                      <span className="text-white font-medium">Lunes a Viernes:</span>
                      <br />
                      {settings.scheduleWeekday}
                    </p>
                    <p>
                      <span className="text-white font-medium">Sábado y Domingo:</span>
                      <br />
                      {settings.scheduleWeekend}
                    </p>
                  </div>
                </div>

                {/* Contacto Directo */}
                <div className="card p-6">
                  <div className="w-12 h-12 rounded-xl bg-rola-blue/10 flex items-center justify-center mb-4">
                    <Phone className="w-6 h-6 text-rola-blue" />
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">Contacto Directo</h3>
                  <div className="space-y-3">
                    <a
                      href={`tel:${settings.phone}`}
                      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <Phone className="w-4 h-4" />
                      {settings.phone}
                    </a>
                    <a
                      href={`mailto:${settings.email}`}
                      className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <Mail className="w-4 h-4" />
                      {settings.email}
                    </a>
                    <button
                      onClick={sendWhatsApp}
                      className="btn btn-primary w-full mt-4"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Abrir WhatsApp
                    </button>
                  </div>
                </div>
              </div>

              {/* Contact Form */}
              <div className="lg:col-span-2">
                <div className="card p-8">
                  <div className="mb-6">
                    <h2 className="font-display text-2xl font-bold text-white mb-2">
                      Envíanos un mensaje
                    </h2>
                    <p className="text-gray-400">
                      Completa el formulario y te responderemos lo antes posible
                    </p>
                  </div>

                  {sendStatus && (
                    <div
                      className={`p-4 rounded-lg mb-6 ${
                        sendStatus.type === 'success'
                          ? 'bg-rola-green/10 border border-rola-green/30 text-rola-green'
                          : 'bg-rola-red/10 border border-rola-red/30 text-rola-red'
                      }`}
                    >
                      {sendStatus.message}
                    </div>
                  )}

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Nombre */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Nombre <span className="text-rola-red">*</span>
                        </label>
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          className="w-full px-4 py-3 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                          placeholder="Tu nombre"
                          required
                        />
                      </div>

                      {/* Email */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Email <span className="text-rola-red">*</span>
                        </label>
                        <input
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          className="w-full px-4 py-3 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                          placeholder="tu@email.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Teléfono */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Teléfono (opcional)
                        </label>
                        <input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="w-full px-4 py-3 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                          placeholder="+52 123 456 7890"
                        />
                      </div>

                      {/* Asunto */}
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Asunto (opcional)
                        </label>
                        <input
                          type="text"
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          className="w-full px-4 py-3 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                          placeholder="Ej: Consulta sobre productos"
                        />
                      </div>
                    </div>

                    {/* Mensaje */}
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Mensaje <span className="text-rola-red">*</span>
                      </label>
                      <textarea
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        rows={6}
                        className="w-full px-4 py-3 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors resize-none"
                        placeholder="Escribe tu mensaje aquí..."
                        required
                      />
                    </div>

                    {/* Botón Submit */}
                    <button
                      type="submit"
                      disabled={isSending}
                      className="btn btn-primary w-full md:w-auto px-8"
                    >
                      {isSending ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                          Enviando...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Enviar Mensaje
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
