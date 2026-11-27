-- YUMMY Customer Website & Trusted Order Placement
-- Migration: 008_customer_web.sql
--
-- What this migration does (additive, safe to re-run):
--   1. Adds restaurant coordinates + currency, and order currency/tax columns.
--   2. Prevents sellers from changing admin-controlled shop fields (status, rating, reviews).
--   3. Adds trusted server-side pricing:  quote_order()  and  place_order()  RPCs.
--      Prices, delivery fee and tax are ALWAYS calculated in the database from
--      products / platform_settings. Client-supplied prices are never trusted.
--   4. Adds get_order_tracking() so a customer can see ONLY their own order's
--      restaurant, delivery and (while active) assigned rider details.
--   5. Removes the old direct INSERT policies on orders / order_items, so orders
--      can only be created through place_order().
--
-- Run in: Supabase Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Requires migrations 001-007 to be applied first.

-- ============================================================
-- 1. Columns
-- ============================================================
ALTER TABLE public.shops
    ADD COLUMN IF NOT EXISTS latitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS longitude DOUBLE PRECISION,
    ADD COLUMN IF NOT EXISTS currency_code TEXT NOT NULL DEFAULT 'USD';

ALTER TABLE public.orders
    ADD COLUMN IF NOT EXISTS currency_code TEXT NOT NULL DEFAULT 'USD',
    ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00;

-- ============================================================
-- 2. Protect admin-controlled shop fields
-- ============================================================
CREATE OR REPLACE FUNCTION public.protect_shop_admin_fields()
RETURNS TRIGGER AS $$
BEGIN
    -- SQL editor / service role (no end-user JWT) and active admins are allowed.
    IF auth.uid() IS NULL OR public.is_admin() THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        NEW.status := 'pending';
        NEW.rating := 0;
        NEW.total_reviews := 0;
        RETURN NEW;
    END IF;

    IF NEW.status IS DISTINCT FROM OLD.status
       OR NEW.rating IS DISTINCT FROM OLD.rating
       OR NEW.total_reviews IS DISTINCT FROM OLD.total_reviews THEN
        RAISE EXCEPTION 'Only YUMMY administrators can change shop approval status or ratings.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_protect_shop_admin_fields ON public.shops;
CREATE TRIGGER trg_protect_shop_admin_fields
BEFORE INSERT OR UPDATE ON public.shops
FOR EACH ROW EXECUTE FUNCTION public.protect_shop_admin_fields();

-- ============================================================
-- 3. Helpers
-- ============================================================

-- Reads a numeric platform setting. Accepts JSON numbers ("250"), strings ("\"250\"")
-- or objects with an "amount"/"value"/"rate" key. Falls back to p_default.
CREATE OR REPLACE FUNCTION public._setting_numeric(p_key TEXT, p_default NUMERIC)
RETURNS NUMERIC AS $$
DECLARE
    v JSONB;
