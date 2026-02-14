-- Fix: infinite recursion in team_members policy
-- Run this in Supabase SQL Editor

-- 1. Create a helper function that bypasses RLS (no recursion)
CREATE OR REPLACE FUNCTION public.is_team_member(team_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.team_members
    WHERE team_id = team_uuid AND user_id = auth.uid()
  );
$$;

-- 2. Drop the problematic policy
DROP POLICY IF EXISTS "Members can view team members" ON public.team_members;

-- 3. Recreate it using the helper (no recursion)
CREATE POLICY "Members can view team members" ON public.team_members
  FOR SELECT USING (public.is_team_member(team_id));
