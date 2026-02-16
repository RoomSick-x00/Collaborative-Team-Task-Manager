# Supabase Setup Instructions

The error **"cannot find the table public.teams in the schema cache"** means the database tables don't exist yet. Follow these steps:

## Step 1: Open Supabase SQL Editor

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** in the left sidebar

## Step 2: Create Tables

1. Click **New query**
2. Open the file `supabase/setup-tables.sql` in this project
3. Copy **all** its contents
4. Paste into the Supabase SQL Editor
5. Click **Run** (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

## Step 3: Create Policies (RLS)

1. Click **New query** again
2. Open the file `supabase/setup-policies.sql`
3. Copy **all** its contents
4. Paste into the SQL Editor
5. Click **Run**
6. You should see "Success. No rows returned"

## Step 4: Verify

1. In Supabase, go to **Table Editor** in the left sidebar
2. You should see: `profiles`, `teams`, `team_members`, `tasks`

## Step 5: (Optional) Enable Realtime for tasks

For live collaboration when team members add/update/delete tasks:

1. Go to **Database** → **Replication**
2. Find the `tasks` table
3. Toggle it **on** for Realtime

---

## Run Migration v2 (display names, task assignment, permissions)

After tables and policies are set up, run the v2 migration:

1. In SQL Editor, click **New query**
2. Copy contents of `supabase/migration-v2.sql`
3. Paste and **Run**

This adds:
- `display_name` to team_members
- `assigned_to` to tasks
- New permission rules: only assignee can change status; only creator, assignee, or leader can delete

## Run Fix: Join Team by Code (required for join flow)

When users join with a team code from a different account, RLS blocks the lookup. Run:

1. In SQL Editor, **New query**
2. Copy contents of `supabase/fix-join-team.sql`
3. **Run**

This creates `get_team_by_code()` so users can join teams with a valid code.

---

After this, try creating a team again in your app.
