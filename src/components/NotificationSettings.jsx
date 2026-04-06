import React, { useState } from 'react';
// Once src/services/NotificationService.js is in place, replace these with:
// import { loadConfig, saveConfig, DEFAULT_CONFIG, sendEmail, sendWhatsApp, sendSMS } from '../services/NotificationService';

const DEFAULT_CONFIG = {
  emailjs_service_id:'', emailjs_template_id:'', emailjs_public_key:'',
  whatsapp_enabled:false, whatsapp_token:'', whatsapp_phone_id:'', whatsapp_from_name:'',
  africastalking_enabled:false, africastalking_api_key:'', africastalking_username:'', africastalking_sender_id:'',
  hubtel_enabled:false, hubtel_client_id:'', hubtel_client_secret:'', hubtel_sender_id:'',
  auto_send_receipt:true, receipt_whatsapp_first:true, receipt_email:true,
};
const loadConfig = () => { try { const v = localStorage.getItem('nx_notif_config'); return v ? {...DEFAULT_CONFIG, ...JSON.parse(v)} : {...DEFAULT_CONFIG}; } catch { return {...DEFAULT_CONFIG}; } };
const saveConfig = (cfg) => { try { localStorage.setItem('nx_notif_config', JSON.stringify(cfg)); } catch {} };
const sendEmail    = async () => ({ ok:false, fallback:true, msg:'Configure EmailJS in NotificationService.js' });
const sendWhatsApp = async ({ to, message }) => { window.open(`https://wa.me/${to.replace(/\D/g,'')}?text=${encodeURIComponent(message||'')}`, '_blank'); return { ok:false, fallback:true }; };
const sendSMS      = async ({ to, message }) => { window.open(`sms:${to}?body=${encodeURIComponent(message||'')}`); return { ok:false, fallback:true }; };

const Section = ({ title, desc, children }) => (
  <div className="bg-white dark:bg-gray-900 border border-stone-200 dark:border-gray-800 rounded-xl p-5 space-y-4">
    <div className="pb-2 border-b border-stone-100 dark:border-gray-800">
      <h3 className="font-bold text-gray-900 dark:text-white" style={{fontSize:'0.9375rem', fontFamily:'Georgia, serif'}}>{title}</h3>
      {desc && <p className="text-gray-400 text-xs mt-0.5">{desc}</p>}
    </div>
    {children}
  </div>
);

const Field = ({ label, value, onChange, type='text', placeholder, mono, hint }) => (
  <div>
    <label className="lbl">{label}</label>
    <input
      type={type}
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      placeholder={placeholder}
      className={`inp ${mono ? 'font-mono text-sm' : ''}`}
    />
    {hint && <p className="text-gray-400 text-xs mt-1">{hint}</p>}
  </div>
);

