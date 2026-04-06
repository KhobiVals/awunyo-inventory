# AWUNYO INVENTORY SUITE — Claude Session Context

## App Identity
**Name:** Awunyo Inventory Suite (formerly Nexus POS)
React + Tailwind CSS multi-tenant inventory & POS system. Runs locally via `npm run dev`. Uses **localStorage** for all persistence.

## Tech Stack
React (JSX), Tailwind CSS, PostCSS. No backend.

## File Structure
```
src/
  App.jsx                    ← Root: auth, routing, global state, store switcher
  hooks/usePOS.js
  components/
    LoginView.jsx            ← Auth + EmailJS alerts
    Sidebar.jsx              ← Desktop nav, no clock
    BottomNav.jsx            ← Mobile nav, no clock
    Notification.jsx, Icon.jsx, BarcodeScanner.jsx
    DashboardView.jsx, POSView.jsx, InventoryView.jsx
    SalesView.jsx, CustomersView.jsx, SuppliersView.jsx
    ReportsView.jsx
    SettingsView.jsx         ← Audit date-range filter, store switcher for superadmin
    StaffView.jsx, TenantManagerView.jsx, views.jsx
  data/products.js, customers.js, sales.js, constants.js, tenants.js
  styles/global.css
```

## Roles & Permissions (string-based, in App.jsx)
| Role | Label | Key Perms |
|------|-------|-----------|
| superadmin | Super Admin | tenant.*, user.global_manage, audit.view_all |
| owner | Store Owner | business.update, user.*, sales.*, inventory.full_access |
| manager | Manager | sales.view/create, inventory.add/update, reports.view |
| sales | Sales / Cashier | sales.create/view_own, inventory.view_limited, customer.add |

`getAllowedViews(role, customViews)` in App.jsx derives nav items from permissions.
`ROLE_LABELS` and `PERMISSIONS` exported from App.jsx.

## Changes Made This Session
1. **Renamed** to "Awunyo Inventory Suite" everywhere
2. **Removed clocking** — No clockIn/clockOut/activeShift/shifts in UI or logic
3. **Audit log date filter** — search, date-from, date-to, action pills, export CSV
4. **Super Admin Store Switcher** — `adminViewStore` state; `switchToStore(storeId)`; store badge in sidebar + header; Settings → Store Info has dropdown; TenantManager has "Switch to Store" button
5. **New role system** — PERMISSIONS map, ROLE_LABELS, getAllowedViews() in App.jsx
6. **UI style** — Accent `#6b4c11` (earthy brown), Georgia serif headings, stone tones, traditional tab-underline tabs
7. **addAudit(action, detail, entity)** — 3rd param `entity` added

## Super Admin Store Switch Flow
1. `switchToStore(storeId)` → sets `adminViewStore`, loads store data into state
2. Sidebar shows "Viewing Store: [Name]" badge
3. Header shows "[Store] (viewing)" + "Exit View" button
4. `switchToStore(null)` exits store view

## localStorage Keys
- Global: `nx_dark`, `nx_sidebar`, `nx_user`, `nx_tenants`, `nx_tenant_users`, `nx_appearance`, `nx_promotions`, `nx_categories`, `nx_audit`, `nx_offline_q`, `nx_session_{userId}`, `nx_admin_view_store`
- Per-store: `nx_{storeId}_settings/products/sales/staff/suppliers/customers`

## Key Patterns
- `notify(msg, type)` — toast
- `addAudit(action, detail, entity)` — audit trail
- `appearance.accentColor` — CSS var `--accent`, default `#6b4c11`
- `storeSettings.currency` — e.g. `'GH'`
- No clocking anywhere

## Demo Credentials
| Role | Email | Password |
|------|-------|----------|
| Super Admin | superadmin@nexuspos.com | super123 |
| Store Owner | admin@nexuspos.com | admin123 |
| Sales | sales@nexuspos.com | sales123 |

## Features Planned (not yet built)
- Receipt PDF + WhatsApp/Email/SMS send
- Customer messaging broadcast
- IndexedDB offline (currently localStorage queue)
- Africa's Talking / Hubtel / SendGrid / Meta WhatsApp integrations
- Dynamic role permission editing UI
