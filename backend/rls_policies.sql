-- LearnLynk Tech Test - Task 2: RLS Policies on leads

alter table public.leads enable row level security;

-- Example helper: assume JWT has tenant_id, user_id, role.
-- You can use: current_setting('request.jwt.claims', true)::jsonb

-- TODO: write a policy so:
-- - counselors see leads where they are owner_id OR in one of their teams
-- - admins can see all leads of their tenant



--Answer Starts

create policy "leads_select_policy"
on public.leads
for select
using (
  -- must belong to the same tenant
  tenant_id = (
    current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id'
  )::uuid
  and
  (
    -- admins: access to everything
    (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'admin'
    or
    (
      -- counselors: access to specified leads or leads from their teams
      (current_setting('request.jwt.claims', true)::jsonb ->> 'role') = 'counselor'
      and
      (
        -- Either own the lead
        owner_id = (
          current_setting('request.jwt.claims', true)::jsonb ->> 'user_id'
        )::uuid

        or

        -- OR the lead belongs to the team members
        id in (
          select tl.lead_id
          from public.team_leads tl
          join public.user_teams ut
            on ut.team_id = tl.team_id
          where ut.user_id = (
            current_setting('request.jwt.claims', true)::jsonb ->> 'user_id'
          )::uuid
        )
      )
    )
  )
);

--Answer Ends



-- TODO: add INSERT policy that:
-- - allows counselors/admins to insert leads for their tenant
-- - ensures tenant_id is correctly set/validated


-- Answer Starts

create policy "leads_insert_policy"
on public.leads
for insert
with check (
  -- enforce that inserted row is for the same tenant
  tenant_id = (
    current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id'
  )::uuid
  and
  -- only admins/counselors can insert
  (current_setting('request.jwt.claims', true)::jsonb ->> 'role') in ('admin', 'counselor')
);

-- Answer Ends