
-- 1.1 Alter weeks table: add new columns
ALTER TABLE public.weeks ADD COLUMN IF NOT EXISTS description_long text;
ALTER TABLE public.weeks ADD COLUMN IF NOT EXISTS spiritual_playlist_url text;
ALTER TABLE public.weeks ADD COLUMN IF NOT EXISTS mental_playlist_url text;
ALTER TABLE public.weeks ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';

-- 1.2 Create task_notes table (Cuaderno)
CREATE TABLE public.task_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  day_id uuid NOT NULL REFERENCES public.days(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, task_id)
);

ALTER TABLE public.task_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notes" ON public.task_notes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notes" ON public.task_notes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notes" ON public.task_notes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notes" ON public.task_notes FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_task_notes_updated_at
  BEFORE UPDATE ON public.task_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 1.3 Create abundance_deposits table
CREATE TABLE public.abundance_deposits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'USD',
  date date NOT NULL DEFAULT current_date,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.abundance_deposits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own deposits" ON public.abundance_deposits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own deposits" ON public.abundance_deposits FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own deposits" ON public.abundance_deposits FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own deposits" ON public.abundance_deposits FOR DELETE USING (auth.uid() = user_id);

-- 1.4 Create announcements table
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  body text NOT NULL,
  scope text NOT NULL DEFAULT 'global',
  scope_id uuid,
  pinned boolean NOT NULL DEFAULT false,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read announcements" ON public.announcements FOR SELECT USING (true);
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- 1.5 Create announcement_reads table
CREATE TABLE public.announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  announcement_id uuid NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  read_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, announcement_id)
);

ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own reads" ON public.announcement_reads FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own reads" ON public.announcement_reads FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own reads" ON public.announcement_reads FOR DELETE USING (auth.uid() = user_id);
