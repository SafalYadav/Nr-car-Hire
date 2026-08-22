-- ==============================================================================
-- NR Car Hire — Supabase Production Database Schema & Initial Migration
-- ==============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Profiles (Linked to auth.users)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    first_name TEXT,
    last_name TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'CUSTOMER' CHECK (role IN ('CUSTOMER', 'ADMIN')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 2. Vehicles (Cars Fleet)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicles (
    id TEXT PRIMARY KEY,
    make TEXT NOT NULL,
    model TEXT NOT NULL,
    year INT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('Sedan', 'SUV', 'Premium', 'Luxury', 'Utility')),
    description TEXT,
    seats INT NOT NULL DEFAULT 5,
    doors INT NOT NULL DEFAULT 4,
    transmission TEXT NOT NULL DEFAULT 'Automatic' CHECK (transmission IN ('Automatic', 'Manual')),
    fuel_type TEXT NOT NULL DEFAULT 'Petrol' CHECK (fuel_type IN ('Petrol', 'Diesel', 'Hybrid', 'Electric')),
    luggage INT NOT NULL DEFAULT 3,
    daily_rate NUMERIC(10, 2) NOT NULL,
    location TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'RESERVED', 'RENTED', 'MAINTENANCE', 'UNAVAILABLE', 'INACTIVE')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    image_url TEXT,
    gallery JSONB DEFAULT '[]'::jsonb,
    features JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicles_status ON public.vehicles(status, is_active);
CREATE INDEX IF NOT EXISTS idx_vehicles_category ON public.vehicles(category);
CREATE INDEX IF NOT EXISTS idx_vehicles_location ON public.vehicles(location);
CREATE INDEX IF NOT EXISTS idx_vehicles_daily_rate ON public.vehicles(daily_rate);

