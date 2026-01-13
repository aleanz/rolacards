'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  ShoppingCart,
  Trash2,
  FileText,
  DollarSign,
  CreditCard,
  X,
  Download,
  Eye,
  Calendar,
  User,
  Package,
} from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name?: string;
  cardName?: string;
  price: number;
  stock: number;
  imageUrl?: string;
  type: string;
}

interface CartItem {
  product: Product;
  quantity: number;
  discount: number;
}

interface Sale {
  id: string;
  number: number;
  date: string;
  total: number;
  paymentMethod: string;
  status: string;
  customerName?: string;
  user: {
    name: string;
  };
  items: Array<{
    quantity: number;
    total: number;
    product: {
      name?: string;
      cardName?: string;
      sku: string;
    };
  }>;
}

export default function VentasPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [activeView, setActiveView] = useState<'new' | 'history'>('new');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoadingSales, setIsLoadingSales] = useState(false);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  // Campos de la venta
  const [paymentMethod, setPaymentMethod] = useState('CASH');
  const [discount, setDiscount] = useState(0);
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');

  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/login');
    }
  }, [status, router]);

  useEffect(() => {
    if (activeView === 'history') {
      loadSales();
    }
  }, [activeView]);

  const loadSales = async () => {
    setIsLoadingSales(true);
    try {
      const response = await fetch('/api/sales?limit=50');
      if (response.ok) {
        const data = await response.json();
        setSales(data);
      }
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setIsLoadingSales(false);
    }
  };

  const searchProducts = async (term: string) => {
    if (!term.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/inventory?search=${encodeURIComponent(term)}&active=true`
      );
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data);
      }
    } catch (error) {
      console.error('Error searching products:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);

    // Limpiar el timeout anterior
    if (searchTimeout) {
      clearTimeout(searchTimeout);
    }

    // Si el campo está vacío, limpiar resultados inmediatamente
    if (!value.trim()) {
      setSearchResults([]);
      return;
    }

    // Establecer un nuevo timeout para buscar después de 300ms
    const newTimeout = setTimeout(() => {
      searchProducts(value);
    }, 300);

    setSearchTimeout(newTimeout);
  };

  // Función para calcular el stock disponible (stock total - cantidad en carrito)
  const getAvailableStock = (productId: string, productStock: number) => {
    const cartItem = cart.find((item) => item.product.id === productId);
    return cartItem ? productStock - cartItem.quantity : productStock;
  };

  const addToCart = (product: Product) => {
    const existingItem = cart.find((item) => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.stock) {
        setError(`Stock máximo alcanzado para ${product.cardName || product.name}`);
        return;
      }
      setCart(
        cart.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      setCart([...cart, { product, quantity: 1, discount: 0 }]);
    }

    setSearchTerm('');
    setSearchResults([]);
    setError('');
  };

  const updateQuantity = (productId: string, quantity: number) => {
    const item = cart.find((i) => i.product.id === productId);
    if (!item) return;

    if (quantity > item.product.stock) {
      setError(`Stock máximo: ${item.product.stock}`);
      return;
    }

    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }

    setCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
    setError('');
  };

  const updateDiscount = (productId: string, discount: number) => {
    setCart(
      cart.map((item) =>
        item.product.id === productId ? { ...item, discount: Math.max(0, discount) } : item
      )
    );
  };

  const removeFromCart = (productId: string) => {
    setCart(cart.filter((item) => item.product.id !== productId));
  };

  const clearCart = () => {
    setCart([]);
    setDiscount(0);
    setCustomerName('');
    setCustomerEmail('');
    setCustomerPhone('');
    setNotes('');
    setError('');
    setSuccess('');
  };

  const calculateSubtotal = () => {
    return cart.reduce((sum, item) => {
      const itemTotal = parseFloat(item.product.price.toString()) * item.quantity - item.discount;
      return sum + itemTotal;
    }, 0);
  };

  const calculateTotal = () => {
    return Math.max(0, calculateSubtotal() - discount);
  };

  const processSale = async () => {
    if (cart.length === 0) {
      setError('Agrega al menos un producto al carrito');
      return;
    }

    setIsProcessing(true);
    setError('');
    setSuccess('');

    try {
      const saleData = {
        items: cart.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          discount: item.discount,
        })),
        paymentMethod,
        discount,
        customerName: customerName || undefined,
        customerEmail: customerEmail || undefined,
        customerPhone: customerPhone || undefined,
        notes: notes || undefined,
      };

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(saleData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar la venta');
      }

      setSuccess(`¡Venta #${data.number} procesada exitosamente!`);

      // Descargar comprobante automáticamente
      setTimeout(() => {
        window.open(`/api/sales/${data.id}/pdf`, '_blank');
      }, 500);

      // Limpiar carrito
      setTimeout(() => {
        clearCart();
        setSuccess('');
      }, 3000);
    } catch (error: any) {
      setError(error.message || 'Error al procesar la venta');
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadPDF = (saleId: string) => {
    window.open(`/api/sales/${saleId}/pdf`, '_blank');
  };

  if (status === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-white">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rola-darker p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-white mb-2">Punto de Venta</h1>
          <p className="text-gray-400">Registra ventas y genera comprobantes</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveView('new')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
              activeView === 'new'
                ? 'bg-rola-gold text-rola-black font-semibold'
                : 'bg-rola-gray/50 text-gray-300 hover:bg-rola-gray'
            }`}
          >
            <ShoppingCart className="w-5 h-5" />
            Nueva Venta
          </button>
          <button
            onClick={() => setActiveView('history')}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
              activeView === 'history'
                ? 'bg-rola-gold text-rola-black font-semibold'
                : 'bg-rola-gray/50 text-gray-300 hover:bg-rola-gray'
            }`}
          >
            <FileText className="w-5 h-5" />
            Historial
          </button>
        </div>

        {/* Nueva Venta */}
        {activeView === 'new' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Columna izquierda - Búsqueda y productos */}
            <div className="lg:col-span-2 space-y-6">
              {/* Búsqueda de productos */}
              <div className="bg-rola-gray/30 rounded-lg p-6 border border-rola-gray">
                <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                  <Search className="w-5 h-5 text-rola-gold" />
                  Buscar Productos
                </h2>

                <div className="mb-4">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => handleSearchChange(e.target.value)}
                    placeholder="Buscar por nombre, SKU o código de carta..."
                    className="w-full px-4 py-3 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold"
                  />
                  {isSearching && (
                    <p className="text-sm text-gray-400 mt-2">Buscando...</p>
                  )}
                </div>

                {/* Resultados de búsqueda */}
                {searchResults.length > 0 && (
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {searchResults.map((product) => (
                      <div
                        key={product.id}
                        onClick={() => addToCart(product)}
                        className="flex items-center gap-4 p-3 bg-rola-gray/50 rounded-lg hover:bg-rola-gray cursor-pointer transition-colors"
                      >
                        {product.imageUrl && (
                          <img
                            src={product.imageUrl}
                            alt={product.cardName || product.name}
                            className="w-16 h-20 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-white font-medium">
                            {product.cardName || product.name}
                          </p>
                          <p className="text-sm text-gray-400">SKU: {product.sku}</p>
                          <p className="text-sm text-gray-400">
                            Stock disponible: {getAvailableStock(product.id, product.stock)} / {product.stock} unidades
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-rola-gold">
                            ${parseFloat(product.price.toString()).toFixed(2)} MXN
                          </p>
                          <button className="text-sm text-rola-gold hover:text-rola-gold-light">
                            <Plus className="w-4 h-4 inline" /> Agregar
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Carrito */}
              <div className="bg-rola-gray/30 rounded-lg p-6 border border-rola-gray">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-white flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-rola-gold" />
                    Carrito ({cart.length})
                  </h2>
                  {cart.length > 0 && (
                    <button
                      onClick={clearCart}
                      className="text-red-400 hover:text-red-300 text-sm flex items-center gap-1"
                    >
                      <Trash2 className="w-4 h-4" />
                      Limpiar
                    </button>
                  )}
                </div>

                {cart.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <ShoppingCart className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p>El carrito está vacío</p>
                    <p className="text-sm">Busca y agrega productos para comenzar</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {cart.map((item) => (
                      <div
                        key={item.product.id}
                        className="flex items-center gap-4 p-4 bg-rola-gray/50 rounded-lg"
                      >
                        {item.product.imageUrl && (
                          <img
                            src={item.product.imageUrl}
                            alt={item.product.cardName || item.product.name}
                            className="w-12 h-16 object-cover rounded"
                          />
                        )}
                        <div className="flex-1">
                          <p className="text-white font-medium">
                            {item.product.cardName || item.product.name}
                          </p>
                          <p className="text-sm text-gray-400">
                            ${parseFloat(item.product.price.toString()).toFixed(2)} MXN c/u
                          </p>
                          <p className="text-xs text-gray-500">
                            Stock restante: {item.product.stock - item.quantity} de {item.product.stock}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <label className="text-xs text-gray-400">Cantidad:</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) =>
                                updateQuantity(item.product.id, parseInt(e.target.value) || 0)
                              }
                              min="1"
                              max={item.product.stock}
                              className="w-20 px-2 py-1 bg-rola-gray border border-rola-gray rounded text-white text-sm"
                            />
                            <label className="text-xs text-gray-400 ml-2">Desc:</label>
                            <input
                              type="number"
                              value={item.discount === 0 ? '' : item.discount}
                              onChange={(e) => {
                                const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                                updateDiscount(item.product.id, isNaN(value) ? 0 : value);
                              }}
                              min="0"
                              step="0.01"
                              className="w-24 px-2 py-1 bg-rola-gray border border-rola-gray rounded text-white text-sm"
                              placeholder="0.00"
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-rola-gold">
                            ${(parseFloat(item.product.price.toString()) * item.quantity - item.discount).toFixed(2)}
                          </p>
                          <button
                            onClick={() => removeFromCart(item.product.id)}
                            className="text-red-400 hover:text-red-300 text-sm mt-2"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Columna derecha - Resumen y pago */}
            <div className="space-y-6">
              {/* Información del cliente */}
              <div className="bg-rola-gray/30 rounded-lg p-6 border border-rola-gray">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <User className="w-5 h-5 text-rola-gold" />
                  Cliente (Opcional)
                </h3>
                <div className="space-y-3">
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="Nombre"
                    className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold"
                  />
                  <input
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="Email"
                    className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold"
                  />
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="Teléfono"
                    className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold"
                  />
                </div>
              </div>

              {/* Resumen de pago */}
              <div className="bg-rola-gray/30 rounded-lg p-6 border border-rola-gray">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-rola-gold" />
                  Resumen
                </h3>

                <div className="space-y-3">
                  <div className="flex justify-between text-gray-300">
                    <span>Subtotal:</span>
                    <span>${calculateSubtotal().toFixed(2)} MXN</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <label className="text-gray-300 text-sm">Descuento:</label>
                    <input
                      type="number"
                      value={discount === 0 ? '' : discount}
                      onChange={(e) => {
                        const value = e.target.value === '' ? 0 : parseFloat(e.target.value);
                        setDiscount(isNaN(value) ? 0 : value);
                      }}
                      min="0"
                      step="0.01"
                      className="flex-1 px-3 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white"
                      placeholder="0.00"
                    />
                  </div>

                  <div className="border-t border-rola-gray pt-3">
                    <div className="flex justify-between text-xl font-bold">
                      <span className="text-white">Total:</span>
                      <span className="text-rola-gold">${calculateTotal().toFixed(2)} MXN</span>
                    </div>
                  </div>

                  <div className="pt-3">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Método de Pago
                    </label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                      className="w-full px-4 py-3 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold"
                    >
                      <option value="CASH">Efectivo</option>
                      <option value="CARD">Tarjeta</option>
                      <option value="TRANSFER">Transferencia</option>
                      <option value="MIXED">Mixto</option>
                    </select>
                  </div>

                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Notas adicionales..."
                    rows={3}
                    className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold resize-none"
                  />

                  {error && (
                    <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
                      {error}
                    </div>
                  )}

                  {success && (
                    <div className="p-3 bg-green-500/20 border border-green-500 rounded-lg text-green-400 text-sm">
                      {success}
                    </div>
                  )}

                  <button
                    onClick={processSale}
                    disabled={isProcessing || cart.length === 0}
                    className="w-full py-4 bg-rola-gold text-rola-black font-bold rounded-lg hover:bg-rola-gold-light transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CreditCard className="w-5 h-5" />
                    {isProcessing ? 'Procesando...' : 'Procesar Venta'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Historial de Ventas */}
        {activeView === 'history' && (
          <div className="bg-rola-gray/30 rounded-lg p-6 border border-rola-gray">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
              <FileText className="w-5 h-5 text-rola-gold" />
              Historial de Ventas
            </h2>

            {isLoadingSales ? (
              <div className="text-center py-12 text-gray-400">Cargando ventas...</div>
            ) : sales.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
                <p>No hay ventas registradas</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-rola-gray">
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">#</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Fecha</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Cliente</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Atendió</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Items</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Pago</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Total</th>
                      <th className="text-left py-3 px-4 text-gray-400 font-medium">Estado</th>
                      <th className="text-center py-3 px-4 text-gray-400 font-medium">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.map((sale) => (
                      <tr
                        key={sale.id}
                        className="border-b border-rola-gray/50 hover:bg-rola-gray/30 transition-colors"
                      >
                        <td className="py-4 px-4">
                          <span className="text-white font-mono">
                            #{sale.number.toString().padStart(6, '0')}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-300 text-sm">
                            {new Date(sale.date).toLocaleString('es-MX', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-300">
                            {sale.customerName || '-'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-300">{sale.user.name}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-300">{sale.items.length}</span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-gray-400 text-sm">
                            {sale.paymentMethod === 'CASH' && 'Efectivo'}
                            {sale.paymentMethod === 'CARD' && 'Tarjeta'}
                            {sale.paymentMethod === 'TRANSFER' && 'Transferencia'}
                            {sale.paymentMethod === 'MIXED' && 'Mixto'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span className="text-rola-gold font-semibold">
                            ${parseFloat(sale.total.toString()).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              sale.status === 'COMPLETED'
                                ? 'bg-green-500/20 text-green-400'
                                : sale.status === 'CANCELLED'
                                ? 'bg-red-500/20 text-red-400'
                                : 'bg-yellow-500/20 text-yellow-400'
                            }`}
                          >
                            {sale.status === 'COMPLETED' && 'Completada'}
                            {sale.status === 'CANCELLED' && 'Cancelada'}
                            {sale.status === 'PENDING' && 'Pendiente'}
                          </span>
                        </td>
                        <td className="py-4 px-4">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => downloadPDF(sale.id)}
                              className="p-2 text-rola-gold hover:bg-rola-gray rounded transition-colors"
                              title="Descargar PDF"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
