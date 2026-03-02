
-- 1) Add missing columns to product_mappings
ALTER TABLE public.product_mappings
  ADD COLUMN IF NOT EXISTS external_type text NOT NULL DEFAULT 'product_id',
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- 2) Drop existing RESTRICTIVE policies (they block admins)
DROP POLICY IF EXISTS "Admins can read product_mappings" ON public.product_mappings;
DROP POLICY IF EXISTS "Service role full access on product_mappings" ON public.product_mappings;

-- 3) Recreate as PERMISSIVE policies
CREATE POLICY "Admins can manage product_mappings"
  ON public.product_mappings
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Service role full access on product_mappings"
  ON public.product_mappings
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
