# CRM Layout & Design – Issues & Fixes

## Issues identified and fixed

### 1. **#root layout (full-width CRM)**
- **Issue:** `App.css` had `#root { max-width: 1280px; margin: 0 auto; padding: 2rem; text-align: center; }` (CRA default), which would limit the app width and centre content.
- **Fix:** Replaced with `#root { width: 100%; min-height: 100%; margin: 0; padding: 0; text-align: left; }` in `App.css`. Added the same in `index.css` so behaviour is correct even if only `index.css` is loaded.

### 2. **Unused CRA styles in App.css**
- **Issue:** `.logo`, `.logo:hover`, `@keyframes logo-spin`, `.card`, `.read-the-docs` were unused and could affect layout if used by mistake.
- **Fix:** Removed these from `App.css`. Kept only `#root` and sidebar/main-content/header-bar layout styles.

### 3. **Content area padding**
- **Issue:** Content wrapper had `pb-0`, so no bottom padding on desktop/mobile; content could sit flush with bottom or mobile nav.
- **Fix:** In `Layout.jsx`, content wrapper updated to `p-4 pb-6 md:p-6 md:pb-8 lg:p-8 lg:pb-8` for consistent bottom padding.

### 4. **Scrollbar consistency**
- **Issue:** Sidebar nav and main content did not use the same scrollbar styling.
- **Fix:** Added `custom-scroll` to the main content area and to the sidebar `<nav>` in `Layout.jsx` so both use the same scrollbar (from `index.css`).

### 5. **Login page**
- **Issue:** No focus rings for accessibility; card could be tight on small screens.
- **Fix:**  
  - Wrapper: `px-4 py-6` for mobile.  
  - Card: `p-6 sm:p-8`, `rounded-xl`.  
  - Inputs: `focus:outline-none`, `py-2.5`.  
  - Submit button: `focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`, `py-2.5`.

### 6. **Header and content alignment**
- **Issue:** Header height was `h-auto lg:h-16`, so on mobile it could grow and content (`pt-16`) could go under the header.
- **Fix:** Header: `min-h-14 lg:min-h-16 lg:h-16`. Content area: `pt-14 lg:pt-16` so top spacing matches header on mobile and desktop.

### 7. **Forgot Password page**
- **Issue:** Same as Login – no mobile padding, no focus styles.
- **Fix:** Same pattern as Login: outer `px-4 py-6`, card `p-6 sm:p-8 rounded-xl`, input/button focus and padding.

### 8. **App.css not loaded**
- **Issue:** `App.css` was never imported, so sidebar/main-content/header-bar and updated `#root` styles were not applied.
- **Fix:** Added `import './App.css'` in `main.jsx`.

---

## Files changed

- `src/App.css` – #root fix, removed unused CRA styles  
- `src/index.css` – #root full-width rules  
- `src/main.jsx` – import `App.css`  
- `src/components/Layout.jsx` – content padding, custom-scroll, header min-height, content pt-14/pt-16  
- `src/pages/Login.jsx` – mobile padding, focus styles, button/input padding  
- `src/pages/ForgotPassword.jsx` – mobile padding, focus styles  

---

## Result

- CRM uses full width; no 1280px cap or centred layout.  
- Content has consistent top/bottom padding and does not sit under header or bottom nav.  
- Sidebar and main area share the same scrollbar look.  
- Login and Forgot Password are usable on mobile and have proper focus states.  
- Header height and content top spacing are aligned on mobile and desktop.
