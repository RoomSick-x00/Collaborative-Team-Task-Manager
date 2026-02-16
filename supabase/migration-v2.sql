-- Migration v2: Display names, task assignment, permissions
-- Run this in Supabase SQL Editor AFTER the original schema

-- 1. Add display_name to team_members (name they use in this team)
ALTER TABLE public.team_members
ADD COLUMN IF NOT EXISTS display_name TEXT;

-- 2. Add assigned_to to tasks (who the task is assigned to)
ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3. Update existing team_members: set display_name from profiles if null
UPDATE public.team_members tm
SET display_name = COALESCE(p.display_name, (SELECT email FROM auth.users WHERE id = tm.user_id))
FROM public.profiles p
WHERE tm.user_id = p.id AND (tm.display_name IS NULL OR tm.display_name = '');

-- 4. For tasks without assigned_to, set to created_by
UPDATE public.tasks
SET assigned_to = created_by
WHERE assigned_to IS NULL AND created_by IS NOT NULL;

-- 5. Drop old task policies (we need new ones)
DROP POLICY IF EXISTS "Team members can update tasks" ON public.tasks;
DROP POLICY IF EXISTS "Team members can delete tasks" ON public.tasks;

-- 6. UPDATE: Only the assignee can change task status
CREATE POLICY "Only assignee can update tasks" ON public.tasks
  FOR UPDATE USING (assigned_to = auth.uid());

-- 7. DELETE: Creator, assignee, or team leader (role=owner) can delete
CREATE POLICY "Creator assignee or leader can delete tasks" ON public.tasks
  FOR DELETE USING (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.team_members tm
      WHERE tm.team_id = tasks.team_id AND tm.user_id = auth.uid() AND tm.role = 'owner'
    )
  );
