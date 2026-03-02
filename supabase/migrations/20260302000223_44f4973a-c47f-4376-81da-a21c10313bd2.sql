
-- 1) access_control (source of truth for access)
CREATE TABLE IF NOT EXISTS public.access_control (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending',
  source text NOT NULL DEFAULT 'manual',
  reason text,
  external_provider text,
  external_customer_id text,
  external_subscription_id text,
  external_transaction_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, program_id)
);

ALTER TABLE public.access_control ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own access_control"
  ON public.access_control FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role full access on access_control"
  ON public.access_control FOR ALL
  USING (auth.role() = 'service_role');

-- Trigger for updated_at
CREATE TRIGGER update_access_control_updated_at
  BEFORE UPDATE ON public.access_control
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) webhook_events (idempotency)
CREATE TABLE IF NOT EXISTS public.webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  event_id text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  status text NOT NULL DEFAULT 'received',
  error text,
  payload jsonb,
  UNIQUE(provider, event_id)
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role full access on webhook_events"
  ON public.webhook_events FOR ALL
  USING (auth.role() = 'service_role');

-- 3) product_mappings (map external product -> program)
CREATE TABLE IF NOT EXISTS public.product_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  external_product_id text NOT NULL,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  action text NOT NULL DEFAULT 'grant',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider, external_product_id)
);

ALTER TABLE public.product_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read product_mappings"
  ON public.product_mappings FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access on product_mappings"
  ON public.product_mappings FOR ALL
  USING (auth.role() = 'service_role');

-- 4) audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  target_user_id uuid,
  action text NOT NULL,
  provider text,
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit_logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role full access on audit_logs"
  ON public.audit_logs FOR ALL
  USING (auth.role() = 'service_role');
