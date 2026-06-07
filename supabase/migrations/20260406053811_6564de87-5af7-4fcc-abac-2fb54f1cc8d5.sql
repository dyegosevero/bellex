-- ============================================================
-- BASELINE MIGRATION — Full schema for Nasce uma Autora
-- Generated 2026-04-06 — consolidates all previous migrations
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "unaccent" SCHEMA extensions;

-- ============================================================
-- 1. ENUM
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'especialista', 'atendimento');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. TABLES (ordered by FK dependencies)
-- ============================================================

-- clients
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  cpf TEXT,
  birth_date DATE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  weight NUMERIC,
  height NUMERIC,
  skin_type TEXT,
  clinical_notes TEXT,
  address TEXT,
  profession TEXT,
  citizen_card_number TEXT,
  consent_given BOOLEAN NOT NULL DEFAULT false,
  consent_pdf_url TEXT,
  preferences TEXT,
  interests TEXT,
  preferred_schedule TEXT,
  internal_notes TEXT,
  opt_in BOOLEAN NOT NULL DEFAULT false
);

-- service_categories
CREATE TABLE IF NOT EXISTS public.service_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- services
CREATE TABLE IF NOT EXISTS public.services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC,
  currency TEXT NOT NULL DEFAULT 'EUR',
  duration_minutes INTEGER,
  active BOOLEAN NOT NULL DEFAULT true,
  color TEXT,
  category_id UUID REFERENCES public.service_categories(id) ON DELETE SET NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  requires_consent_form BOOLEAN NOT NULL DEFAULT false,
  requires_before_after_photos BOOLEAN NOT NULL DEFAULT false,
  requires_completion_signature BOOLEAN NOT NULL DEFAULT false,
  requires_assessment_form BOOLEAN NOT NULL DEFAULT false,
  assessment_form_type TEXT,
  multi_session BOOLEAN NOT NULL DEFAULT false,
  session_count INTEGER,
  show_on_booking_page BOOLEAN NOT NULL DEFAULT true,
  show_price_on_booking_page BOOLEAN NOT NULL DEFAULT true,
  archived BOOLEAN NOT NULL DEFAULT false,
  vat_rate NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  blocked BOOLEAN NOT NULL DEFAULT false,
  last_auto_assignment_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- user_roles
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL DEFAULT 'especialista',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- appointments
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  specialist_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  attendant_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'agendado',
  notes TEXT,
  created_by UUID,
  cancellation_token UUID NOT NULL DEFAULT gen_random_uuid(),
  session_number INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- appointment_anamnesis
