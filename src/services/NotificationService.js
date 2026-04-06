/**
 * Awunyo Inventory Suite — Notification Service
 * Handles: WhatsApp (Meta Cloud API), Email (EmailJS), SMS (Africa's Talking / Hubtel)
 *
 * Config is stored in localStorage under key: nx_notif_config
 * All methods gracefully fall back to device-native (mailto:, sms:, wa.me) if APIs not configured.
 */

const LS_KEY = 'nx_notif_config';

export const DEFAULT_CONFIG = {
  // EmailJS
  emailjs_service_id:  '',
  emailjs_template_id: '',
  emailjs_public_key:  '',

  // Meta WhatsApp Cloud API
  whatsapp_enabled:    false,
  whatsapp_token:      '',          // Bearer token
  whatsapp_phone_id:   '',          // Phone number ID from Meta dashboard
  whatsapp_from_name:  '',          // Business display name

  // Africa's Talking SMS
  africastalking_enabled:  false,
  africastalking_api_key:  '',
  africastalking_username: '',
  africastalking_sender_id:'',      // e.g. 'AWUNYO'

  // Hubtel SMS (alternative to Africa's Talking)
  hubtel_enabled:      false,
  hubtel_client_id:    '',
  hubtel_client_secret:'',
  hubtel_sender_id:    '',          // e.g. 'Awunyo'
};

export function loadConfig() {
  try {
    const v = localStorage.getItem(LS_KEY);
    return v ? { ...DEFAULT_CONFIG, ...JSON.parse(v) } : { ...DEFAULT_CONFIG };
  } catch { return { ...DEFAULT_CONFIG }; }
}

export function saveConfig(cfg) {
  try { localStorage.setItem(LS_KEY, JSON.stringify(cfg)); } catch {}
}

/** Format phone to international E.164 for Ghana (+233) */
export function formatPhone(raw = '') {
  let p = raw.replace(/\D/g, '');
  if (p.startsWith('0') && p.length === 10) p = '233' + p.slice(1);
  if (!p.startsWith('233') && p.length === 9) p = '233' + p;
  return '+' + p;
}

// ─────────────────────────────────────────────────────────────────────────────
// EMAIL
// ─────────────────────────────────────────────────────────────────────────────

async function loadEmailJS(publicKey) {
  if (window.emailjs) return;
  await new Promise((res, rej) => {
    if (document.getElementById('emailjs-sdk')) { res(); return; }
    const s = document.createElement('script');
    s.id = 'emailjs-sdk';
    s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
    s.onload = res; s.onerror = rej;
    document.head.appendChild(s);
  });
  window.emailjs.init(publicKey);
}

/**
 * Send receipt/notification email via EmailJS.
 * Falls back to mailto: if not configured.
 */
