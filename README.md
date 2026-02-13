# Team Task Manager - Collaborative Task Management

A full-stack collaborative team task manager where multiple people in the same team can add, update, and delete tasks in real-time. Built with Next.js, Supabase, and Tailwind CSS.

## Features

- **Create or Join Teams** - Create a new team with a shareable code, or join existing teams using the code
- **Real-time Collaboration** - Multiple team members can add/delete/update tasks simultaneously
- **Task Board** - Kanban-style view with To Do, In Progress, and Done columns
- **Authentication** - Email/password auth via Supabase Auth

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, Tailwind CSS
- **Backend/Database**: Supabase (PostgreSQL, Auth, Realtime)
- **Deployment**: Vercel-ready

## Setup

### 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a project
2. In **Project Settings → API**, copy your `Project URL` and `anon` key

### 2. Run Database Schema

1. In Supabase Dashboard, go to **SQL Editor**
2. Create a new query and paste the contents of `supabase/schema.sql`
3. Run the query to create tables, RLS policies, and triggers

### 3. Enable Realtime (for collaborative updates)

1. In Supabase Dashboard, go to **Database → Replication**
2. Find the `tasks` table and enable it for Realtime

### 4. Configure Environment

```bash
cp .env.local.example .env.local
```

Edit `.env.local` and add:

```
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

### 5. Install & Run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment (Vercel)

1. Push your code to GitHub
2. Import the project in [Vercel](https://vercel.com)
3. Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` as environment variables
4. Deploy

## Project Structure

```
src/
├── app/
│   ├── page.tsx          # Landing
│   ├── auth/page.tsx     # Sign in / Sign up
│   ├── dashboard/        # Create/Join team
│   └── team/[teamId]/    # Collaborative task board
├── lib/
│   ├── supabase.ts
│   └── team-code.ts
└── types/
    └── database.ts
supabase/
└── schema.sql            # Run in Supabase SQL Editor
```
