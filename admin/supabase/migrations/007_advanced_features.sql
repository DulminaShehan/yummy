-- YUMMY Advanced Features Migration
-- Migration: 007_advanced_features.sql
-- Covers: Real-time GPS Tracking RLS, Restaurant Partner Web Portal RLS, Role Escalation Safeguards, and Social Auth

-- ============================================================
-- 1. Delivery Workflow Constraint Alignment (8-step Workflow)
-- ============================================================
ALTER TABLE public.deliveries DROP CONSTRAINT IF EXISTS deliveries_delivery_status_check;
ALTER TABLE public.deliveries ADD CONSTRAINT deliveries_delivery_status_check CHECK (
    delivery_status IN (
        'unassigned',
        'assigned',
        'accepted',
        'going_to_pickup',
        'arrived_at_pickup',
        'picked_up',
        'going_to_customer',
        'arrived_at_customer',
        'delivered',
        'failed',
        'cancelled'
    )
);

-- Ensure pickup & dropoff coordinates and contact numbers exist
ALTER TABLE public.deliveries
ADD COLUMN IF NOT EXISTS customer_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS restaurant_contact_phone TEXT;

-- ============================================================
-- 2. Real-Time GPS Tracking Row Level Security (RLS)
-- ============================================================
ALTER TABLE public.rider_locations ENABLE ROW LEVEL SECURITY;

-- Drop prior location policies to avoid conflicts
DROP POLICY IF EXISTS "Customers can view active delivery rider location" ON public.rider_locations;
DROP POLICY IF EXISTS "Customers can view assigned rider location" ON public.riders;

-- Customers can view rider breadcrumbs ONLY while their active delivery is in progress
CREATE POLICY "Customers can view active delivery rider location"
    ON public.rider_locations FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.deliveries d
            JOIN public.orders o ON o.id = d.order_id
            WHERE d.id = rider_locations.delivery_id
              AND o.customer_id = auth.uid()
              AND d.delivery_status NOT IN ('delivered', 'cancelled', 'failed')
        )
    );

-- Customers can read assigned rider's current position & vehicle info ONLY during active delivery
CREATE POLICY "Customers can view assigned rider location"
    ON public.riders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.deliveries d
            JOIN public.orders o ON o.id = d.order_id
            WHERE d.rider_id = riders.id
              AND o.customer_id = auth.uid()
              AND d.delivery_status NOT IN ('delivered', 'cancelled', 'failed')
        )
    );

-- ============================================================
-- 3. Restaurant Partner Web Portal Row Level Security (RLS)
-- ============================================================

-- Sellers can manage their own shop record
DROP POLICY IF EXISTS "Sellers can manage own shop" ON public.shops;
CREATE POLICY "Sellers can manage own shop"
    ON public.shops FOR ALL
    USING (auth.uid() = seller_id)
    WITH CHECK (auth.uid() = seller_id);

-- Sellers can view all orders placed for their shop
DROP POLICY IF EXISTS "Sellers can view own shop orders" ON public.orders;
CREATE POLICY "Sellers can view own shop orders"
    ON public.orders FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.shops
            WHERE public.shops.id = orders.shop_id
              AND public.shops.seller_id = auth.uid()
        )
    );

-- Sellers can update order status for their shop (Accept, Reject, Preparing, Ready for pickup)
DROP POLICY IF EXISTS "Sellers can update own shop orders" ON public.orders;
CREATE POLICY "Sellers can update own shop orders"
    ON public.orders FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.shops
            WHERE public.shops.id = orders.shop_id
              AND public.shops.seller_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.shops
            WHERE public.shops.id = orders.shop_id
              AND public.shops.seller_id = auth.uid()
        )
    );

-- Sellers can view order items for their shop's orders
DROP POLICY IF EXISTS "Sellers can view own shop order items" ON public.order_items;
CREATE POLICY "Sellers can view own shop order items"
    ON public.order_items FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.orders
            JOIN public.shops ON public.shops.id = orders.shop_id
            WHERE orders.id = order_items.order_id
              AND public.shops.seller_id = auth.uid()
        )
    );

-- ============================================================
-- 4. Role Escalation Safeguards
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_role_escalation()
RETURNS TRIGGER AS $$
BEGIN
    -- Only active administrators can modify role assignments
    IF NEW.role <> OLD.role AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Security Alert: You are not authorized to modify user roles.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_prevent_role_escalation ON public.profiles;
CREATE TRIGGER trg_prevent_role_escalation
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.prevent_role_escalation();

-- ============================================================
-- 5. Social Authentication Auto-Profile Trigger (Default: Customer)
-- ============================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, phone_number, role, status, avatar_url)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Valued Customer'),
        COALESCE(NEW.email, ''),
        NEW.raw_user_meta_data->>'phone_number',
        'customer', -- Always default to customer for OAuth / self-signups
        'active',
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
        avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url),
        updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Hook into auth.users trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 6. Enable Realtime Replication for Key Tables
-- ============================================================

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.deliveries;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.rider_locations;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.products;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;