export async function sendEmail({ to, subject, body, templateParams, cfg: rawCfg } = {}) {
  const cfg = rawCfg || loadConfig();
  if (!cfg.emailjs_service_id || !cfg.emailjs_public_key) {
    // Native fallback
    window.open(`mailto:${to}?subject=${encodeURIComponent(subject||'')}&body=${encodeURIComponent(body||'')}`);
    return { ok: false, fallback: true, msg: 'EmailJS not configured — opened mail app.' };
  }
  try {
    await loadEmailJS(cfg.emailjs_public_key);
    await window.emailjs.send(
      cfg.emailjs_service_id,
      cfg.emailjs_template_id,
      { to_email: to, ...templateParams }
    );
    return { ok: true };
  } catch (e) {
    console.warn('EmailJS send failed:', e);
    window.open(`mailto:${to}?subject=${encodeURIComponent(subject||'')}&body=${encodeURIComponent(body||'')}`);
    return { ok: false, fallback: true, error: e?.text || String(e) };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// WHATSAPP
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Send WhatsApp message via Meta Cloud API.
 * Falls back to wa.me link if not configured.
 */
export async function sendWhatsApp({ to, message, cfg: rawCfg } = {}) {
  const cfg = rawCfg || loadConfig();
  const phone = formatPhone(to);

  if (!cfg.whatsapp_enabled || !cfg.whatsapp_token || !cfg.whatsapp_phone_id) {
    // Native fallback — opens WhatsApp with pre-filled message
    const url = `https://wa.me/${phone.replace('+','')}?text=${encodeURIComponent(message||'')}`;
    window.open(url, '_blank');
    return { ok: false, fallback: true, msg: 'WhatsApp API not configured — opened WhatsApp app.' };
  }

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${cfg.whatsapp_phone_id}/messages`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${cfg.whatsapp_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone,
          type: 'text',
          text: { body: message },
        }),
      }
    );
    const data = await res.json();
    if (!res.ok) throw new Error(data?.error?.message || 'API error');
    return { ok: true, data };
  } catch (e) {
    console.warn('WhatsApp API failed:', e);
    const url = `https://wa.me/${phone.replace('+','')}?text=${encodeURIComponent(message||'')}`;
    window.open(url, '_blank');
    return { ok: false, fallback: true, error: String(e) };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SMS — Africa's Talking
// ─────────────────────────────────────────────────────────────────────────────

async function sendAfricasTalking({ to, message, cfg }) {
  // Africa's Talking API — NOTE: requires CORS proxy or backend in production
  // For local/demo: opens SMS app fallback
  try {
    const body = new URLSearchParams({
      username: cfg.africastalking_username,
      to: formatPhone(to),
      message,
      ...(cfg.africastalking_sender_id ? { from: cfg.africastalking_sender_id } : {}),
    });
    const res = await fetch('https://api.africastalking.com/version1/messaging', {
      method: 'POST',
      headers: {
        'apiKey': cfg.africastalking_api_key,
        'Content-Type': 'application/x-www-form-urlencoded',
        'Accept': 'application/json',
      },
      body,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.SMSMessageData?.Message || 'AT error');
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// SMS — Hubtel
// ─────────────────────────────────────────────────────────────────────────────

async function sendHubtel({ to, message, cfg }) {
  try {
    const phone = formatPhone(to).replace('+', '');
    const credentials = btoa(`${cfg.hubtel_client_id}:${cfg.hubtel_client_secret}`);
    const res = await fetch('https://smsc.hubtel.com/v1/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        From: cfg.hubtel_sender_id || 'Awunyo',
        To: phone,
        Content: message,
      }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data?.message || 'Hubtel error');
    return { ok: true, data };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/**
 * Send SMS via configured provider (Africa's Talking or Hubtel).
 * Falls back to sms: link if not configured.
 */
export async function sendSMS({ to, message, cfg: rawCfg } = {}) {
  const cfg = rawCfg || loadConfig();

  if (cfg.africastalking_enabled && cfg.africastalking_api_key) {
    const r = await sendAfricasTalking({ to, message, cfg });
    if (r.ok) return r;
    // Fall through to Hubtel or fallback
  }

  if (cfg.hubtel_enabled && cfg.hubtel_client_id) {
    const r = await sendHubtel({ to, message, cfg });
    if (r.ok) return r;
  }

  // Native fallback
  window.open(`sms:${formatPhone(to)}?body=${encodeURIComponent(message||'')}`);
  return { ok: false, fallback: true, msg: 'SMS API not configured — opened SMS app.' };
}

// ─────────────────────────────────────────────────────────────────────────────
// RECEIPT HELPERS
// ─────────────────────────────────────────────────────────────────────────────

/** Build receipt text for SMS/WhatsApp */
export function buildReceiptText(sale, store) {
  const C = store?.currency || 'GH';
  const lines = [
    `*${store?.name || 'Awunyo POS'}*`,
    `Receipt: ${sale.id}`,
    `Date: ${sale.date} ${sale.time}`,
    `Cashier: ${sale.cashier}`,
    ``,
    ...sale.items.map(i => `${i.name} ×${i.qty}  ${C}${(i.price*i.qty).toFixed(2)}`),
    ``,
    ...(sale.discount > 0 ? [`Discount: -${C}${sale.discount.toFixed(2)}`] : []),
    `Tax: ${C}${sale.tax.toFixed(2)}`,
    `*TOTAL: ${C}${sale.total.toFixed(2)}*`,
    `Payment: ${{cash:'Cash',mobile_money:'Mobile Money',split:'Split',credit:'Credit'}[sale.payment]||sale.payment}`,
    ``,
    store?.receiptFooter || 'Thank you for your business!',
  ];
  return lines.join('\n');
}

/**
 * Auto-send receipt after a sale.
 * Sends via all configured channels if customer has phone/email.
 */
export async function autoSendReceipt({ sale, customer, store, onStatus } = {}) {
  const cfg  = loadConfig();
  const text = buildReceiptText(sale, store);
  const results = [];

  if (customer?.phone) {
    // WhatsApp
    const waResult = await sendWhatsApp({ to: customer.phone, message: text, cfg });
    results.push({ channel: 'WhatsApp', ...waResult });
    if (onStatus) onStatus(waResult.ok ? `WhatsApp sent to ${customer.name}` : waResult.msg || 'WhatsApp opened');

    // SMS (only if WhatsApp API failed)
    if (!waResult.ok && !waResult.fallback) {
      const smsResult = await sendSMS({ to: customer.phone, message: text, cfg });
      results.push({ channel: 'SMS', ...smsResult });
    }
  }

  if (customer?.email) {
    const emailResult = await sendEmail({
      to: customer.email,
      subject: `Receipt ${sale.id} — ${store?.name || 'Awunyo POS'}`,
      body: text.replace(/\*/g, ''),
      templateParams: {
        receipt_id:  sale.id,
        store_name:  store?.name || 'Awunyo POS',
        total:       `${store?.currency || 'GH'}${sale.total.toFixed(2)}`,
        cashier:     sale.cashier,
        footer:      store?.receiptFooter || 'Thank you!',
        items_text:  sale.items.map(i => `${i.name} ×${i.qty} = ${store?.currency||'GH'}${(i.price*i.qty).toFixed(2)}`).join(', '),
      },
      cfg,
    });
    results.push({ channel: 'Email', ...emailResult });
    if (onStatus) onStatus(emailResult.ok ? `Email sent to ${customer.email}` : emailResult.msg || 'Email opened');
  }

  return results;
}

/**
 * Broadcast message to multiple customers.
 * Sends via all configured channels.
 */
export async function broadcastMessage({ customers, message, channels = ['whatsapp','sms'], onProgress } = {}) {
  const cfg     = loadConfig();
  const results = [];

  for (let i = 0; i < customers.length; i++) {
    const c = customers[i];
    if (onProgress) onProgress(i + 1, customers.length, c.name);

    if (channels.includes('whatsapp') && c.phone) {
      const r = await sendWhatsApp({ to: c.phone, message, cfg });
      results.push({ customer: c.name, channel: 'WhatsApp', ...r });
      // Small delay to avoid rate limiting
      await new Promise(res => setTimeout(res, 200));
    }
    if (channels.includes('sms') && c.phone) {
      const r = await sendSMS({ to: c.phone, message, cfg });
      results.push({ customer: c.name, channel: 'SMS', ...r });
      await new Promise(res => setTimeout(res, 150));
    }
    if (channels.includes('email') && c.email) {
      const r = await sendEmail({
        to: c.email,
        subject: 'Message from ' + (loadConfig().whatsapp_from_name || 'Awunyo Suite'),
        body: message,
        templateParams: { message, store_name: loadConfig().whatsapp_from_name || 'Awunyo Suite' },
        cfg,
      });
      results.push({ customer: c.name, channel: 'Email', ...r });
    }
  }

  return results;
}
