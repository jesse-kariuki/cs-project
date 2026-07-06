// ============================================================
// thermal-print.ts – Thermal Receipt Printing Service
// ============================================================

/**
 * Payload containing all data needed to render a receipt.
 */
export interface ReceiptPayload {
  storeName: string;
  tagline?: string;
  address?: string;
  createdAt: string;
  receiptNumber: string;
  paymentMethod: string;
  phone?: string;
  cashierName: string;
  items: Array<{
    name: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
    unitLabel?: string; // e.g. "kg", "pcs"
  }>;
  subtotal: number;
  amountPaid: number;
  changeAmount: number;
  total: number; // same as subtotal (for consistency)
}

/**
 * Thermal printer configuration.
 */
export interface ThermalPrinterSettings {
  mode: 'browser' | 'webusb' | 'webserial' | 'api'; // printing mode
  paperWidth: number; // characters per line (e.g., 32, 48)
  apiUrl?: string; // if mode === 'api', endpoint to send raw text
  fallbackToBrowser: boolean; // if direct print fails, use browser
}

// Default settings (loaded if no saved settings exist)
export const DEFAULT_THERMAL_PRINTER_SETTINGS: ThermalPrinterSettings = {
  mode: 'browser',
  paperWidth: 32,
  fallbackToBrowser: true,
};

// Storage key for settings
const STORAGE_KEY = 'thermalPrinterSettings';

/**
 * Load printer settings from localStorage.
 */
export function loadThermalPrinterSettings(): ThermalPrinterSettings | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Save printer settings to localStorage.
 */
