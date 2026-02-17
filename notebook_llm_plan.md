# Travel CRM System: Comprehensive Status & Implementation Plan
*For NotebookLM / AI Planning Assistant*

## 1. Project Overview & Goal
We are building a **Multi-Tenant SaaS Travel CRM** designed for travel agencies.
*   **Super Admin:** The platform owner who manages subscription plans and features.
*   **Companies (Tenants):** Travel agencies who purchase plans to manage their business.
*   **Employees:** Staff members within agencies with specific roles (Admin, Manager, Team Lead, Agent).

## 2. Core Requirements & Business Logic

### A. Dynamic Subscription Plans (The Foundation)
1.  **Flexible Features:**
    *   Super Admin must be able to create plans (e.g., Basic, Gold, Pro).
    *   Features must be **toggleable** (Checkboxes) for each plan.
        *   *Example:* Turn "WhatsApp Integration" ON for Gold Plan, but OFF for Basic.
    *   Changes to a plan's features should effectively update access for all subscribed companies (or stick to versioning).

### B. Automated Company Onboarding (The Flow)
Current flow is manual/direct. Target flow is:
1.  **Purchase:** Company buys a plan.
2.  **Step 1 (Welcome):** System instantly sends a **"Welcome Email"** containing:
    *   Temporary credentials.
    *   **DNS Setup Guide** with Server IP.
    *   Instructions to point their custom domain (e.g., `crm.agency.com`) to our server.
3.  **Step 2 (Setup):** Company configures DNS and notifies Super Admin (via a "Verify" action).
4.  **Step 3 (Activation):** Super Admin verifies DNS propagation. Upon approval, system sends a **"Go Live Email"** with:
    *   Final Custom Domain URL.
    *   Permanent Admin Credentials.

### C. Role-Based Access Control (RBAC) & Hierarchy
We need a strict hierarchical data access model:
*   **Company Admin:** Full access to all company data.
*   **Manager:** Can view/edit:
    *   Their own leads.
    *   Leads of Team Leads (TLs) reporting to them.
    *   Leads of Agents reporting to those TLs.
*   **Team Lead (TL):** Can view/edit:
    *   Their own leads.
    *   Leads of Agents in their specific team.
*   **Agent (Employee):** **Strictly limited** to their own assigned leads. No access to others' data.

### D. Strict Feature Enforcement
*   **Backend Enforcement:** If a plan does not include "WhatsApp", the API endpoint for sending messages must strictly **block** the request (Middleware), not just hide the button on UI.
*   **UI Sync:** The frontend Sidebar and Dashboard must dynamically hide/show modules based on the active plan.

---

## 3. Current Technical Status (Code Analysis)

### ✅ What is Implemented (The Base)
*   **Tech Stack:** Laravel 10+ (Backend API), React (Frontend), MySQL.
*   **Database:**
    *   `companies`: Stores basic info, domain, subscription status.
    *   `users`: Stores employee details, mapped to `company_id`.
    *   `subscription_plans`: Basic plan details (price, duration).
    *   `permissions`: Using *Spatie Laravel Permission* package.
*   **Authentication:** JWT-based auth (Sanctum) is working.
*   **Basic UI:** Sidebar attempts to hide items based on basic permission strings.

### ⚠️ Gaps & Missing Logic (The Work Ahead)

| Feature Area | Current Status | Missing / Required Requirement |
| :--- | :--- | :--- |
| **Plan Features** | Hardcoded/Seeded in DB. | **Dynamic UI** for Super Admin to toggle features per plan. |
| **Onboarding** | Companies created instantly. | **3-Step Flow:** Pending Status -> DNS Verify -> Active. Email triggers missing. |
| **Data Scoping** | Basic ownership check. | **Nested Hierarchy Logic:** The `getAll()` APIs need identifying "My Team" recursively. |
| **Enforcement** | UI Hiding mainly. | **Middleware/Gate:** API must reject requests for features not in the plan. |
| **Activity Logs** | Basic or Non-existent. | **Audit Trail:** Detailed history of who changed what and when. |

---

## 4. Implementation Priorities (Roadmap)

### Phase 1: Super Admin & Plan Flexibility
1.  Refactor `SubscriptionPlan` model to store features as a flexible JSON or Relation.
2.  Build **Super Admin UI** to Create/Edit plans with feature checkboxes.
3.  Implement Backend logic (`Company::hasFeature($key)`) to check plan access.

### Phase 2: Onboarding Automation
1.  Add `status` column to `companies` table (`pending_dns`, `active`).
2.  Implement **Email Notification System** (Welcome Email, Activation Email).
3.  Build default "DNS Verification" page/logic for Admin.

### Phase 3: Data Scoping & Hierarchy
1.  Implement `User::scopableQuery()` trait in Laravel models.
2.  Refactor `LeadsController::index()` to apply strictly hierarchical filters:
    *   `$query->whereIn('assigned_to', $currentUser->getAllSubordinateIds())`.

### Phase 4: API Security & Logs
1.  Create `FeatureAccessMiddleware` to block unauthorized API usage.
2.  Implement `ActivityLogger` service for tracking all mutations.
