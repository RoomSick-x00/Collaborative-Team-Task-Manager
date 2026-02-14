-- Run this AFTER setup-tables.sql in Supabase SQL Editor

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Drop existing policies (in case re-running)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Members can view their teams" ON public.teams;
DROP POLICY IF EXISTS "Authenticated users can create teams" ON public.teams;
DROP POLICY IF EXISTS "Owners can update their teams" ON public.teams;
DROP POLICY IF EXISTS "Members can view team members" ON public.team_members;
DROP POLICY IF EXISTS "Team owners can add members" ON public.team_members;
DROP POLICY IF EXISTS "Users can join team with valid code" ON public.team_members;
DROP POLICY IF EXISTS "Team members can view tasks" ON public.tasks;
DROP POLICY IF EXISTS "Team members can create tasks" ON public.tasks;
DROP POLICY IF EXISTS "Team members can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Team members can delete tasks" ON public.tasks;

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Teams
CREATE POLICY "Members can view their teams" ON public.teams FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_members.team_id = teams.id AND team_members.user_id = auth.uid())
  OR created_by = auth.uid()
);
CREATE POLICY "Authenticated users can create teams" ON public.teams FOR INSERT WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Owners can update their teams" ON public.teams FOR UPDATE USING (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM public.team_members WHERE team_id = teams.id AND user_id = auth.uid() AND role = 'owner')
);

-- Team members
CREATE POLICY "Members can view team members" ON public.team_members FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.team_members tm WHERE tm.team_id = team_members.team_id AND tm.user_id = auth.uid())
);
CREATE POLICY "Team owners can add members" ON public.team_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.teams t LEFT JOIN public.team_members tm ON t.id = tm.team_id AND tm.user_id = auth.uid()
    WHERE t.id = team_id AND (t.created_by = auth.uid() OR tm.role = 'owner'))
);
CREATE POLICY "Users can join team with valid code" ON public.team_members FOR INSERT WITH CHECK (user_id = auth.uid());

-- Tasks
CREATE POLICY "Team members can view tasks" ON public.tasks FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_members.team_id = tasks.team_id AND team_members.user_id = auth.uid())
);
CREATE POLICY "Team members can create tasks" ON public.tasks FOR INSERT WITH CHECK (
  created_by = auth.uid() AND EXISTS (SELECT 1 FROM public.team_members WHERE team_members.team_id = tasks.team_id AND team_members.user_id = auth.uid())
);
CREATE POLICY "Team members can update tasks" ON public.tasks FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_members.team_id = tasks.team_id AND team_members.user_id = auth.uid())
);
CREATE POLICY "Team members can delete tasks" ON public.tasks FOR DELETE USING (
  EXISTS (SELECT 1 FROM public.team_members WHERE team_members.team_id = tasks.team_id AND team_members.user_id = auth.uid())
);
