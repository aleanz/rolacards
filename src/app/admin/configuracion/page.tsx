'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Save, Building2 } from 'lucide-react';

export default function ConfiguracionPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  // Configuraciones bancarias
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [clabe, setClabe] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankReference, setBankReference] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchSettings();
    }
  }, [status]);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        setBankName(data.bank_name || '');
        setAccountHolder(data.bank_account_holder || '');
        setClabe(data.bank_clabe || '');
        setAccountNumber(data.bank_account_number || '');
        setBankReference(data.bank_reference || '');
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
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings: [
            { key: 'bank_name', value: bankName },
            { key: 'bank_account_holder', value: accountHolder },
            { key: 'bank_clabe', value: clabe },
            { key: 'bank_account_number', value: accountNumber },
            { key: 'bank_reference', value: bankReference },
          ],
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Error al guardar configuración');
      }
    } catch (err) {
      setError('Error al guardar configuración');
    } finally {
      setIsSaving(false);
    }
  };

  if (status === 'loading' || isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-rola-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando configuración...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Configuración de la Tienda
        </h1>
        <p className="text-gray-400">
          Administra la información bancaria para las transferencias
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
        {/* Bank Information Card */}
        <div className="card p-6 space-y-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-rola-gold/10 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-rola-gold" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Datos Bancarios</h2>
              <p className="text-sm text-gray-400">
                Información para que los clientes realicen transferencias
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Bank Name */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Nombre del Banco *
              </label>
              <input
                type="text"
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                placeholder="Ej: BBVA Bancomer"
                className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                required
              />
            </div>

            {/* Account Holder */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Titular de la Cuenta *
              </label>
              <input
                type="text"
                value={accountHolder}
                onChange={(e) => setAccountHolder(e.target.value)}
                placeholder="Ej: ROLA CARDS S.A. DE C.V."
                className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
                required
              />
            </div>

            {/* CLABE */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                CLABE Interbancaria *
              </label>
              <input
                type="text"
                value={clabe}
                onChange={(e) => setClabe(e.target.value)}
                placeholder="18 dígitos"
                maxLength={18}
                className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors font-mono"
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Clave Bancaria Estandarizada (18 dígitos)
              </p>
            </div>

            {/* Account Number */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Número de Cuenta
              </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Opcional"
                className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors font-mono"
              />
              <p className="text-xs text-gray-500 mt-1">
                Número de cuenta tradicional (opcional)
              </p>
            </div>

            {/* Reference */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Referencia / Concepto de Pago
              </label>
              <input
                type="text"
                value={bankReference}
                onChange={(e) => setBankReference(e.target.value)}
                placeholder="Ej: Orden #XXXXX (se mostrará en la página de compra)"
                className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
              />
              <p className="text-xs text-gray-500 mt-1">
                Texto que se mostrará a los clientes para incluir en la transferencia
              </p>
            </div>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="card p-4 bg-green-500/10 border-green-500">
            <p className="text-green-400 text-sm font-medium">
              ✓ Configuración guardada exitosamente
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="card p-4 bg-red-500/10 border-red-500">
            <p className="text-red-400 text-sm font-medium">{error}</p>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSaving}
            className="btn btn-primary"
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Configuración
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
