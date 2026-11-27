import { supabase } from '../lib/supabase';
import type { RestaurantApplication } from '../types';

export interface SubmitApplicationData {
  applicant_name: string;
  applicant_email: string;
  applicant_phone: string;
  restaurant_name: string;
  restaurant_category: string;
  restaurant_description: string;
  country: string;
  city: string;
  address: string;
  postal_code?: string;
  logo_url?: string;
  cover_image_url?: string;
  business_reg_number?: string;
  operating_hours?: string;
}

const APPLICATIONS_TABLE = 'restaurant_applications';
const STORAGE_KEY = 'yummy_partner_applications_local';

export async function submitRestaurantApplication(
  data: SubmitApplicationData
): Promise<RestaurantApplication> {
  const newApp: RestaurantApplication = {
    id: 'APP-' + Math.random().toString(36).substring(2, 9).toUpperCase(),
    applicant_name: data.applicant_name,
    applicant_email: data.applicant_email,
    applicant_phone: data.applicant_phone,
    restaurant_name: data.restaurant_name,
    restaurant_category: data.restaurant_category,
    restaurant_description: data.restaurant_description,
    country: data.country,
    city: data.city,
    address: data.address,
    postal_code: data.postal_code,
    logo_url: data.logo_url,
    cover_image_url: data.cover_image_url,
    business_reg_number: data.business_reg_number,
    operating_hours: data.operating_hours,
    status: 'PENDING',
    created_at: new Date().toISOString(),
  };

  try {
    // Attempt database insert if table exists
    const { data: dbData, error } = await supabase
      .from(APPLICATIONS_TABLE)
      .insert({
        applicant_name: newApp.applicant_name,
        applicant_email: newApp.applicant_email,
        applicant_phone: newApp.applicant_phone,
        restaurant_name: newApp.restaurant_name,
        restaurant_category: newApp.restaurant_category,
        restaurant_description: newApp.restaurant_description,
        country: newApp.country,
        city: newApp.city,
        address: newApp.address,
        postal_code: newApp.postal_code,
        logo_url: newApp.logo_url,
        cover_image_url: newApp.cover_image_url,
        business_reg_number: newApp.business_reg_number,
        operating_hours: newApp.operating_hours,
        status: 'PENDING',
      })
      .select()
      .maybeSingle();

    if (!error && dbData) {
      return dbData as RestaurantApplication;
    }
  } catch {
    // fallback to local persistence
  }

  // Fallback to local storage for instant feedback
  try {
    const list: RestaurantApplication[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    );
    list.unshift(newApp);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // ignore
  }

  return newApp;
}

export async function getApplicationStatus(
  searchQuery: string
): Promise<RestaurantApplication | null> {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return null;

  try {
    // 1. Try remote DB
    const { data, error } = await supabase
      .from(APPLICATIONS_TABLE)
      .select('*')
      .or(`id.eq.${query},applicant_email.ilike.${query}`)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return data as RestaurantApplication;
    }
  } catch {
    // ignore
  }

  // 2. Check local storage
  try {
    const list: RestaurantApplication[] = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || '[]'
    );
    const match = list.find(
      (a) =>
        a.id.toLowerCase() === query ||
        a.applicant_email.toLowerCase() === query
    );
    if (match) return match;
  } catch {
    // ignore
  }

  return null;
}
