
ALTER TABLE public.journal_entries
  DROP CONSTRAINT IF EXISTS journal_entries_day_id_fkey;

ALTER TABLE public.journal_entries
  ADD CONSTRAINT journal_entries_day_id_fkey
  FOREIGN KEY (day_id)
  REFERENCES public.days(id)
  ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_journal_entries_day_id
  ON public.journal_entries(day_id);

-- Also fix week_id FK while we're at it
ALTER TABLE public.journal_entries
  DROP CONSTRAINT IF EXISTS journal_entries_week_id_fkey;

ALTER TABLE public.journal_entries
  ADD CONSTRAINT journal_entries_week_id_fkey
  FOREIGN KEY (week_id)
  REFERENCES public.weeks(id)
  ON DELETE CASCADE;
