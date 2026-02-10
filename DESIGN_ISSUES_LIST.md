# TravelOps CRM – Design Related Issues List

**Generated:** Full codebase scan  
**Scope:** Frontend (React + Tailwind), global CSS, Layout & pages

---

## 1. Colors & Theming

| # | Issue | Location / Detail | Priority |
|---|--------|-------------------|----------|
| 1.1 | **Hardcoded hex colors** | 200+ inline hex/rgb (e.g. `#D8DEF5`, `#F7FAFC`, `#667eea`) across LeadDetails, EmailTemplates, DashboardStatsCards, Layout, Settings, PaymentCollectionTable, etc. Theme change karne par ye update nahi honge. | Medium |
| 1.2 | **`bg-primary` / `text-primary`** | Leads.jsx, TodayQueriesCard.jsx, button.jsx, badge.jsx use `bg-primary` / `text-primary`. `tailwind.config.js` mein `primary` extend nahi hai – CSS variables (`--primary`) se map karne ke liye theme extend karna padega, warna class ka effect na ho sakta hai. | High |
| 1.3 | **Scrollbar hardcoded** | `index.css`: `.custom-scroll` scrollbar track/thumb par `#ffffff`, `#9DC7F1` hardcoded. Dark theme ya company theme ke saath mismatch ho sakta hai. | Low |
| 1.4 | **Dark mode defined but unused** | `index.css` mein `.dark` CSS variables hain, lekin app mein dark mode toggle/use nahi hai. Ya to remove karein ya implement karein. | Low |
| 1.5 | **QueriesHeader hardcoded colors** | `Headers/QueriesHeader.jsx`: `bg-[#F7FAFC]`, `bg-[#F8FAFC]`. Component ab use nahi ho raha, lekin agar future mein use karenge to theme se align karna better. | Low |

---

## 2. Layout & Spacing

| # | Issue | Location / Detail | Priority |
|---|--------|-------------------|----------|
| 2.1 | **Dashboard fixed min-width** | `Dashboard.jsx`: `min-w-[1280px]` – chote screens par horizontal scroll hoga, mobile experience kharab. Responsive grid/breakpoints chahiye. | High |
| 2.2 | **Inconsistent padding** | Kahi `p-4`, kahi `p-6`, kahi `p-8` / `px-4 py-3` – page-to-page consistency nahi. Standardise (e.g. content area `p-4 md:p-6`) consider karein. | Medium |
| 2.3 | **Inconsistent border radius** | `rounded-md`, `rounded-lg`, `rounded-xl`, `rounded-2xl` mixed use – cards, buttons, inputs alag-alag feel dete hain. Ek scale (e.g. card=rounded-xl, button=rounded-lg) fix karein. | Medium |
| 2.4 | **Modal/dialog max-height** | Kai modals `max-h-[90vh]` use karte hain – chote viewports par bhi theek, lekin kahi `max-h-[80vh]` ya no max-height bhi hai. Consistent pattern use karein. | Low |

---

## 3. Typography

| # | Issue | Location / Detail | Priority |
|---|--------|-------------------|----------|
| 3.1 | **Page title sizes inconsistent** | Kahi `text-2xl`, kahi `text-3xl`, kahi `text-xl font-[700]` – same level headings ke liye ek scale (e.g. page title = `text-2xl font-bold`) use karein. | Medium |
| 3.2 | **Table header styles** | Table headers: mostly `text-xs font-medium text-gray-500 uppercase`, lekin kahi alag padding/alignment. Reusable table header class/component se consistency aa sakti hai. | Low |
| 3.3 | **Font family** | `index.css` mein Nunito Sans + system stack. Tailwind config mein fontFamily extend nahi – agar globally change karna ho to config use karein. | Low |

---

## 4. Components & Reusability

| # | Issue | Location / Detail | Priority |
|---|--------|-------------------|----------|
| 4.1 | **Button styles mixed** | Kai jagah `bg-blue-600 hover:bg-blue-700`, kahi `bg-primary`, kahi orange/green for actions. Primary/secondary/danger button variants ek design system (e.g. ui/button) se use karein. | Medium |
| 4.2 | **Form inputs inconsistent** | Inputs: kahi `border border-gray-300 rounded-lg`, kahi `rounded-xl`, kahi `focus:ring-2 focus:ring-blue-500`. Shared input component ya consistent Tailwind classes use karein. | Medium |
| 4.3 | **Card styles** | Cards: `bg-white rounded-lg shadow`, `rounded-xl shadow-sm`, `shadow-md` – different combinations. Ek card variant (e.g. default = white + rounded-xl + shadow-sm) standardise karein. | Low |
| 4.4 | **Empty states** | "No data" / empty list messages alag-alag styling (centering, padding, icon). Ek EmptyState component se uniform look aa sakta hai. | Low |

---

## 5. Responsive & Mobile

| # | Issue | Location / Detail | Priority |
|---|--------|-------------------|----------|
| 5.1 | **Dashboard not responsive** | Dashboard grid `min-w-[1280px]` – mobile/tablet par scroll ya broken layout. Breakpoints (e.g. 1 col mobile, 2 tablet, 12 col desktop) add karein. | High |
| 5.2 | **Tables on small screens** | Kai list/table pages par sirf `overflow-x-auto` – headers/data chote screens par padhna mushkil. Consider card layout on mobile ya sticky columns. | Medium |
| 5.3 | **Fixed widths** | `min-w-[220px]`, `w-64`, `max-w-4xl` etc. kahi breakpoints ke saath nahi – chote viewport par overflow/overlap ho sakta hai. | Medium |
| 5.4 | **Mobile bottom nav** | Layout: bottom tabs lg:hidden. Ensure active state + spacing sab devices par consistent hai. | Low |

