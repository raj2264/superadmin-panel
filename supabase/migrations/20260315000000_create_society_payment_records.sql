-- Society payment tracking table for superadmin collections
-- Stores recurring payment entries from societies with proof references

CREATE TABLE IF NOT EXISTS public.society_payment_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  billing_frequency TEXT NOT NULL CHECK (billing_frequency IN ('monthly', 'quarterly', 'bi_annually', 'annually')),
  period_start DATE,
  period_end DATE,
  payment_amount NUMERIC(12,2) NOT NULL CHECK (payment_amount >= 0),
  payment_mode TEXT NOT NULL CHECK (payment_mode IN ('upi', 'bank_transfer', 'cheque', 'cash', 'online', 'other')),
  transaction_id TEXT,
  cheque_number TEXT,
  cheque_date DATE,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  reference_notes TEXT,
  proof_file_path TEXT,
  proof_file_name TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  CONSTRAINT cheque_details_required_for_cheque_mode CHECK (
    payment_mode <> 'cheque' OR (cheque_number IS NOT NULL AND cheque_date IS NOT NULL)
  )
);

CREATE INDEX IF NOT EXISTS idx_society_payment_records_society_id ON public.society_payment_records(society_id);
CREATE INDEX IF NOT EXISTS idx_society_payment_records_payment_date ON public.society_payment_records(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_society_payment_records_frequency ON public.society_payment_records(billing_frequency);

ALTER TABLE public.society_payment_records ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'society_payment_records'
      AND policyname = 'Superadmins full access on society_payment_records'
  ) THEN
    CREATE POLICY "Superadmins full access on society_payment_records"
      ON public.society_payment_records
      FOR ALL
      USING (EXISTS (SELECT 1 FROM public.superadmins WHERE superadmins.id = auth.uid()))
      WITH CHECK (EXISTS (SELECT 1 FROM public.superadmins WHERE superadmins.id = auth.uid()));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'society_payment_records'
      AND policyname = 'Society admins can view own society_payment_records'
  ) THEN
    CREATE POLICY "Society admins can view own society_payment_records"
      ON public.society_payment_records
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1
          FROM public.society_admins
          WHERE society_admins.user_id = auth.uid()
            AND society_admins.society_id = society_payment_records.society_id
        )
      );
  END IF;
END $$;

CREATE OR REPLACE FUNCTION public.update_society_payment_records_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_society_payment_records_updated_at ON public.society_payment_records;

CREATE TRIGGER trigger_update_society_payment_records_updated_at
  BEFORE UPDATE ON public.society_payment_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_society_payment_records_updated_at();

-- Storage bucket to keep screenshots/proof files
INSERT INTO storage.buckets (id, name, public)
VALUES ('society-payment-proofs', 'society-payment-proofs', false)
ON CONFLICT (id) DO NOTHING;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Superadmins read society payment proofs'
  ) THEN
    CREATE POLICY "Superadmins read society payment proofs"
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (
        bucket_id = 'society-payment-proofs'
        AND EXISTS (SELECT 1 FROM public.superadmins WHERE superadmins.id = auth.uid())
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Superadmins insert society payment proofs'
  ) THEN
    CREATE POLICY "Superadmins insert society payment proofs"
      ON storage.objects
      FOR INSERT
      TO authenticated
      WITH CHECK (
        bucket_id = 'society-payment-proofs'
        AND EXISTS (SELECT 1 FROM public.superadmins WHERE superadmins.id = auth.uid())
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Superadmins update society payment proofs'
  ) THEN
    CREATE POLICY "Superadmins update society payment proofs"
      ON storage.objects
      FOR UPDATE
      TO authenticated
      USING (
        bucket_id = 'society-payment-proofs'
        AND EXISTS (SELECT 1 FROM public.superadmins WHERE superadmins.id = auth.uid())
      );
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
      AND tablename = 'objects'
      AND policyname = 'Superadmins delete society payment proofs'
  ) THEN
    CREATE POLICY "Superadmins delete society payment proofs"
      ON storage.objects
      FOR DELETE
      TO authenticated
      USING (
        bucket_id = 'society-payment-proofs'
        AND EXISTS (SELECT 1 FROM public.superadmins WHERE superadmins.id = auth.uid())
      );
  END IF;
END $$;
