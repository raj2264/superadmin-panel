-- ============================================================
-- Migration: Create services, service_bookings, lic_requests, ca_requests tables
-- These tables are required by the superadmin panel pages.
-- Run this in the Supabase SQL Editor.
-- ============================================================

-- 1) SERVICES TABLE
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  price NUMERIC(10,2),
  price_range TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Superadmins can manage all services
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'Superadmins can manage all services') THEN
    CREATE POLICY "Superadmins can manage all services" ON public.services
      FOR ALL USING (EXISTS (SELECT 1 FROM superadmins WHERE superadmins.id = auth.uid()));
  END IF;
END $$;

-- Anyone authenticated can view active services
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'services' AND policyname = 'Anyone can view active services') THEN
    CREATE POLICY "Anyone can view active services" ON public.services
      FOR SELECT USING (is_active = true);
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;

CREATE INDEX IF NOT EXISTS idx_services_category ON public.services(category);
CREATE INDEX IF NOT EXISTS idx_services_is_active ON public.services(is_active);


-- 2) SERVICE_BOOKINGS TABLE
CREATE TABLE IF NOT EXISTS public.service_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  resident_id UUID REFERENCES public.residents(id) ON DELETE CASCADE,
  society_id UUID REFERENCES public.societies(id) ON DELETE CASCADE,
  booking_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.service_bookings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'service_bookings' AND policyname = 'Superadmins can manage all bookings') THEN
    CREATE POLICY "Superadmins can manage all bookings" ON public.service_bookings
      FOR ALL USING (EXISTS (SELECT 1 FROM superadmins WHERE superadmins.id = auth.uid()));
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.service_bookings TO authenticated;

CREATE INDEX IF NOT EXISTS idx_service_bookings_service_id ON public.service_bookings(service_id);
CREATE INDEX IF NOT EXISTS idx_service_bookings_status ON public.service_bookings(status);
CREATE INDEX IF NOT EXISTS idx_service_bookings_booking_date ON public.service_bookings(booking_date);


-- 3) LIC_REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.lic_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  society_id UUID REFERENCES public.societies(id) ON DELETE CASCADE,
  resident_name TEXT NOT NULL,
  policy_number TEXT,
  request_type TEXT NOT NULL DEFAULT 'general',
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  phone TEXT,
  email TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.lic_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lic_requests' AND policyname = 'Superadmins can manage all LIC requests') THEN
    CREATE POLICY "Superadmins can manage all LIC requests" ON public.lic_requests
      FOR ALL USING (EXISTS (SELECT 1 FROM superadmins WHERE superadmins.id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'lic_requests' AND policyname = 'Users can manage their own LIC requests') THEN
    CREATE POLICY "Users can manage their own LIC requests" ON public.lic_requests
      FOR ALL USING (user_id = auth.uid());
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.lic_requests TO authenticated;

CREATE INDEX IF NOT EXISTS idx_lic_requests_society_id ON public.lic_requests(society_id);
CREATE INDEX IF NOT EXISTS idx_lic_requests_status ON public.lic_requests(status);
CREATE INDEX IF NOT EXISTS idx_lic_requests_user_id ON public.lic_requests(user_id);


-- 4) CA_REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.ca_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  society_id UUID NOT NULL REFERENCES public.societies(id) ON DELETE CASCADE,
  resident_id UUID REFERENCES public.residents(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL CHECK (request_type IN ('accounting', 'audit')),
  name TEXT,
  email TEXT,
  phone TEXT,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

ALTER TABLE public.ca_requests ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ca_requests' AND policyname = 'Superadmins can manage all CA requests') THEN
    CREATE POLICY "Superadmins can manage all CA requests" ON public.ca_requests
      FOR ALL USING (EXISTS (SELECT 1 FROM superadmins WHERE superadmins.id = auth.uid()));
  END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ca_requests TO authenticated;

CREATE INDEX IF NOT EXISTS idx_ca_requests_society_id ON public.ca_requests(society_id);
CREATE INDEX IF NOT EXISTS idx_ca_requests_status ON public.ca_requests(status);
CREATE INDEX IF NOT EXISTS idx_ca_requests_resident_id ON public.ca_requests(resident_id);