const Toggle = ({ label, desc, value, onChange, accent }) => (
  <div className="flex items-center justify-between p-3 bg-stone-50 dark:bg-gray-800 rounded-xl">
    <div>
      <div className="font-semibold text-gray-900 dark:text-white text-sm">{label}</div>
      {desc && <div className="text-gray-400 text-xs mt-0.5">{desc}</div>}
    </div>
    <button
      onClick={() => onChange(!value)}
      className="w-12 h-6 rounded-full relative flex-shrink-0 transition-colors duration-200"
      style={{background: value ? accent : '#d1d5db'}}
    >
      <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all duration-300 ${value ? 'left-6' : 'left-0.5'}`}/>
    </button>
  </div>
);

export default function NotificationSettings({ notify, appearance }) {
  const accent = appearance?.accentColor || '#7c5cbf';
  const [cfg,     setCfg]     = useState(() => loadConfig());
  const [testing, setTesting] = useState({});
  const [testNum, setTestNum] = useState('');
  const [testEmail, setTestEmail] = useState('');

  const update = (key, val) => setCfg(p => ({...p, [key]: val}));

  const handleSave = () => {
    saveConfig(cfg);
    notify('Notification settings saved.');
  };

  const testEmail_ = async () => {
    if (!testEmail) { notify('Enter a test email address.', 'error'); return; }
    setTesting(p => ({...p, email: true}));
    const r = await sendEmail({
      to: testEmail,
      subject: 'Awunyo Suite — Test Email',
      body: 'This is a test email from Awunyo Inventory Suite.',
      templateParams: { store_name: 'Awunyo Suite', receipt_id: 'TEST-001', total: 'GH₵0.00', cashier: 'Test', footer: 'Test message', items_text: 'Test item ×1' },
      cfg,
    });
    setTesting(p => ({...p, email: false}));
    notify(r.ok ? '✓ Test email sent!' : r.fallback ? 'Mail app opened (EmailJS not configured).' : `Email failed: ${r.error}`, r.ok ? 'success' : 'warning');
  };

  const testWhatsApp_ = async () => {
    if (!testNum) { notify('Enter a test phone number.', 'error'); return; }
    setTesting(p => ({...p, whatsapp: true}));
    const r = await sendWhatsApp({ to: testNum, message: 'Hello from Awunyo Inventory Suite! 🎉 This is a test message.', cfg });
    setTesting(p => ({...p, whatsapp: false}));
    notify(r.ok ? '✓ WhatsApp message sent!' : r.fallback ? 'WhatsApp app opened (API not configured).' : `WhatsApp failed: ${r.error}`, r.ok ? 'success' : 'warning');
  };

  const testSMS_ = async () => {
    if (!testNum) { notify('Enter a test phone number.', 'error'); return; }
    setTesting(p => ({...p, sms: true}));
    const r = await sendSMS({ to: testNum, message: 'Hello from Awunyo Inventory Suite! This is a test SMS.', cfg });
    setTesting(p => ({...p, sms: false}));
    notify(r.ok ? '✓ SMS sent!' : r.fallback ? 'SMS app opened (API not configured).' : `SMS failed: ${r.error}`, r.ok ? 'success' : 'warning');
  };

  return (
    <div className="space-y-5">
      {/* Info banner */}
      <div className="p-4 rounded-xl border" style={{background:`${accent}08`, borderColor:`${accent}30`}}>
        <div className="font-semibold text-sm mb-1" style={{color:accent, fontFamily:'Georgia, serif'}}>Notification APIs</div>
        <p className="text-gray-500 text-xs leading-relaxed">
          Configure WhatsApp, Email, and SMS providers to automatically send receipts to customers after every sale, and enable broadcast messaging. All keys are stored locally — nothing is sent to Awunyo servers.
        </p>
      </div>

      {/* ── EMAIL ── */}
      <Section title="Email — EmailJS" desc="Send receipts and notifications via email. Free tier: 200 emails/month.">
        <div className="p-3 bg-blue-50 dark:bg-blue-900/10 rounded-lg text-xs text-blue-700 dark:text-blue-400">
          Get your keys at <a href="https://www.emailjs.com" target="_blank" rel="noreferrer" className="underline font-semibold">emailjs.com</a> → Create a service → Create a template with variables: <code className="bg-blue-100 dark:bg-blue-900/30 px-1 rounded">to_email, store_name, receipt_id, total, cashier, footer, items_text</code>
        </div>
        <Field label="Service ID" value={cfg.emailjs_service_id} onChange={v=>update('emailjs_service_id',v)} placeholder="service_xxxxxxx" mono hint="Found in EmailJS dashboard → Email Services"/>
        <Field label="Template ID" value={cfg.emailjs_template_id} onChange={v=>update('emailjs_template_id',v)} placeholder="template_xxxxxxx" mono hint="Found in EmailJS dashboard → Email Templates"/>
        <Field label="Public Key" value={cfg.emailjs_public_key} onChange={v=>update('emailjs_public_key',v)} placeholder="xxxxxxxxxxxxxxx" mono hint="Found in EmailJS dashboard → Account → General → Public Key" type="password"/>
        <div className="flex gap-2 items-end">
          <div className="flex-1"><label className="lbl">Test Email Address</label><input value={testEmail} onChange={e=>setTestEmail(e.target.value)} placeholder="test@email.com" className="inp" type="email"/></div>
          <button onClick={testEmail_} disabled={testing.email} className="min-h-[44px] px-4 rounded-xl font-semibold text-white text-sm flex-shrink-0 disabled:opacity-60" style={{background:accent}}>
            {testing.email ? '…' : 'Test'}
          </button>
        </div>
      </Section>

      {/* ── WHATSAPP ── */}
      <Section title="WhatsApp — Meta Cloud API" desc="Send receipts and messages directly via WhatsApp Business.">
        <Toggle label="Enable WhatsApp API" desc="Use Meta API instead of wa.me links" value={cfg.whatsapp_enabled} onChange={v=>update('whatsapp_enabled',v)} accent={accent}/>
        {cfg.whatsapp_enabled && (
          <>
            <div className="p-3 bg-green-50 dark:bg-green-900/10 rounded-lg text-xs text-green-700 dark:text-green-400">
              Get started at <a href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started" target="_blank" rel="noreferrer" className="underline font-semibold">Meta for Developers</a> → Create App → WhatsApp → Get Phone Number ID and Access Token.
            </div>
            <Field label="Phone Number ID" value={cfg.whatsapp_phone_id} onChange={v=>update('whatsapp_phone_id',v)} placeholder="123456789012345" mono hint="From Meta WhatsApp Business Platform dashboard"/>
            <Field label="Permanent Access Token" value={cfg.whatsapp_token} onChange={v=>update('whatsapp_token',v)} placeholder="EAAxxxxxx..." mono type="password" hint="Generate a permanent token from Meta Business Manager → System Users"/>
            <Field label="Business Display Name" value={cfg.whatsapp_from_name} onChange={v=>update('whatsapp_from_name',v)} placeholder="Awunyo Inventory" hint="How your business name appears in WhatsApp"/>
          </>
        )}
        <div className="flex gap-2 items-end">
          <div className="flex-1"><label className="lbl">Test Phone (with country code)</label><input value={testNum} onChange={e=>setTestNum(e.target.value)} placeholder="+233244123456" className="inp" type="tel"/></div>
          <button onClick={testWhatsApp_} disabled={testing.whatsapp} className="min-h-[44px] px-4 rounded-xl font-semibold text-white text-sm flex-shrink-0 disabled:opacity-60" style={{background:'#25D366'}}>
            {testing.whatsapp ? '…' : 'Test WA'}
          </button>
        </div>
      </Section>

      {/* ── SMS — Africa's Talking ── */}
      <Section title="SMS — Africa's Talking" desc="Bulk SMS via Africa's Talking. Best for Ghana, Nigeria, Kenya.">
        <Toggle label="Enable Africa's Talking" desc="Use AT API for SMS sending" value={cfg.africastalking_enabled} onChange={v=>update('africastalking_enabled',v)} accent={accent}/>
        {cfg.africastalking_enabled && (
          <>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg text-xs text-amber-700 dark:text-amber-400">
              Register at <a href="https://africastalking.com" target="_blank" rel="noreferrer" className="underline font-semibold">africastalking.com</a>. Note: In production, API calls should go through your own server to protect your API key.
            </div>
            <Field label="Username" value={cfg.africastalking_username} onChange={v=>update('africastalking_username',v)} placeholder="your_username" hint="Your Africa's Talking username (use 'sandbox' for testing)"/>
            <Field label="API Key" value={cfg.africastalking_api_key} onChange={v=>update('africastalking_api_key',v)} placeholder="atsk_xxxxxx" mono type="password" hint="Found in AT dashboard → Settings → API Key"/>
            <Field label="Sender ID (optional)" value={cfg.africastalking_sender_id} onChange={v=>update('africastalking_sender_id',v)} placeholder="AWUNYO" hint="Alphanumeric sender ID (max 11 chars). Must be registered with AT."/>
          </>
        )}
      </Section>

      {/* ── SMS — Hubtel ── */}
      <Section title="SMS — Hubtel" desc="Alternative SMS via Hubtel. Popular in Ghana.">
        <Toggle label="Enable Hubtel SMS" desc="Use Hubtel for SMS sending" value={cfg.hubtel_enabled} onChange={v=>update('hubtel_enabled',v)} accent={accent}/>
        {cfg.hubtel_enabled && (
          <>
            <div className="p-3 bg-amber-50 dark:bg-amber-900/10 rounded-lg text-xs text-amber-700 dark:text-amber-400">
              Register at <a href="https://hubtel.com" target="_blank" rel="noreferrer" className="underline font-semibold">hubtel.com</a> → Developer → Get Client ID and Secret.
            </div>
            <Field label="Client ID" value={cfg.hubtel_client_id} onChange={v=>update('hubtel_client_id',v)} placeholder="xxxxxxxx" mono hint="From Hubtel developer dashboard"/>
            <Field label="Client Secret" value={cfg.hubtel_client_secret} onChange={v=>update('hubtel_client_secret',v)} placeholder="xxxxxxxx" mono type="password"/>
            <Field label="Sender ID" value={cfg.hubtel_sender_id} onChange={v=>update('hubtel_sender_id',v)} placeholder="Awunyo" hint="Registered sender name (max 11 chars)"/>
          </>
        )}
        {(cfg.africastalking_enabled || cfg.hubtel_enabled) && (
          <div className="flex gap-2 items-end">
            <div className="flex-1"><label className="lbl">Test Phone Number</label><input value={testNum} onChange={e=>setTestNum(e.target.value)} placeholder="0244123456 or +233244123456" className="inp" type="tel"/></div>
            <button onClick={testSMS_} disabled={testing.sms} className="min-h-[44px] px-4 rounded-xl font-semibold text-white text-sm flex-shrink-0 disabled:opacity-60" style={{background:'#f59e0b'}}>
              {testing.sms ? '…' : 'Test SMS'}
            </button>
          </div>
        )}
      </Section>

      {/* ── Auto-send settings ── */}
      <Section title="Auto-Send Receipt" desc="Automatically send receipt to customer after every completed sale.">
        <Toggle label="Auto-send after sale" desc="Send receipt via WhatsApp/Email when customer has contact info" value={cfg.auto_send_receipt ?? true} onChange={v=>update('auto_send_receipt',v)} accent={accent}/>
        <Toggle label="WhatsApp first (fallback to SMS)" desc="Try WhatsApp before falling back to SMS" value={cfg.receipt_whatsapp_first ?? true} onChange={v=>update('receipt_whatsapp_first',v)} accent={accent}/>
        <Toggle label="Send email receipt" desc="Send email receipt if customer has email on file" value={cfg.receipt_email ?? true} onChange={v=>update('receipt_email',v)} accent={accent}/>
      </Section>

      <button onClick={handleSave} className="w-full min-h-[48px] rounded-xl font-semibold text-white text-sm" style={{background:accent}}>
        Save Notification Settings
      </button>
    </div>
  );
}
