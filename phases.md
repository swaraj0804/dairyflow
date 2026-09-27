# Implementation Roadmap & Phases — DairyFlow

## Overview of Development Lifecycle
The development of DairyFlow is structured into five progressive phases, transitioning from foundational data layers and offline caching to rich user flows, financial reporting, and production polish.

---

## Phase 1: Foundations, Schema, & Offline Engine
**Goal**: Establish project architecture, local client database, server endpoints, and authentication.

### Deliverables:
1. Initialize Vite + React 19 + TypeScript + Tailwind CSS project with Node/Express backend.
2. Configure **Drizzle ORM** with PostgreSQL schema for `users`, `milk_inward`, `customers`, `daily_finance`, and `expenses`.
3. Set up **Dexie.js** IndexedDB tables mirroring the server schema for local-first reads and writes.
4. Build `AuthView` with login, registration, and farm profile initialization.
5. Create `AppContext` and `ToastContext` providing global access to user state, active records, and notification toasts.

### Acceptance Criteria:
- Application starts reliably on port `3000`.
- Users can register and sign in; credentials/tokens persist across reloads.
- IndexedDB stores customer and collection tables locally.

---

## Phase 2: Core Farm Operations (Milk Inward & Daily Collection)
**Goal**: Enable farmers to record daily yields and track milk collections per shift.

### Deliverables:
1. Build `MilkInwardView` with interactive Morning/Evening shift toggles, quantity input, Fat/SNF calculations, and price preview.
2. Build Inward History tab with chronological sorting, shift filters, and delete actions.
3. Build `DailyFinanceView` with customer directory management (Add/Edit customer profiles, rate per liter, default quota).
4. Implement one-tap delivery confirmations (`Confirmed`, `Pending`, `Skipped`) for daily distribution batches.

### Acceptance Criteria:
- Farmer can record a 50L milk inward batch with 4.5% Fat in under 10 seconds.
- Customer delivery records automatically calculate total monetary amounts based on volume and assigned rate.
- Immediate write to IndexedDB with background synchronization.

---

## Phase 3: Expense Management & Cash Outflow
**Goal**: Provide accurate accounting of all farm operating expenses and feed costs.

### Deliverables:
1. Build `FarmExpensesView` supporting expense logging by category (Feed, Veterinary, Labor, Equipment, Utility, Other).
2. Integrate payment mode selection (Cash, UPI/Online, Bank Transfer).
3. Provide an Expense History list with filterable tags, monthly totals, and expense summaries.

### Acceptance Criteria:
- Expenses can be logged with receipt notes and dates.
- Instant balance recalculation on the active month's expense ledger.

---

## Phase 4: Financial Analytics, Balance Sheet & Export Engine
**Goal**: Deliver actionable financial intelligence and exportable reports.

### Deliverables:
1. Build `ReportsView` with Net Balance calculations (`Total Revenue - Operating Expenses`).
2. Build `MonthlyFinanceReportView` with a daily matrix grid showing each customer's daily intake for every day of the month.
3. Implement `exportToPdf` with custom farm headers, logo/branding, and tabular statements using `jspdf` and `jspdf-autotable`.
4. Implement `exportToExcel` providing `.xlsx` workbooks using SheetJS (`xlsx`).

### Acceptance Criteria:
- Net profit/loss dynamically updates as inward entries or expenses change.
- PDF and Excel files generate completely client-side in under 1.5 seconds and download cleanly on both mobile and desktop browsers.

---

## Phase 5: PWA Compliance, Animations & Final Polish
**Goal**: Ensure mobile-first tactile smoothness, installability, and UI polish.

### Deliverables:
1. Configure PWA manifest (`manifest.webmanifest`) and service worker for offline asset caching.
2. Integrate `motion/react` spring physics across all modals, drawers, cards, and page switches.
3. Build `BottomNav` with active floating pill animation (`layoutId="activeTabPill"`).
4. Build `SettingsView` with profile edit, shift reminder alerts, IndexedDB cache inspector, and sync status monitor.
5. End-to-end linting, TypeScript compilation, and accessibility audit.

### Acceptance Criteria:
- `tsc --noEmit` and Vite production build pass without errors.
- App is installable as a PWA on iOS and Android devices.
- Seamless offline usage: adding records offline and automatic sync upon network reconnection.
