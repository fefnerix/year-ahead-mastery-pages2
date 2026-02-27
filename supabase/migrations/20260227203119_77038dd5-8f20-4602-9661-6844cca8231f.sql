
-- =============================================
-- ACCESS CONTROL SYSTEM — TABLES + RLS + SEED
-- =============================================

-- 1) access_products
CREATE TABLE public.access_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.access_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read access_products"
  ON public.access_products FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage access_products"
  ON public.access_products FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 2) access_entitlements
CREATE TABLE public.access_entitlements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.access_products(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  source text NOT NULL DEFAULT 'manual',
  external_customer_id text,
  external_subscription_id text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

ALTER TABLE public.access_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own entitlements"
  ON public.access_entitlements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can do everything on entitlements"
  ON public.access_entitlements FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 3) access_events (idempotent webhook log)
CREATE TABLE public.access_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  provider_event_id text NOT NULL,
  event_type text NOT NULL,
  received_at timestamptz NOT NULL DEFAULT now(),
  processed_at timestamptz,
  status text NOT NULL DEFAULT 'received',
  error text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  UNIQUE(provider, provider_event_id)
);

ALTER TABLE public.access_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage access_events"
  ON public.access_events FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 4) access_actions (audit trail)
CREATE TABLE public.access_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_user_id uuid,
  action text NOT NULL,
  user_id uuid NOT NULL,
  product_id uuid NOT NULL REFERENCES public.access_products(id) ON DELETE CASCADE,
  reason text,
  meta jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.access_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage access_actions"
  ON public.access_actions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- 5) provider_identities
CREATE TABLE public.provider_identities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  provider text NOT NULL,
  external_customer_id text NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(provider, external_customer_id)
);

ALTER TABLE public.provider_identities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage provider_identities"
  ON public.provider_identities FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Indexes
CREATE INDEX idx_access_entitlements_user ON public.access_entitlements(user_id);
CREATE INDEX idx_access_entitlements_status ON public.access_entitlements(status);
CREATE INDEX idx_access_events_provider ON public.access_events(provider, provider_event_id);
CREATE INDEX idx_access_actions_user ON public.access_actions(user_id);
CREATE INDEX idx_provider_identities_user ON public.provider_identities(user_id);

-- Seed default product
INSERT INTO public.access_products (code, name, description)
VALUES ('progress_2026', 'PROGRESS 2026', 'Programa completo PROGRESS 2026');

-- Updated_at trigger for entitlements
CREATE TRIGGER update_access_entitlements_updated_at
  BEFORE UPDATE ON public.access_entitlements
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
