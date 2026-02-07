# Session Report – 4 Feb 2026

Summary of changes and fixes done in this session (Marketing, Email Campaigns, WhatsApp setup guidance).

---

## 1. Marketing Dashboard – Recent Campaigns Dynamic

**Issue:** Recent Campaigns table was showing static/mock data.

**Changes:**
- **Backend (`MarketingController.php`):** Removed `company_id` filters from dashboard stats and `getRecentCampaigns()` / `calculateConversionRate()` (since `email_campaigns` / `sms_campaigns` / `leads` tables don’t have `company_id` in this project). Dashboard now returns real counts and recent email campaigns.
- **Frontend:**  
  - Added `marketingAPI.dashboard()` in `frontend/src/services/api.js`.  
  - Updated `MarketingDashboard.jsx` to call `marketingAPI.dashboard()` and use `response.data.data` (with fallbacks for customer_stats, performance).  

**Result:** Recent Campaigns and dashboard stats now load from the database.

---

## 2. Email Campaigns – Target Leads Empty + Wrong API Usage

**Issue:** Target Leads list was empty; CORS/redirect errors when calling APIs.

**Changes:**
- **Frontend (`EmailCampaigns.jsx`):**  
  - Leads list: use `data.leads` instead of `data.data` (backend returns `data: { leads, pagination }`).  
  - Checkbox: use `checked={formData.lead_ids?.includes(lead.id)}` instead of `value`.  
  - Lead label: use `lead.name || lead.client_name` (backend sends `client_name`).  
- Replaced all `fetch('/api/...')` with axios APIs so auth token is sent and CORS/redirect issues go away:  
  - `marketingEmailCampaignsAPI` (list, create, update, delete, send) in `api.js`.  
  - `EmailCampaigns.jsx` uses `marketingEmailCampaignsAPI`, `marketingTemplatesAPI`, `leadsAPI`.  

**Result:** Target Leads load correctly; create/send/delete work without CORS errors.

---

## 3. Validation Errors Shown on Frontend

**Issue:** Backend validation errors (e.g. “template_id required”) were not visible on the page.

**Changes:**
- **Frontend (`EmailCampaigns.jsx`):** Added an error banner that shows `error` from `useErrorHandler` (which already parses `response.data.errors` and `message`).  

**Result:** Validation messages appear in a red banner on the Email Campaigns page.

---

## 4. Marketing Templates – Create Template Not Working

**Issue:** “Create Template” form did nothing; no API call.

**Changes:**
- **Frontend (`MarketingTemplates.jsx`):**  
  - Added `formData` state (name, type, subject, content, variables, is_active).  
  - Form `onSubmit` calls `marketingTemplatesAPI.create(payload)` (variables sent as array).  
  - All inputs controlled with `value`/`onChange`; subject required when type is email.  
  - On success: new template prepended to list and modal closed.  
  - On error: `formError` state and red message in modal.  

**Result:** New marketing templates can be created and show in the list.

---

## 5. Email Campaigns – Send / Update / Delete Backend

**Issue:** Routes existed but controller methods were missing → “Method does not exist” errors.

**Changes:**
- **Backend (`MarketingController.php`):**  
  - `showEmailCampaign($id)` – single campaign with template/leads.  
  - `updateEmailCampaign(Request, $id)` – validation + update; optional `send_immediately` triggers send.  
  - `sendEmailCampaign($id)` – sets status to sending, calls `processEmailCampaign`, returns success or 422 with reason.  
  - `deleteEmailCampaign($id)` – deletes campaign.  
  - `duplicateEmailCampaign($id)` – replicates campaign with status draft and zero counts.  
- **processEmailCampaign:** Removed update to `leads.last_contacted_at` (column doesn’t exist).  

**Result:** Email campaigns can be updated, sent, deleted, and duplicated from the UI.

---

## 6. Email Campaign – Real Emails Sent to Leads

**Issue:** Campaign “sent” only updated DB; no actual emails.

**Changes:**
- **Backend (`MarketingController.php`):**  
  - `processEmailCampaign()` now: loads template, fetches leads with email from `lead_ids`, uses `CompanyMailSettingsService` and `Setting` for from name/address, builds per-lead variables (name, email, phone, company, destination), uses `MarketingTemplate::processContent()`, builds branded HTML body (inline string, no Blade view), calls `Mail::send()` per lead.  
  - Returns array `['status','sent_count','reason']` for success/failure.  
- **sendEmailCampaign:** If `processEmailCampaign` returns failed (e.g. 0 sent), responds with 422 and `details` (reason) so frontend/Network tab can show it.  

