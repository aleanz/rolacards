'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Download,
  FileText,
  Calendar,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  Filter,
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface SaleItem {
  productName: string;
  sku: string;
  type: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

interface Sale {
  id: string;
  number: number;
  date: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  user: string;
  userEmail: string;
  itemsCount: number;
  totalItems: number;
  subtotal: number;
  discount: number;
  total: number;
  paymentMethod: string;
  status: string;
  notes: string;
  items: SaleItem[];
}

interface ReportData {
  summary: {
    totalSales: number;
    totalRevenue: number;
    totalDiscounts: number;
    totalItemsSold: number;
    averageTicket: number;
    period: {
      start: string;
      end: string;
    };
  };
  paymentMethodBreakdown: any;
  topProducts: any[];
  salesByDay: any;
  sales: Sale[];
}

export default function ReportesPage() {
  const { data: session } = useSession();
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filterType, setFilterType] = useState<'month' | 'year'>('month');
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchReport();
  }, [filterType, selectedMonth, selectedYear]);

  const fetchReport = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        filterType,
        year: selectedYear.toString(),
      });

      if (filterType === 'month') {
        params.append('month', selectedMonth.toString());
      }

      const response = await fetch(`/api/reports/sales?${params}`);
      if (response.ok) {
        const data = await response.json();
        setReportData(data);
      }
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const downloadExcel = () => {
    if (!reportData) return;

    // Crear hoja de resumen
    const summaryData = [
      ['REPORTE DE VENTAS'],
      [''],
      ['Período', `${new Date(reportData.summary.period.start).toLocaleDateString('es-MX')} - ${new Date(reportData.summary.period.end).toLocaleDateString('es-MX')}`],
      [''],
      ['RESUMEN'],
      ['Total de Ventas', reportData.summary.totalSales],
      ['Ingresos Totales', formatCurrency(reportData.summary.totalRevenue)],
      ['Descuentos Totales', formatCurrency(reportData.summary.totalDiscounts)],
      ['Artículos Vendidos', reportData.summary.totalItemsSold],
      ['Ticket Promedio', formatCurrency(reportData.summary.averageTicket)],
    ];

    // Crear hoja de ventas detalladas
    const salesData = [
      ['# Venta', 'Fecha', 'Cliente', 'Email', 'Teléfono', 'Atendió', 'Items', 'Cantidad Total', 'Subtotal', 'Descuento', 'Total', 'Método de Pago', 'Estado', 'Notas'],
      ...reportData.sales.map(sale => [
        sale.number,
        formatDate(sale.date),
        sale.customerName,
        sale.customerEmail,
        sale.customerPhone,
        sale.user,
        sale.itemsCount,
        sale.totalItems,
        sale.subtotal,
        sale.discount,
        sale.total,
        sale.paymentMethod,
        sale.status,
        sale.notes,
      ]),
    ];

    // Crear hoja de productos más vendidos
    const topProductsData = [
      ['Producto', 'SKU', 'Tipo', 'Cantidad Vendida', 'Ingresos'],
      ...reportData.topProducts.map(product => [
        product.name,
        product.sku,
        product.type,
        product.quantity,
        product.revenue,
      ]),
    ];

    // Crear libro de Excel
    const wb = XLSX.utils.book_new();
    const wsResumen = XLSX.utils.aoa_to_sheet(summaryData);
    const wsVentas = XLSX.utils.aoa_to_sheet(salesData);
    const wsProductos = XLSX.utils.aoa_to_sheet(topProductsData);

    XLSX.utils.book_append_sheet(wb, wsResumen, 'Resumen');
    XLSX.utils.book_append_sheet(wb, wsVentas, 'Ventas');
    XLSX.utils.book_append_sheet(wb, wsProductos, 'Top Productos');

    const fileName = `reporte_ventas_${filterType}_${selectedYear}${filterType === 'month' ? `_${selectedMonth}` : ''}.xlsx`;
    XLSX.writeFile(wb, fileName);
  };

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  if (isLoading || !reportData) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="font-display text-3xl font-bold text-white mb-2">
            Reportes de Ventas
          </h1>
          <p className="text-gray-400">Cargando reporte...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl font-bold text-white mb-2">
          Reportes de Ventas
        </h1>
        <p className="text-gray-400">
          Análisis detallado de ventas con opciones de exportación
        </p>
      </div>

      {/* Filters */}
      <div className="card p-6">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Tipo de Filtro
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setFilterType('month')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterType === 'month'
                    ? 'bg-rola-gold text-rola-black font-semibold'
                    : 'bg-rola-gray/50 text-gray-300 hover:bg-rola-gray'
                }`}
              >
                Mensual
              </button>
              <button
                onClick={() => setFilterType('year')}
                className={`px-4 py-2 rounded-lg transition-colors ${
                  filterType === 'year'
                    ? 'bg-rola-gold text-rola-black font-semibold'
                    : 'bg-rola-gray/50 text-gray-300 hover:bg-rola-gray'
                }`}
              >
                Anual
              </button>
            </div>
          </div>

          {filterType === 'month' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Mes
              </label>
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                className="px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold"
              >
                {months.map((month, index) => (
                  <option key={index} value={index + 1}>
                    {month}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Año
            </label>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-4 py-2 bg-rola-gray/50 border border-rola-gray rounded-lg text-white focus:outline-none focus:border-rola-gold"
            >
              {years.map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={downloadExcel}
            className="ml-auto px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-semibold rounded-lg transition-colors flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Descargar Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-blue-500" />
            </div>
            <span className="text-gray-400 text-sm">Total Ventas</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {reportData.summary.totalSales}
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-green-500/10 flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-green-500" />
            </div>
            <span className="text-gray-400 text-sm">Ingresos</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {formatCurrency(reportData.summary.totalRevenue)}
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Package className="w-6 h-6 text-purple-500" />
            </div>
            <span className="text-gray-400 text-sm">Items Vendidos</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {reportData.summary.totalItemsSold}
          </p>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-lg bg-rola-gold/10 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-rola-gold" />
            </div>
            <span className="text-gray-400 text-sm">Ticket Promedio</span>
          </div>
          <p className="text-3xl font-bold text-white">
            {formatCurrency(reportData.summary.averageTicket)}
          </p>
        </div>
      </div>

      {/* Sales Table */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
          <FileText className="w-5 h-5 text-rola-gold" />
          Detalle de Ventas
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-rola-gray">
                <th className="text-left py-3 px-4 text-gray-400 font-medium">#</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Fecha</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Cliente</th>
                <th className="text-left py-3 px-4 text-gray-400 font-medium">Atendió</th>
                <th className="text-center py-3 px-4 text-gray-400 font-medium">Items</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Subtotal</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Descuento</th>
                <th className="text-right py-3 px-4 text-gray-400 font-medium">Total</th>
                <th className="text-center py-3 px-4 text-gray-400 font-medium">Pago</th>
                <th className="text-center py-3 px-4 text-gray-400 font-medium">Estado</th>
              </tr>
            </thead>
            <tbody>
              {reportData.sales.map((sale) => (
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
                      {formatDate(sale.date)}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div>
                      <p className="text-white text-sm">{sale.customerName}</p>
                      {sale.customerEmail && (
                        <p className="text-gray-500 text-xs">{sale.customerEmail}</p>
                      )}
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-gray-300 text-sm">{sale.user}</span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-white">{sale.totalItems}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-gray-300">{formatCurrency(sale.subtotal)}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-red-400">{formatCurrency(sale.discount)}</span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <span className="text-rola-gold font-semibold">
                      {formatCurrency(sale.total)}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
                    <span className="text-gray-400 text-sm">
                      {sale.paymentMethod === 'CASH' && 'Efectivo'}
                      {sale.paymentMethod === 'CARD' && 'Tarjeta'}
                      {sale.paymentMethod === 'TRANSFER' && 'Transferencia'}
                      {sale.paymentMethod === 'MIXED' && 'Mixto'}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-center">
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {reportData.sales.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <FileText className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <p>No hay ventas en este período</p>
          </div>
        )}
      </div>

      {/* Top Products */}
      {reportData.topProducts.length > 0 && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold text-white mb-6 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-rola-gold" />
            Productos Más Vendidos
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-rola-gray">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">#</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Producto</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">SKU</th>
                  <th className="text-center py-3 px-4 text-gray-400 font-medium">Cantidad</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Ingresos</th>
                </tr>
              </thead>
              <tbody>
                {reportData.topProducts.map((product, index) => (
                  <tr
                    key={index}
                    className="border-b border-rola-gray/50 hover:bg-rola-gray/30 transition-colors"
                  >
                    <td className="py-4 px-4">
                      <span className="text-rola-gold font-bold">{index + 1}</span>
                    </td>
                    <td className="py-4 px-4">
                      <p className="text-white">{product.name}</p>
                      <p className="text-xs text-gray-500">{product.type}</p>
                    </td>
                    <td className="py-4 px-4">
                      <span className="text-gray-400 font-mono text-sm">{product.sku}</span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="text-white font-semibold">{product.quantity}</span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className="text-rola-gold font-semibold">
                        {formatCurrency(product.revenue)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
