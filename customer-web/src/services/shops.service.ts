import { supabase } from '../lib/supabase';
import type { Category, Product, Shop } from '../types';

export interface ShopFilterOptions {
  search?: string;
  categoryId?: string;
  city?: string;
  minRating?: number;
  isOpenOnly?: boolean;
}

export async function getApprovedShops(options?: ShopFilterOptions): Promise<Shop[]> {
  try {
    let query = supabase
      .from('shops')
      .select('*')
      .eq('status', 'approved')
      .order('rating', { ascending: false });

    if (options?.categoryId) {
      query = query.eq('category_id', options.categoryId);
    }
    if (options?.city) {
      query = query.ilike('city', `%${options.city}%`);
    }
    if (options?.search) {
      query = query.ilike('name', `%${options.search}%`);
    }
    if (options?.isOpenOnly) {
      query = query.eq('is_open', true);
    }
    if (options?.minRating && options.minRating > 0) {
      query = query.gte('rating', options.minRating);
    }

    const { data, error } = await query;
    if (error) throw error;
    return (data as Shop[]) || [];
  } catch (err) {
    console.error('Error fetching shops:', err);
    return [];
  }
}

export async function getFeaturedShops(limit = 6): Promise<Shop[]> {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('status', 'approved')
      .order('rating', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data as Shop[]) || [];
  } catch (err) {
    console.error('Error fetching featured shops:', err);
    return [];
  }
}

export async function getShopById(id: string): Promise<Shop | null> {
  try {
    const { data, error } = await supabase
      .from('shops')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as Shop | null;
  } catch (err) {
    console.error('Error fetching shop details:', err);
    return null;
  }
}

export async function getShopMenu(shopId: string): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('shop_id', shopId)
      .eq('status', 'published')
      .order('title', { ascending: true });

    if (error) throw error;
    return (data as Product[]) || [];
  } catch (err) {
    console.error('Error fetching shop menu:', err);
    return [];
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data as Category[]) || [];
  } catch (err) {
    console.error('Error fetching categories:', err);
    return [];
  }
}

export async function getPopularProducts(limit = 8): Promise<Product[]> {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('status', 'published')
      .eq('is_available', true)
      .limit(limit);

    if (error) throw error;
    return (data as Product[]) || [];
  } catch (err) {
    console.error('Error fetching popular products:', err);
    return [];
  }
}

export async function searchFoodAndRestaurants(queryStr: string): Promise<{
  shops: Shop[];
  products: Product[];
}> {
  const term = queryStr.trim();
  if (!term) return { shops: [], products: [] };

  try {
    const [shopsRes, productsRes] = await Promise.all([
      supabase
        .from('shops')
        .select('*')
        .eq('status', 'approved')
        .ilike('name', `%${term}%`)
        .limit(10),
      supabase
        .from('products')
        .select('*')
        .eq('status', 'published')
        .ilike('title', `%${term}%`)
        .limit(20),
    ]);

    return {
      shops: (shopsRes.data as Shop[]) || [],
      products: (productsRes.data as Product[]) || [],
    };
  } catch (err) {
    console.error('Search failed:', err);
    return { shops: [], products: [] };
  }
}
