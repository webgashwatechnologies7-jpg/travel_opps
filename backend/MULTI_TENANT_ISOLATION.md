# AK TRAVEL CRM – Multi-tenant isolation (company_id)

Each company should only see its own data; no company should see another company's data. Everything is isolated based on **company_id** and must remain **fast**.

---

## Rules

1. **Separation of data per company**  
   Leads, packages, hotels, activities, transfers, destinations, day itineraries, suppliers, etc., all must be filtered by **company_id**.

2. **IdentifyTenant**  
   The `IdentifyTenant` middleware runs on API requests. It sets the `tenant` (current company) based on the domain/subdomain or the logged-in user.

3. **HasCompany trait**  
   Use the **HasCompany** trait on models that are company-scoped. This ensures:
   - **Create:** The `company_id` is automatically set (from the tenant) when a new record is created.
   - **Read/Query:** For non-super-admin users, `Model::query()` automatically applies `where('company_id', tenant_id)`.

4. **Super Admin**  
   The company scope is **not** applied to users with `is_super_admin = true` – they can see all companies (e.g., in the main admin panel).

5. **Performance**  
   There must be an **index** on `company_id` to keep queries fast. Indexes have been added to migrations that add `company_id` to main tables.

---

## Models with HasCompany (company-scoped)

The **HasCompany** trait and `company_id` in fillable are already being used on these models:

- **Lead** (Modules/Leads)
- **Package**
- **Hotel**
- **Activity**
- **Transfer**
- **Destination**
- **Supplier**
- **DayItinerary**

On these models, `Model::query()`, `Model::find()`, `Model::all()`, etc., are automatically filtered based on the current tenant (company), except for super admins.

---

## Adding a New Company-Scoped Feature

1. **Table:**  
   Add a `company_id` column to the table (foreign key to `companies`, with an index).

2. **Model:**  
   - `use App\Traits\HasCompany;`  
   - `use HasCompany;` inside the class  
   - Add `company_id` to the `$fillable` array.

3. **Controller / Repository:**  
   If you ever write a direct query, use the tenant, e.g.:  
   `Model::where('company_id', tenant('id'))->...`  
   or  
   `Model::where('company_id', $request->user()->company_id)->...`  
   However, for models using **HasCompany**, an extra filter is normally not needed as the scope is applied automatically.

4. **Create:**  
   Passing `company_id` during creation is optional – the HasCompany trait sets it automatically from the tenant.

---

## Login / Domain

- **Company Users**  
  Can only log in from their company's domain (e.g., `crm.company.com` or `company.localhost`).  
  They will only see data for their `company_id`.

- **Super Admin**  
  Log in from the main domain (e.g., `127.0.0.1`, server IP).  
  Company scope does not apply to them.

---

## Checklist (Existing / New APIs)

- [ ] Every list/detail API returns only company-scoped data (via HasCompany or explicit `company_id` filter).
- [ ] `company_id` is not set incorrectly on create/update (use HasCompany or set from tenant).
- [ ] Tables that are company-scoped have `company_id` + index.
- [ ] Models for new company-scoped tables have HasCompany + `company_id` in fillable.

This ensures that in **AK TRAVEL CRM**, one company can never see another company's data, and queries remain fast due to the `company_id` index.
