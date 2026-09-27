# Development Rules & Coding Standards — DairyFlow

## 1. Absolute Scope & Architecture Constraints
- **Scope Discipline**: Implement strictly what is specified in requirements. Do NOT invent unsolicited features, arbitrary third-party services, or complex external API dependencies unless requested.
- **Port & Host Enforcement**: In development and container execution, the application must bind exclusively to port `3000` on host `0.0.0.0`.
- **API Key Security**: Sensitive credentials (e.g. database URLs, JWT secrets, Gemini API keys) must remain strictly server-side in `server.ts`. Never prefix server-only keys with `VITE_` or expose them in browser bundle.

---

## 2. Frontend & React 19 Guidelines

### 2.1 Component Architecture & Modularity
- Split large components into focused, reusable modules. Keep files under 350 lines when feasible.
- Place shared TypeScript interfaces in `src/types.ts`.
- Sub-components belong in `src/components/`, and primary views in `src/views/`.

### 2.2 React State & Hooks
- Avoid deep prop-drilling by utilizing React Context (`AppContext`, `ToastContext`).
- Avoid infinite re-renders: Never update state unconditionally inside render functions or `useEffect`.
- Only use primitives or memoized references in `useEffect` dependency arrays.

### 2.3 Styling Standards
- Default to **Tailwind CSS** utility classes directly.
- **Strictly Forbidden**: CSS-in-JS libraries (styled-components, emotion) and custom inline `style` objects (except dynamic numerical calculations like computed progress bars).
- Adhere to the mathematical padding rule: Container outer padding must equal or exceed inner child gaps. Button horizontal padding must equal `2x` vertical padding.

### 2.4 Animations & Motion
- All animations **MUST** be implemented using `motion/react` (imported from `motion/react`).
- Use spring transitions for tactile UI controls: `type: 'spring', damping: 28, stiffness: 350`.
- Use `AnimatePresence mode="wait"` for smooth view transitions without layout jumps.
- Include subtle micro-interactions on clickable buttons: `whileHover={{ scale: 1.01-1.02 }}` and `whileTap={{ scale: 0.95-0.98 }}`.

### 2.5 Icons
- All icons **MUST** be imported directly from `lucide-react`. Custom SVGs or third-party icon libraries are forbidden to ensure design consistency.

---

## 3. Backend & Database Rules

### 3.1 Express 5 Routing
- Mount API endpoints under `/api/*` prior to any static or SPA fallback middleware.
- In Express 5, catch-all routing uses `app.get('*all', ...)` or standard SPA static serving.
- Handle every asynchronous route with clean `try/catch` blocks or centralized error-handling middleware.

### 3.2 Database & Migrations
- Use **Drizzle ORM** for schema declarations and database interactions.
- Avoid raw string concatenation in SQL queries to prevent SQL injection; always use parameterized queries or Drizzle query builders.
- Ensure all financial calculations preserve monetary precision by utilizing decimal strings or rounded floats (`toFixed(2)`).

---

## 4. Error Handling & Logging Conventions
- **Client Side**: Display meaningful, non-technical feedback to the user via toast notifications (`showToast('Message', 'error' | 'success')`). Never leave users stranded on failed actions.
- **Server Side**: Log operational errors with timestamp and endpoint context using `console.error('[API Error /endpoint]', err)`.
- **Offline Fallback**: Network failures must gracefully transition to local IndexedDB operations without throwing unhandled promise rejections.

---

## 5. Coding Anti-Patterns (Banned Practices)
- ❌ Do NOT use browser alert modals (`window.alert`, `window.prompt`, `window.confirm`). Use styled React modal components or toasts.
- ❌ Do NOT commit hardcoded credentials, test passwords, or secrets to Git.
- ❌ Do NOT generate "AI Slop" visuals: no purple-to-blue gradient clichés, glowing neon drop shadows in dark mode, or nested card borders.
- ❌ Do NOT introduce external chart or UI packages if `d3`, `recharts`, or Tailwind can fulfill the design.
