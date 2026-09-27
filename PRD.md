# Product Requirement Document (PRD) — DairyFlow

## 1. Executive Summary & Overview
**DairyFlow** is a modern, responsive, offline-first dairy farm management application tailored for independent dairy farmers, commercial farm supervisors, and local milk collection centers. It simplifies and automates daily dairy operations by providing fast, error-free milk inward recording (supporting morning and evening shifts, fat/SNF quality metrics, and cattle types), customer distribution ledger tracking, farm expense categorizations, comprehensive financial reporting with exportable documentation (PDF and Excel), and offline-first IndexedDB persistence.

---

## 2. Target Audience & User Personas

### 2.1 Target Audience
- Independent family dairy farmers managing herds of 5 to 100+ cattle.
- Rural and peri-urban milk collection centers and cooperative collection agents.
- Commercial dairy farm managers tracking yield, cattle feed overhead, and worker payroll.

### 2.2 User Personas
* **Ramesh (Independent Dairy Farmer)**: Needs a fast, high-contrast mobile interface with large buttons to record morning (6:00 AM) and evening (6:00 PM) milk yields directly from the milking shed, often with spotty or no cellular connectivity.
* **Suresh (Milk Collection Center Agent)**: Needs to quickly record milk deposits for 30+ registered local farmers/customers, automatically calculate payouts based on Fat % and volume, and export weekly/monthly statements in PDF/Excel for payment settlement.
* **Anita (Farm Operations & Finance Manager)**: Oversees farm purchasing (silage, concentrated feed, veterinary care, equipment repair) and needs real-time insight into the farm's net monthly cash flow and balance sheet.

---

## 3. Core Feature Breakdown & Functional Requirements

### 3.1 Milk Inward & Quality Logging
- **Shift Management**: Support for distinct Morning and Evening collection sessions.
- **Entry Metrics**: Record Date, Quantity in Liters, Fat Percentage, SNF (Solid-Not-Fat), Rate per Liter, Total Computed Value, Animal Source (Cow / Buffalo / Mixed).
- **Log History**: Real-time list of inward records with search, filtering by date range and shift, and deletion/correction capabilities.
- **Automatic Price Calculation**: Option to calculate total cost using fixed rates or quality-based formulas (`Price = Volume * BaseRate` or quality multiplier).

### 3.2 Customer Ledger & Daily Milk Distribution (Finance)
- **Customer Directory**: Add, update, and manage customer profiles (Name, Phone Number, Assigned Daily Quantity, Agreed Rate/L).
- **Daily Dispatch & Confirmations**: Quick-entry table for recording milk delivered to each customer per shift, with one-tap status toggles (Confirmed / Pending / Skipped).
- **Outstanding Balances**: Real-time tracking of unpaid balances, invoice reconciliation, and historical payment logs.

### 3.3 Farm Operating Expenses
- **Categorization**: Multi-category tagging (Cattle Feed & Silage, Veterinary & Medicines, Labor & Payroll, Equipment Maintenance, Fuel & Utility, Miscellaneous).
- **Transaction Details**: Amount, Date, Vendor / Payee Name, Payment Mode (Cash, Bank Transfer, UPI/Digital), and Notes/Receipt description.
- **Summary Visuals**: Instant calculation of total monthly expenditure and category-wise percentage breakdowns.

### 3.4 Financial Analytics, Balance Sheet & Reports
- **Executive Dashboard**: Key performance indicators: Today's Milk Collection (Liters), Daily Revenue, Monthly Cumulative Milk, Monthly Net Margin (`Total Revenue - Total Expenses`).
- **Monthly Milk Intake Grid**: Cross-tabulated matrix showing daily milk delivery per customer across all 28–31 days of any selected month.
- **Document Exporting**:
  - High-resolution, printable PDF generation using `jspdf` and `jspdf-autotable`.
  - Structured Excel `.xlsx` spreadsheets using SheetJS (`xlsx`) for accountants and cooperative audits.

### 3.5 Offline-First Architecture & Data Synchronization
- **Local Persistence**: Instant zero-latency caching using client-side IndexedDB (`dexie`).
- **Offline Ingress**: Uninterrupted record entry while offline; operations are queued into an outbox store.
- **Background Sync**: Automatic replay and reconciliation with the cloud database (PostgreSQL / Neon via Express backend) upon network recovery.

### 3.6 Settings, Security & Farm Profile
- **Farm Profile Customization**: Farm name, operator contact details, default currency, and address for export headers.
- **Collection Shift Reminders**: Web browser notification scheduling for morning and evening collection windows.
- **Security**: Local session protection, password management, and data backup exports.

---

## 4. Non-Functional Requirements
- **Performance**: Initial route load under 1.2s; subsequent transitions under 100ms via client-side routing.
- **Accessibility & Contrast**: WCAG AA compliance with high-contrast text against warm neutral backgrounds for outdoor barn readability.
- **Reliability**: Zero data loss guarantee during network dropouts through immediate IndexedDB commits.
- **Mobile First Touch Precision**: Minimum 44px touch targets on all interactive buttons, pills, and input controls.
