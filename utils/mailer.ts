import * as nodemailer from 'nodemailer';

export interface PerfMetrics {
  ttfb: number;
  domLoad: number;
  fullLoad: number;
  dnsLookup: number;
  tcpConnect: number;
}

export interface PageResult {
  name: string;
  url: string;
  metrics: PerfMetrics;
  isSlow: boolean;
  threshold: number;
  checkedAt: string;
}

export async function sendEmail(results: PageResult[]): Promise<void> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, ALERT_FROM, ALERT_TO } = process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS || !ALERT_TO || !ALERT_FROM) {
    console.warn('[Email] Missing SMTP config in .env — skipping email');
    return;
  }

  const slowPages   = results.filter(r => r.isSlow);
  const hasSlowPage = slowPages.length > 0;

  const subject = hasSlowPage
    ? `🚨 [ALERT] ${slowPages.length} slow page(s) detected — Perf Monitor`
    : `✅ [OK] All pages loading normally — Perf Monitor`;

  // HTML email body
  const rows = results.map(r => {
  const isError = r.metrics.fullLoad === 0;
  return `
    <tr>
      <td style="padding:10px 14px;border:1px solid #e0e0e0">${r.name}</td>
      <td style="padding:10px 14px;border:1px solid #e0e0e0;font-weight:bold;color:${isError ? '#cc0000' : r.isSlow ? '#cc0000' : '#007700'}">
        ${isError ? '❌ ERROR' : r.isSlow ? '⚠️ SLOW' : '✅ OK'}
      </td>
      <td style="padding:10px 14px;border:1px solid #e0e0e0">${isError ? 'N/A' : r.metrics.fullLoad + 'ms'}</td>
      <td style="padding:10px 14px;border:1px solid #e0e0e0">${isError ? 'N/A' : r.metrics.ttfb + 'ms'}</td>
      <td style="padding:10px 14px;border:1px solid #e0e0e0">${isError ? 'N/A' : r.metrics.domLoad + 'ms'}</td>
      <td style="padding:10px 14px;border:1px solid #e0e0e0">${r.checkedAt}</td>
    </tr>`}).join('');

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:750px;margin:0 auto;padding:24px">

      <h2 style="margin:0 0 8px;color:${hasSlowPage ? '#cc0000' : '#007700'}">
        ${hasSlowPage ? '🚨 Slow Page Alert' : '✅ All Pages OK'}
      </h2>
      <p style="margin:0 0 24px;color:#555">
        ${hasSlowPage
          ? `<strong>${slowPages.map(p => p.name).join(', ')}</strong> exceeded the ${results[0]?.threshold}ms threshold.`
          : `All pages loaded within the ${results[0]?.threshold}ms threshold.`}
      </p>

      <table style="width:100%;border-collapse:collapse;font-size:14px">
        <thead>
          <tr style="background:#f5f5f5">
            <th style="padding:10px 14px;border:1px solid #e0e0e0;text-align:left">Page</th>
            <th style="padding:10px 14px;border:1px solid #e0e0e0;text-align:left">Status</th>
            <th style="padding:10px 14px;border:1px solid #e0e0e0;text-align:left">Full Load</th>
            <th style="padding:10px 14px;border:1px solid #e0e0e0;text-align:left">TTFB</th>
            <th style="padding:10px 14px;border:1px solid #e0e0e0;text-align:left">DOM Load</th>
            <th style="padding:10px 14px;border:1px solid #e0e0e0;text-align:left">Checked At</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <p style="margin-top:24px;font-size:12px;color:#999">
        Threshold: ${results[0]?.threshold}ms &nbsp;|&nbsp; Automated message from Playwright Perf Monitor
      </p>
    </div>`;

  const transporter = nodemailer.createTransport({
    host:   SMTP_HOST,
    port:   Number(SMTP_PORT) || 587,
    secure: false,
    tls: {
    rejectUnauthorized: false,  // ignore certificate errors on internal networks
  },
    auth:   { user: SMTP_USER, pass: SMTP_PASS },
  });


    await transporter.verify();
    console.log('[Email] SMTP connection OK');

  await transporter.sendMail({ from: ALERT_FROM, to: ALERT_TO, subject, html });
  console.log('[Email] Sent to:', ALERT_TO);
}
