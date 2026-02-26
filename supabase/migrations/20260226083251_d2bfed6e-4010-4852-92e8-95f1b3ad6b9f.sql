
CREATE TABLE public.profile_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  daily_reminder boolean NOT NULL DEFAULT false,
  reminder_time time NOT NULL DEFAULT '08:00',
  show_in_ranking boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own settings"
ON public.profile_settings FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
ON public.profile_settings FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
ON public.profile_settings FOR UPDATE
USING (auth.uid() = user_id);

CREATE TRIGGER update_profile_settings_updated_at
BEFORE UPDATE ON public.profile_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
