
CREATE TABLE public.profile_status (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  cierre_2025 text DEFAULT '',
  ingresos_actuales text DEFAULT '',
  gastos_actuales text DEFAULT '',
  ahorro_actual text DEFAULT '',
  deuda_total text DEFAULT '',
  pagos_minimos text DEFAULT '',
  inversion_en_uno text DEFAULT '',
  libros_leidos text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profile_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own status" ON public.profile_status FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own status" ON public.profile_status FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own status" ON public.profile_status FOR UPDATE USING (auth.uid() = user_id);

CREATE TRIGGER update_profile_status_updated_at
  BEFORE UPDATE ON public.profile_status
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
