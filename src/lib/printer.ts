import { Order, OrderItem } from './db/schema';
import { formatRupiah, formatDateTime } from './formatters';
import { dbStore } from './db/store';

export class ThermalPrinterFormatter {
  /**
   * Format ESC/POS Receipt for Customer (58mm or 80mm)
   */
  public static generateCustomerReceipt(
    order: Order,
    items: OrderItem[],
    cashierName: string = 'Kasir Kopi Noka',
    paperWidth: '58mm' | '80mm' = '58mm'
  ): string {
    const colWidth = paperWidth === '58mm' ? 32 : 48;
    const separator = '-'.repeat(colWidth);
    const doubleSep = '='.repeat(colWidth);

    const outletName = dbStore.getAppSetting('outlet_name', 'KOPI NOKA');
    const outletSub = dbStore.getAppSetting('outlet_subname', 'Specialty Coffee & Brew Bar');
    const outletAddress = dbStore.getAppSetting('outlet_address', 'Jl. Pengayoman No. 12B, Makassar');
    const outletPhone = dbStore.getAppSetting('outlet_phone', '+62 811-4567-8901');

    let text = '';
    text += this.centerText(outletName.toUpperCase(), colWidth) + '\n';
    text += this.centerText(outletSub, colWidth) + '\n';
    text += this.centerText(outletAddress, colWidth) + '\n';
    text += this.centerText(`Telp: ${outletPhone}`, colWidth) + '\n';
    text += doubleSep + '\n';

    text += `No. Pesanan : ${order.orderNumber}\n`;
    text += `Waktu       : ${formatDateTime(order.createdAt)}\n`;
    text += `Kasir       : ${cashierName}\n`;
    text += `Sumber      : ${order.source === 'POS' ? 'KASIR (DINE-IN/TAKEAWAY)' : 'ONLINE ORDER'}\n`;
    if (order.tableNumber) {
      text += `Meja        : ${order.tableNumber}\n`;
    }
    if (order.customerName) {
      text += `Pelanggan   : ${order.customerName}\n`;
    }
    text += separator + '\n';

    // Item List
    for (const item of items) {
      text += `${item.productNameSnapshot}\n`;
      const qtyAndPrice = `  ${item.quantity}x @${formatRupiah(item.unitPriceSnapshot)}`;
      const lineTotal = formatRupiah(item.lineTotal);
      text += this.justifyText(qtyAndPrice, lineTotal, colWidth) + '\n';

      if (item.customizationSnapshot) {
        let customText = '';
        if (typeof item.customizationSnapshot === 'string') {
          customText = item.customizationSnapshot;
        } else {
          const c = item.customizationSnapshot;
          const parts = [];
          if (c.size) parts.push(c.size);
          if (c.sugarLevel) parts.push(c.sugarLevel);
          if (c.iceLevel) parts.push(c.iceLevel);
          if (c.toppings && c.toppings.length) parts.push(c.toppings.join(', '));
          customText = parts.join(' | ');
        }
        if (customText) {
          text += `  * ${customText}\n`;
        }
      }
      if (item.notes) {
        text += `  Catatan: ${item.notes}\n`;
      }
    }

    text += separator + '\n';
    text += this.justifyText('Subtotal', formatRupiah(order.subtotal), colWidth) + '\n';
    if (order.discountAmount > 0) {
      text += this.justifyText('Diskon', `-${formatRupiah(order.discountAmount)}`, colWidth) + '\n';
    }
    text += doubleSep + '\n';
    text += this.justifyText('TOTAL AKHIR', formatRupiah(order.totalAmount), colWidth) + '\n';

    // Payment Info
    if (order.payments && order.payments.length > 0) {
      const p = order.payments[0];
      text += this.justifyText(`Metode (${p.method})`, formatRupiah(p.amount), colWidth) + '\n';
      if (p.method === 'CASH' && p.receivedAmount) {
        text += this.justifyText('Tunai Diterima', formatRupiah(p.receivedAmount), colWidth) + '\n';
        text += this.justifyText('Kembalian', formatRupiah(p.changeAmount || 0), colWidth) + '\n';
      }
      text += `Status Pembayaran: ${p.status === 'PAID' ? 'LUNAS (PAID)' : p.status}\n`;
    }

    text += doubleSep + '\n';
    text += this.centerText('TERIMA KASIH ATAS KUNJUNGAN ANDA', colWidth) + '\n';
    text += this.centerText('Nikmati Setiap Tetes Kopi Noka', colWidth) + '\n';
    text += this.centerText('Instagram: @kopinoka.official', colWidth) + '\n\n\n';

    return text;
  }

  /**
   * Format ESC/POS Ticket for Barista (80mm or 58mm)
   * High readability, prominent order number, zero payment info
   */
  public static generateBaristaTicket(
    order: Order,
    items: OrderItem[],
    paperWidth: '58mm' | '80mm' = '80mm'
  ): string {
    const colWidth = paperWidth === '58mm' ? 32 : 48;
    const separator = '*'.repeat(colWidth);
    const lineSep = '-'.repeat(colWidth);

    let text = '';
    text += separator + '\n';
    text += this.centerText('=== TIKET BARISTA (KITCHEN) ===', colWidth) + '\n';
    text += this.centerText(`ORDER: ${order.orderNumber}`, colWidth) + '\n';
    text += separator + '\n';

    text += `Waktu  : ${formatDateTime(order.createdAt)}\n`;
    text += `Sumber : ${order.source === 'POS' ? 'KASIR' : 'ONLINE PELANGGAN'}\n`;
    if (order.tableNumber) {
      text += `MEJA   : >>> ${order.tableNumber} <<<\n`;
    }
    if (order.customerName) {
      text += `Nama   : ${order.customerName}\n`;
    }
    text += lineSep + '\n';

    // Items with large emphasis on modifiers
    items.forEach((item, index) => {
      text += `[${index + 1}] >>> ${item.quantity}x ${item.productNameSnapshot} <<<\n`;
      if (item.variantSnapshot) {
        text += `    VARIAN: ${item.variantSnapshot}\n`;
      }
      if (item.customizationSnapshot) {
        if (typeof item.customizationSnapshot === 'string') {
          text += `    MODIF : ${item.customizationSnapshot}\n`;
        } else {
          const c = item.customizationSnapshot;
          if (c.size) text += `    UKURAN: ${c.size}\n`;
          if (c.sugarLevel) text += `    GULA  : ${c.sugarLevel}\n`;
          if (c.iceLevel) text += `    ES    : ${c.iceLevel}\n`;
          if (c.toppings && c.toppings.length) text += `    TOPPING: ${c.toppings.join(', ')}\n`;
        }
      }
      if (item.notes) {
        text += `    CATATAN: ** ${item.notes.toUpperCase()} **\n`;
      }
      text += lineSep + '\n';
    });

    if (order.notes) {
      text += `Catatan Pesanan: ${order.notes}\n`;
      text += lineSep + '\n';
    }

    text += this.centerText('--- SEGERA BUAT SETELAH TIKET KELUAR ---', colWidth) + '\n\n\n';
    return text;
  }

  private static centerText(str: string, width: number): string {
    if (str.length >= width) return str.substring(0, width);
    const leftPad = Math.floor((width - str.length) / 2);
    return ' '.repeat(leftPad) + str;
  }

  private static justifyText(left: string, right: string, width: number): string {
    const totalSpaces = width - left.length - right.length;
    if (totalSpaces <= 0) {
      return `${left} ${right}`;
    }
    return left + ' '.repeat(totalSpaces) + right;
  }
}
