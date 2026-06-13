export interface InvoiceData {
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  items: { description: string; amount: number }[];
  total: number;
  date: string;
  platformName?: string;
  supportEmail?: string;
  footerText?: string;
}

function buildInvoiceHTML(data: InvoiceData): string {
  const rows = data.items.map(item => `
    <tr>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;">${item.description}</td>
      <td style="padding:12px 16px;border-bottom:1px solid #e2e8f0;font-size:13px;color:#334155;text-align:right;font-weight:700;">$${Math.abs(item.amount).toFixed(2)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  *{margin:0;padding:0;box-sizing:border-box;}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;background:#f8fafc;padding:40px;}
  .invoice{max-width:680px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08);}
  .header{background:#0f172a;padding:40px 40px 32px;color:#fff;}
  .header h1{font-size:28px;font-weight:900;letter-spacing:-1px;text-transform:uppercase;font-style:italic;}
  .header p{font-size:11px;color:#94a3b8;letter-spacing:3px;text-transform:uppercase;margin-top:4px;}
  .meta{display:flex;justify-content:space-between;padding:32px 40px;border-bottom:1px solid #e2e8f0;}
  .meta-block p.label{font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;font-weight:700;margin-bottom:4px;}
  .meta-block p.value{font-size:13px;color:#0f172a;font-weight:700;}
  table{width:100%;border-collapse:collapse;}
  thead tr{background:#f1f5f9;}
  thead th{padding:12px 16px;font-size:10px;color:#94a3b8;text-transform:uppercase;letter-spacing:2px;font-weight:700;text-align:left;}
  thead th:last-child{text-align:right;}
  .total-row td{padding:16px;font-size:15px;font-weight:900;color:#0f172a;border-top:2px solid #0f172a;}
  .total-row td:last-child{text-align:right;color:#22c55e;}
  .footer{padding:24px 40px;background:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;}
  .footer p{font-size:11px;color:#94a3b8;}
  @media print{body{padding:0;background:#fff;}.invoice{box-shadow:none;border-radius:0;}}
</style>
</head>
<body>
<div class="invoice">
  <div class="header">
    <h1>${data.platformName || 'DUREX TEAM'}</h1>
    <p>Invoice // ${data.invoiceNumber}</p>
  </div>
  <div class="meta">
    <div class="meta-block">
      <p class="label">Bill To</p>
      <p class="value">${data.clientName}</p>
      <p style="font-size:12px;color:#64748b;margin-top:2px;">${data.clientEmail}</p>
    </div>
    <div class="meta-block" style="text-align:right">
      <p class="label">Date</p>
      <p class="value">${data.date}</p>
      <p class="label" style="margin-top:12px;">Invoice No.</p>
      <p class="value">${data.invoiceNumber}</p>
    </div>
  </div>
  <table>
    <thead>
      <tr><th>Description</th><th>Amount</th></tr>
    </thead>
    <tbody>${rows}</tbody>
    <tr class="total-row">
      <td>TOTAL</td>
      <td>$${data.total.toFixed(2)}</td>
    </tr>
  </table>
  <div class="footer">
    <p>${data.footerText || 'Thank you for your business.'}</p>
    ${data.supportEmail ? `<p style="margin-top:4px;">Support: ${data.supportEmail}</p>` : ''}
  </div>
</div>
</body>
</html>`;
}

export async function downloadInvoicePDF(data: InvoiceData): Promise<void> {
  const html = buildInvoiceHTML(data);
  const container = document.createElement('div');
  container.innerHTML = html;
  container.style.position = 'absolute';
  container.style.left = '-9999px';
  document.body.appendChild(container);

  try {
    const html2pdf = (await import('html2pdf.js')).default;
    await html2pdf()
      .set({
        margin: 0,
        filename: `invoice-${data.invoiceNumber}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .from(container.querySelector('.invoice'))
      .save();
  } finally {
    document.body.removeChild(container);
  }
}

export function buildInvoiceFromTransaction(tx: any, profile: any, platformName?: string, supportEmail?: string): InvoiceData {
  return {
    invoiceNumber: tx.id?.slice(0, 8).toUpperCase() || 'INV-0000',
    clientName: profile?.username || 'Client',
    clientEmail: profile?.email || '',
    items: [{ description: tx.description || tx.type || 'Service', amount: Math.abs(tx.amount || 0) }],
    total: Math.abs(tx.amount || 0),
    date: tx.createdAt?.toDate ? tx.createdAt.toDate().toLocaleDateString() : new Date().toLocaleDateString(),
    platformName,
    supportEmail,
  };
}
