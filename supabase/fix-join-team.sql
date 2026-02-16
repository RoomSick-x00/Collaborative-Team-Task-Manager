-- Fix: Allow users to look up team by code when joining (RLS was blocking non-members)
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION public.get_team_by_code(team_code TEXT)
RETURNS TABLE(id UUID, name TEXT)
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT t.id, t.name
  FROM teams t
  WHERE t.code = team_code;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.get_team_by_code(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_team_by_code(TEXT) TO service_role;
