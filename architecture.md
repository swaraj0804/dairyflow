# System Architecture — DairyFlow

## 1. High-Level Architecture Overview
DairyFlow is built on an **Offline-First Full-Stack Architecture** combining a high-performance Single Page Application (React 19 + TypeScript + Vite) with a lightweight Node.js/Express service and a dual-storage strategy:
- **Client Storage Layer**: IndexedDB via Dexie.js for instant local reads and optimistic offline-first writes.
- **Server Persistence Layer**: Express 5 REST API + Drizzle ORM connecting to PostgreSQL (Neon serverless cloud database).

```
+-------------------------------------------------------------------------+
|                              Client (PWA)                               |
|                                                                         |
|  [ React 19 UI ] <---> [ AppContext & Hooks ]                           |
|         |                        |                                      |
|         v                        v                                      |
|  [ Motion Engine ]     [ Dexie.js (IndexedDB) ]                         |
|                                  |                                      |
|                        [ Sync / Outbox Engine ]                         |
+----------------------------------+--------------------------------------+
                                   | HTTP / JSON (Bearer Auth)
                                   v
+-------------------------------------------------------------------------+
|                        Server (Node.js + Express 5)                     |
|                                                                         |
|  [ /api/auth ]     [ /api/milk-inward ]     [ /api/finance ]            |
|  [ /api/expenses ] [ /api/customers ]       [ /api/sync ]               |
|                                  |                                      |
|                        [ Drizzle ORM ]                                  |
|                                  v                                      |
|                  [ PostgreSQL Database (Neon) ]                         |
+-------------------------------------------------------------------------+
```

---

## 2. Tech Stack & Justifications

| Component | Technology | Version | Rationale & Justification |
| :--- | :--- | :--- | :--- |
| **Frontend Framework** | React + TypeScript | 19.x / 5.8 | Modern functional component model with strict type safety, fast state updates, and robust ecosystem. |
| **Build & Dev Tooling** | Vite | 6.x | Near-instant cold start, blazing-fast HMR in development, and optimized production bundling with esbuild. |
| **Styling** | Tailwind CSS | v4 | Modern utility-first CSS engine with zero-runtime footprint, responsive design utilities, and CSS variables. |
| **Motion & Animation** | Motion (`motion/react`) | 12.x | High-performance spring-based transitions, layout animations (`layoutId`), and micro-interactions without jank. |
| **Client Local DB** | Dexie.js (`dexie`) | 4.x | Fast, promise-based wrapper over browser IndexedDB with relational table querying and reactive hooks. |
| **Backend Runtime** | Express 5 on Node.js | 5.2.x | Standardized RESTful endpoints, robust middleware chaining, and native async route handling. |
| **ORM / Data Access** | Drizzle ORM | 0.45.x | Type-safe SQL builder with zero runtime overhead, schema migration automation, and pure TypeScript definitions. |
| **Cloud Database** | PostgreSQL (Neon) | 8.x (pg) | Durable relational persistence, reliable ACID transactions for financial records, and serverless scale-to-zero. |
| **Reporting & Export** | jsPDF + XLSX | Latest | In-browser client-side generation of audit-ready PDFs and Excel spreadsheets without server CPU overhead. |
| **Iconography** | Lucide React | Latest | Clean, consistent, tree-shakeable stroke-based vector icons for farm workflows. |

---

## 3. Directory & File Structure

```text
/
├── server.ts                    # Express 5 server & API routes
├── vite.config.ts               # Vite configuration & PWA plugins
├── package.json                 # Dependency manifest & scripts
├── tsconfig.json                # TypeScript compiler configuration
├── metadata.json                # Applet configuration & metadata
├── src/
│   ├── main.tsx                 # Client application entry point
│   ├── App.tsx                  # Root component, routing & navigation shell
│   ├── index.css                # Global Tailwind CSS directives
│   ├── types.ts                 # TypeScript shared data models & enums
│   ├── context/
│   │   ├── AppContext.tsx       # Global state manager, active user & cloud sync
│   │   └── ToastContext.tsx     # Toast notification system
│   ├── lib/
│   │   ├── db.ts                # Dexie IndexedDB client schema & operations
│   │   ├── exportUtils.tsx      # PDF and Excel export engine
│   │   └── utils.ts             # Date formatting and currency helpers
│   ├── components/
│   │   ├── BottomNav.tsx        # Floating navigation bar with animated indicator
│   │   └── ScrollAreaWithGradients.tsx # Scroll container utility
│   └── views/
│       ├── HomeView.tsx         # Executive dashboard, quick actions, metric tiles
│       ├── MilkInwardView.tsx   # Milk logging, shift selection, quality metrics
│       ├── DailyFinanceView.tsx # Customer distribution ledger & confirmations
│       ├── FarmExpensesView.tsx # Expense tracking, category filters, receipts
│       ├── ReportsView.tsx      # Analytics, balance sheet, net profit/loss
│       ├── MonthlyFinanceReportView.tsx # Full-month daily intake matrix & export
│       ├── SettingsView.tsx     # Profile, shift alerts, security, local cache
│       └── AuthView.tsx         # User authentication & farm registration
└── public/
    └── manifest.webmanifest     # Progressive Web App metadata & icons
```

---

## 4. Data Flow & Synchronization Strategy
1. **Optimistic Local Write**: Every entry (milk inward, customer payout, expense) is immediately written to the local IndexedDB database. The UI updates instantaneously.
2. **Outbox Queueing**: If the device is offline, operations are tagged with status `pending_sync` in the local outbox.
3. **Automatic Synchronization**: A background worker monitors network state (`navigator.onLine`). When connected, it batches pending items to `/api/sync`.
4. **Conflict Resolution**: Server-side timestamp resolution (`updatedAt`) ensures authoritative persistence in PostgreSQL with zero data loss.
