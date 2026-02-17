# SaaS Travel CRM - Implementation Roadmap

This document outlines the step-by-step plan to upgrade the existing CRM into a fully dynamic SaaS platform with automated onboarding and strict data scoping.

## **Phase 1: Dynamic Subscription Plans (Database & Logic)**
**Goal:** Move from hardcoded features to a database-driven system where Super Admin can toggle features.

- [ ] **Step 1.1: Database Migration**
    - Create `features` table (id, name, key, description).
    - Create `plan_features` pivot table (plan_id, feature_id, is_active).
    - **Pre-Check:** Review `subscription_plans` table structure.
    
- [ ] **Step 1.2: Seed Features**
    - Populate `features` table with existing hardcoded list (WhatsApp, Email, etc.).
    - Sync existing plans with default features.
    
- [ ] **Step 1.3: Update Models**
    - Update `SubscriptionPlan.php` to use `belongsToMany` relationship.
    - Create helper methods: `syncFeatures($list)`.
    - **Pre-Check:** Review `SubscriptionPlanFeature.php` model.

- [ ] **Step 1.4: Super Admin API**
    - Update `SubscriptionController` to allow fetching all features and updating plan features.

---

## **Phase 2: Automated Onboarding (Pending -> Active Workflow)**
**Goal:** Implement the "Welcome Email -> DNS Setup -> Verification -> Go Live" flow.

- [ ] **Step 2.1: Database Update**
    - Add `status` enum column to `companies` table (`pending`, `verifying`, `active`, `suspended`).
    - Add `dns_verification_token` column.
    - **Pre-Check:** Review `companies` table migration.

- [ ] **Step 2.2: Email System Setup**
    - Create `WelcomeEmail` Mailable (Temporary login + DNS Guide).
    - Create `GoLiveEmail` Mailable (Final URL + Credentials).
    - **Pre-Check:** Check Mail configuration in `.env`.

- [ ] **Step 2.3: Logic Update (Controller)**
    - Modify `CompanyAdminController@create` to set status `pending` by default.
    - Trigger `WelcomeEmail` on creation.

- [ ] **Step 2.4: Admin Verification Action**
    - Create API endpoint `admin/verify-dns/{company_id}`.
    - Update status to `active` and trigger `GoLiveEmail`.

---

## **Phase 3: Hierarchical Data Scoping (Strict View)**
**Goal:** Ensure users see ONLY data relevant to their role and team hierarchy.

- [ ] **Step 3.1: User Hierarchy Helper**
    - Add method `getAllSubordinateIds()` in `User.php`.
    - This recursive function will find all users reporting to the current user.
    - **Pre-Check:** Review `users` table `reports_to` column usage.

- [ ] **Step 3.2: Create Global Scope**
    - Create `ScopeByHierarchy` Trait.
    - Apply logic:
        - Agent: `where('assigned_to', Auth::id())`
        - TL/Manager: `whereIn('assigned_to', $subordinateIds)`
        - Admin: No filter.
    
- [ ] **Step 3.3: Apply Scope**
    - Apply this scope to the `Lead` model only initially.
    - **Pre-Check:** Review `Lead` model structure.

---

## **Phase 4: Middleware Enforcement (Security)**
**Goal:** Block API requests for features not in the active plan.

- [ ] **Step 4.1: Create Middleware**
    - Create `CheckPlanFeature` middleware.
    - Logic: Check `Auth::user()->company->hasFeature($featureKey)`.
    - If false, abort 403.

- [ ] **Step 4.2: Apply to Routes**
    - Wrap specific routes (e.g., `/whatsapp/*`) with `middleware('feature:whatsapp')`.
    - **Pre-Check:** Review `routes/api.php` grouping.

---

**Execution Protocol:**
1.  **Review Config:** Before starting any step, I will use `view_file` to understand the current code.
2.  **Implementation:** Write code/migration.
3.  **Validation:** Run basic checks (if applicable).
4.  **Confirmation:** Ask user for approval to proceed to the next step.
