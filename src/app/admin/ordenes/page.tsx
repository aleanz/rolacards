'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Package,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Check,
  X,
  Search,
} from 'lucide-react';
import { Prisma } from '@prisma/client';

type Order = {
  id: string;
  orderNumber: number;
  status: string;
  quantity: number;
  unitPrice: Prisma.Decimal;
  total: Prisma.Decimal;
  paymentProofUrl: string | null;
  transferReference: string | null;
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
};

export default function AdminOrdersPage() {
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [rejectionNote, setRejectionNote] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState<'approve' | 'reject' | null>(null);

  useEffect(() => {
    if (sessionStatus === 'unauthenticated') {
      router.push('/auth/signin');
    } else if (sessionStatus === 'authenticated') {
      fetchOrders();
    }
  }, [sessionStatus, selectedStatus]);

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

  const handleApprove = async (order: Order) => {
    setSelectedOrder(order);
    setModalAction('approve');
    setShowModal(true);
  };

  const handleReject = async (order: Order) => {
    setSelectedOrder(order);
    setModalAction('reject');
    setRejectionNote('');
    setShowModal(true);
  };

  const confirmAction = async () => {
    if (!selectedOrder) return;

    setProcessingId(selectedOrder.id);

    try {
      const response = await fetch(`/api/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: modalAction === 'approve' ? 'APPROVED' : 'REJECTED',
          rejectionNote: modalAction === 'reject' ? rejectionNote : undefined,
        }),
      });

      if (response.ok) {
        await fetchOrders();
        setShowModal(false);
        setSelectedOrder(null);
        setRejectionNote('');
      } else {
        const error = await response.json();
        alert(error.error || 'Error al procesar la orden');
      }
    } catch (error) {
      console.error('Error processing order:', error);
      alert('Error al procesar la orden');
    } finally {
      setProcessingId(null);
    }
  };

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      searchTerm === '' ||
      order.orderNumber.toString().includes(searchTerm) ||
      order.User.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.User.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.product?.name.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesSearch;
  });

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (sessionStatus === 'loading' || isLoading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="w-12 h-12 border-4 border-rola-gold border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400">Cargando órdenes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">
          Gestión de Órdenes de Compra
        </h1>
        <p className="text-gray-400">
          Administra las solicitudes de compra de los clientes
        </p>
      </div>

      {/* Search and Filters */}
      <div className="card p-4 space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por número, cliente o producto..."
            className="w-full pl-12 pr-4 py-3 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedStatus('')}
            className={`px-4 py-2 rounded-lg transition-colors ${
              selectedStatus === ''
                ? 'bg-rola-gold text-rola-dark font-semibold'
                : 'bg-rola-gray/50 text-gray-400 hover:text-white'
            }`}
          >
            Todas ({orders.length})
          </button>
          {Object.entries(statusConfig).map(([key, config]) => {
            const count = orders.filter((o) => o.status === key).length;
            return (
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
                {config.label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="text-center py-12 card">
          <Package className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">No se encontraron órdenes</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const config = statusConfig[order.status as keyof typeof statusConfig];
            const StatusIcon = config.icon;
            const isProcessing = processingId === order.id;

            return (
              <div key={order.id} className="card p-6">
                <div className="flex flex-col lg:flex-row gap-6">
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
                      <div
                        className={`px-3 py-1 rounded-lg ${config.bg} ${config.border} border flex items-center gap-2`}
                      >
                        <StatusIcon className={`w-4 h-4 ${config.color}`} />
                        <span className={`text-sm font-medium ${config.color}`}>
                          {config.label}
                        </span>
                      </div>
                    </div>

                    {/* Customer Info */}
                    <div className="bg-rola-gray/30 rounded-lg p-3">
                      <p className="text-sm text-gray-400 mb-1">Cliente</p>
                      <p className="text-white font-medium">{order.User.name}</p>
                      <p className="text-gray-400 text-sm">{order.User.email}</p>
                    </div>

                    {/* Order Details */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
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
                      <div>
                        <span className="text-gray-400">SKU</span>
                        <p className="text-white font-medium">
                          {order.product?.sku || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Rejection Note */}
                    {order.rejectionNote && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <p className="text-red-400 text-sm">
                          <strong>Motivo de rechazo:</strong> {order.rejectionNote}
                        </p>
                        {order.ApprovedByUser && (
                          <p className="text-gray-400 text-xs mt-1">
                            Por: {order.ApprovedByUser.name}
                          </p>
                        )}
                      </div>
                    )}

                    {/* Approved Info */}
                    {order.approvedAt && order.ApprovedByUser && (
                      <p className="text-green-400 text-sm">
                        Aprobada por {order.ApprovedByUser.name} el{' '}
                        {formatDate(order.approvedAt)}
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

                    {/* Actions */}
                    {order.status === 'PENDING' && (
                      <div className="flex gap-3 pt-3 border-t border-rola-gray/30">
                        <button
                          onClick={() => handleApprove(order)}
                          disabled={isProcessing}
                          className="btn btn-primary flex-1"
                        >
                          <Check className="w-4 h-4" />
                          Aprobar
                        </button>
                        <button
                          onClick={() => handleReject(order)}
                          disabled={isProcessing}
                          className="btn btn-outline-red flex-1"
                        >
                          <X className="w-4 h-4" />
                          Rechazar
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-rola-dark-light border border-rola-gray rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold text-white mb-4">
              {modalAction === 'approve' ? 'Aprobar Orden' : 'Rechazar Orden'}
            </h2>

            <div className="mb-4">
              <p className="text-gray-400 mb-2">
                Orden #{selectedOrder.orderNumber}
              </p>
              <p className="text-white font-medium mb-1">
                {selectedOrder.product?.name}
              </p>
              <p className="text-gray-400 text-sm">
                Cliente: {selectedOrder.User.name}
              </p>
            </div>

            {modalAction === 'approve' ? (
              <p className="text-gray-300 mb-6">
                ¿Estás seguro de que deseas aprobar esta orden? Se reducirá el stock
                automáticamente.
              </p>
            ) : (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Motivo del rechazo *
                </label>
                <textarea
                  value={rejectionNote}
                  onChange={(e) => setRejectionNote(e.target.value)}
                  placeholder="Escribe el motivo del rechazo..."
                  rows={4}
                  className="w-full px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-rola-gold transition-colors resize-none"
                />
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedOrder(null);
                  setRejectionNote('');
                }}
                className="btn btn-ghost flex-1"
                disabled={processingId !== null}
              >
                Cancelar
              </button>
              <button
                onClick={confirmAction}
                disabled={
                  processingId !== null ||
                  (modalAction === 'reject' && !rejectionNote.trim())
                }
                className={`btn flex-1 ${
                  modalAction === 'approve' ? 'btn-primary' : 'btn-outline-red'
                }`}
              >
                {processingId ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Procesando...
                  </>
                ) : modalAction === 'approve' ? (
                  'Aprobar'
                ) : (
                  'Rechazar'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
