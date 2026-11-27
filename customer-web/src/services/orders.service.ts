import { supabase } from '../lib/supabase';
import type { Order, QuoteResult, TrackingPayload } from '../types';

export interface PlaceOrderParams {
  shopId: string;
  items: Array<{ product_id: string; quantity: number }>;
  addressId?: string;
  address?: {
    street_address: string;
    city: string;
    recipient_name?: string;
    phone_number?: string;
    delivery_instructions?: string;
    latitude?: number;
    longitude?: number;
  };
  paymentMethod?: 'cod';
  notes?: string;
}

export async function quoteOrder(
  shopId: string,
  items: Array<{ product_id: string; quantity: number }>
): Promise<QuoteResult> {
  const { data, error } = await supabase.rpc('quote_order', {
    p_shop_id: shopId,
    p_items: items,
  });

  if (error) {
    throw new Error(error.message || 'Failed to quote order');
  }

  return data as QuoteResult;
}

export async function placeOrder(params: PlaceOrderParams): Promise<{
  order_id: string;
  order_number: string;
  total_amount: number;
  currency_code: string;
}> {
  const { data, error } = await supabase.rpc('place_order', {
    p_shop_id: params.shopId,
    p_items: params.items,
    p_address_id: params.addressId || null,
    p_address: params.address || null,
    p_payment_method: params.paymentMethod || 'cod',
    p_notes: params.notes || null,
  });

  if (error) {
    throw new Error(error.message || 'Failed to place order');
  }

  return data;
}

export async function getCustomerOrders(): Promise<Order[]> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        shop:shops(id, name, logo_url, banner_url, address, city, currency_code),
        items:order_items(*)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as Order[]) || [];
  } catch (err) {
    console.error('Failed to get customer orders:', err);
    return [];
  }
}

export async function getOrderById(orderId: string): Promise<Order | null> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        shop:shops(id, name, logo_url, banner_url, address, city, currency_code, contact_phone),
        items:order_items(*)
      `)
      .eq('id', orderId)
      .maybeSingle();

    if (error) throw error;
    return data as Order | null;
  } catch (err) {
    console.error('Failed to get order:', err);
    return null;
  }
}

export async function getOrderTracking(orderId: string): Promise<TrackingPayload> {
  const { data, error } = await supabase.rpc('get_order_tracking', {
    p_order_id: orderId,
  });

  if (error) {
    throw new Error(error.message || 'Failed to fetch order tracking');
  }

  return data as TrackingPayload;
}