export function saveThermalPrinterSettings(settings: ThermalPrinterSettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

// ============================================================
// Receipt Builders
// ============================================================

/**
 * Build a plain‑text receipt suitable for thermal printers.
 * Uses ASCII characters and spaces for alignment.
 */
export function buildThermalReceiptText(
  payload: ReceiptPayload,
  paperWidth: number = 32
): string {
  const lines: string[] = [];
  const padBoth = (str: string, width: number) => {
    const pad = width - str.length;
    const left = Math.floor(pad / 2);
    const right = pad - left;
    return ' '.repeat(left) + str + ' '.repeat(right);
  };
  const line = (str: string) => lines.push(str);
  const separator = (char: string = '-') => line(char.repeat(paperWidth));

  // Header
  line(padBoth(payload.storeName, paperWidth));
  if (payload.tagline) line(padBoth(payload.tagline, paperWidth));
  if (payload.address) line(padBoth(payload.address, paperWidth));
  separator('=');
  line(`#${payload.receiptNumber}  ${payload.createdAt}`);
  line(`Cashier: ${payload.cashierName}`);
  if (payload.phone) line(`Phone: ${payload.phone}`);
  line(`Payment: ${payload.paymentMethod}`);
  separator('-');

  // Items
  line('Item'.padEnd(16) + 'Qty'.padEnd(6) + 'Price'.padEnd(6) + 'Total');
  separator('-');
  for (const item of payload.items) {
    const name = item.name.slice(0, 16).padEnd(16);
    const qty = (item.qty + (item.unitLabel ? ' ' + item.unitLabel : '')).padEnd(6);
    const price = (item.unitPrice.toFixed(2)).padEnd(6);
    const total = (item.lineTotal.toFixed(2));
    line(`${name}${qty}${price}${total}`);
  }
  separator('-');

  // Totals
  line('Subtotal'.padEnd(30) + payload.subtotal.toFixed(2));
  if (payload.changeAmount > 0) {
    line('Amount Paid'.padEnd(30) + payload.amountPaid.toFixed(2));
    line('Change'.padEnd(30) + payload.changeAmount.toFixed(2));
  }
  line('TOTAL'.padEnd(30) + payload.total.toFixed(2));
  separator('=');
  line(padBoth('Thank You!', paperWidth));
  line(padBoth('We appreciate your business', paperWidth));

  return lines.join('\n');
}

/**
 * Build an HTML document for browser printing.
 * Styled as a receipt with a clean, printable look.
 */
export function buildBrowserReceiptHtml(payload: ReceiptPayload): string {
  const itemsHtml = payload.items
    .map(
      (item) => `
    <tr>
      <td>${item.name}</td>
      <td style="text-align:center;">${item.qty}${item.unitLabel ? ' ' + item.unitLabel : ''}</td>
      <td style="text-align:right;">${item.unitPrice.toFixed(2)}</td>
      <td style="text-align:right;">${item.lineTotal.toFixed(2)}</td>
    </tr>
  `
    )
    .join('');

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <title>Receipt #${payload.receiptNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Courier New', monospace;
      width: 80mm;
      margin: 0 auto;
      padding: 8px;
      background: #fff;
      color: #000;
    }
    .receipt {
      max-width: 100%;
    }
    .header {
      text-align: center;
      margin-bottom: 8px;
    }
    .store-name {
      font-size: 18px;
      font-weight: bold;
    }
    .tagline {
      font-size: 14px;
      color: #555;
    }
    .address {
      font-size: 12px;
      color: #555;
    }
    .divider {
      border-top: 1px dashed #000;
      margin: 8px 0;
    }
    .info-line {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      margin-bottom: 2px;
    }
    table {
      width: 100%;
      font-size: 12px;
      border-collapse: collapse;
    }
    th, td {
      padding: 4px 0;
    }
    th {
      border-bottom: 1px solid #000;
      font-weight: bold;
      text-align: left;
    }
    td:last-child, th:last-child {
      text-align: right;
    }
    td:nth-child(2) {
      text-align: center;
    }
    .totals {
      margin-top: 8px;
      text-align: right;
      font-size: 14px;
    }
    .totals div {
      display: flex;
      justify-content: space-between;
      padding: 2px 0;
    }
    .total-line {
      font-size: 16px;
      font-weight: bold;
      border-top: 1px solid #000;
      margin-top: 4px;
      padding-top: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 12px;
      font-size: 12px;
      color: #555;
    }
    @media print {
      body { margin: 0; padding: 0; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="receipt">
    <div class="header">
      <div class="store-name">${payload.storeName}</div>
      ${payload.tagline ? `<div class="tagline">${payload.tagline}</div>` : ''}
      ${payload.address ? `<div class="address">${payload.address}</div>` : ''}
    </div>
    <div class="divider"></div>
    <div class="info-line">
      <span>#${payload.receiptNumber}</span>
      <span>${payload.createdAt}</span>
    </div>
    <div class="info-line">
      <span>Cashier: ${payload.cashierName}</span>
      <span>${payload.paymentMethod}</span>
    </div>
    ${payload.phone ? `<div class="info-line"><span>Phone: ${payload.phone}</span></div>` : ''}
    <div class="divider"></div>
    <table>
      <thead>
        <tr>
          <th>Item</th>
          <th>Qty</th>
          <th>Price</th>
          <th>Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemsHtml}
      </tbody>
    </table>
    <div class="divider"></div>
    <div class="totals">
      <div><span>Subtotal</span><span>${payload.subtotal.toFixed(2)}</span></div>
      ${payload.changeAmount > 0 ? `<div><span>Amount Paid</span><span>${payload.amountPaid.toFixed(2)}</span></div>` : ''}
      ${payload.changeAmount > 0 ? `<div><span>Change</span><span>${payload.changeAmount.toFixed(2)}</span></div>` : ''}
      <div class="total-line"><span>TOTAL</span><span>${payload.total.toFixed(2)}</span></div>
    </div>
    <div class="divider"></div>
    <div class="footer">
      Thank you for your business!
    </div>
  </div>
  <script>
    window.onload = () => {
      // Auto-print when document loads
      window.print();
    };
  </script>
</body>
</html>
  `;
}

// ============================================================
// Print Sending Functions
// ============================================================

/**
 * Send raw text to a thermal printer.
 * Supports multiple modes:
 * - 'browser'  => uses window.print() (via browser receipt HTML)
 * - 'api'      => sends raw text to a local print server (e.g., http://localhost:9100)
 * - 'webusb'   => placeholder for WebUSB (not fully implemented)
 * - 'webserial'=> placeholder for Web Serial (not fully implemented)
 */
export async function sendRawPrintJob(
  rawText: string,
  settings: ThermalPrinterSettings
): Promise<void> {
  // If mode is 'browser', we should not call this function –
  // but if it's called, we can fallback to browser HTML.
  // However, the caller already handles 'browser' separately.
  // We'll support the other modes.

  switch (settings.mode) {
    case 'api': {
      if (!settings.apiUrl) {
        throw new Error('API URL not defined for print mode "api"');
      }
      // Send raw text to the print server as plain text.
      const response = await fetch(settings.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: rawText,
      });
      if (!response.ok) {
        throw new Error(`Print server responded with ${response.status}`);
      }
      break;
    }
    case 'webusb': {
      // WebUSB implementation (experimental)
      // For real thermal printers that support USB (e.g., ESC/POS over USB)
      // This is a simplified placeholder – you'd need to implement ESC/POS commands.
      // We'll fallback to browser if not implemented.
      throw new Error('WebUSB printing is not yet implemented. Falling back to browser.');
      // break;
    }
    case 'webserial': {
      // Web Serial API (for USB-to-serial adapters)
      // Placeholder.
      throw new Error('Web Serial printing is not yet implemented. Falling back to browser.');
      // break;
    }
    default:
      throw new Error(`Unsupported print mode: ${settings.mode}`);
  }
}