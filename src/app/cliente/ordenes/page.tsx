'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { Package, Clock, CheckCircle, XCircle, Eye } from 'lucide-react';
import { Prisma } from '@prisma/client';

type Order = {
  id: string;
  orderNumber: number;
  status: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
  total: Prisma.Decimal;
  paymentProofUrl: string | null;
  rejectionNote: string | null;
  createdAt: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  User: {
    name: string;
    email: string;
  };
  ApprovedByUser: {
    name: string;
  } | null;
  product: {
    name: string;
    imageUrl: string | null;
    sku: string | null;
  } | null;
};

const statusConfig = {
  PENDING: {
    label: 'Pendiente',
    icon: Clock,
    color: 'text-yellow-500',
    bg: 'bg-yellow-500/10',
    border: 'border-yellow-500/30',
  },
  APPROVED: {
    label: 'Aprobada',
    icon: CheckCircle,
    color: 'text-green-500',
    bg: 'bg-green-500/10',
    border: 'border-green-500/30',
  },
  REJECTED: {
    label: 'Rechazada',
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
  },
  CANCELLED: {
    label: 'Cancelada',
    icon: XCircle,
    color: 'text-gray-500',
    bg: 'bg-gray-500/10',
    border: 'border-gray-500/30',
  },
};

export default function ClientOrdersPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (status === 'authenticated') {
      fetchOrders();
    }
  }, [status, selectedStatus]);

  const fetchOrders = async () => {
    try {
      const params = new URLSearchParams();
      if (selectedStatus) params.append('status', selectedStatus);

      const response = await fetch(`/api/orders?${params.toString()}`);
      if (response.ok) {
        const data = await response.json();
        setOrders(data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (status === 'loading' || isLoading) {
    return (
      <>
        <Header />
        <main className="min-h-screen pt-20">
          <div className="section">
            <div className="container-custom">
              <div className="text-center py-12 card">
                <div className="w-12 h-12 border-4 border-rola-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-400">Cargando órdenes...</p>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-20">
        <div className="section">
          <div className="container-custom max-w-6xl">
            {/* Header */}
            <div className="mb-6">
              <h1 className="font-display text-3xl font-bold text-white mb-2">
                Mis <span className="text-gradient">Órdenes</span>
              </h1>
              <p className="text-gray-400">
                Consulta el estado de tus solicitudes de compra
              </p>
            </div>

            {/* Filters */}
            <div className="card p-4 mb-6">
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedStatus('')}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedStatus === ''
                      ? 'bg-rola-gold text-rola-dark font-semibold'
                      : 'bg-rola-gray/50 text-gray-400 hover:text-white'
                  }`}
                >
                  Todas
                </button>
                {Object.entries(statusConfig).map(([key, config]) => (
                  <button
                    key={key}
                    onClick={() => setSelectedStatus(key)}
                    className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                      selectedStatus === key
                        ? 'bg-rola-gold text-rola-dark font-semibold'
                        : 'bg-rola-gray/50 text-gray-400 hover:text-white'
                    }`}
                  >
                    <config.icon className="w-4 h-4" />
                    {config.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Orders List */}
            {orders.length === 0 ? (
              <div className="text-center py-12 card">
                <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">No tienes órdenes</p>
              </div>
            ) : (
              <div className="space-y-4">
                {orders.map((order) => {
                  const config = statusConfig[order.status as keyof typeof statusConfig];
                  const StatusIcon = config.icon;

                  return (
                    <div key={order.id} className="card p-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* Product Image */}
                        <div className="flex-shrink-0">
                          <div className="w-24 h-32 bg-rola-gray/30 rounded-lg overflow-hidden">
                            {order.product?.imageUrl ? (
                              <img
                                src={order.product.imageUrl}
                                alt={order.product.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Package className="w-8 h-8 text-gray-600" />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Order Info */}
                        <div className="flex-1 space-y-3">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-white font-semibold text-lg mb-1">
                                {order.product?.name}
                              </h3>
                              <p className="text-gray-400 text-sm">
                                Orden #{order.orderNumber}
                              </p>
                            </div>
                            <div className={`px-3 py-1 rounded-lg ${config.bg} ${config.border} border flex items-center gap-2`}>
                              <StatusIcon className={`w-4 h-4 ${config.color}`} />
                              <span className={`text-sm font-medium ${config.color}`}>
                                {config.label}
                              </span>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-gray-400">Cantidad</span>
                              <p className="text-white font-medium">{order.quantity}</p>
                            </div>
                            <div>
                              <span className="text-gray-400">Precio unitario</span>
                              <p className="text-white font-medium">
                                ${parseFloat(order.unitPrice.toString()).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-400">Total</span>
                              <p className="text-rola-gold font-bold text-lg">
                                ${parseFloat(order.total.toString()).toFixed(2)}
                              </p>
                            </div>
                            <div>
                              <span className="text-gray-400">Fecha</span>
                              <p className="text-white font-medium">
                                {new Date(order.createdAt).toLocaleDateString('es-MX')}
                              </p>
                            </div>
                          </div>

                          {order.rejectionNote && (
                            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                              <p className="text-red-400 text-sm">
                                <strong>Motivo de rechazo:</strong> {order.rejectionNote}
                              </p>
                            </div>
                          )}

                          {order.approvedAt && (
                            <p className="text-green-400 text-sm">
                              Aprobada el {formatDate(order.approvedAt)}
                            </p>
                          )}

                          {/* Payment Proof */}
                          {order.paymentProofUrl && (
                            <div>
                              <a
                                href={order.paymentProofUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 text-rola-gold hover:text-rola-gold/80 transition-colors text-sm"
                              >
                                <Eye className="w-4 h-4" />
                                Ver comprobante de pago
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
