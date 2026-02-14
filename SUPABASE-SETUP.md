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

After this, try creating a team again in your app.