---

## 6. Z-Index & Overlays

| # | Issue | Location / Detail | Priority |
|---|--------|-------------------|----------|
| 6.1 | **Z-index values scattered** | `z-10`, `z-40`, `z-50`, `z-[60]` – modal, dropdown, sidebar alag files mein. Ek scale (e.g. dropdown=40, modal=50, toast=60) define karke use karein taaki overlap bugs na aayein. | Medium |
| 6.2 | **Modal backdrop** | Kai modals `bg-black bg-opacity-50` – consistent; kahi `bg-black/50` ya `bg-opacity-60`. Ek backdrop utility use karein. | Low |

---

## 7. Focus & Accessibility

| # | Issue | Location / Detail | Priority |
|---|--------|-------------------|----------|
| 7.1 | **Focus styles missing** | Kai buttons/links par sirf `hover:` hai, `focus:ring-2` / `focus:outline-none` nahi – keyboard users ko focus visible nahi dikhega. | Medium |
| 7.2 | **Focus styles inconsistent** | Jahan focus hai wahan bhi alag-alag (focus:ring-blue-500, focus:ring-2). Ek default focus ring (e.g. ring-2 ring-primary) use karein. | Low |
| 7.3 | **Color contrast** | Gray text on light gray background (e.g. `text-gray-500` on `bg-gray-50`) – WCAG check karein, contrast kam ho to darken text/background. | Low |

---

## 8. Inline Styles vs Tailwind

| # | Issue | Location / Detail | Priority |
|---|--------|-------------------|----------|
| 8.1 | **Heavy inline styles** | LeadDetails, EmailTemplates, reportGenerator – HTML email templates aur PDF ke andar inline `style="..."` – maintain karna mushkil. Jahan possible ho, shared style object ya utility use karein. | Low |
| 8.2 | **Layout/style mix** | Kahi `style={{ backgroundColor }}` (dynamic theme), kahi Tailwind – thik hai; bas jahan theme color chahiye wahan Tailwind hardcode (e.g. bg-gray-100) hata kar theme use karein. | Medium |

---

## 9. Loading & Empty States

| # | Issue | Location / Detail | Priority |
|---|--------|-------------------|----------|
| 9.1 | **ProtectedRoute loading** | Loading spinner ke wrapper mein koi background nahi – white/gray default dikhega. Theme background (e.g. dashboard_background_color) yahan bhi laga sakte hain. | Low |
| 9.2 | **Skeleton vs spinner** | Kai jagah sirf spinner; lists/tables ke liye skeleton loaders se UX better ho sakta hai. | Low |

---

## 10. Specific Pages / Components

| # | Issue | Location / Detail | Priority |
|---|--------|-------------------|----------|
| 10.1 | **Users.jsx – TODO** | "Edit functionality coming soon" – UI incomplete. | High |
| 10.2 | **Leads filters** | noConnect, postponed, invalid filters "Not implemented yet" – empty result, confusing. | Medium |
| 10.3 | **LandingPages.jsx** | "Coming Soon" option in dropdown – either implement ya remove. | Low |
| 10.4 | **LeadDetails – Post Sales** | Tab shows "Post sales management coming soon" – placeholder. | Low |
| 10.5 | **QueriesHeader.jsx** | Unused component – ya use karein ya delete; design debt kam hoga. | Low |

---

## 11. Summary – Priority Order

**High**
- Dashboard responsive (min-width 1280) fix karein.
- `bg-primary` / theme: Tailwind theme extend karke primary use karein ya in components ko explicit color (e.g. bg-blue-600) dein.

**Medium**
- Inconsistent padding / radius / shadows – ek design token ya shared classes.
- Button & input consistency – design system / ui components.
- Tables + small screens – overflow/card layout.
- Z-index scale define karke use karein.
- Focus styles sab interactive elements par.

**Low**
- Scrollbar, dark mode, QueriesHeader, empty states, modal max-height, typography scale, card variants, ProtectedRoute loading background.

---

## 12. Recommended Next Steps

1. **Tailwind theme extend** – `primary`, `secondary` (CSS vars se) add karein; phir `bg-primary` etc. reliably kaam karengi.
2. **Dashboard.jsx** – grid ko responsive banao (e.g. `grid-cols-1 md:grid-cols-2 lg:grid-cols-12`, `min-w-[1280px]` hatao ya sirf lg+ par lagao).
3. **Design tokens** – ek file (e.g. `designTokens.js` ya Tailwind extend) mein spacing scale, radius scale, shadow list define karein; pages mein yahi use karein.
4. **Button/Input** – `components/ui` ke button/input ko default variant banao; gradually pages ko in components se replace karein.
5. **Z-index** – e.g. `z-dropdown: 40, z-modal: 50, z-toast: 60` tailwind extend mein add karein aur codebase mein replace karein.

Is list ko sprint/backlog mein daal kar priority ke hisaab se fix kiya ja sakta hai.
