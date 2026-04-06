# Nexus POS — Mobile-First Rebuild Setup Guide

## Step 1: Install Dependencies

Open terminal in your POS folder and run:

```bash
npm install --legacy-peer-deps
```

This installs Tailwind CSS, PostCSS and Autoprefixer.

---

## Step 2: File Placement

### Root folder (Desktop/App/POS/)
| File | Action |
|------|--------|
| `package.json` | Replace existing |
| `tailwind.config.js` | NEW file |
| `postcss.config.js` | NEW file |

### src/styles/
| File | Action |
|------|--------|
| `global.css` | Replace existing |

### src/hooks/
| File | Action |
|------|--------|
| `usePOS.js` | Replace existing |

### src/data/
| File | Action |
|------|--------|
| `users.js` | Replace existing |

### src/
| File | Action |
|------|--------|
| `App.jsx` | Replace existing |

### src/components/
| File | Action |
|------|--------|
| `BottomNav.jsx` | NEW file |
| `Sidebar.jsx` | Replace |
| `LoginView.jsx` | Replace |
| `DashboardView.jsx` | Replace |
| `POSView.jsx` | Replace |
| `InventoryView.jsx` | Replace |
| `BarcodeScanner.jsx` | Replace |
| `Notification.jsx` | Replace |
| `SalesView.jsx` | Replace |
| `CustomersView.jsx` | Replace |
| `SuppliersView.jsx` | Replace |
| `ReportsView.jsx` | Replace |
| `SettingsView.jsx` | Replace |
| `StaffView.jsx` | Replace |
| `views.jsx` | NEW file |

---

## Step 3: Start the App

```bash
npm start
```

---

## Step 4: EmailJS Setup (Optional — for login notifications)

1. Go to https://www.emailjs.com and create a free account
2. Add an Email Service (Gmail recommended)
3. Create an Email Template with variables:
   - `{{to_email}}` `{{user_name}}` `{{user_role}}` `{{login_time}}` `{{device}}` `{{location}}`
4. Open `src/components/LoginView.jsx`
5. Replace these three lines at the top:
   ```js
   const SERVICE_ID  = 'YOUR_SERVICE_ID';
   const TEMPLATE_ID = 'YOUR_TEMPLATE_ID';
   const PUBLIC_KEY  = 'YOUR_PUBLIC_KEY';
   ```

---

## Demo Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@nexuspos.com | super123 |
| Admin | admin@nexuspos.com | admin123 |
| Sales | sales@nexuspos.com | sales123 |

---

## What's New

- **Tailwind CSS** — full utility-class design system
- **Mobile-first** — designed for 320px screens up
- **Bottom navigation** on mobile (Dashboard, POS, Stock, Reports, Settings)
- **Slide-up bottom sheets** for all modals on mobile
- **POS numeric keypad** for cash entry on mobile
- **Barcode scanner** using native camera API (BarcodeDetector + ZXing fallback)
- **Dark mode** via Tailwind dark: classes
- **10-minute idle auto-logout** with 1-minute warning
- **Touch-friendly** — all buttons minimum 44px height
