-- BuyLanka Seller Menu & Products Migration
-- Migration: 006_seller_menu_products.sql

-- ============================================================
-- 1. Ensure required product columns exist
-- ============================================================
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS is_available BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS preparation_time_minutes INTEGER NOT NULL DEFAULT 15;

-- ============================================================
-- 2. Ensure required shop columns exist
-- ============================================================
ALTER TABLE public.shops
ADD COLUMN IF NOT EXISTS is_open BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN IF NOT EXISTS opening_time TEXT DEFAULT '08:00 AM',
ADD COLUMN IF NOT EXISTS closing_time TEXT DEFAULT '10:00 PM';

-- ============================================================
-- 3. Row Level Security (RLS) Policies on public.products
-- ============================================================

-- Allow sellers to view all products for their own shop (including draft & pending)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' AND policyname = 'Sellers can view own shop products'
    ) THEN
        CREATE POLICY "Sellers can view own shop products"
            ON public.products FOR SELECT
            USING (
                EXISTS (
                    SELECT 1 FROM public.shops
                    WHERE public.shops.id = public.products.shop_id
                    AND public.shops.seller_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Allow sellers to insert products into their own shop
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' AND policyname = 'Sellers can insert own shop products'
    ) THEN
        CREATE POLICY "Sellers can insert own shop products"
            ON public.products FOR INSERT
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.shops
                    WHERE public.shops.id = public.products.shop_id
                    AND public.shops.seller_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Allow sellers to update products belonging to their shop
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' AND policyname = 'Sellers can update own shop products'
    ) THEN
        CREATE POLICY "Sellers can update own shop products"
            ON public.products FOR UPDATE
            USING (
                EXISTS (
                    SELECT 1 FROM public.shops
                    WHERE public.shops.id = public.products.shop_id
                    AND public.shops.seller_id = auth.uid()
                )
            )
            WITH CHECK (
                EXISTS (
                    SELECT 1 FROM public.shops
                    WHERE public.shops.id = public.products.shop_id
                    AND public.shops.seller_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Allow sellers to delete products belonging to their shop
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'products' AND policyname = 'Sellers can delete own shop products'
    ) THEN
        CREATE POLICY "Sellers can delete own shop products"
            ON public.products FOR DELETE
            USING (
                EXISTS (
                    SELECT 1 FROM public.shops
                    WHERE public.shops.id = public.products.shop_id
                    AND public.shops.seller_id = auth.uid()
                )
            );
    END IF;
END $$;

-- ============================================================
-- 4. Supabase Storage: 'product-images' Dedicated Bucket
-- ============================================================

-- Create product-images bucket if it does not exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];

-- 4a. Public can read/view product images
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Public can view product images'
    ) THEN
        CREATE POLICY "Public can view product images"
            ON storage.objects FOR SELECT
            USING (bucket_id = 'product-images');
    END IF;
END $$;

-- 4b. Authenticated sellers can upload images only to their own restaurant folder (shops/{shop_id}/products/...)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Sellers can upload images to own restaurant folder'
    ) THEN
        CREATE POLICY "Sellers can upload images to own restaurant folder"
            ON storage.objects FOR INSERT
            WITH CHECK (
                bucket_id = 'product-images' 
                AND auth.role() = 'authenticated'
                AND (
                    public.is_admin() OR
                    EXISTS (
                        SELECT 1 FROM public.shops 
                        WHERE public.shops.id::text = (string_to_array(name, '/'))[2]
                        AND public.shops.seller_id = auth.uid()
                    )
                )
            );
    END IF;
END $$;

-- 4c. Authenticated sellers can update their own restaurant's product images
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Sellers can update images in own restaurant folder'
    ) THEN
        CREATE POLICY "Sellers can update images in own restaurant folder"
            ON storage.objects FOR UPDATE
            USING (
                bucket_id = 'product-images' 
                AND auth.role() = 'authenticated'
                AND (
                    public.is_admin() OR
                    EXISTS (
                        SELECT 1 FROM public.shops 
                        WHERE public.shops.id::text = (string_to_array(name, '/'))[2]
                        AND public.shops.seller_id = auth.uid()
                    )
                )
            );
    END IF;
END $$;

-- 4d. Authenticated sellers can delete images from their own restaurant folder
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'objects' AND policyname = 'Sellers can delete images from own restaurant folder'
    ) THEN
        CREATE POLICY "Sellers can delete images from own restaurant folder"
            ON storage.objects FOR DELETE
            USING (
                bucket_id = 'product-images' 
                AND auth.role() = 'authenticated'
                AND (
                    public.is_admin() OR
                    EXISTS (
                        SELECT 1 FROM public.shops 
                        WHERE public.shops.id::text = (string_to_array(name, '/'))[2]
                        AND public.shops.seller_id = auth.uid()
                    )
                )
            );
    END IF;
END $$;
