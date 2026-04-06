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

## Session 3 Changes
1. **Document title** — `document.title = 'Awunyo Inventory Suite'` set in App.jsx on load
2. **Default colours** — Light purple `#7c5cbf` (accent) + gold `#b8962e`. Changeable in Settings → Appearance
3. **Clocking RESTORED** — Sales/Cashier role must clock in before making a sale. Clock In/Out button back in Sidebar footer. `shifts`, `activeShift`, `clockIn`, `clockOut` all restored in App.jsx
4. **"Admin" → "Manager"** — ROLE_LABELS updated; legacy alias kept for backward compat
5. **TenantManagerView rebuilt**:
   - No subscription plans anywhere
   - "Enter Store" / "Exit View" button per store (calls `onSwitchToStore`)
   - Full user registration form: gender, DOB, phone, address, position, department, emergency contact, notes
   - Role picker: Store Owner / Manager / Sales / Cashier
   - Module permissions checklist visible on add/edit user
   - Edit existing users supported
   - Shifts tab removed (clocking is per-store, not global)
   - Audit tab kept (platform-level)
   - All Users tab has search
6. **SettingsView** — accent presets updated to purple+gold palette
7. **LoginView** — demo colours updated to purple/gold

## Session 4 — All Pending Features Built

### New Files (place in src/)
| File | Location |
|------|----------|
| `NotificationService.js` | `src/services/NotificationService.js` |
| `OfflineDB.js` | `src/services/OfflineDB.js` |
| `NotificationSettings.jsx` | `src/components/NotificationSettings.jsx` |
| `RolePermissionsView.jsx` | `src/components/RolePermissionsView.jsx` |

### Updated Files
- `App.jsx` — async handleCompleteSale, OfflineDB hook, auto-receipt send wired in
- `SettingsView.jsx` — Notifications tab + Roles & Perms tab added
- `CustomersView.jsx` — Full broadcast with WhatsApp/SMS/Email, progress bar, results log

### 1. NotificationService.js (`src/services/`)
- `sendEmail(...)` — EmailJS with mailto fallback
- `sendWhatsApp(...)` — Meta Cloud API with wa.me fallback
- `sendSMS(...)` — Africa's Talking OR Hubtel with sms: fallback
- `autoSendReceipt(sale, customer, store)` — called after every sale automatically
- `broadcastMessage(customers, message, channels)` — bulk send with progress callback
- `buildReceiptText(sale, store)` — WhatsApp/SMS formatted receipt text
- `formatPhone(raw)` — normalises Ghana numbers to +233 E.164
- Config stored in localStorage key `nx_notif_config`

### 2. OfflineDB.js (`src/services/`)
- IndexedDB database `awunyo_offline` with stores: `offline_sales`, `offline_updates`
- `offlineDB.queueSale(sale)` — add to queue
- `offlineDB.getPendingSales()` — get unsynced
- `offlineDB.markSaleSynced(id)` / `markSaleFailed(id)`
- `offlineDB.queueUpdate({entity, action, payload})` — for inventory/customer offline edits
- `offlineDB.migrateFromLocalStorage()` — one-time migration from old localStorage queue
- `offlineDB.cleanup(daysOld)` — remove old synced records
- `useOfflineQueue(isOnline, setSales, notify)` — React hook; replaces old offlineQueue state

### 3. NotificationSettings.jsx (Settings → Notifications tab)
- EmailJS: service ID, template ID, public key + test button
- WhatsApp Meta API: phone number ID, bearer token, display name + test button
- Africa's Talking: username, API key, sender ID
- Hubtel: client ID, secret, sender ID
- SMS test button (uses whichever provider is enabled)
- Auto-send toggles: auto-send after sale, WhatsApp-first, email receipt

### 4. RolePermissionsView.jsx (Settings → Roles & Perms tab)
- Edit permissions for Owner, Manager, Sales roles
- 7 permission groups: Sales, Inventory, Customers, Reports, Staff/Users, Business Settings, Navigation Modules
- Per-group Select All / Clear All buttons
- Sticky Save button when unsaved changes exist
- Saves to localStorage `nx_role_perms` and applies to all users of that role

### 5. CustomersView.jsx — Enhanced Broadcast
- Channel picker: WhatsApp / SMS / Email with coloured icons
- Progress bar during broadcast
- Per-customer results log (sent/fallback/failed)
- Message template quick-fill buttons
- Character counter (500 max)
- Falls back to native app if no API configured + shows config reminder

### Auto-send Receipt Flow
After every sale in POSView:
1. `handleCompleteSale` finds the customer in `customers[]`
2. If customer has phone/email AND `cfg.auto_send_receipt !== false`
3. Calls `autoSendReceipt()` from NotificationService
4. WhatsApp → SMS fallback for phone; Email for email address
5. Shows status notification 1.5s after sale confirmation

### Folder Structure Addition
```
src/
  services/
    NotificationService.js   ← NEW
    OfflineDB.js             ← NEW
```

## Session 5 — Phase 5: UI/UX Overhaul + View Upgrades

### Updated Files
| File | What changed |
|------|-------------|
| `DashboardView.jsx` | Full rebuild: purple+gold theme, Georgia serif headings, 3 views (platform/store/cashier), real store-switcher buttons, bar chart with progress bars, no hardcoded indigo |
| `StaffView.jsx` | Full rebuild: new role labels (Owner/Manager/Sales), inline permission editor per user, shift history tab, activity log tab, photo upload, purple+gold theme |
| `ReportsView.jsx` | Full rebuild: tab-underline navigation, P&L statement, staff performance bars, promotion manager, scheduled reports, purple+gold throughout, Georgia serif headings |

### DashboardView — 3 distinct views
1. **Super Admin (no store selected)** — Platform stats, store list with "Enter" button, quick nav cards
2. **Super Admin (viewing a store)** — Shows that store's full manager dashboard with exit button
3. **Sales/Cashier** — Shift card (clock in/out), POS hero button (disabled if not clocked in), my sales today
4. **Manager/Owner** — Full KPI grid, recent sales, top products bar, stock alerts, payment breakdown

### StaffView — Rebuilt
- Tabs: Staff | Shifts | Activity Log
- Per-card inline permissions editor (click Edit → toggle modules → Save)
- Photo upload per staff member
- Role filter pills
- Add/Edit modal: name, email, phone, staff ID, position, department, role, password
- Reset password per user (separate modal)
- Shift history tab shows all clock-in/out records with revenue
- Activity log shows audit entries with role badges

### ReportsView — Rebuilt
- Tab-underline nav (Overview | P&L | Staff | Promotions | Shifts | Scheduled)
- Daily revenue bar chart
- Payment methods + category breakdown side by side
- Full P&L statement table (Revenue → COGS → Refunds → Gross Profit → Tax → Net Profit)
- Staff performance with progress bars
- Promotion CRUD (percent_off / fixed_off / free_item)
- Scheduled reports manager
- CSV + Excel export buttons
