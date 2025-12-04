# LearnLynk – Technical Assessment (Completed Submission)

This repository contains my completed solution for the LearnLynk technical assessment.  
All tasks have been implemented using Supabase (Postgres + Edge Functions) and Next.js (TypeScript).  
Where appropriate, I have added `Answer Starts` / `Answer Ends` blocks inside the code for clarity.

---

## Overview of Tasks

The assessment consisted of:

1. Database schema — `backend/schema.sql`  
2. Row-Level Security (RLS) — `backend/rls_policies.sql`  
3. Edge Function — `backend/edge-functions/create-task/index.ts`  
4. Frontend page — `frontend/pages/dashboard/today.tsx`  
5. Stripe written explanation — included below  

A live demo of Task 4 is optionally available if needed.

---

## Task 1 — Database Schema

File: `backend/schema.sql`

### Requirements (from the assessment)
- Tables: `leads`, `applications`, `tasks`
- Standard fields: `id`, `tenant_id`, `created_at`, `updated_at`
- Relations:
  - `applications.lead_id` → `leads.id`
  - `tasks.application_id` → `applications.id`
- Constraints:
  - `tasks.type ∈ ('call','email','review')`
  - `tasks.due_at >= tasks.created_at`
- Indexes:
  - Leads: `tenant_id`, `owner_id`, `stage`, `created_at`
  - Applications: `tenant_id`, `lead_id`, `stage`
  - Tasks: `tenant_id`, `due_at`, `status`

### **My Implementation**
**Answer:** Implemented all tables with required fields, constraints, and indexes.  
Added minimal `user_teams` and `team_leads` tables to support RLS team-based access (Task 2).  
Schema is fully runnable on a fresh Supabase project.

---

## Task 2 — Row-Level Security (RLS)

File: `backend/rls_policies.sql`

### Requirements
- Enable RLS on `leads`
- Counselors can see:
  - Leads they own  
  - OR leads belonging to teams they are part of  
- Admins can see all leads for their tenant  
- INSERT allowed for admin/counselor within their tenant

### **My Implementation**
**Answer:**  
- Enabled RLS on `leads`.  
- Implemented SELECT policy:
  - Admin: full tenant visibility  
  - Counselor: `owner_id = user_id` OR `lead_id` in teams they belong to  
- Implemented INSERT policy enforcing JWT `tenant_id` and role.  
- All logic uses `current_setting('request.jwt.claims')::jsonb`.

---

## Task 3 — Edge Function (create-task)

File: `backend/edge-functions/create-task/index.ts`

### Requirements
- Accept JSON `{ application_id, task_type, due_at }`
- Validate:
  - `task_type` ∈ (`call`,`email`,`review`)
  - `due_at` is a valid future timestamp
- Lookup application to derive `tenant_id`
- Insert into `tasks` using service role
- Return `{ success: true, task_id }`
- Validation errors → 400  
- Internal errors → 500  

### **My Implementation**
**Answer:**  
- Added full validation for `application_id`, `task_type`, and `due_at`.  
- Validates timestamp formatting + future constraint.  
- Fetches application to derive `tenant_id` (required by schema).  
- Inserts task using Supabase service role key.  
- Returns structured success/error JSON responses.  
- Tested end-to-end via curl and Supabase logs.
- **Note**:- I had to change the **SUPABASE_SERVICE_ROLE_KEY** to **SERVICE_ROLE_KEY** since supabase was not accepting the default key parameter. For consistency, I have included the default one in this codebase.

---

## Task 4 — Frontend Page (`/dashboard/today`)

File: `frontend/pages/dashboard/today.tsx`

### Requirements
- Fetch tasks due today (status ≠ completed)
- Display type, application_id, due_at, status
- Add “Mark Complete” button

### **My Implementation**
**Answer:**  
- Implemented Supabase client-based fetch for tasks due today.  
- Styled a clean table UI with row striping and monospace UUIDs.  
- Added initial loader + inline update loader.  
- Added green success banner after marking a task complete.  
- Page updates smoothly without flashing or white-screen transitions.

A live deployment can be provided upon request.

---

## Task 5 — Stripe Answer

### **Stripe Answer (8–12 lines)**

To implement Stripe Checkout for an application fee, I would begin by inserting a `payment_requests` row recording the `application_id`, expected amount, and an initial status such as `pending`. Next, a backend endpoint (edge function or API route) would call `stripe.checkout.sessions.create()` with the amount and include the `payment_request` ID in the metadata or success URL. I would store the generated Checkout Session ID in my database for reference.

Stripe will then send webhook events to my backend. In the webhook handler, I would verify the signature, retrieve the session details, and match them to the corresponding `payment_request` row. When a successful payment event arrives (`checkout.session.completed`), I would update the `payment_requests.status` to `paid` and update the related application record—e.g., setting `stage='payment-complete'` or storing the payment timestamp. This ensures the application status always reflects the actual Stripe transaction state.

---

## Submission Details

- All tasks completed and verified.
- Backend + RLS + Edge Function implemented under `backend/`.
- Frontend UI implemented under `frontend/`.
- Stripe flow explanation provided above.
- Repo structured to match assessment instructions.

