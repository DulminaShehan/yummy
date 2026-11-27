import { supabase } from '../lib/supabase';
import type { CustomerAddress } from '../types';

export async function getCustomerAddresses(): Promise<CustomerAddress[]> {
  try {
    const { data, error } = await supabase
      .from('customer_addresses')
      .select('*')
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as CustomerAddress[]) || [];
  } catch (err) {
    console.error('Error fetching addresses:', err);
    return [];
  }
}

export async function createCustomerAddress(
  address: Omit<CustomerAddress, 'id' | 'customer_id' | 'created_at'>
): Promise<CustomerAddress | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  // If this address is set as default, reset others
  if (address.is_default) {
    await supabase
      .from('customer_addresses')
      .update({ is_default: false })
      .eq('customer_id', user.id);
  }

  const { data, error } = await supabase
    .from('customer_addresses')
    .insert({
      ...address,
      customer_id: user.id,
    })
    .select()
    .single();

  if (error) throw error;
  return data as CustomerAddress;
}

export async function updateCustomerAddress(
  id: string,
  address: Partial<CustomerAddress>
): Promise<CustomerAddress | null> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  if (address.is_default) {
    await supabase
      .from('customer_addresses')
      .update({ is_default: false })
      .eq('customer_id', user.id);
  }

  const { data, error } = await supabase
    .from('customer_addresses')
    .update(address)
    .eq('id', id)
    .eq('customer_id', user.id)
    .select()
    .single();

  if (error) throw error;
  return data as CustomerAddress;
}

export async function deleteCustomerAddress(id: string): Promise<boolean> {
  const { error } = await supabase
    .from('customer_addresses')
    .delete()
    .eq('id', id);

  if (error) throw error;
  return true;
}
