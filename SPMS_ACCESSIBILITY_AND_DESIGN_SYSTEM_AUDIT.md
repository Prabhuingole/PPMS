# SPMS Phase 5.4 – Accessibility & Design System Compliance Audit

## Executive Summary
This audit evaluates the SPMS frontend architecture following the completion of Phase 5.3. The focus of this review is Accessibility (a11y), WCAG compliance, Design System adherence, and readiness for a Dark Mode implementation. 

---

## 1. Accessibility Evaluation

* **Keyboard Navigation**: **Fair.** Standard components inherited from `shadcn/ui` (Dialogs, Selects, Drawers) maintain native keyboard navigation. However, custom interactive components (e.g., custom cards, workspace panes, custom buttons) frequently lack proper `tabIndex` and keyboard event handlers.
* **Focus States**: **Poor.** Focus states are heavily fragmented. While standard components use `focus-visible:ring-ring`, custom forms (like `EmployeeForm.tsx`) use hardcoded contextual focus rings (e.g., `focus-visible:ring-indigo-500`, `focus-visible:ring-emerald-500`, `focus-visible:ring-amber-500`). This breaks visual consistency for keyboard users.
* **ARIA Attributes**: **Fair.** Radix UI primitives provide a strong baseline, but custom DataTables and custom widgets lack `aria-live` regions for dynamic content and `aria-describedby` for form errors.
* **Dialog/Drawer/DataTable Accessibility**: **Good.** Leveraging `radix-ui` provides out-of-the-box screen reader support and focus trapping for these components.
* **WorkspaceLayout Accessibility**: **Needs Work.** The complex 3-pane layout lacks proper ARIA landmarks (`role="region"`, `aria-label`) to help screen readers distinguish between the primary list, secondary details, and editor panes.

---

## 2. WCAG Compliance

* **Contrast Ratios**: **Critical Violation.** The widespread use of `text-slate-400` and `text-slate-300` on `bg-white` and `bg-slate-50` backgrounds fails WCAG 2.1 AA contrast requirements (requires 4.5:1).
* **Status Badges**: **Warning.** Status badges use custom hardcoded background/text combinations (e.g., `bg-slate-50 text-slate-600`) which often lack sufficient contrast differentiation to be accessible.
* **Error States**: **Good.** The newly introduced `ErrorState` component utilizes standard readable text, though inline form validation still relies on small, low-contrast text in some legacy components.
* **Typography**: **Fair.** Font sizes are generally legible, but the overuse of `text-[10px]` with `uppercase tracking-widest` for labels reduces readability for visually impaired users.

---

## 3. Design System Compliance

* **Hardcoded Colors**: **Critical Violation.** A global codebase scan reveals massive deviations from the established Design System tokens:
  * Over **174 instances** of hardcoded `text-slate-[X]`
  * Over **66 instances** of hardcoded `bg-slate-[X]`
* **Hardcoded Spacing/Radii**: **Warning.** Components frequently bypass design tokens by using arbitrary values like `rounded-2xl` or `rounded-3xl` instead of standard semantic radii variables (e.g., `rounded-lg`).
* **Non-standard Shadows**: **Warning.** Shadows rely on arbitrary Tailwind classes (`shadow-xl shadow-slate-200/50`) rather than unified, semantic shadow tokens.

---

## 4. Dark Mode Readiness

* **Semantic Tokens Usage**: **Minimal.** The application heavily avoids semantic tokens (`bg-background`, `bg-card`, `text-primary`, `text-muted-foreground`). 
* **Hardcoded Slate Colors**: **Severe.** The core UI relies completely on the assumption of a light theme via `slate` utility classes. 
* **Migration Effort Estimate**: **High.** Implementing Dark Mode currently is impossible without a massive refactoring effort. Over 300+ individual class declarations across the application must be mapped and migrated to CSS variables.

---

## 5. Top 5 Accessibility Issues (High Priority)

1. **Low Contrast Text**: `text-slate-400` on light backgrounds is illegible for visually impaired users.
2. **Inconsistent Focus Rings**: Form inputs change focus ring colors (emerald, amber, indigo) randomly, confusing keyboard users.
3. **Missing Focus Outlines**: Several custom buttons and interactive `div` elements drop `focus-visible` entirely.
4. **Micro-Typography**: `text-[10px]` uppercase labels fail minimum readability standards.
5. **Landmark Missing**: The `WorkspaceLayout` lacks ARIA regions, making screen reader navigation between panes nearly impossible.

---

## 6. Top 5 Design System Violations

1. **Theme Bypassing**: Universal hardcoding of `bg-slate-50`, `bg-slate-100`, and `bg-slate-900` across pages, layouts, and components.
2. **Foreground Hardcoding**: Direct use of `text-slate-500`, `text-slate-700`, and `text-slate-900` instead of `text-foreground` or `text-muted-foreground`.
3. **Border Hardcoding**: `border-slate-200` is used globally instead of `border-border`.
4. **Rogue Radii**: Extensive use of `rounded-2xl` bypassing standard UI component library constraints.
5. **Contextual Branding**: Hardcoding `bg-indigo-600` instead of `bg-primary`.

---

## 7. Production Readiness Reassessment

| Metric | Score | Status |
|---|---|---|
| **Accessibility Score** | **65 / 100** | 🟡 Needs Attention |
| **Design System Compliance Score** | **30 / 100** | 🔴 Critical |
| **Dark Mode Readiness Score** | **10 / 100** | 🔴 Critical |
| **Updated Production Readiness Score** | **75 / 100** | 🟡 Good (Functionally ready, visually non-compliant) |

---

# Final Verdict

**SPMS is currently NOT READY for Dark Mode implementation.**

The codebase is fundamentally tethered to hardcoded `slate` utility classes. Attempting to implement Dark Mode by adding `dark:bg-slate-900` to hundreds of elements will result in severe technical debt and an unmaintainable codebase.

**Required Action:**
Before any Dark Mode toggles are implemented, the project must undergo a **Design System Token Migration Phase** to strip all hardcoded colors and replace them with semantic CSS variables (`var(--background)`, `var(--card)`, `var(--primary)`, etc.).
