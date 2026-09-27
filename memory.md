# Project Memory & Session State — DairyFlow

## 1. Project Overview & Context
- **Application Name**: DairyFlow
- **Core Domain**: Modern, minimalist dairy farm management application (Milk Inward, Daily Finance Ledger, Farm Operating Expenses, Reports & Analytics, Offline IndexedDB Sync, PWA).
- **Current Runtime**: Node.js + Express 5 backend with React 19 + TypeScript + Vite + Tailwind CSS v4 on Port 3000.
- **Primary Design Aesthetic**: Modern Organic Dairy (Warm cream `#FAF8F5`, Hunter green `#0A2F20`, Emerald `#164E35`, Serif display paired with geometric sans-serif, Motion physics).

---

## 2. Completed Tasks Log
- [x] **Core Architecture Setup**: Full-stack Vite + Express 5 with dual persistence (PostgreSQL / Drizzle ORM + client Dexie IndexedDB).
- [x] **Milk Inward Module (`MilkInwardView.tsx`)**: Morning & evening collection logging, Fat/SNF calculations, rate per liter, history log with filters.
- [x] **Daily Finance Module (`DailyFinanceView.tsx`)**: Customer registration modal, recurring quota tracking, shift delivery status confirmations (`Confirmed`, `Pending`, `Skipped`).
- [x] **Farm Expenses Module (`FarmExpensesView.tsx`)**: Categorized expense entries (Feed, Veterinary, Labor, Equipment, Utility), payment modes, and monthly totals.
- [x] **Reports & Analytics (`ReportsView.tsx`)**: Net margin calculations, revenue breakdown, expense distribution, and high-level financial summary.
- [x] **Monthly Milk Intake Grid (`MonthlyFinanceReportView.tsx`)**: Cross-tabular customer delivery sheet for every day of the month with summary totals and one-click PDF & Excel exports.
- [x] **Export Engine (`src/lib/exportUtils.tsx`)**: Client-side PDF generation via `jspdf` / `jspdf-autotable` and Excel `.xlsx` spreadsheets via `xlsx`.
- [x] **Offline Cache & Sync Engine (`src/lib/db.ts`, `SettingsView.tsx`)**: IndexedDB schema, outbox queueing, network status listeners, and manual/automatic cloud sync.
- [x] **App-Wide Animations (`motion/react`)**: Spring physics, modal entrances, staggered list animations, and active bottom navigation indicator (`layoutId="activeTabPill"`).
- [x] **UI Polish & Gradient Removal**: Cleaned up scroll container styling, removed obsolete scroll overlay gradients, and calibrated font/spacing tokens.

---

## 3. Currently Active Files & Components
- **`src/App.tsx`**: Main navigation shell, route controller (`home`, `finance`, `inward`, `expenses`, `reports`, `monthlyFinanceReport`, `settings`), and floating `BottomNav`.
- **`src/views/HomeView.tsx`**: Executive overview, quick metric cards, shortcuts to all primary modules, recent activity stream.
- **`src/views/DailyFinanceView.tsx`**: Customer milk delivery ledger and registration dialog.
- **`src/views/MilkInwardView.tsx`**: Primary milk collection entry form and historical record viewer.
- **`src/views/FarmExpensesView.tsx`**: Operating expenses logger and category filter.
- **`src/views/ReportsView.tsx`**: Financial balance sheet and analytics graphs.
- **`src/views/MonthlyFinanceReportView.tsx`**: Comprehensive 31-day intake matrix with export capabilities.
- **`src/views/SettingsView.tsx`**: Profile editor, shift collection reminder notifications, IndexedDB status monitor, and data backups.
- **`src/context/AppContext.tsx`**: Primary React Context orchestrating data sync, user auth, and local-to-cloud mutations.

---

## 4. Key Notes & Guidelines for Subsequent AI Sessions
1. **Always Verify Compilation**: Run `compile_applet` and `lint_applet` (`tsc --noEmit`) after modifications to ensure type safety and error-free builds.
2. **Animation Consistency**: When introducing new components or modals, use `motion/react` spring configurations (`damping: 28, stiffness: 350`) and wrap dynamic views in `AnimatePresence`.
3. **Preserve Offline-First Capability**: Ensure all write actions continue to commit immediately to `dexie` (`db.ts`) so farmers retain full functionality when in areas with weak cellular signal.
4. **Export Integrity**: Always verify that table exports in `exportUtils.tsx` handle missing customer rates or empty daily records gracefully without throwing runtime errors.
5. **No Visual Slop**: Maintain the organic dairy palette (creams and forest greens); avoid introducing harsh neon glows, generic AI SaaS templates, or unnecessary third-party widget dependencies.
