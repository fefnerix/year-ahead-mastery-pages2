
-- ========================================
-- Month Tasks system (replaces daily tasks)
-- ========================================

-- A) month_tasks: global catalog of monthly tasks
CREATE TABLE public.month_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sort_order int NOT NULL DEFAULT 0,
  title text NOT NULL,
  description text,
  type text,
  image_url text,
  audio_url text,
  video_url text,
  file_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.month_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read month_tasks"
  ON public.month_tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Admins can manage month_tasks"
  ON public.month_tasks FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- B) month_task_checks: per-user, per-month checks
CREATE TABLE public.month_task_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  month_id uuid NOT NULL REFERENCES public.months(id) ON DELETE CASCADE,
  month_task_id uuid NOT NULL REFERENCES public.month_tasks(id) ON DELETE CASCADE,
  checked boolean NOT NULL DEFAULT true,
  checked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_id, month_task_id)
);

ALTER TABLE public.month_task_checks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own month_task_checks"
  ON public.month_task_checks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own month_task_checks"
  ON public.month_task_checks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own month_task_checks"
  ON public.month_task_checks FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own month_task_checks"
  ON public.month_task_checks FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- C) month_task_notes: per-user, per-month notes on tasks
CREATE TABLE public.month_task_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  month_id uuid NOT NULL REFERENCES public.months(id) ON DELETE CASCADE,
  month_task_id uuid NOT NULL REFERENCES public.month_tasks(id) ON DELETE CASCADE,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, month_id, month_task_id)
);

ALTER TABLE public.month_task_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own month_task_notes"
  ON public.month_task_notes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own month_task_notes"
  ON public.month_task_notes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own month_task_notes"
  ON public.month_task_notes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own month_task_notes"
  ON public.month_task_notes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Trigger for updated_at on month_task_notes
CREATE TRIGGER update_month_task_notes_updated_at
  BEFORE UPDATE ON public.month_task_notes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- D) Seed 17 default month tasks
INSERT INTO public.month_tasks (sort_order, title) VALUES
  (1, 'Leer libro del mes'),
  (2, 'Leer evangelio del mes'),
  (3, 'Orar diariamente (Padre Nuestro)'),
  (4, 'Asistir a 1 día de congregación'),
  (5, 'Ahorrar $100 dólares'),
  (6, 'Cumplir presupuesto 70-20-10'),
  (7, 'Registrar todos los gastos'),
  (8, 'Aplicar plan bola de nieve con munición extra'),
  (9, 'Entrenar pesas 2 veces por semana'),
  (10, 'Cumplir plan de alimentación del nutricionista'),
  (11, 'Consumir dulce máximo 4 veces en el mes'),
  (12, 'Resolver ejercicios prácticos del mes'),
  (13, 'Avanzar en proyecto personal'),
  (14, 'Alimentar círculos de influencia'),
  (15, 'Asistir a sesión virtual con Coach'),
  (16, 'Asistir a sesión virtual con Jhonny Romero'),
  (17, 'Completar hoja de cierre y reflexión del mes');
