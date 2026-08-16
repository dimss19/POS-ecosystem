/**
 * KASIR POS — Printer Service
 *
 * Implements thermal receipt printing for 58mm and 80mm paper sizes.
 * Uses window.print() within an ephemeral iframe to format output cleanly.
 *
 * Security:
 * - Sanitizes all print inputs (escapes HTML strings).
 */

import { getSetting } from './database';
import { formatRupiah, formatDate, shortId } from '../utils/format';
import type { Transaction, TransactionItem } from '../types';

/**
 * Escapes HTML characters to prevent print layout breaking or XSS in printing.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Print a transaction receipt.
 */
export async function printReceipt(
  transaction: Transaction,
  items: TransactionItem[]
): Promise<boolean> {
  try {
    const storeName = (await getSetting('store_name')) || 'KASIR POS';
    const paperSize = (await getSetting('printer_paper_size')) || '80';
    const widthClass = paperSize === '58' ? 'width-58' : 'width-80';

    // 1. Create printable HTML content
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt ${shortId(transaction.uuid)}</title>
        <style>
          @page {
            margin: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            color: #000;
            background: #fff;
            margin: 0;
            padding: 10px;
            box-sizing: border-box;
          }
          .width-58 {
            width: 54mm; /* printable width of 58mm roll */
          }
          .width-80 {
            width: 72mm; /* printable width of 80mm roll */
          }
          .text-center {
            text-align: center;
          }
          .text-right {
            text-align: right;
          }
          .bold {
            font-weight: bold;
          }
          .header {
            margin-bottom: 10px;
            line-height: 1.2;
          }
          .divider {
            border-top: 1px dashed #000;
            margin: 8px 0;
          }
          .item-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
          }
          .item-name {
            flex: 1;
            white-space: normal;
            word-break: break-word;
            padding-right: 5px;
          }
          .summary-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .footer {
            margin-top: 15px;
            font-size: 10px;
          }
        </style>
      </head>
      <body class="${widthClass}">
        <div class="header text-center">
          <div class="bold" style="font-size: 16px;">${escapeHtml(storeName)}</div>
          <div style="font-size: 10px; margin-top: 2px;">Struk Penjualan</div>
        </div>

        <div style="font-size: 10px;">
          <div>No: ${shortId(transaction.uuid)}</div>
          <div>Tanggal: ${formatDate(transaction.created_at)}</div>
          <div>Kasir: ${escapeHtml(transaction.cashier_name)}</div>
        </div>

        <div class="divider"></div>

        <!-- Items -->
        <div>
          ${items
            .map(
              (item) => `
            <div class="item-row">
              <div class="item-name">${escapeHtml(item.product_name)}</div>
            </div>
            <div class="item-row" style="font-size: 11px; color: #333; padding-bottom: 4px;">
              <div>${item.quantity} x ${formatRupiah(item.price)}</div>
              <div class="text-right">${formatRupiah(item.subtotal)}</div>
            </div>
          `
            )
            .join('')}
        </div>

        <div class="divider"></div>

        <!-- Totals -->
        <div class="summary-row">
          <div>Subtotal</div>
          <div>${formatRupiah(transaction.subtotal)}</div>
        </div>
        <div class="summary-row">
          <div>Diskon</div>
          <div>-${formatRupiah(transaction.discount)}</div>
        </div>
        <div class="summary-row bold" style="font-size: 13px; margin-top: 2px;">
          <div>Total</div>
          <div>${formatRupiah(transaction.total)}</div>
        </div>

        <div class="divider"></div>

        <!-- Payment Info -->
        <div class="summary-row">
          <div>Metode</div>
          <div>${transaction.payment_method}</div>
        </div>
        <div class="summary-row">
          <div>Bayar</div>
          <div>${formatRupiah(transaction.amount_paid)}</div>
        </div>
        <div class="summary-row">
          <div>Kembalian</div>
          <div>${formatRupiah(transaction.change)}</div>
        </div>

        <div class="divider"></div>

        <div class="footer text-center">
          <div class="bold">Terima Kasih</div>
          <div>Atas Kunjungan Anda</div>
        </div>
      </body>
      </html>
    `;

    // 2. Create invisible print iframe
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) {
      document.body.removeChild(iframe);
      return false;
    }

    doc.open();
    doc.write(html);
    doc.close();

    // 3. Trigger printing once content is loaded
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      // Clean up after print window closes
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 250);

    return true;
  } catch {
    return false;
  }
}