BEGIN
    SELECT value INTO v FROM public.platform_settings WHERE key = p_key;
    IF v IS NULL THEN
        RETURN p_default;
    END IF;
    IF jsonb_typeof(v) = 'object' THEN
        v := COALESCE(v -> 'amount', v -> 'value', v -> 'rate');
    END IF;
    RETURN COALESCE((v #>> '{}')::NUMERIC, p_default);
EXCEPTION WHEN OTHERS THEN
    RETURN p_default;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public._setting_numeric(TEXT, NUMERIC) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public._haversine_km(lat1 DOUBLE PRECISION, lon1 DOUBLE PRECISION,
                                                lat2 DOUBLE PRECISION, lon2 DOUBLE PRECISION)
RETURNS NUMERIC AS $$
    SELECT ROUND((12742 * ASIN(SQRT(
        0.5 - COS(RADIANS(lat2 - lat1)) / 2
        + COS(RADIANS(lat1)) * COS(RADIANS(lat2)) * (1 - COS(RADIANS(lon2 - lon1))) / 2
    )))::NUMERIC, 2);
$$ LANGUAGE sql IMMUTABLE;

-- ============================================================
-- 4. quote_order: trusted price breakdown (no writes)
--    p_items = [{"product_id": "<uuid>", "quantity": 2}, ...]
-- ============================================================
CREATE OR REPLACE FUNCTION public.quote_order(p_shop_id UUID, p_items JSONB)
RETURNS JSONB AS $$
DECLARE
    v_shop RECORD;
    v_line RECORD;
    v_lines JSONB := '[]'::JSONB;
    v_subtotal NUMERIC := 0;
    v_fee NUMERIC;
    v_tax_rate NUMERIC;
    v_tax NUMERIC;
BEGIN
    IF p_items IS NULL OR jsonb_typeof(p_items) <> 'array'
       OR jsonb_array_length(p_items) = 0 OR jsonb_array_length(p_items) > 50 THEN
        RAISE EXCEPTION 'INVALID_ITEMS';
    END IF;

    SELECT * INTO v_shop FROM public.shops WHERE id = p_shop_id AND status = 'approved';
    IF NOT FOUND THEN
        RAISE EXCEPTION 'SHOP_UNAVAILABLE';
    END IF;

    FOR v_line IN
        SELECT i.product_id, SUM(i.quantity)::INT AS quantity
        FROM jsonb_to_recordset(p_items) AS i(product_id UUID, quantity INT)
        GROUP BY i.product_id
    LOOP
        IF v_line.quantity IS NULL OR v_line.quantity < 1 OR v_line.quantity > 99 THEN
            RAISE EXCEPTION 'INVALID_QUANTITY';
        END IF;

        DECLARE
            p RECORD;
        BEGIN
            SELECT id, title, price, stock_quantity, is_available, status, images
              INTO p
              FROM public.products
             WHERE id = v_line.product_id AND shop_id = p_shop_id;

            IF NOT FOUND OR p.status <> 'published' OR NOT p.is_available THEN
                RAISE EXCEPTION 'PRODUCT_UNAVAILABLE:%', COALESCE(p.title, v_line.product_id::TEXT);
            END IF;
            IF p.stock_quantity < v_line.quantity THEN
                RAISE EXCEPTION 'OUT_OF_STOCK:%', p.title;
            END IF;

            v_subtotal := v_subtotal + p.price * v_line.quantity;
            v_lines := v_lines || jsonb_build_object(
                'product_id', p.id,
                'title', p.title,
                'unit_price', p.price,
                'quantity', v_line.quantity,
                'total_price', p.price * v_line.quantity
            );
        END;
    END LOOP;

    v_fee := GREATEST(public._setting_numeric('delivery_fee', 0), 0);
    v_tax_rate := GREATEST(public._setting_numeric('tax_rate', 0), 0);   -- percentage, e.g. 8 = 8%
    v_tax := ROUND(v_subtotal * v_tax_rate / 100, 2);

    RETURN jsonb_build_object(
        'shop_id', v_shop.id,
        'shop_is_open', v_shop.is_open,
        'currency_code', v_shop.currency_code,
        'lines', v_lines,
        'subtotal', ROUND(v_subtotal, 2),
        'delivery_fee', ROUND(v_fee, 2),
        'tax_rate', v_tax_rate,
        'tax_amount', v_tax,
        'discount_amount', 0,
        'total_amount', ROUND(v_subtotal + v_fee + v_tax, 2)
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.quote_order(UUID, JSONB) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.quote_order(UUID, JSONB) TO authenticated;

-- ============================================================
-- 5. place_order: trusted, transactional order creation
--    Provide EITHER p_address_id (a saved customer_addresses row)
--    OR p_address (JSON with street_address, city, recipient_name, phone_number, ...).
-- ============================================================
CREATE OR REPLACE FUNCTION public.place_order(
    p_shop_id UUID,
    p_items JSONB,
    p_address_id UUID DEFAULT NULL,
    p_address JSONB DEFAULT NULL,
    p_payment_method TEXT DEFAULT 'cod',
    p_notes TEXT DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_profile RECORD;
    v_shop RECORD;
    v_quote JSONB;
    v_line JSONB;
    v_address JSONB;
    v_drop_lat DOUBLE PRECISION;
    v_drop_lng DOUBLE PRECISION;
    v_distance NUMERIC;
    v_order_id UUID;
    v_order_number TEXT;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED';
    END IF;

    SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;
    IF NOT FOUND OR v_profile.role <> 'customer' OR v_profile.status <> 'active' THEN
        RAISE EXCEPTION 'CUSTOMER_ACCOUNT_REQUIRED';
    END IF;

    IF p_payment_method IS NULL OR p_payment_method <> 'cod' THEN
        RAISE EXCEPTION 'PAYMENT_METHOD_UNSUPPORTED';
    END IF;

    -- Lock the shop and products while we validate and decrement stock.
    SELECT * INTO v_shop FROM public.shops WHERE id = p_shop_id AND status = 'approved' FOR SHARE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'SHOP_UNAVAILABLE';
    END IF;
    IF NOT v_shop.is_open THEN
        RAISE EXCEPTION 'SHOP_CLOSED';
    END IF;

    PERFORM 1 FROM public.products
     WHERE shop_id = p_shop_id
       AND id IN (SELECT (e ->> 'product_id')::UUID FROM jsonb_array_elements(p_items) e)
     FOR UPDATE;

    v_quote := public.quote_order(p_shop_id, p_items);

    -- Resolve delivery address
    IF p_address_id IS NOT NULL THEN
        SELECT jsonb_build_object(
                   'address_id', a.id,
                   'label', a.label,
                   'recipient_name', a.recipient_name,
                   'phone_number', a.phone_number,
                   'street_address', a.street_address,
                   'city', a.city,
                   'district', a.district,
                   'delivery_instructions', a.delivery_instructions,
                   'latitude', a.latitude,
                   'longitude', a.longitude
               ),
               a.latitude, a.longitude
          INTO v_address, v_drop_lat, v_drop_lng
          FROM public.customer_addresses a
         WHERE a.id = p_address_id AND a.customer_id = v_uid;
        IF v_address IS NULL THEN
            RAISE EXCEPTION 'ADDRESS_NOT_FOUND';
        END IF;
    ELSIF p_address IS NOT NULL AND jsonb_typeof(p_address) = 'object'
          AND COALESCE(TRIM(p_address ->> 'street_address'), TRIM(p_address ->> 'address'), '') <> '' THEN
        v_address := p_address;
        BEGIN
            v_drop_lat := NULLIF(p_address ->> 'latitude', '')::DOUBLE PRECISION;
            v_drop_lng := NULLIF(p_address ->> 'longitude', '')::DOUBLE PRECISION;
        EXCEPTION WHEN OTHERS THEN
            v_drop_lat := NULL;
            v_drop_lng := NULL;
        END;
    ELSE
        RAISE EXCEPTION 'ADDRESS_REQUIRED';
    END IF;

    IF v_shop.latitude IS NOT NULL AND v_drop_lat IS NOT NULL THEN
        v_distance := public._haversine_km(v_shop.latitude, v_shop.longitude, v_drop_lat, v_drop_lng);
    END IF;

    v_order_number := 'YM' || TO_CHAR(NOW(), 'YYMMDD')
                      || UPPER(SUBSTR(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 6));

    INSERT INTO public.orders (
        order_number, customer_id, shop_id, total_amount, delivery_fee, discount_amount,
        tax_amount, currency_code, payment_method, payment_status, order_status,
        shipping_address, customer_notes
    ) VALUES (
        v_order_number, v_uid, p_shop_id,
        (v_quote ->> 'total_amount')::NUMERIC,
        (v_quote ->> 'delivery_fee')::NUMERIC,
        0,
        (v_quote ->> 'tax_amount')::NUMERIC,
        v_shop.currency_code,
        'cod', 'pending', 'pending',
        v_address,
        NULLIF(LEFT(TRIM(COALESCE(p_notes, '')), 500), '')
    )
    RETURNING id INTO v_order_id;

    FOR v_line IN SELECT * FROM jsonb_array_elements(v_quote -> 'lines')
    LOOP
        INSERT INTO public.order_items (order_id, product_id, product_title, unit_price, quantity, total_price)
        VALUES (
            v_order_id,
            (v_line ->> 'product_id')::UUID,
            v_line ->> 'title',
            (v_line ->> 'unit_price')::NUMERIC,
            (v_line ->> 'quantity')::INT,
            (v_line ->> 'total_price')::NUMERIC
        );

        UPDATE public.products
           SET stock_quantity = stock_quantity - (v_line ->> 'quantity')::INT
         WHERE id = (v_line ->> 'product_id')::UUID;
    END LOOP;

    INSERT INTO public.deliveries (
        order_id, pickup_address, dropoff_address, delivery_status,
        pickup_latitude, pickup_longitude, dropoff_latitude, dropoff_longitude,
        distance_km, estimated_minutes, customer_contact_phone, restaurant_contact_phone
    ) VALUES (
        v_order_id,
        COALESCE(NULLIF(TRIM(CONCAT_WS(', ', v_shop.address, v_shop.city)), ''), v_shop.name),
        CONCAT_WS(', ', COALESCE(v_address ->> 'street_address', v_address ->> 'address'), v_address ->> 'city'),
        'unassigned',
        v_shop.latitude, v_shop.longitude, v_drop_lat, v_drop_lng,
        v_distance,
        CASE WHEN v_distance IS NOT NULL THEN GREATEST(ROUND(v_distance / 25.0 * 60)::INT + 3, 5) END,
        COALESCE(v_address ->> 'phone_number', v_profile.phone_number),
        v_shop.contact_phone
    );

    INSERT INTO public.notifications (user_id, title, message, type, data)
    VALUES (
        v_uid,
        'Order placed',
        'Your order #' || v_order_number || ' has been sent to ' || v_shop.name || '.',
        'order',
        jsonb_build_object('order_id', v_order_id)
    );

    RETURN jsonb_build_object(
        'order_id', v_order_id,
        'order_number', v_order_number,
        'currency_code', v_shop.currency_code,
        'subtotal', v_quote -> 'subtotal',
        'delivery_fee', v_quote -> 'delivery_fee',
        'tax_amount', v_quote -> 'tax_amount',
        'total_amount', v_quote -> 'total_amount'
    );
END;
$$ LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.place_order(UUID, JSONB, UUID, JSONB, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.place_order(UUID, JSONB, UUID, JSONB, TEXT, TEXT) TO authenticated;

-- Orders can now only be created through place_order().
DROP POLICY IF EXISTS "Customers can insert orders" ON public.orders;
DROP POLICY IF EXISTS "Customers can insert order items" ON public.order_items;

-- ============================================================
-- 6. get_order_tracking: customer-only tracking payload
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_order_tracking(p_order_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_order RECORD;
    v_shop RECORD;
    v_delivery RECORD;
    v_rider JSONB := NULL;
    v_location JSONB := NULL;
    v_active BOOLEAN := FALSE;
BEGIN
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'AUTH_REQUIRED';
    END IF;

    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id AND customer_id = v_uid;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'ORDER_NOT_FOUND';
    END IF;

    SELECT id, name, logo_url, address, city, contact_phone, latitude, longitude, currency_code
      INTO v_shop FROM public.shops WHERE id = v_order.shop_id;

    SELECT * INTO v_delivery FROM public.deliveries WHERE order_id = p_order_id;

    IF FOUND THEN
        v_active := v_delivery.rider_id IS NOT NULL
                    AND v_delivery.delivery_status NOT IN ('unassigned', 'delivered', 'cancelled', 'failed');

        IF v_active THEN
            SELECT jsonb_build_object(
                       'id', r.id,
                       'full_name', pr.full_name,
                       'avatar_url', pr.avatar_url,
                       'phone_number', pr.phone_number,
                       'vehicle_type', r.vehicle_type,
                       'vehicle_number', r.vehicle_number,
                       'vehicle_model', r.vehicle_model,
                       'vehicle_color', r.vehicle_color,
                       'rating', r.rating
                   )
              INTO v_rider
              FROM public.riders r
              JOIN public.profiles pr ON pr.id = r.id
             WHERE r.id = v_delivery.rider_id;

            SELECT jsonb_build_object('latitude', l.latitude, 'longitude', l.longitude,
                                      'heading', l.heading, 'created_at', l.created_at)
              INTO v_location
              FROM public.rider_locations l
             WHERE l.delivery_id = v_delivery.id
             ORDER BY l.created_at DESC
             LIMIT 1;
        END IF;
    END IF;

    RETURN jsonb_build_object(
        'order', jsonb_build_object(
            'id', v_order.id,
            'order_number', v_order.order_number,
            'order_status', v_order.order_status,
            'payment_method', v_order.payment_method,
            'total_amount', v_order.total_amount,
            'currency_code', v_order.currency_code,
            'shipping_address', v_order.shipping_address,
            'created_at', v_order.created_at,
            'updated_at', v_order.updated_at
        ),
        'shop', to_jsonb(v_shop),
        'delivery', CASE WHEN v_delivery.id IS NULL THEN NULL ELSE jsonb_build_object(
            'id', v_delivery.id,
            'delivery_status', v_delivery.delivery_status,
            'pickup_latitude', v_delivery.pickup_latitude,
            'pickup_longitude', v_delivery.pickup_longitude,
            'dropoff_latitude', v_delivery.dropoff_latitude,
            'dropoff_longitude', v_delivery.dropoff_longitude,
            'distance_km', v_delivery.distance_km,
            'estimated_minutes', v_delivery.estimated_minutes,
            'assigned_at', v_delivery.assigned_at,
            'picked_up_at', v_delivery.picked_up_at,
            'delivered_at', v_delivery.delivered_at
        ) END,
        'rider', v_rider,
        'rider_location', v_location
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.get_order_tracking(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_order_tracking(UUID) TO authenticated;
