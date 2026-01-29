# Setup Flow: Super Admin → Company → Ready-to-Use CRM (WhatsApp + Email)

## Flow Overview

1. **Super Admin** adds a company (tenant).
2. That company gets its own CRM instance (multi-tenant).
3. **Company Admin** logs in and goes to **Settings** in the sidebar.
4. Under Settings, admin configures:
   - **WhatsApp Integration** (`/settings/whatsapp`) – configure WhatsApp for the company so leads/emails can use it.
   - **Email Integration** (`/settings/mail`) – configure SMTP/email for the company so leads can send/receive emails.
5. Once both (or either) are configured, **WhatsApp and Email are ready to use** for that company across the CRM (e.g. Lead Details → Mails tab, WhatsApp tab, Compose, etc.).

---

## Step-by-Step

### 1. Super Admin adds a company

- Super Admin logs in on the main (super-admin) domain.
- Goes to Companies (or Company Management).
- Clicks **Add Company** and fills in company details.
- Company is created as a tenant. That company’s users can now log in to their CRM (e.g. via subdomain or tenant selection).

### 2. Company admin logs in

- Company admin (or first user) logs in to the CRM for that company.
- Sees the normal dashboard and sidebar.

### 3. Settings → WhatsApp Integration

- In the sidebar: **Settings** → **WhatsApp Integration**.
- Route: `/settings/whatsapp`.
- Page: **Company WhatsApp Settings** (uses `CompanyWhatsAppSetup` component).
- Admin can:
  - **Auto-Provision** WhatsApp (if your backend supports it) so the company gets a WhatsApp Business number and webhooks.
  - **Sync** and **Test** connection.
- After setup, WhatsApp is **ready to use** for that company (e.g. Lead Details → WhatsApp tab, send message from CRM).

### 4. Settings → Email Integration

- In the sidebar: **Settings** → **Email Integration**.
- Route: `/settings/mail`.
- Page: **Company Mail Settings** (SMTP configuration).
- Admin configures:
  - Enable/disable, Mailer (e.g. SMTP), Host, Port, Encryption, Username, Password, From address, From name.
  - Can **Test** by sending a test email.
- After saving, **email is ready to use** for that company (e.g. Lead Details → Mails tab, Compose, send email from CRM).

### 5. Everything runs for that company

- All WhatsApp and Email usage in the CRM (Lead Details, Inbox, etc.) use **that company’s** settings (tenant-scoped).
- No need for each user to configure anything; **one-time setup by company admin** under Settings is enough.

---

## Where things are in the code

| What | Where |
|------|--------|
| Sidebar menu (default) | `frontend/src/components/Layout.jsx` – Settings submenu includes **WhatsApp Integration** and **Email Integration**. |
| Menu from API | Same file – `ensureSettingsIntegrationItems()` ensures that even when menu comes from API, Settings submenu has these two items. |
| WhatsApp Integration page | `frontend/src/pages/CompanyWhatsAppSettings.jsx` – wraps `CompanyWhatsAppSetup`. |
| WhatsApp setup component | `frontend/src/components/CompanyWhatsAppSetup.jsx` – uses `companyWhatsappAPI` (auth + baseURL). |
| Email Integration page | `frontend/src/pages/CompanyMailSettings.jsx` – title “Email Integration”, route `/settings/mail`. |
| Routes | `frontend/src/App.jsx` – `/settings/whatsapp`, `/settings/mail`. |
| Backend (company-scoped) | `api_settings.php`: `company/whatsapp/*`, `company-settings/mail-settings`. |
| Default menu on company create | **Backend:** `CompanyController::store()` seeds default sidebar menu (with WhatsApp & Email Integration) via `Setting::setValue('company_{id}_sidebar_menu', MenuController::getDefaultMenu(), ...)`. Menu is tenant-scoped: `MenuController::index()` returns menu for current tenant or default. |
| Integration flags | **WhatsApp:** `companies.whatsapp_enabled` (set when admin enables WhatsApp). **Email:** `company_settings.email_integration_enabled` – set when admin saves Email Integration with enabled; migration `2026_01_29_120000_add_email_integration_enabled_to_company_settings_table.php`. |

---

## Summary

- **Super Admin** adds company → company gets CRM.
- **Company admin** opens **Settings** → **WhatsApp Integration** and **Email Integration**.
- Admin configures WhatsApp and Email once per company.
- After that, **CRM is ready to use** with WhatsApp and Email integrated for that company; no per-user setup needed.