-- ------------------------------------------------------------------------------
-- 3. Vehicle Images (Car Image Management)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicle_images (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    caption TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_images_vehicle_id ON public.vehicle_images(vehicle_id);

-- ------------------------------------------------------------------------------
-- 4. Vehicle Maintenances (Scheduled Maintenance & Holds)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.vehicle_maintenances (
    id TEXT PRIMARY KEY,
    vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    reason TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_maintenances_range ON public.vehicle_maintenances(vehicle_id, start_date, end_date);

-- ------------------------------------------------------------------------------
-- 5. Locations (Airport Hubs & Cities)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.locations (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    airport_or_city TEXT NOT NULL,
    address TEXT NOT NULL,
    state TEXT NOT NULL,
    pickup_available BOOLEAN NOT NULL DEFAULT TRUE,
    dropoff_available BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 6. Discounts & Promotions
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.discounts (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    description TEXT NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('PERCENTAGE', 'FIXED_AMOUNT')),
    value NUMERIC(10, 2) NOT NULL,
    min_rental_days INT DEFAULT 1,
    min_booking_value NUMERIC(10, 2),
    max_discount_amount NUMERIC(10, 2),
    applicable_categories TEXT[],
    usage_limit INT,
    usage_count INT NOT NULL DEFAULT 0,
    per_customer_limit INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 7. Rental Extras (Add-ons & Insurance Options)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.extras (
    id TEXT PRIMARY KEY,
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    pricing_type TEXT NOT NULL CHECK (pricing_type IN ('PER_DAY', 'FLAT')),
    price NUMERIC(10, 2) NOT NULL,
    icon TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    max_quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------------------------
-- 8. Bookings
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bookings (
    id TEXT PRIMARY KEY,
    booking_number TEXT UNIQUE NOT NULL,
    user_id TEXT NOT NULL,
    vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id),
    pickup_location TEXT NOT NULL,
    dropoff_location TEXT NOT NULL,
    pickup_date TIMESTAMPTZ NOT NULL,
    dropoff_date TIMESTAMPTZ NOT NULL,
    pickup_time TEXT NOT NULL DEFAULT '10:00',
    return_time TEXT NOT NULL DEFAULT '10:00',
    rental_days INT NOT NULL,
    daily_rate NUMERIC(10, 2) NOT NULL,
    base_amount NUMERIC(10, 2) NOT NULL,
    extras_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    discount_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0,
    final_amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    promo_code TEXT,
    customer_details JSONB NOT NULL,
    extras JSONB DEFAULT '[]'::jsonb,
    status TEXT NOT NULL DEFAULT 'PAYMENT_PENDING' CHECK (status IN ('PENDING', 'PAYMENT_PENDING', 'CONFIRMED', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'REFUNDED', 'EXPIRED')),
    payment_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (payment_status IN ('PENDING', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED')),
    razorpay_order_id TEXT,
    razorpay_payment_id TEXT,
    cancellation_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bookings_vehicle_dates ON public.bookings(vehicle_id, pickup_date, dropoff_date, status);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_number ON public.bookings(booking_number);

-- ------------------------------------------------------------------------------
-- 9. Payments (Razorpay Transaction Records)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id TEXT PRIMARY KEY,
    booking_id TEXT,
    vehicle_id TEXT NOT NULL,
    razorpay_order_id TEXT UNIQUE NOT NULL,
    razorpay_payment_id TEXT,
    razorpay_signature TEXT,
    amount NUMERIC(10, 2) NOT NULL,
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'AUTHORIZED', 'PAID', 'FAILED', 'REFUNDED')),
    receipt TEXT,
    notes JSONB DEFAULT '{}'::jsonb,
    refund_id TEXT,
    refund_amount NUMERIC(10, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON public.payments(razorpay_order_id);
CREATE INDEX IF NOT EXISTS idx_payments_booking ON public.payments(booking_id);

-- ------------------------------------------------------------------------------
-- 10. Admin Audit Logs
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id TEXT PRIMARY KEY,
    admin_id TEXT NOT NULL,
    action TEXT NOT NULL,
    entity TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.admin_audit_logs(created_at DESC);

-- ------------------------------------------------------------------------------
-- 11. AI Conversations (NR Concierge Session Memory)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id TEXT,
    vehicle_id TEXT,
    messages JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ==============================================================================
-- Row Level Security (RLS) Policies
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_maintenances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.extras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Public Read Policies
CREATE POLICY "Public can view active vehicles" ON public.vehicles FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can view vehicle images" ON public.vehicle_images FOR SELECT USING (TRUE);
CREATE POLICY "Public can view active locations" ON public.locations FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can view active discounts" ON public.discounts FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can view active extras" ON public.extras FOR SELECT USING (is_active = TRUE);
CREATE POLICY "Public can view vehicle maintenances" ON public.vehicle_maintenances FOR SELECT USING (TRUE);

-- User Profile Policies
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Booking Policies
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid()::text = user_id OR user_id LIKE 'guest-%');
CREATE POLICY "Public can create bookings" ON public.bookings FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE USING (auth.uid()::text = user_id OR user_id LIKE 'guest-%');

-- Payments Policies
CREATE POLICY "Public can create payment records" ON public.payments FOR INSERT WITH CHECK (TRUE);
CREATE POLICY "Public can view own payment records" ON public.payments FOR SELECT USING (TRUE);

-- Admin Full Access Policies (Service Role or Role = 'ADMIN')
CREATE POLICY "Admins have full access to profiles" ON public.profiles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Admins have full access to vehicles" ON public.vehicles FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Admins have full access to vehicle images" ON public.vehicle_images FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Admins have full access to maintenances" ON public.vehicle_maintenances FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Admins have full access to locations" ON public.locations FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Admins have full access to discounts" ON public.discounts FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Admins have full access to extras" ON public.extras FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Admins have full access to bookings" ON public.bookings FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Admins have full access to payments" ON public.payments FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
CREATE POLICY "Admins have full access to audit logs" ON public.admin_audit_logs FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
