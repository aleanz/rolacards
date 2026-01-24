'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import {
  Package,
  ArrowLeft,
  ShoppingCart,
  AlertCircle,
  Upload,
  CheckCircle
} from 'lucide-react';
import { Prisma } from '@prisma/client';

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: Prisma.Decimal;
  stock: number;
  sku: string | null;
  cardCode: string | null;
  category: string;
  condition: string | null;
  rarity: string | null;
  imageUrl: string | null;
  active: boolean;
};

const categories: Record<string, string> = {
  'YU_GI_OH': 'Yu-Gi-Oh!',
  'POKEMON': 'Pokémon',
  'MAGIC': 'Magic: The Gathering',
  'ACCESSORIES': 'Accesorios',
  'SEALED': 'Producto Sellado',
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [paymentProof, setPaymentProof] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Bank settings
  const [bankName, setBankName] = useState('');
  const [accountHolder, setAccountHolder] = useState('');
  const [clabe, setClabe] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankReference, setBankReference] = useState('');

  useEffect(() => {
    if (params.id) {
      fetchProduct();
      fetchBankSettings();
    }
  }, [params.id]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/inventory/${params.id}`);
      if (response.ok) {
        const data = await response.json();
        setProduct(data);
      } else {
        router.push('/catalogo');
      }
    } catch (error) {
      console.error('Error fetching product:', error);
      router.push('/catalogo');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBankSettings = async () => {
    try {
      const response = await fetch('/api/settings');
      if (response.ok) {
        const data = await response.json();
        // Si es un array, convertirlo a objeto
        if (Array.isArray(data)) {
          const settingsObj = data.reduce((acc, setting) => {
            acc[setting.key] = setting.value;
            return acc;
          }, {} as Record<string, string>);
          setBankName(settingsObj.bank_name || '');
          setAccountHolder(settingsObj.bank_account_holder || '');
          setClabe(settingsObj.bank_clabe || '');
          setAccountNumber(settingsObj.bank_account_number || '');
          setBankReference(settingsObj.bank_reference || '');
        } else {
          // Si ya es un objeto
          setBankName(data.bank_name || '');
          setAccountHolder(data.bank_account_holder || '');
          setClabe(data.bank_clabe || '');
          setAccountNumber(data.bank_account_number || '');
          setBankReference(data.bank_reference || '');
        }
      }
    } catch (error) {
      console.error('Error fetching bank settings:', error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validar que sea una imagen
      if (!file.type.startsWith('image/')) {
        setError('Solo se permiten archivos de imagen');
        return;
      }
      // Validar tamaño (máximo 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('El archivo es demasiado grande. Máximo 5MB');
        return;
      }
      setPaymentProof(file);
      setError('');
    }
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!session) {
      setError('Debes iniciar sesión para realizar una compra');
      return;
    }

    if (!paymentProof) {
      setError('Debes adjuntar el comprobante de pago');
      return;
    }

    if (quantity < 1 || quantity > product!.stock) {
      setError(`La cantidad debe estar entre 1 y ${product!.stock}`);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      // Subir comprobante de pago
      const formData = new FormData();
      formData.append('file', paymentProof);
      formData.append('type', 'payments');

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadResponse.ok) {
        throw new Error('Error al subir el comprobante de pago');
      }

      const { url: paymentProofUrl } = await uploadResponse.json();

      // Crear orden
      const orderResponse = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product!.id,
          quantity,
          paymentProofUrl,
        }),
      });

      if (!orderResponse.ok) {
        const errorData = await orderResponse.json();
        console.error('Error response:', errorData);
        throw new Error(errorData.error || errorData.details || 'Error al crear la orden');
      }

      setSuccess(true);
      setPaymentProof(null);
      setQuantity(1);

      // Redirigir a mis órdenes después de 3 segundos
      setTimeout(() => {
        router.push('/cliente/ordenes');
      }, 3000);
    } catch (err) {
      console.error('Error completo:', err);
      setError(err instanceof Error ? err.message : 'Error al procesar la orden');
    } finally {
      setIsSubmitting(false);
    }
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
                <p className="text-gray-400">Cargando producto...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!product) {
    return null;
  }

  const total = parseFloat(product.price.toString()) * quantity;

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <div className="section">
          <div className="container-custom max-w-6xl">
            {/* Back Button */}
            <button
              onClick={() => router.back()}
              className="btn btn-ghost mb-6 inline-flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver al catálogo
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Product Image */}
              <div className="card p-6">
                <div className="aspect-[3/4] bg-rola-gray/30 rounded-lg overflow-hidden mb-4">
                  {product.imageUrl ? (
                    <img
                      src={product.imageUrl}
                      alt={product.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-24 h-24 text-gray-600" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">SKU</span>
                    <span className="text-white">{product.sku || 'N/A'}</span>
                  </div>
                  {product.cardCode && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Código</span>
                      <span className="text-white">{product.cardCode}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400 text-sm">Categoría</span>
                    <span className="text-white">{categories[product.category] || product.category}</span>
                  </div>
                  {product.rarity && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Rareza</span>
                      <span className="px-2 py-1 bg-rola-purple/20 text-rola-purple-light text-sm rounded">
                        {product.rarity}
                      </span>
                    </div>
                  )}
                  {product.condition && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">Condición</span>
                      <span className="text-white">{product.condition}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between pt-2 border-t border-rola-gray/30">
                    <span className="text-gray-400 text-sm">Stock disponible</span>
                    <span className={`font-bold ${product.stock <= 5 ? 'text-rola-red' : 'text-rola-green'}`}>
                      {product.stock} unidades
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Form */}
              <div className="space-y-6">
                <div>
                  <h1 className="font-display text-3xl font-bold text-white mb-4">
                    {product.name}
                  </h1>
                  {product.description && (
                    <p className="text-gray-300 mb-6">{product.description}</p>
                  )}
                  <div className="text-4xl font-bold text-rola-gold mb-6">
                    ${parseFloat(product.price.toString()).toFixed(2)}
                  </div>
                </div>

                {success ? (
                  <div className="card p-6 bg-rola-green/10 border-rola-green">
                    <div className="flex items-start gap-4">
                      <CheckCircle className="w-6 h-6 text-rola-green flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="text-rola-green font-bold mb-2">¡Orden creada exitosamente!</h3>
                        <p className="text-gray-300 text-sm mb-2">
                          Tu orden ha sido enviada y está pendiente de aprobación.
                        </p>
                        <p className="text-gray-400 text-sm">
                          Recibirás un correo electrónico cuando sea aprobada o rechazada.
                          Redirigiendo a tus órdenes...
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitOrder} className="card p-6 space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-4">Realizar compra</h2>
                      <p className="text-gray-400 text-sm">
                        El pago debe realizarse mediante transferencia bancaria. Por favor, adjunta el comprobante de pago.
                      </p>
                    </div>

                    {/* Bank Information */}
                    {clabe && (
                      <div className="bg-rola-gold/10 border border-rola-gold/30 rounded-lg p-4 space-y-3">
                        <h3 className="text-rola-gold font-semibold text-sm mb-3">
                          Datos para transferencia:
                        </h3>
                        <div className="space-y-2 text-sm">
                          {bankName && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Banco:</span>
                              <span className="text-white font-medium">{bankName}</span>
                            </div>
                          )}
                          {accountHolder && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Titular:</span>
                              <span className="text-white font-medium">{accountHolder}</span>
                            </div>
                          )}
                          <div className="flex justify-between items-center pt-2 border-t border-rola-gold/20">
                            <span className="text-gray-400">CLABE:</span>
                            <span className="text-rola-gold font-bold font-mono text-base">{clabe}</span>
                          </div>
                          {accountNumber && (
                            <div className="flex justify-between">
                              <span className="text-gray-400">Cuenta:</span>
                              <span className="text-white font-mono">{accountNumber}</span>
                            </div>
                          )}
                          {bankReference && (
                            <div className="pt-2 border-t border-rola-gold/20">
                              <span className="text-gray-400 text-xs">Referencia:</span>
                              <p className="text-white mt-1">{bankReference}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {!session && (
                      <div className="bg-rola-red/10 border border-rola-red rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-rola-red flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-rola-red font-medium">Debes iniciar sesión</p>
                          <p className="text-sm text-gray-400 mt-1">
                            Para realizar una compra, necesitas{' '}
                            <button
                              type="button"
                              onClick={() => router.push('/auth/signin')}
                              className="text-rola-gold hover:underline"
                            >
                              iniciar sesión
                            </button>
                          </p>
                        </div>
                      </div>
                    )}

                    {product.stock === 0 ? (
                      <div className="bg-rola-red/10 border border-rola-red rounded-lg p-4 flex items-start gap-3">
                        <AlertCircle className="w-5 h-5 text-rola-red flex-shrink-0 mt-0.5" />
                        <p className="text-rola-red font-medium">Producto agotado</p>
                      </div>
                    ) : (
                      <>
                        {/* Quantity */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Cantidad
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={product.stock}
                            value={quantity}
                            onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
                            className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold transition-colors"
                            disabled={!session}
                          />
                          <p className="text-sm text-gray-400 mt-1">
                            Disponible: {product.stock} unidades
                          </p>
                        </div>

                        {/* Payment Proof Upload */}
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-2">
                            Comprobante de pago *
                          </label>
                          <div className="relative">
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="hidden"
                              id="payment-proof"
                              disabled={!session}
                            />
                            <label
                              htmlFor="payment-proof"
                              className={`flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed rounded-lg transition-colors cursor-pointer ${
                                session
                                  ? 'border-rola-gray hover:border-rola-gold text-gray-400 hover:text-rola-gold'
                                  : 'border-rola-gray/50 text-gray-600 cursor-not-allowed'
                              }`}
                            >
                              <Upload className="w-5 h-5" />
                              <span className="text-sm">
                                {paymentProof ? paymentProof.name : 'Seleccionar comprobante'}
                              </span>
                            </label>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            Formato: JPG, PNG. Tamaño máximo: 5MB
                          </p>
                        </div>

                        {/* Total */}
                        <div className="pt-4 border-t border-rola-gray/30">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-gray-400">Subtotal</span>
                            <span className="text-white">${total.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xl font-bold">
                            <span className="text-white">Total</span>
                            <span className="text-rola-gold">${total.toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Error Message */}
                        {error && (
                          <div className="bg-rola-red/10 border border-rola-red rounded-lg p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-rola-red flex-shrink-0 mt-0.5" />
                            <p className="text-rola-red text-sm">{error}</p>
                          </div>
                        )}

                        {/* Submit Button */}
                        <button
                          type="submit"
                          disabled={!session || isSubmitting || product.stock === 0}
                          className="btn btn-primary w-full"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Procesando...
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="w-5 h-5" />
                              Enviar solicitud de compra
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
