import { jsPDF } from 'jspdf';

interface SaleData {
  number: number;
  date: Date;
  subtotal: any;
  discount: any;
  tax: any;
  total: any;
  paymentMethod: string;
  customerName?: string | null;
  customerEmail?: string | null;
  customerPhone?: string | null;
  user: {
    name: string;
  };
  items: Array<{
    quantity: number;
    unitPrice: any;
    discount: any;
    total: any;
    product: {
      sku: string;
      name?: string | null;
      cardName?: string | null;
      type: string;
    };
  }>;
}

interface StoreInfo {
  name?: string;
  address?: string;
  city?: string;
  state?: string;
  phone?: string;
  email?: string;
}

export async function generateSaleReceipt(
  sale: SaleData,
  storeInfo: StoreInfo
): Promise<Buffer> {
  const doc = new jsPDF();

  // Configuración de colores
  const primaryColor = [218, 165, 32]; // Dorado #DAA520
  const darkColor = [26, 26, 26]; // Casi negro #1A1A1A
  const grayColor = [107, 114, 128]; // Gris

  let yPos = 20;

  // Header - Logo y nombre de la tienda
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, 210, 40, 'F');

  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(storeInfo.name || 'Rola Cards', 105, 20, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Tu tienda de cartas TCG de confianza', 105, 28, { align: 'center' });

  yPos = 50;

  // Información de la tienda
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.setFontSize(9);
  if (storeInfo.address) {
    doc.text(`${storeInfo.address}, ${storeInfo.city}, ${storeInfo.state}`, 105, yPos, { align: 'center' });
    yPos += 5;
  }
  if (storeInfo.phone || storeInfo.email) {
    doc.text(`Tel: ${storeInfo.phone || 'N/A'} | Email: ${storeInfo.email || 'N/A'}`, 105, yPos, { align: 'center' });
    yPos += 5;
  }

  yPos += 5;

  // Título del comprobante
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('COMPROBANTE DE VENTA', 105, yPos, { align: 'center' });

  yPos += 10;

  // Información de la venta
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  // Columna izquierda
  doc.setFont('helvetica', 'bold');
  doc.text('No. de Venta:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(`#${sale.number.toString().padStart(6, '0')}`, 55, yPos);

  // Columna derecha
  doc.setFont('helvetica', 'bold');
  doc.text('Fecha:', 120, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(new Date(sale.date).toLocaleString('es-MX', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }), 140, yPos);

  yPos += 6;

  doc.setFont('helvetica', 'bold');
  doc.text('Atendió:', 20, yPos);
  doc.setFont('helvetica', 'normal');
  doc.text(sale.user.name, 55, yPos);

  doc.setFont('helvetica', 'bold');
  doc.text('Método de Pago:', 120, yPos);
  doc.setFont('helvetica', 'normal');
  const paymentMethodLabels: Record<string, string> = {
    CASH: 'Efectivo',
    CARD: 'Tarjeta',
    TRANSFER: 'Transferencia',
    MIXED: 'Mixto',
  };
  doc.text(paymentMethodLabels[sale.paymentMethod] || sale.paymentMethod, 160, yPos);

  yPos += 6;

  // Información del cliente (si existe)
  if (sale.customerName) {
    doc.setFont('helvetica', 'bold');
    doc.text('Cliente:', 20, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(sale.customerName, 55, yPos);
    yPos += 6;
  }

  yPos += 5;

  // Línea separadora
  doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.setLineWidth(0.5);
  doc.line(20, yPos, 190, yPos);

  yPos += 8;

  // Tabla de productos - Header
  doc.setFillColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.rect(20, yPos - 5, 170, 8, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.text('SKU', 22, yPos);
  doc.text('Producto', 48, yPos);
  doc.text('Cant.', 120, yPos);
  doc.text('P. Unit.', 140, yPos);
  doc.text('Desc.', 160, yPos);
  doc.text('Total', 180, yPos);

  yPos += 8;

  // Productos
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.setFont('helvetica', 'normal');

  sale.items.forEach((item, index) => {
    // Verificar si necesitamos una nueva página
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    const productName = item.product.cardName || item.product.name || 'Producto';
    const sku = item.product.sku;

    // Fondo alternado para las filas
    if (index % 2 === 0) {
      doc.setFillColor(245, 245, 245);
      doc.rect(20, yPos - 4, 170, 6, 'F');
    }

    doc.setFontSize(8);
    doc.text(sku.substring(0, 15), 22, yPos);

    // Truncar nombre del producto si es muy largo
    const truncatedName = productName.length > 35
      ? productName.substring(0, 35) + '...'
      : productName;
    doc.text(truncatedName, 48, yPos);

    doc.text(item.quantity.toString(), 125, yPos, { align: 'right' });
    doc.text(`$${parseFloat(item.unitPrice).toFixed(2)}`, 155, yPos, { align: 'right' });
    doc.text(`$${parseFloat(item.discount).toFixed(2)}`, 172, yPos, { align: 'right' });
    doc.text(`$${parseFloat(item.total).toFixed(2)}`, 188, yPos, { align: 'right' });

    yPos += 6;
  });

  yPos += 5;

  // Línea separadora
  doc.setDrawColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.line(20, yPos, 190, yPos);

  yPos += 8;

  // Totales
  doc.setFontSize(10);

  // Subtotal
  doc.setFont('helvetica', 'normal');
  doc.text('Subtotal:', 140, yPos);
  doc.text(`$${parseFloat(sale.subtotal).toFixed(2)} MXN`, 188, yPos, { align: 'right' });
  yPos += 6;

  // Descuento (si aplica)
  if (parseFloat(sale.discount) > 0) {
    doc.setTextColor(220, 38, 38); // Rojo para descuento
    doc.text('Descuento:', 140, yPos);
    doc.text(`-$${parseFloat(sale.discount).toFixed(2)} MXN`, 188, yPos, { align: 'right' });
    doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
    yPos += 6;
  }

  // IVA (si aplica)
  if (parseFloat(sale.tax) > 0) {
    doc.text('IVA (16%):', 140, yPos);
    doc.text(`$${parseFloat(sale.tax).toFixed(2)} MXN`, 188, yPos, { align: 'right' });
    yPos += 6;
  }

  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
  doc.rect(135, yPos - 4, 55, 8, 'F');
  doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
  doc.text('TOTAL:', 140, yPos);
  doc.text(`$${parseFloat(sale.total).toFixed(2)} MXN`, 188, yPos, { align: 'right' });

  yPos += 15;

  // Footer
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(grayColor[0], grayColor[1], grayColor[2]);
  doc.text('¡Gracias por tu compra!', 105, yPos, { align: 'center' });
  yPos += 4;
  doc.text('Conserva este comprobante para cualquier aclaración', 105, yPos, { align: 'center' });
  yPos += 4;
  doc.text('Este documento no es válido como factura fiscal', 105, yPos, { align: 'center' });

  // Generar el buffer del PDF
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  return pdfBuffer;
}
