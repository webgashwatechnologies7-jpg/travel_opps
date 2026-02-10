# AK TRAVEL CRM – Multi-tenant isolation (company_id)

Har company sirf apna data dekhe, koi company dusri company ka data na dekhe. Sab kuch **company_id** ke base pe isolate hai aur **fast** rehna chahiye.

---

## Rules

1. **Har company ka data alag**  
   Leads, packages, hotels, activities, transfers, destinations, day itineraries, suppliers, etc. sab **company_id** se filter hona chahiye.

2. **IdentifyTenant**  
   API requests pe `IdentifyTenant` middleware chalता hai. Isse `tenant` (current company) set hota hai – domain/subdomain ya logged-in user se.

3. **HasCompany trait**  
   Jo models company-scoped hain, unpe **HasCompany** trait use karo. Isse:
   - **Create:** naya record create karte waqt `company_id` auto set ho (tenant se).
   - **Read/Query:** non–super-admin user ke liye `Model::query()` automatically `where('company_id', tenant_id)` lagata hai.

4. **Super Admin**  
   `is_super_admin = true` wale user pe company scope **nahi** lagta – unhe sab companies dikhti hain (e.g. main admin panel).

5. **Performance**  
   `company_id` pe **index** hona chahiye taaki queries fast rahein. Jo migrations main tables pe `company_id` add karti hain, wahan index bhi add kiya gaya hai.

---

## Models with HasCompany (company-scoped)

In sab models pe **HasCompany** aur **company_id** in fillable use ho chuka hai:

- **Lead** (Modules/Leads)
- **Package**
- **Hotel**
- **Activity**
- **Transfer**
- **Destination**
- **Supplier**
- **DayItinerary**

In models pe `Model::query()`, `Model::find()`, `Model::all()` etc. automatically current tenant (company) ke hisaab se filter ho jate hain (super admin ko chhod ke).

---

## Naya company-scoped feature add karte waqt

1. **Table:**  
   Table mein `company_id` column add karo (foreign key to `companies`, index bhi).

2. **Model:**  
   - `use App\Traits\HasCompany;`  
   - `use HasCompany;` in class  
   - `company_id` ko `$fillable` mein add karo.

3. **Controller / Repository:**  
   Agar kabhi direct query likho to bhi tenant use karo, e.g.  
   `Model::where('company_id', tenant('id'))->...`  
   ya  
   `Model::where('company_id', $request->user()->company_id)->...`  
   Lekin **HasCompany** wale models pe normally extra filter ki zaroorat nahi, scope khud lag jata hai.

4. **Create:**  
   Create karte waqt `company_id` pass karna optional hai – HasCompany trait tenant se auto set kar deta hai.

---

## Login / domain

- **Company users**  
  Sirf apne company ke domain se login ho sakte hain (e.g. `crm.company.com` ya `company.localhost`).  
  Unhe sirf apne `company_id` ka data dikhega.

- **Super admin**  
  Main domain (e.g. `127.0.0.1`, server IP) se login.  
  Unpe company scope nahi lagta.

---

## Checklist (existing / new APIs)

- [ ] Har list/detail API company-scoped data hi return kare (HasCompany ya explicit `company_id` filter).
- [ ] Create/update pe `company_id` wrong set na ho (HasCompany use karo ya tenant se set karo).
- [ ] Jo tables company-scoped hain, unpe `company_id` + index hai.
- [ ] Naye company-scoped tables ke models pe HasCompany + `company_id` in fillable.

Is se **AK TRAVEL CRM** me ek company kabhi dusri company ka data nahi dekh payegi, aur **company_id** ke index ki wajah se queries fast rahengi.
