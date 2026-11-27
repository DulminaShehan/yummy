import { supabase } from '../lib/supabase';
import type { Shop, Product, Order, OrderStatus } from '../types';

export interface PartnerMetrics {
  totalOrders: number;
  pendingOrders: number;
  preparingOrders: number;
  completedOrders: number;
  todayRevenue: number;
  isOpen: boolean;
}

export const sellerService = {
  /**
   * Fetch the active shop for the authenticated seller.
   */
  async getSellerShop(userId: string): Promise<Shop | null> {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('seller_id', userId)
        .maybeSingle();

      if (error) throw error;
      if (data) return data as Shop;

      // Fallback for demo or admin: get first approved shop
      const { data: fallbackShop } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle();

      return (fallbackShop as Shop) || null;
    } catch (err) {
      console.error('Error fetching seller shop:', err);
      return null;
    }
  },

  /**
   * Update restaurant profile details
   */
  async updateShop(shopId: string, updates: Partial<Shop>): Promise<Shop> {
    const { data, error } = await supabase
      .from('shops')
      .update(updates)
      .eq('id', shopId)
      .select()
      .single();

    if (error) throw error;
    return data as Shop;
  },

  /**
   * Toggle restaurant open / closed status
   */
  async toggleShopIsOpen(shopId: string, isOpen: boolean): Promise<Shop> {
    return this.updateShop(shopId, { is_open: isOpen });
  },

  /**
   * Get restaurant operational metrics
   */
  async getShopMetrics(shopId: string): Promise<PartnerMetrics> {
    try {
      const { data: orders, error } = await supabase
        .from('orders')
        .select('id, total_amount, order_status, created_at')
        .eq('shop_id', shopId);

      if (error) throw error;

      const { data: shop } = await supabase
        .from('shops')
        .select('is_open')
        .eq('id', shopId)
        .maybeSingle();

      const today = new Date().toISOString().split('T')[0];
      const allOrders = orders || [];

      const todayOrders = allOrders.filter(
        (o) => o.created_at && o.created_at.startsWith(today)
      );

      const todayRevenue = todayOrders
        .filter((o) => o.order_status !== 'cancelled')
        .reduce((sum, o) => sum + Number(o.total_amount || 0), 0);

      return {
        totalOrders: allOrders.length,
        pendingOrders: allOrders.filter((o) => o.order_status === 'pending').length,
        preparingOrders: allOrders.filter(
          (o) => o.order_status === 'accepted' || o.order_status === 'preparing'
        ).length,
        completedOrders: allOrders.filter((o) => o.order_status === 'delivered').length,
        todayRevenue,
        isOpen: shop?.is_open ?? true,
      };
    } catch (err) {
      console.error('Error computing partner metrics:', err);
      return {
        totalOrders: 0,
        pendingOrders: 0,
        preparingOrders: 0,
        completedOrders: 0,
        todayRevenue: 0,
        isOpen: true,
      };
    }
  },

  /**
   * Get restaurant orders with customer & items details
   */
  async getShopOrders(shopId: string): Promise<Order[]> {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          items:order_items(*)
        `)
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as Order[]) || [];
    } catch (err) {
      console.error('Error fetching shop orders:', err);
      return [];
    }
  },

  /**
   * Update order status by kitchen (e.g. accepted -> preparing -> ready_for_pickup)
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<void> {
    const { error } = await supabase
      .from('orders')
      .update({
        order_status: status,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) throw error;
  },

  /**
   * Get all dishes for the restaurant
   */
  async getShopProducts(shopId: string): Promise<Product[]> {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('shop_id', shopId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as Product[]) || [];
    } catch (err) {
      console.error('Error fetching shop products:', err);
      return [];
    }
  },

  /**
   * Create a new dish
   */
  async createProduct(
    product: Omit<Product, 'id' | 'created_at'>
  ): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .insert({
        ...product,
        status: 'published',
        is_available: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  },

  /**
   * Update an existing dish
   */
  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  },

  /**
   * Delete a dish
   */
  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
  },
};