**Result:** Sending a campaign sends real emails to selected leads (when mail config is correct). If it fails (no emails, invalid template, SMTP error), the reason is in the API response.

---

## 7. View Not Found – emails.simple-branded

**Issue:** `processEmailCampaign` used `view('emails.simple-branded', ...)` which doesn’t exist → “View not found”.

**Changes:**
- **Backend (`MarketingController.php`):** Replaced the view with an inline HTML string for the email body (same structure as in `NotificationController` – header, content, footer with company details).  

**Result:** Campaign emails send without requiring a new Blade view.

---

## 8. WhatsApp – Token Expired / Sync Failed / Account Restricted

**Issue:** Lead page WhatsApp tab and Settings → Sync/Test failing with “Session has expired” and “Account restricted”.

**Guidance given (no code change):**  
- Explained that “Error validating access token: Session has expired” means Facebook/WhatsApp token is expired; need to re-connect via Settings → WhatsApp Integration (Sync/Change Number).  
- Explained that “Account restricted” (CRMProject, later CRMNumber) is a Meta-side permanent restriction – no code fix; need to request review or use a new business/WABA.  
- Explained “Request review” returning `success: false` and `is_final: true` means appeal rejected; that WABA cannot be used.  
- Suggested: new Facebook Business + new WhatsApp Business Account + new number, or third-party provider (e.g. 360dialog, Twilio).  

**Result:** User has clear steps for new setup; existing restricted accounts cannot be used for sending.

---

## 9. WhatsApp – Business Verification Form (Gashwa)

**Issue:** Meta “Add business details” form – what to fill for Gashwa company.

**Guidance:**  
- Business Tax ID: Gashwa’s **GSTIN / PAN / MSME UDYAM** (number only, not “Gashwa company”).  
- Business name: legal name as on documents (e.g. “Gashwa Technologies Pvt Ltd”).  
- Alternative name: optional trade name.  
- For testing without real details: skip verification for now; use Developer test number or create new business later.  

**Result:** User knows what to fill when they have Gashwa’s documents.

---

## 10. WhatsApp – “Business is not allowed to claim App”

**Issue:** Creating/claiming app under restricted business (CRMSoftware) showed “Business is not allowed to claim App”.

**Guidance:**  
- Create a **new** Business in business.facebook.com (new name, new email).  
- In developers.facebook.com, when creating the app, select this **new business** (not CRMSoftware).  

**Result:** User created new app “NewProject” with a different business.

---

## 11. WhatsApp – WhatsApp Product Not in Dashboard

**Issue:** WhatsApp icon/product not visible in “Add a product” grid.

**Guidance:**  
- Use **Products → Add Product** and find WhatsApp in the list, or  
- Open WhatsApp setup directly:  
  `https://developers.facebook.com/apps/2118664925545598/whatsapp-business/wa-setup/`  
- If needed, set App type to **Business** in App settings → Basic.  

**Result:** User can open WhatsApp setup via direct URL and proceed with WABA + phone number + token for CRM.

---

## Files Touched (Code Changes)

| File | Changes |
|------|--------|
| `backend/app/Http/Controllers/MarketingController.php` | Dashboard without company_id; show/update/delete/duplicate/send email campaign; processEmailCampaign with real Mail::send, inline HTML, return status/sent_count/reason; no last_contacted_at. |
| `frontend/src/services/api.js` | marketingAPI.dashboard; marketingEmailCampaignsAPI (list, create, update, delete, send). |
| `frontend/src/pages/MarketingDashboard.jsx` | Call marketingAPI.dashboard(); use response.data.data with fallbacks. |
| `frontend/src/pages/EmailCampaigns.jsx` | Use leadsAPI, marketingTemplatesAPI, marketingEmailCampaignsAPI; setLeads from data.leads; checkbox checked; lead name/client_name; error banner. |
| `frontend/src/pages/MarketingTemplates.jsx` | formData state; onSubmit → marketingTemplatesAPI.create; formError display; inputs controlled. |

---

## Summary

- **Marketing Dashboard:** Recent Campaigns and stats are dynamic.  
- **Email Campaigns:** Target Leads load, create/update/delete/send work; validation errors show; real emails sent to leads when mail config is correct; failure reason in API response.  
- **Marketing Templates:** Create template works with API.  
- **WhatsApp:** No code changes; full guidance for token refresh, restricted accounts, new business, new app, and WhatsApp setup URL.  

— End of report —