CREATE TABLE IF NOT EXISTS public.appointment_anamnesis (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  form_type TEXT NOT NULL,
  form_data JSONB NOT NULL DEFAULT '{}',
  filled_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- appointment_feedback
CREATE TABLE IF NOT EXISTS public.appointment_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  specialist_id UUID,
  rating INTEGER NOT NULL,
  comment TEXT,
  collected_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- service_form_fields
CREATE TABLE IF NOT EXISTS public.service_form_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  options JSONB,
  required BOOLEAN NOT NULL DEFAULT false,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- appointment_form_responses
CREATE TABLE IF NOT EXISTS public.appointment_form_responses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  field_id UUID NOT NULL REFERENCES public.service_form_fields(id) ON DELETE CASCADE,
  value TEXT,
  file_urls JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- appointment_products
CREATE TABLE IF NOT EXISTS public.appointment_products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  product_id UUID NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- appointment_services
CREATE TABLE IF NOT EXISTS public.appointment_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- booking_page_settings
CREATE TABLE IF NOT EXISTS public.booking_page_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT DEFAULT 'Agendar',
  logo_url TEXT,
  cover_url TEXT,
  background_color TEXT DEFAULT '#f5f0eb',
  footer_notes TEXT,
  social_instagram TEXT,
  social_facebook TEXT,
  social_website TEXT,
  allow_specialist_choice BOOLEAN NOT NULL DEFAULT true,
  categories_expanded BOOLEAN NOT NULL DEFAULT false,
  require_email BOOLEAN NOT NULL DEFAULT true,
  require_gender BOOLEAN NOT NULL DEFAULT false,
  require_birth_date BOOLEAN NOT NULL DEFAULT false,
  require_nif BOOLEAN NOT NULL DEFAULT false,
  terms_url TEXT,
  privacy_url TEXT,
  marketing_url TEXT,
  tracking_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- business_hours
CREATE TABLE IF NOT EXISTS public.business_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  weekday INTEGER NOT NULL,
  start_time TIME NOT NULL DEFAULT '08:00',
  end_time TIME NOT NULL DEFAULT '18:00',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- calendar_blocks
CREATE TABLE IF NOT EXISTS public.calendar_blocks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id UUID NOT NULL,
  start_datetime TIMESTAMPTZ NOT NULL,
  end_datetime TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- calendar_feeds
CREATE TABLE IF NOT EXISTS public.calendar_feeds (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id UUID,
  token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  feed_type TEXT NOT NULL DEFAULT 'specialist',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- campaigns
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL DEFAULT '',
  channel TEXT NOT NULL DEFAULT 'email',
  audience_filter TEXT NOT NULL DEFAULT 'all',
  include_no_optin BOOLEAN NOT NULL DEFAULT false,
  subject TEXT,
  content TEXT NOT NULL DEFAULT '',
  cta_text TEXT,
  cta_url TEXT,
  header_image_url TEXT,
  show_header_image BOOLEAN DEFAULT true,
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  recipient_count INTEGER,
  batch_size INTEGER NOT NULL DEFAULT 50,
  send_delay_seconds INTEGER NOT NULL DEFAULT 2,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- campaign_recipients
CREATE TABLE IF NOT EXISTS public.campaign_recipients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending',
  sent_at TIMESTAMPTZ,
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- products
CREATE TABLE IF NOT EXISTS public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  stock_quantity INTEGER NOT NULL DEFAULT 0,
  sku TEXT,
  brand TEXT,
  category TEXT,
  image_url TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- product_categories
CREATE TABLE IF NOT EXISTS public.product_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- charges
CREATE TABLE IF NOT EXISTS public.charges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  amount NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pendente',
  due_date DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  discount_type TEXT,
  discount_value NUMERIC DEFAULT 0,
  discount_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- charge_items
CREATE TABLE IF NOT EXISTS public.charge_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  charge_id UUID NOT NULL REFERENCES public.charges(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  item_type TEXT NOT NULL DEFAULT 'service',
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price NUMERIC NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- charge_sends
CREATE TABLE IF NOT EXISTS public.charge_sends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  charge_id UUID NOT NULL REFERENCES public.charges(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  send_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  sent_by UUID,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- client_consents
CREATE TABLE IF NOT EXISTS public.client_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  consent_type TEXT NOT NULL,
  signed_at TIMESTAMPTZ,
  signed_by_name TEXT,
  signature_url TEXT,
  collected_by UUID,
  is_valid BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- client_documents
CREATE TABLE IF NOT EXISTS public.client_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'other',
  notes TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- client_images
CREATE TABLE IF NOT EXISTS public.client_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  file_url TEXT NOT NULL,
  image_type TEXT NOT NULL DEFAULT 'other',
  caption TEXT,
  uploaded_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- clinic_settings
CREATE TABLE IF NOT EXISTS public.clinic_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  clinic_name TEXT,
  phone TEXT,
  address TEXT,
  timezone TEXT DEFAULT 'Europe/Lisbon',
  currency TEXT DEFAULT 'EUR',
  booking_url TEXT,
  system_url TEXT,
  inactivity_days INTEGER NOT NULL DEFAULT 90,
  reminder_lead TEXT,
  google_calendar_id TEXT,
  calendar_slot_interval TEXT,
  sms_sender_name TEXT,
  default_vat_rate NUMERIC,
  inactive_notification_interval_days INTEGER,
  allow_multi_service_booking BOOLEAN DEFAULT false,
  min_booking_lead TEXT,
  max_booking_future TEXT,
  optimize_bookings TEXT,
  hide_off_duty_specialists TEXT,
  show_notes_on_calendar TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- consent_texts
CREATE TABLE IF NOT EXISTS public.consent_texts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL,
  label TEXT NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- google_calendar_syncs
CREATE TABLE IF NOT EXISTS public.google_calendar_syncs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  google_event_id TEXT NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  event_summary TEXT,
  event_start TIMESTAMPTZ,
  event_end TIMESTAMPTZ,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- integration_settings
CREATE TABLE IF NOT EXISTS public.integration_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL,
  setting_value TEXT,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- message_templates
CREATE TABLE IF NOT EXISTS public.message_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL,
  label TEXT NOT NULL,
  subject TEXT,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- notification_logs
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL,
  notification_type TEXT NOT NULL,
  channel TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'sent',
  external_id TEXT,
  sent_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- notification_settings
CREATE TABLE IF NOT EXISTS public.notification_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  channel TEXT NOT NULL DEFAULT 'email',
  recipient TEXT,
  threshold INTEGER,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- password_reset_tokens
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- reminder_history
CREATE TABLE IF NOT EXISTS public.reminder_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL,
  client_id UUID,
  client_name TEXT,
  service_id UUID,
  service_name TEXT,
  specialist_id UUID,
  specialist_name TEXT,
  start_time TIMESTAMPTZ,
  send_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending',
  status_detail TEXT,
  channels JSONB,
  channels_payload JSONB,
  email_status TEXT,
  email_external_id TEXT,
  sms_status TEXT,
  sms_external_id TEXT,
  whatsapp_status TEXT,
  whatsapp_external_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- review_requests
CREATE TABLE IF NOT EXISTS public.review_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  confirmation_token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  send_count INTEGER NOT NULL DEFAULT 0,
  last_sent_at TIMESTAMPTZ,
  next_send_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id)
);

-- service_specialists
CREATE TABLE IF NOT EXISTS public.service_specialists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  specialist_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- specialist_hours
CREATE TABLE IF NOT EXISTS public.specialist_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id UUID NOT NULL,
  weekday INTEGER NOT NULL,
  start_time TIME NOT NULL DEFAULT '08:00',
  end_time TIME NOT NULL DEFAULT '18:00',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- specialist_services
CREATE TABLE IF NOT EXISTS public.specialist_services (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  specialist_id UUID NOT NULL,
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  custom_duration_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- sms_logs
CREATE TABLE IF NOT EXISTS public.sms_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  phone TEXT NOT NULL,
  message TEXT,
  message_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  callback_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- smtp_settings
CREATE TABLE IF NOT EXISTS public.smtp_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host TEXT NOT NULL DEFAULT '',
  port INTEGER NOT NULL DEFAULT 587,
  username TEXT NOT NULL DEFAULT '',
  encrypted_password TEXT NOT NULL DEFAULT '',
  from_email TEXT NOT NULL DEFAULT '',
  from_name TEXT NOT NULL DEFAULT '',
  use_tls BOOLEAN NOT NULL DEFAULT true,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- FK for appointment_products -> products
DO $$ BEGIN
  ALTER TABLE public.appointment_products
    ADD CONSTRAINT appointment_products_product_id_fkey
    FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 3. ENABLE RLS ON ALL TABLES
-- ============================================================
ALTER TABLE public.appointment_anamnesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_form_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_page_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_feeds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaign_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charge_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charge_sends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.client_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_texts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.google_calendar_syncs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminder_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.review_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_form_fields ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_specialists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smtp_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialist_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialist_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. HELPER FUNCTIONS (must exist before policies)
-- ============================================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.has_role(_user_id, 'admin')
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','especialista','atendimento')
  )
$$;

CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ============================================================
-- 5. RLS POLICIES (all idempotent with DROP IF EXISTS)
-- ============================================================

-- appointment_anamnesis
DROP POLICY IF EXISTS "Auth users can insert anamnesis" ON public.appointment_anamnesis;
CREATE POLICY "Auth users can insert anamnesis" ON public.appointment_anamnesis FOR INSERT TO authenticated WITH CHECK ((is_admin(auth.uid()) OR has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Auth users can update anamnesis" ON public.appointment_anamnesis;
CREATE POLICY "Auth users can update anamnesis" ON public.appointment_anamnesis FOR UPDATE TO authenticated USING ((is_admin(auth.uid()) OR has_role(auth.uid(), 'especialista'::app_role)));
DROP POLICY IF EXISTS "Only admins can delete anamnesis" ON public.appointment_anamnesis;
CREATE POLICY "Only admins can delete anamnesis" ON public.appointment_anamnesis FOR DELETE TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Staff can view anamnesis" ON public.appointment_anamnesis;
CREATE POLICY "Staff can view anamnesis" ON public.appointment_anamnesis FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- appointment_feedback
DROP POLICY IF EXISTS "Auth users can insert feedback" ON public.appointment_feedback;
CREATE POLICY "Auth users can insert feedback" ON public.appointment_feedback FOR INSERT TO authenticated WITH CHECK ((is_admin(auth.uid()) OR has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Only admins can delete feedback" ON public.appointment_feedback;
CREATE POLICY "Only admins can delete feedback" ON public.appointment_feedback FOR DELETE TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Staff can view feedback" ON public.appointment_feedback;
CREATE POLICY "Staff can view feedback" ON public.appointment_feedback FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- appointment_form_responses
DROP POLICY IF EXISTS "Auth users can insert responses" ON public.appointment_form_responses;
CREATE POLICY "Auth users can insert responses" ON public.appointment_form_responses FOR INSERT TO authenticated WITH CHECK ((is_admin(auth.uid()) OR has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Auth users can update responses" ON public.appointment_form_responses;
CREATE POLICY "Auth users can update responses" ON public.appointment_form_responses FOR UPDATE TO authenticated USING ((is_admin(auth.uid()) OR has_role(auth.uid(), 'especialista'::app_role)));
DROP POLICY IF EXISTS "Authenticated can view responses" ON public.appointment_form_responses;
CREATE POLICY "Authenticated can view responses" ON public.appointment_form_responses FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Staff can view form responses" ON public.appointment_form_responses;
CREATE POLICY "Staff can view form responses" ON public.appointment_form_responses FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- appointment_products
DROP POLICY IF EXISTS "Auth users can delete appointment products" ON public.appointment_products;
CREATE POLICY "Auth users can delete appointment products" ON public.appointment_products FOR DELETE TO authenticated USING ((is_admin(auth.uid()) OR has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Auth users can insert appointment products" ON public.appointment_products;
CREATE POLICY "Auth users can insert appointment products" ON public.appointment_products FOR INSERT TO authenticated WITH CHECK ((is_admin(auth.uid()) OR has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Auth users can update appointment products" ON public.appointment_products;
CREATE POLICY "Auth users can update appointment products" ON public.appointment_products FOR UPDATE TO authenticated USING ((is_admin(auth.uid()) OR has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Staff can view appointment products" ON public.appointment_products;
CREATE POLICY "Staff can view appointment products" ON public.appointment_products FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- appointment_services
DROP POLICY IF EXISTS "Anon can insert appointment_services" ON public.appointment_services;
CREATE POLICY "Anon can insert appointment_services" ON public.appointment_services FOR INSERT TO public WITH CHECK (((appointment_id IS NOT NULL) AND (service_id IS NOT NULL)));
DROP POLICY IF EXISTS "Auth users can insert appointment_services" ON public.appointment_services;
CREATE POLICY "Auth users can insert appointment_services" ON public.appointment_services FOR INSERT TO public WITH CHECK ((is_admin(auth.uid()) OR has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Authenticated can view appointment_services" ON public.appointment_services;
CREATE POLICY "Authenticated can view appointment_services" ON public.appointment_services FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Only admins can delete appointment_services" ON public.appointment_services;
CREATE POLICY "Only admins can delete appointment_services" ON public.appointment_services FOR DELETE TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Staff can delete appointment_services" ON public.appointment_services;
CREATE POLICY "Staff can delete appointment_services" ON public.appointment_services FOR DELETE TO authenticated USING ((has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Staff can view appointment services" ON public.appointment_services;
CREATE POLICY "Staff can view appointment services" ON public.appointment_services FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- appointments
DROP POLICY IF EXISTS "Only admins can delete appointments" ON public.appointments;
CREATE POLICY "Only admins can delete appointments" ON public.appointments FOR DELETE TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Public can insert appointments with required fields" ON public.appointments;
CREATE POLICY "Public can insert appointments with required fields" ON public.appointments FOR INSERT TO public WITH CHECK (((client_id IS NOT NULL) AND (service_id IS NOT NULL) AND (start_time IS NOT NULL) AND (status = 'agendado'::text)));
DROP POLICY IF EXISTS "Staff can delete appointments" ON public.appointments;
CREATE POLICY "Staff can delete appointments" ON public.appointments FOR DELETE TO authenticated USING (is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff can insert appointments" ON public.appointments;
CREATE POLICY "Staff can insert appointments" ON public.appointments FOR INSERT TO authenticated WITH CHECK (is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff can update appointments" ON public.appointments;
CREATE POLICY "Staff can update appointments" ON public.appointments FOR UPDATE TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff can view appointments" ON public.appointments;
CREATE POLICY "Staff can view appointments" ON public.appointments FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- booking_page_settings
DROP POLICY IF EXISTS "Admins manage booking_page_settings" ON public.booking_page_settings;
CREATE POLICY "Admins manage booking_page_settings" ON public.booking_page_settings FOR ALL TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Anyone can view booking_page_settings" ON public.booking_page_settings;
CREATE POLICY "Anyone can view booking_page_settings" ON public.booking_page_settings FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Authenticated can view booking_page_settings" ON public.booking_page_settings;
CREATE POLICY "Authenticated can view booking_page_settings" ON public.booking_page_settings FOR SELECT TO authenticated USING (true);

-- business_hours
DROP POLICY IF EXISTS "Anyone can view business_hours" ON public.business_hours;
CREATE POLICY "Anyone can view business_hours" ON public.business_hours FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Authenticated can view business_hours" ON public.business_hours;
CREATE POLICY "Authenticated can view business_hours" ON public.business_hours FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Only admins manage business_hours" ON public.business_hours;
CREATE POLICY "Only admins manage business_hours" ON public.business_hours FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- calendar_blocks
DROP POLICY IF EXISTS "Admins manage calendar_blocks" ON public.calendar_blocks;
CREATE POLICY "Admins manage calendar_blocks" ON public.calendar_blocks FOR ALL TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Authenticated can view calendar_blocks" ON public.calendar_blocks;
CREATE POLICY "Authenticated can view calendar_blocks" ON public.calendar_blocks FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Specialists manage own blocks" ON public.calendar_blocks;
CREATE POLICY "Specialists manage own blocks" ON public.calendar_blocks FOR ALL TO authenticated USING ((auth.uid() = specialist_id)) WITH CHECK ((auth.uid() = specialist_id));

-- calendar_feeds
DROP POLICY IF EXISTS "Admins manage calendar_feeds" ON public.calendar_feeds;
CREATE POLICY "Admins manage calendar_feeds" ON public.calendar_feeds FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Specialists manage own feed" ON public.calendar_feeds;
CREATE POLICY "Specialists manage own feed" ON public.calendar_feeds FOR ALL TO public USING ((auth.uid() = specialist_id)) WITH CHECK ((auth.uid() = specialist_id));

-- campaign_recipients
DROP POLICY IF EXISTS "Admins manage campaign_recipients" ON public.campaign_recipients;
CREATE POLICY "Admins manage campaign_recipients" ON public.campaign_recipients FOR ALL TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Authenticated can view campaign_recipients" ON public.campaign_recipients;
CREATE POLICY "Authenticated can view campaign_recipients" ON public.campaign_recipients FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Staff can view campaign recipients" ON public.campaign_recipients;
CREATE POLICY "Staff can view campaign recipients" ON public.campaign_recipients FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- campaigns
DROP POLICY IF EXISTS "Admins manage campaigns" ON public.campaigns;
CREATE POLICY "Admins manage campaigns" ON public.campaigns FOR ALL TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Staff can view campaigns" ON public.campaigns;
CREATE POLICY "Staff can view campaigns" ON public.campaigns FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- charge_items
DROP POLICY IF EXISTS "Auth users can insert charge_items" ON public.charge_items;
CREATE POLICY "Auth users can insert charge_items" ON public.charge_items FOR INSERT TO authenticated WITH CHECK ((is_admin(auth.uid()) OR has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Auth users can update charge_items" ON public.charge_items;
CREATE POLICY "Auth users can update charge_items" ON public.charge_items FOR UPDATE TO authenticated USING ((is_admin(auth.uid()) OR has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Authenticated can view charge_items" ON public.charge_items;
CREATE POLICY "Authenticated can view charge_items" ON public.charge_items FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Only admins can delete charge_items" ON public.charge_items;
CREATE POLICY "Only admins can delete charge_items" ON public.charge_items FOR DELETE TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Staff can view charge items" ON public.charge_items;
CREATE POLICY "Staff can view charge items" ON public.charge_items FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- charge_sends
DROP POLICY IF EXISTS "Auth users can insert charge_sends" ON public.charge_sends;
CREATE POLICY "Auth users can insert charge_sends" ON public.charge_sends FOR INSERT TO authenticated WITH CHECK ((is_admin(auth.uid()) OR has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Authenticated can view charge_sends" ON public.charge_sends;
CREATE POLICY "Authenticated can view charge_sends" ON public.charge_sends FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Staff can view charge sends" ON public.charge_sends;
CREATE POLICY "Staff can view charge sends" ON public.charge_sends FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- charges
DROP POLICY IF EXISTS "Auth users can insert charges" ON public.charges;
CREATE POLICY "Auth users can insert charges" ON public.charges FOR INSERT TO authenticated WITH CHECK ((is_admin(auth.uid()) OR has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Auth users can update charges" ON public.charges;
CREATE POLICY "Auth users can update charges" ON public.charges FOR UPDATE TO authenticated USING ((is_admin(auth.uid()) OR has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role))) WITH CHECK ((is_admin(auth.uid()) OR has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Only admins can delete charges" ON public.charges;
CREATE POLICY "Only admins can delete charges" ON public.charges FOR DELETE TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Staff can view charges" ON public.charges;
CREATE POLICY "Staff can view charges" ON public.charges FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- client_consents
DROP POLICY IF EXISTS "Auth users can insert consents" ON public.client_consents;
CREATE POLICY "Auth users can insert consents" ON public.client_consents FOR INSERT TO authenticated WITH CHECK ((is_admin(auth.uid()) OR has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Auth users can update consents" ON public.client_consents;
CREATE POLICY "Auth users can update consents" ON public.client_consents FOR UPDATE TO authenticated USING ((is_admin(auth.uid()) OR has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role))) WITH CHECK ((is_admin(auth.uid()) OR has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Only admins can delete consents" ON public.client_consents;
CREATE POLICY "Only admins can delete consents" ON public.client_consents FOR DELETE TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Staff can view consents" ON public.client_consents;
CREATE POLICY "Staff can view consents" ON public.client_consents FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- client_documents
DROP POLICY IF EXISTS "Auth users can insert client documents" ON public.client_documents;
CREATE POLICY "Auth users can insert client documents" ON public.client_documents FOR INSERT TO authenticated WITH CHECK ((is_admin(auth.uid()) OR has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Only admins can delete client documents" ON public.client_documents;
CREATE POLICY "Only admins can delete client documents" ON public.client_documents FOR DELETE TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Staff can view client documents" ON public.client_documents;
CREATE POLICY "Staff can view client documents" ON public.client_documents FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- client_images
DROP POLICY IF EXISTS "Auth users can insert client images" ON public.client_images;
CREATE POLICY "Auth users can insert client images" ON public.client_images FOR INSERT TO authenticated WITH CHECK ((is_admin(auth.uid()) OR has_role(auth.uid(), 'especialista'::app_role)));
DROP POLICY IF EXISTS "Only admins can delete client images" ON public.client_images;
CREATE POLICY "Only admins can delete client images" ON public.client_images FOR DELETE TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Staff can view client images" ON public.client_images;
CREATE POLICY "Staff can view client images" ON public.client_images FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- clients
DROP POLICY IF EXISTS "Anon can insert clients with required fields" ON public.clients;
CREATE POLICY "Anon can insert clients with required fields" ON public.clients FOR INSERT TO anon WITH CHECK (((full_name IS NOT NULL) AND (full_name <> ''::text) AND (email IS NOT NULL) AND (phone IS NOT NULL)));
DROP POLICY IF EXISTS "Auth users can insert clients" ON public.clients;
CREATE POLICY "Auth users can insert clients" ON public.clients FOR INSERT TO public WITH CHECK ((is_admin(auth.uid()) OR has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Auth users can update clients" ON public.clients;
CREATE POLICY "Auth users can update clients" ON public.clients FOR UPDATE TO public USING ((is_admin(auth.uid()) OR has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Only admins can delete clients" ON public.clients;
CREATE POLICY "Only admins can delete clients" ON public.clients FOR DELETE TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Staff can delete clients" ON public.clients;
CREATE POLICY "Staff can delete clients" ON public.clients FOR DELETE TO authenticated USING (is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff can insert clients" ON public.clients;
CREATE POLICY "Staff can insert clients" ON public.clients FOR INSERT TO authenticated WITH CHECK (is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff can update clients" ON public.clients;
CREATE POLICY "Staff can update clients" ON public.clients FOR UPDATE TO authenticated USING (is_staff(auth.uid())) WITH CHECK (is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff can view clients" ON public.clients;
CREATE POLICY "Staff can view clients" ON public.clients FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- clinic_settings
DROP POLICY IF EXISTS "Admins manage clinic settings" ON public.clinic_settings;
CREATE POLICY "Admins manage clinic settings" ON public.clinic_settings FOR ALL TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Authenticated can view clinic settings" ON public.clinic_settings;
CREATE POLICY "Authenticated can view clinic settings" ON public.clinic_settings FOR SELECT TO authenticated USING (true);

-- consent_texts
DROP POLICY IF EXISTS "Admins manage consent_texts" ON public.consent_texts;
CREATE POLICY "Admins manage consent_texts" ON public.consent_texts FOR ALL TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Authenticated can view consent_texts" ON public.consent_texts;
CREATE POLICY "Authenticated can view consent_texts" ON public.consent_texts FOR SELECT TO authenticated USING (true);

-- google_calendar_syncs
DROP POLICY IF EXISTS "Admins can view all syncs" ON public.google_calendar_syncs;
CREATE POLICY "Admins can view all syncs" ON public.google_calendar_syncs FOR SELECT TO public USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Users can insert own syncs" ON public.google_calendar_syncs;
CREATE POLICY "Users can insert own syncs" ON public.google_calendar_syncs FOR INSERT TO public WITH CHECK ((auth.uid() = user_id));
DROP POLICY IF EXISTS "Users can view own syncs" ON public.google_calendar_syncs;
CREATE POLICY "Users can view own syncs" ON public.google_calendar_syncs FOR SELECT TO public USING ((auth.uid() = user_id));

-- integration_settings
DROP POLICY IF EXISTS "Admins can view integration_settings" ON public.integration_settings;
CREATE POLICY "Admins can view integration_settings" ON public.integration_settings FOR SELECT TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Only admins can view integration_settings" ON public.integration_settings;
CREATE POLICY "Only admins can view integration_settings" ON public.integration_settings FOR SELECT TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Only admins manage integration_settings" ON public.integration_settings;
CREATE POLICY "Only admins manage integration_settings" ON public.integration_settings FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- message_templates
DROP POLICY IF EXISTS "Authenticated can view message templates" ON public.message_templates;
CREATE POLICY "Authenticated can view message templates" ON public.message_templates FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Only admins manage message templates" ON public.message_templates;
CREATE POLICY "Only admins manage message templates" ON public.message_templates FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- notification_logs
DROP POLICY IF EXISTS "Admins manage notification_logs" ON public.notification_logs;
CREATE POLICY "Admins manage notification_logs" ON public.notification_logs FOR ALL TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Authenticated can view notification_logs" ON public.notification_logs;
CREATE POLICY "Authenticated can view notification_logs" ON public.notification_logs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Staff can view notification logs" ON public.notification_logs;
CREATE POLICY "Staff can view notification logs" ON public.notification_logs FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- notification_settings
DROP POLICY IF EXISTS "Authenticated can view notification settings" ON public.notification_settings;
CREATE POLICY "Authenticated can view notification settings" ON public.notification_settings FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Only admins manage notification settings" ON public.notification_settings;
CREATE POLICY "Only admins manage notification settings" ON public.notification_settings FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- password_reset_tokens
DROP POLICY IF EXISTS "No direct access to reset tokens" ON public.password_reset_tokens;
CREATE POLICY "No direct access to reset tokens" ON public.password_reset_tokens FOR ALL TO authenticated USING (false);

-- product_categories
DROP POLICY IF EXISTS "Admins manage categories" ON public.product_categories;
CREATE POLICY "Admins manage categories" ON public.product_categories FOR ALL TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Authenticated can view categories" ON public.product_categories;
CREATE POLICY "Authenticated can view categories" ON public.product_categories FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Especialistas can delete categories" ON public.product_categories;
CREATE POLICY "Especialistas can delete categories" ON public.product_categories FOR DELETE TO authenticated USING ((has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Especialistas can insert categories" ON public.product_categories;
CREATE POLICY "Especialistas can insert categories" ON public.product_categories FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Especialistas can update categories" ON public.product_categories;
CREATE POLICY "Especialistas can update categories" ON public.product_categories FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));

-- products
DROP POLICY IF EXISTS "Auth users can insert products" ON public.products;
CREATE POLICY "Auth users can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK ((is_admin(auth.uid()) OR has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Auth users can update products" ON public.products;
CREATE POLICY "Auth users can update products" ON public.products FOR UPDATE TO authenticated USING ((is_admin(auth.uid()) OR has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role))) WITH CHECK ((is_admin(auth.uid()) OR has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Authenticated can view products" ON public.products;
CREATE POLICY "Authenticated can view products" ON public.products FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Only admins delete products" ON public.products;
CREATE POLICY "Only admins delete products" ON public.products FOR DELETE TO authenticated USING (is_admin(auth.uid()));

-- profiles
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles" ON public.profiles FOR ALL TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = user_id));

-- reminder_history
DROP POLICY IF EXISTS "Admins manage reminder_history" ON public.reminder_history;
CREATE POLICY "Admins manage reminder_history" ON public.reminder_history FOR ALL TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Authenticated can view reminder_history" ON public.reminder_history;
CREATE POLICY "Authenticated can view reminder_history" ON public.reminder_history FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Staff can insert reminder_history" ON public.reminder_history;
CREATE POLICY "Staff can insert reminder_history" ON public.reminder_history FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Staff can view reminder history" ON public.reminder_history;
CREATE POLICY "Staff can view reminder history" ON public.reminder_history FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- review_requests
DROP POLICY IF EXISTS "Admins manage review_requests" ON public.review_requests;
CREATE POLICY "Admins manage review_requests" ON public.review_requests FOR ALL TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Authenticated can view review_requests" ON public.review_requests;
CREATE POLICY "Authenticated can view review_requests" ON public.review_requests FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Staff can view review requests" ON public.review_requests;
CREATE POLICY "Staff can view review requests" ON public.review_requests FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- service_categories
DROP POLICY IF EXISTS "Admins manage service_categories" ON public.service_categories;
CREATE POLICY "Admins manage service_categories" ON public.service_categories FOR ALL TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Anon can view service_categories" ON public.service_categories;
CREATE POLICY "Anon can view service_categories" ON public.service_categories FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Authenticated can view service_categories" ON public.service_categories;
CREATE POLICY "Authenticated can view service_categories" ON public.service_categories FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Staff can delete service_categories" ON public.service_categories;
CREATE POLICY "Staff can delete service_categories" ON public.service_categories FOR DELETE TO authenticated USING ((has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Staff can insert service_categories" ON public.service_categories;
CREATE POLICY "Staff can insert service_categories" ON public.service_categories FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Staff can update service_categories" ON public.service_categories;
CREATE POLICY "Staff can update service_categories" ON public.service_categories FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role))) WITH CHECK ((has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));

-- service_form_fields
DROP POLICY IF EXISTS "Admins manage form fields" ON public.service_form_fields;
CREATE POLICY "Admins manage form fields" ON public.service_form_fields FOR ALL TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Authenticated can view form fields" ON public.service_form_fields;
CREATE POLICY "Authenticated can view form fields" ON public.service_form_fields FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Staff can delete form fields" ON public.service_form_fields;
CREATE POLICY "Staff can delete form fields" ON public.service_form_fields FOR DELETE TO authenticated USING ((has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Staff can insert form fields" ON public.service_form_fields;
CREATE POLICY "Staff can insert form fields" ON public.service_form_fields FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Staff can update form fields" ON public.service_form_fields;
CREATE POLICY "Staff can update form fields" ON public.service_form_fields FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role))) WITH CHECK ((has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));

-- service_specialists
DROP POLICY IF EXISTS "Anon can view service_specialists" ON public.service_specialists;
CREATE POLICY "Anon can view service_specialists" ON public.service_specialists FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Atendimento can manage service_specialists" ON public.service_specialists;
CREATE POLICY "Atendimento can manage service_specialists" ON public.service_specialists FOR ALL TO authenticated USING (has_role(auth.uid(), 'atendimento'::app_role)) WITH CHECK (has_role(auth.uid(), 'atendimento'::app_role));
DROP POLICY IF EXISTS "Authenticated can view service_specialists" ON public.service_specialists;
CREATE POLICY "Authenticated can view service_specialists" ON public.service_specialists FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Only admins manage service_specialists" ON public.service_specialists;
CREATE POLICY "Only admins manage service_specialists" ON public.service_specialists FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- services
DROP POLICY IF EXISTS "Admins manage services" ON public.services;
CREATE POLICY "Admins manage services" ON public.services FOR ALL TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Anyone can view active services" ON public.services;
CREATE POLICY "Anyone can view active services" ON public.services FOR SELECT TO anon USING ((active = true));
DROP POLICY IF EXISTS "Authenticated can view services" ON public.services;
CREATE POLICY "Authenticated can view services" ON public.services FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Staff can delete services" ON public.services;
CREATE POLICY "Staff can delete services" ON public.services FOR DELETE TO authenticated USING ((has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Staff can insert services" ON public.services;
CREATE POLICY "Staff can insert services" ON public.services FOR INSERT TO authenticated WITH CHECK ((has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));
DROP POLICY IF EXISTS "Staff can update services" ON public.services;
CREATE POLICY "Staff can update services" ON public.services FOR UPDATE TO authenticated USING ((has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role))) WITH CHECK ((has_role(auth.uid(), 'especialista'::app_role) OR has_role(auth.uid(), 'atendimento'::app_role)));

-- sms_logs
DROP POLICY IF EXISTS "Authenticated users can view sms_logs" ON public.sms_logs;
CREATE POLICY "Authenticated users can view sms_logs" ON public.sms_logs FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Staff can insert sms_logs" ON public.sms_logs;
CREATE POLICY "Staff can insert sms_logs" ON public.sms_logs FOR INSERT TO authenticated WITH CHECK (is_staff(auth.uid()));
DROP POLICY IF EXISTS "Staff can view sms logs" ON public.sms_logs;
CREATE POLICY "Staff can view sms logs" ON public.sms_logs FOR SELECT TO authenticated USING (is_staff(auth.uid()));

-- smtp_settings
DROP POLICY IF EXISTS "Only admins can view smtp settings" ON public.smtp_settings;
CREATE POLICY "Only admins can view smtp settings" ON public.smtp_settings FOR SELECT TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Only admins manage smtp settings" ON public.smtp_settings;
CREATE POLICY "Only admins manage smtp settings" ON public.smtp_settings FOR ALL TO authenticated USING (is_admin(auth.uid()));

-- specialist_hours
DROP POLICY IF EXISTS "Admins manage specialist_hours" ON public.specialist_hours;
CREATE POLICY "Admins manage specialist_hours" ON public.specialist_hours FOR ALL TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Atendimento can manage specialist_hours" ON public.specialist_hours;
CREATE POLICY "Atendimento can manage specialist_hours" ON public.specialist_hours FOR ALL TO authenticated USING (has_role(auth.uid(), 'atendimento'::app_role)) WITH CHECK (has_role(auth.uid(), 'atendimento'::app_role));
DROP POLICY IF EXISTS "Authenticated can view specialist_hours" ON public.specialist_hours;
CREATE POLICY "Authenticated can view specialist_hours" ON public.specialist_hours FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Specialists manage own hours" ON public.specialist_hours;
CREATE POLICY "Specialists manage own hours" ON public.specialist_hours FOR ALL TO authenticated USING ((auth.uid() = specialist_id)) WITH CHECK ((auth.uid() = specialist_id));

-- specialist_services
DROP POLICY IF EXISTS "Admins manage specialist_services" ON public.specialist_services;
CREATE POLICY "Admins manage specialist_services" ON public.specialist_services FOR ALL TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Anon can view specialist_services" ON public.specialist_services;
CREATE POLICY "Anon can view specialist_services" ON public.specialist_services FOR SELECT TO anon USING (true);
DROP POLICY IF EXISTS "Atendimento can manage specialist_services" ON public.specialist_services;
CREATE POLICY "Atendimento can manage specialist_services" ON public.specialist_services FOR ALL TO authenticated USING (has_role(auth.uid(), 'atendimento'::app_role)) WITH CHECK (has_role(auth.uid(), 'atendimento'::app_role));
DROP POLICY IF EXISTS "Authenticated can view specialist_services" ON public.specialist_services;
CREATE POLICY "Authenticated can view specialist_services" ON public.specialist_services FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Specialists manage own services" ON public.specialist_services;
CREATE POLICY "Specialists manage own services" ON public.specialist_services FOR ALL TO authenticated USING ((auth.uid() = specialist_id)) WITH CHECK ((auth.uid() = specialist_id));

-- user_roles
DROP POLICY IF EXISTS "Only admins manage roles" ON public.user_roles;
CREATE POLICY "Only admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (is_admin(auth.uid()));
DROP POLICY IF EXISTS "Users can view own role or admins view all" ON public.user_roles;
CREATE POLICY "Users can view own role or admins view all" ON public.user_roles FOR SELECT TO authenticated USING (((auth.uid() = user_id) OR is_admin(auth.uid())));

-- ============================================================
-- 6. DATABASE FUNCTIONS
-- ============================================================

CREATE OR REPLACE FUNCTION public.cancel_appointment_by_token(p_token uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_id uuid; v_status text;
BEGIN
  SELECT id, status INTO v_id, v_status FROM appointments WHERE cancellation_token = p_token;
  IF v_id IS NULL THEN RAISE EXCEPTION 'invalid_token'; END IF;
  IF v_status = 'cancelado' THEN RETURN false; END IF;
  UPDATE appointments SET status = 'cancelado', updated_at = now() WHERE id = v_id;
  RETURN true;
END;
$$;

CREATE OR REPLACE FUNCTION public.lookup_client_by_email(p_email text)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_id uuid;
BEGIN
  IF p_email IS NULL OR p_email = '' THEN RETURN NULL; END IF;
  SELECT id INTO v_id FROM clients WHERE email = p_email LIMIT 1;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.public_clinic_info()
RETURNS json LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT json_build_object(
    'clinic_name', COALESCE(cs.clinic_name, ''),
    'allow_multi_service_booking', COALESCE(cs.allow_multi_service_booking, false),
    'timezone', COALESCE(cs.timezone, 'Europe/Lisbon'),
    'booking_url', COALESCE(cs.booking_url, ''),
    'phone', COALESCE(cs.phone, '')
  ) FROM clinic_settings cs LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.restore_product_stock(p_product_id uuid, p_quantity integer)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  UPDATE products SET stock_quantity = stock_quantity + p_quantity, updated_at = now() WHERE id = p_product_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_appointment_created_by()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.created_by IS NULL THEN NEW.created_by := auth.uid(); END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.deduct_appointment_stock(p_appointment_id uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE item RECORD;
BEGIN
  FOR item IN SELECT product_id, quantity FROM appointment_products WHERE appointment_id = p_appointment_id LOOP
    UPDATE products SET stock_quantity = GREATEST(0, stock_quantity - item.quantity), updated_at = now() WHERE id = item.product_id;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.revenue_per_specialist()
RETURNS TABLE(specialist_id uuid, specialist_name text, total_revenue numeric, appointment_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN QUERY
    SELECT a.specialist_id, COALESCE(p.full_name, 'Sem especialista') AS specialist_name,
      COALESCE(SUM(ch.amount), 0) AS total_revenue, COUNT(DISTINCT a.id) AS appointment_count
    FROM appointments a LEFT JOIN profiles p ON p.user_id = a.specialist_id
    LEFT JOIN charges ch ON ch.appointment_id = a.id AND ch.status = 'pago'
    WHERE a.specialist_id IS NOT NULL GROUP BY a.specialist_id, p.full_name ORDER BY total_revenue DESC;
END;
$$;

CREATE OR REPLACE FUNCTION public.client_metrics(p_client_id uuid)
RETURNS json LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE result JSON;
BEGIN
  SELECT json_build_object(
    'total_invested', COALESCE((SELECT SUM(amount) FROM charges WHERE client_id = p_client_id AND status = 'pago'), 0),
    'total_charges', COALESCE((SELECT SUM(amount) FROM charges WHERE client_id = p_client_id), 0),
    'total_appointments', (SELECT COUNT(*) FROM appointments WHERE client_id = p_client_id),
    'avg_ticket', COALESCE((SELECT AVG(amount) FROM charges WHERE client_id = p_client_id AND status = 'pago'), 0),
    'first_appointment', (SELECT MIN(start_time) FROM appointments WHERE client_id = p_client_id),
    'last_appointment', (SELECT MAX(start_time) FROM appointments WHERE client_id = p_client_id),
    'client_since', (SELECT created_at FROM clients WHERE id = p_client_id)
  ) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_session_number()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_is_multi boolean; v_session_count integer; v_active_count integer; v_next_num integer;
BEGIN
  IF NEW.service_id IS NULL THEN RETURN NEW; END IF;
  SELECT s.multi_session, s.session_count INTO v_is_multi, v_session_count FROM public.services s WHERE s.id = NEW.service_id;
  IF v_is_multi IS TRUE THEN
    SELECT COUNT(*) INTO v_active_count FROM public.appointments a WHERE a.client_id = NEW.client_id AND a.service_id = NEW.service_id AND a.id IS DISTINCT FROM NEW.id AND a.status <> 'cancelado';
    IF COALESCE(v_session_count, 0) > 0 THEN v_next_num := MOD(v_active_count, v_session_count) + 1; ELSE v_next_num := v_active_count + 1; END IF;
    NEW.session_number := v_next_num;
  ELSE NEW.session_number := NULL; END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.create_public_booking(p_client_id uuid, p_service_id uuid, p_specialist_id uuid, p_start_time timestamptz, p_end_time timestamptz, p_notes text DEFAULT NULL, p_service_ids uuid[] DEFAULT NULL)
RETURNS json LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_appointment_id uuid; v_cancellation_token uuid; v_sid uuid;
BEGIN
  IF p_client_id IS NULL THEN RAISE EXCEPTION 'client_id is required'; END IF;
  IF p_service_id IS NULL THEN RAISE EXCEPTION 'service_id is required'; END IF;
  IF p_start_time IS NULL THEN RAISE EXCEPTION 'start_time is required'; END IF;
  INSERT INTO appointments (client_id, service_id, specialist_id, start_time, end_time, status, notes)
  VALUES (p_client_id, p_service_id, p_specialist_id, p_start_time, p_end_time, 'agendado', p_notes)
  RETURNING id, cancellation_token INTO v_appointment_id, v_cancellation_token;
  IF p_service_ids IS NOT NULL AND array_length(p_service_ids, 1) > 0 THEN
    FOREACH v_sid IN ARRAY p_service_ids LOOP INSERT INTO appointment_services (appointment_id, service_id) VALUES (v_appointment_id, v_sid); END LOOP;
  END IF;
  RETURN json_build_object('id', v_appointment_id, 'cancellation_token', v_cancellation_token);
END;
$$;

CREATE OR REPLACE FUNCTION public.public_specialists()
RETURNS TABLE(user_id uuid, full_name text, avatar_url text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT p.user_id, p.full_name, p.avatar_url FROM profiles p INNER JOIN user_roles ur ON ur.user_id = p.user_id AND ur.role = 'especialista' WHERE p.blocked = false
$$;

CREATE OR REPLACE FUNCTION public.get_appointment_by_cancel_token(p_token uuid)
RETURNS json LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE result json;
BEGIN
  SELECT json_build_object('id', a.id, 'start_time', a.start_time, 'status', a.status, 'cancellation_token', a.cancellation_token,
    'client_name', c.full_name, 'client_phone', c.phone, 'client_email', c.email, 'service_name', s.name, 'specialist_name', p.full_name
  ) INTO result FROM appointments a LEFT JOIN clients c ON c.id = a.client_id LEFT JOIN services s ON s.id = a.service_id LEFT JOIN profiles p ON p.user_id = a.specialist_id WHERE a.cancellation_token = p_token;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name) VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.last_visits(p_limit integer DEFAULT 10)
RETURNS TABLE(client_id uuid, client_name text, specialist_id uuid, last_visit timestamptz, is_active boolean)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  RETURN QUERY SELECT c.id AS client_id, c.full_name AS client_name, latest.specialist_id, latest.start_time AS last_visit,
    (latest.start_time >= now() - INTERVAL '3 months') AS is_active
  FROM clients c LEFT JOIN LATERAL (SELECT a.specialist_id, a.start_time FROM appointments a WHERE a.client_id = c.id ORDER BY a.start_time DESC LIMIT 1) latest ON TRUE
  ORDER BY latest.start_time DESC NULLS LAST LIMIT p_limit;
END;
$$;

CREATE OR REPLACE FUNCTION public.inactive_clients()
RETURNS TABLE(client_id uuid, client_name text, phone text, email text, last_visit timestamptz, days_inactive integer, appointment_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE threshold_days integer;
BEGIN
  SELECT COALESCE(cs.inactivity_days, 90) INTO threshold_days FROM clinic_settings cs LIMIT 1;
  IF threshold_days IS NULL THEN threshold_days := 90; END IF;
  RETURN QUERY SELECT c.id AS client_id, c.full_name AS client_name, c.phone, c.email,
    latest.start_time AS last_visit, EXTRACT(DAY FROM now() - latest.start_time)::INTEGER AS days_inactive,
    COALESCE(appt_count.cnt, 0) AS appointment_count
  FROM clients c LEFT JOIN LATERAL (SELECT a.start_time FROM appointments a WHERE a.client_id = c.id ORDER BY a.start_time DESC LIMIT 1) latest ON TRUE
  LEFT JOIN LATERAL (SELECT COUNT(*)::bigint AS cnt FROM appointments a WHERE a.client_id = c.id) appt_count ON TRUE
  WHERE latest.start_time IS NOT NULL AND latest.start_time < now() - (threshold_days || ' days')::INTERVAL ORDER BY latest.start_time ASC;
END;
$$;

CREATE OR REPLACE FUNCTION public.list_user_emails()
RETURNS TABLE(user_id uuid, email text)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT au.id AS user_id, au.email::text FROM auth.users au INNER JOIN public.profiles p ON p.user_id = au.id
$$;

CREATE OR REPLACE FUNCTION public.upsert_booking_client(p_full_name text, p_phone text, p_email text, p_opt_in boolean DEFAULT false, p_birth_date date DEFAULT NULL, p_citizen_card_number text DEFAULT NULL)
RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_id uuid;
BEGIN
  IF p_full_name IS NULL OR p_full_name = '' THEN RAISE EXCEPTION 'full_name is required'; END IF;
  IF p_phone IS NULL OR p_phone = '' THEN RAISE EXCEPTION 'phone is required'; END IF;
  IF p_email IS NULL OR p_email = '' THEN RAISE EXCEPTION 'email is required'; END IF;
  SELECT id INTO v_id FROM clients WHERE email = p_email LIMIT 1;
  IF v_id IS NOT NULL THEN
    IF p_opt_in THEN UPDATE clients SET opt_in = true, updated_at = now() WHERE id = v_id; END IF;
    RETURN v_id;
  END IF;
  INSERT INTO clients (full_name, phone, email, opt_in, birth_date, citizen_card_number) VALUES (p_full_name, p_phone, p_email, COALESCE(p_opt_in, false), p_birth_date, p_citizen_card_number) RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.renumber_sessions_on_cancel()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_is_multi boolean; v_session_count integer; r RECORD; v_seq integer := 0;
BEGIN
  IF NEW.status <> 'cancelado' OR OLD.status = 'cancelado' THEN RETURN NEW; END IF;
  IF NEW.service_id IS NULL THEN RETURN NEW; END IF;
  SELECT s.multi_session, s.session_count INTO v_is_multi, v_session_count FROM public.services s WHERE s.id = NEW.service_id;
  IF v_is_multi IS NOT TRUE THEN RETURN NEW; END IF;
  NEW.session_number := NULL;
  FOR r IN SELECT a.id FROM public.appointments a WHERE a.client_id = NEW.client_id AND a.service_id = NEW.service_id AND a.id <> NEW.id AND a.status <> 'cancelado' ORDER BY a.start_time ASC LOOP
    v_seq := v_seq + 1;
    IF COALESCE(v_session_count, 0) > 0 THEN UPDATE public.appointments SET session_number = MOD(v_seq - 1, v_session_count) + 1 WHERE id = r.id;
    ELSE UPDATE public.appointments SET session_number = v_seq WHERE id = r.id; END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.dashboard_kpis()
RETURNS json LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE result JSON; threshold_days integer; cutoff TIMESTAMP WITH TIME ZONE; month_start TIMESTAMP WITH TIME ZONE := date_trunc('month', now());
BEGIN
  SELECT COALESCE(cs.inactivity_days, 90) INTO threshold_days FROM clinic_settings cs LIMIT 1;
  IF threshold_days IS NULL THEN threshold_days := 90; END IF;
  cutoff := now() - (threshold_days || ' days')::INTERVAL;
  SELECT json_build_object(
    'total_clients', (SELECT COUNT(*) FROM clients),
    'active_clients', (SELECT COUNT(DISTINCT a.client_id) FROM appointments a WHERE a.start_time >= cutoff),
    'inactive_clients', (SELECT COUNT(*) FROM clients c WHERE EXISTS (SELECT 1 FROM appointments a WHERE a.client_id = c.id) AND NOT EXISTS (SELECT 1 FROM appointments a WHERE a.client_id = c.id AND a.start_time >= cutoff)),
    'total_revenue', COALESCE((SELECT SUM(amount) FROM charges WHERE status = 'pago'), 0),
    'monthly_revenue', COALESCE((SELECT SUM(amount) FROM charges WHERE status = 'pago' AND paid_at >= month_start), 0),
    'monthly_appointments', (SELECT COUNT(*) FROM appointments WHERE start_time >= month_start),
    'avg_ticket', COALESCE((SELECT AVG(amount) FROM charges WHERE status = 'pago'), 0),
    'total_paid_charges', (SELECT COUNT(*) FROM charges WHERE status = 'pago')
  ) INTO result;
  RETURN result;
END;
$$;

CREATE OR REPLACE FUNCTION public.search_clients(search_term text DEFAULT '', page_number integer DEFAULT 1, page_size integer DEFAULT 20, sort_column text DEFAULT 'full_name', sort_direction text DEFAULT 'asc', filter_type text DEFAULT 'all')
RETURNS TABLE(id uuid, full_name text, email text, phone text, cpf text, birth_date date, notes text, created_at timestamptz, total_count bigint, visit_count bigint, last_visit timestamptz, first_visit timestamptz)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE clean_term text; cutoff timestamptz := now() - interval '30 days';
BEGIN
  IF auth.uid() IS NULL OR NOT public.is_staff(auth.uid()) THEN RAISE EXCEPTION 'permission denied'; END IF;
  clean_term := '%' || lower(extensions.unaccent(trim(search_term))) || '%';
  RETURN QUERY SELECT c.id, c.full_name, c.email, c.phone, c.cpf, c.birth_date, c.notes, c.created_at,
    count(*) OVER() AS total_count, COALESCE(stats.visit_count, 0) AS visit_count, stats.last_visit, stats.first_visit
  FROM clients c LEFT JOIN LATERAL (SELECT COUNT(*)::bigint AS visit_count, MAX(a.start_time) AS last_visit, MIN(a.start_time) AS first_visit FROM appointments a WHERE a.client_id = c.id) stats ON TRUE
  WHERE (search_term = '' OR search_term IS NULL OR lower(extensions.unaccent(c.full_name)) LIKE clean_term OR lower(extensions.unaccent(COALESCE(c.email, ''))) LIKE clean_term OR lower(COALESCE(c.phone, '')) LIKE clean_term OR lower(COALESCE(c.cpf, '')) LIKE clean_term)
    AND (filter_type = 'all' OR (filter_type = 'novos' AND stats.first_visit >= cutoff) OR (filter_type = 'ativos' AND stats.last_visit >= cutoff) OR (filter_type = 'inativos' AND (stats.last_visit IS NULL OR stats.last_visit < cutoff)))
  ORDER BY
    CASE WHEN sort_column='full_name' AND sort_direction='asc' THEN c.full_name END ASC,
    CASE WHEN sort_column='full_name' AND sort_direction='desc' THEN c.full_name END DESC,
    CASE WHEN sort_column='email' AND sort_direction='asc' THEN c.email END ASC,
    CASE WHEN sort_column='email' AND sort_direction='desc' THEN c.email END DESC,
    CASE WHEN sort_column='phone' AND sort_direction='asc' THEN c.phone END ASC,
    CASE WHEN sort_column='phone' AND sort_direction='desc' THEN c.phone END DESC,
    CASE WHEN sort_column='created_at' AND sort_direction='asc' THEN c.created_at END ASC,
    CASE WHEN sort_column='created_at' AND sort_direction='desc' THEN c.created_at END DESC,
    CASE WHEN sort_column='visit_count' AND sort_direction='desc' THEN stats.visit_count END DESC,
    CASE WHEN sort_column='visit_count' AND sort_direction='asc' THEN stats.visit_count END ASC,
    CASE WHEN sort_column='last_visit' AND sort_direction='desc' THEN stats.last_visit END DESC NULLS LAST,
    CASE WHEN sort_column='last_visit' AND sort_direction='asc' THEN stats.last_visit END ASC NULLS LAST
  LIMIT page_size OFFSET (page_number - 1) * page_size;
END;
$$;

-- ============================================================
-- 7. TRIGGERS
-- ============================================================
DROP TRIGGER IF EXISTS set_session_number_trigger ON public.appointments;
CREATE TRIGGER set_session_number_trigger BEFORE INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.set_session_number();

DROP TRIGGER IF EXISTS renumber_sessions_on_cancel_trigger ON public.appointments;
CREATE TRIGGER renumber_sessions_on_cancel_trigger BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.renumber_sessions_on_cancel();

DROP TRIGGER IF EXISTS set_created_by_trigger ON public.appointments;
CREATE TRIGGER set_created_by_trigger BEFORE INSERT ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.set_appointment_created_by();

-- ============================================================
-- 8. REALTIME
-- ============================================================
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;