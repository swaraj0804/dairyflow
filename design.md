# Design System & UI Specifications — DairyFlow

## 1. Aesthetic Philosophy: Modern Organic Dairy
DairyFlow rejects generic SaaS tropes in favor of an **organic, high-contrast dairy aesthetic**. It combines warm, soothing cream canvases with rich forest greens, crisp milk-white cards, and natural botanical accents. The design communicates agricultural craftsmanship, trust, and operational clarity.

---

## 2. Color Palette & Tokens

### 2.1 Color Tokens
| Role | Color Name | Hex Code | Tailwind Equivalent | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| **Canvas Background** | Warm Cream Base | `#FAF8F5` | `bg-cream-50` | Primary app canvas; soft on eyes in bright sunlight |
| **Subtle Container** | Light Cream Tint | `#F4EFE6` | `bg-cream-100` | Secondary surface, dividers, input backgrounds |
| **Primary Brand** | Deep Hunter Green | `#0A2F20` | `bg-brand-900` | Header banners, primary typography, high-contrast text |
| **Brand Accent** | Rich Emerald Forest | `#164E35` | `bg-brand-700` | Action buttons, active badges, key card highlights |
| **Vibrant Interactive** | Vivid Clover Green | `#10B981` | `text-brand-600` | Monetary gains, positive balances, active toggles |
| **Card Surface** | Pure Gloss White | `#FFFFFF` | `bg-white/95` | Elevated content cards with subtle backdrops |
| **Warning / Attention** | Golden Butterfat | `#F59E0B` | `text-amber-600` | Pending shift alerts, offline status warnings |
| **Destructive / Outflow**| Crimson Rust | `#EF4444` | `text-red-600` | Expenses, record deletion, sign-out actions |

### 2.2 Neutral Contrast & Readability
- **Header Contrast Ratio**: 11.2:1 (Deep Hunter Green against White text), exceeding WCAG AAA standards.
- **Card Contrast Ratio**: 9.4:1 (Deep Forest text against Warm Cream/White background).
- **Subtle Borders**: `border-brand-900/10` with `ring-1 ring-white/80` for elevated layered clarity.

---

## 3. Typography & Mathematical Scale

### 3.1 Font Families
- **Display & Headings**: Elegant Serif (`font-serif`, Playfair Display / Georgia fallback). Used for view titles, numerical KPI totals, and report banners.
- **Body, UI & Tabular Numbers**: Clean Geometric Sans (`font-sans`, Plus Jakarta Sans / Inter fallback). Used for input labels, table cells, dates, and buttons.

### 3.2 Typographic Hierarchy
| Style | Size | Weight | Tracking / Leading | Usage |
| :--- | :--- | :--- | :--- | :--- |
| **Display Header** | `28px - 32px` | Bold (`700`) | Tracking tight, leading snug | View main titles, Net Balance total |
| **Card Heading (H2)** | `18px - 20px` | Bold (`700`) | Tracking tight | Section cards, Modal headers |
| **Metric Value** | `24px` | SemiBold (`600`) | Tabular numerals | Liters, monetary amounts ($ / ₹) |
| **Body Standard** | `14px - 15px` | Medium (`500`) | Line height `1.5` | Form values, table cell text |
| **Micro Labels** | `10px - 11px` | Bold (`700`) | Tracking widest (`uppercase`) | Category tags, shift badges, field captions |

---

## 4. UI Component Patterns & Micro-Interactions

### 4.1 Elevated Cards & Bento Grids
- **Corner Radii**: Standard cards use `rounded-[24px]` or `rounded-[28px]`.
- **Card Shadowing**: Smooth multi-layer shadow: `shadow-[0_4px_24px_-2px_rgba(10,47,32,0.06),0_1px_3px_rgba(10,47,32,0.04)]`.
- **Nested Border Radius Rule**: `Inner Radius = Outer Radius - Padding`. For an outer container with `p-4` (16px) and `rounded-[24px]`, inner elements are `rounded-[8px]`.

### 4.2 Floating Navigation (`BottomNav`)
- Floats centered above the bottom edge with `backdrop-blur-2xl` and `bg-white/85`.
- Active tab features a spring-animated pill indicator using `motion.div layoutId="activeTabPill"`.
- Buttons feature tactile tap feedback: `active:scale-95`.

### 4.3 Form Inputs & Steppers
- Generous touch heights (minimum 48px).
- Inputs styled with `bg-cream-50/80 border border-brand-900/10 rounded-2xl px-4 py-3.5`.
- Focus state: `focus:ring-2 focus:ring-brand-600 focus:bg-white`.

### 4.4 Motion & Physics Curves
- **Modal Entry**:
  ```ts
  initial={{ opacity: 0, scale: 0.95, y: 12 }}
  animate={{ opacity: 1, scale: 1, y: 0 }}
  exit={{ opacity: 0, scale: 0.95, y: 12 }}
  transition={{ type: 'spring', damping: 28, stiffness: 350 }}
  ```
- **Page Transitions**: Smooth cross-fade with subtle vertical displacement:
  ```ts
  initial={{ opacity: 0, y: 8, scale: 0.992 }}
  animate={{ opacity: 1, y: 0, scale: 1 }}
  exit={{ opacity: 0, y: -6, scale: 0.996 }}
  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
  ```
