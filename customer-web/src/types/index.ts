export type UserRole = 'customer' | 'seller' | 'rider' | 'admin';

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  phone_number: string | null;
  avatar_url: string | null;
  status: 'active' | 'suspended' | 'pending';
  created_at?: string;
  updated_at?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string | null;
  image_url?: string | null;
  sort_order?: number;
  is_active?: boolean;
}

export interface Shop {
  id: string;
  name: string;
  description: string | null;
  category_id?: string | null;
  logo_url: string | null;
  banner_url: string | null;
  address: string | null;
  city: string | null;
  contact_phone: string | null;
  rating: number;
  total_reviews: number;
  is_open: boolean;
  status: 'pending' | 'approved' | 'suspended' | 'rejected';
  latitude: number | null;
  longitude: number | null;
  currency_code: string;
  created_at?: string;
}

export interface Product {
  id: string;
  shop_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  price: number;
  original_price?: number | null;
  images: string[] | null;
  is_available: boolean;
  status: 'draft' | 'published' | 'archived';
  stock_quantity: number;
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  notes?: string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  label: string;
  recipient_name: string;
  phone_number: string;
  street_address: string;
  city: string;
  district?: string | null;
  delivery_instructions?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  is_default: boolean;
  created_at?: string;
}

export type OrderStatus =
  | 'pending'
  | 'accepted'
  | 'preparing'
  | 'ready_for_pickup'
  | 'picked_up'
  | 'on_the_way'
  | 'delivered'
  | 'cancelled';

export type PaymentMethod = 'cod';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_title: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string;
  shop_id: string;
  total_amount: number;
  delivery_fee: number;
  discount_amount: number;
  tax_amount: number;
  currency_code: string;
  payment_method: PaymentMethod;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  shipping_address: {
    address_id?: string;
    label?: string;
    recipient_name?: string;
    phone_number?: string;
    street_address?: string;
    city?: string;
    district?: string;
    delivery_instructions?: string;
    latitude?: number;
    longitude?: number;
  };
  customer_notes?: string | null;
  created_at: string;
  updated_at: string;
  shop?: Partial<Shop>;
  items?: OrderItem[];
}

export type DeliveryStatus =
  | 'unassigned'
  | 'assigned'
  | 'accepted'
  | 'arrived_at_restaurant'
  | 'picked_up'
  | 'arrived_at_customer'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface Delivery {
  id: string;
  order_id: string;
  rider_id: string | null;
  pickup_address: string;
  dropoff_address: string;
  delivery_status: DeliveryStatus;
  pickup_latitude: number | null;
  pickup_longitude: number | null;
  dropoff_latitude: number | null;
  dropoff_longitude: number | null;
  distance_km: number | null;
  estimated_minutes: number | null;
  assigned_at: string | null;
  picked_up_at: string | null;
  delivered_at: string | null;
}

export interface RiderProfile {
  id: string;
  full_name: string;
  avatar_url: string | null;
  phone_number: string | null;
  vehicle_type: string | null;
  vehicle_number: string | null;
  vehicle_model: string | null;
  vehicle_color: string | null;
  rating: number;
}

export interface RiderLocation {
  latitude: number;
  longitude: number;
  heading?: number | null;
  created_at: string;
}

export interface QuoteLine {
  product_id: string;
  title: string;
  unit_price: number;
  quantity: number;
  total_price: number;
}

export interface QuoteResult {
  shop_id: string;
  shop_is_open: boolean;
  currency_code: string;
  lines: QuoteLine[];
  subtotal: number;
  delivery_fee: number;
  tax_rate: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
}

export interface TrackingPayload {
  order: Partial<Order>;
  shop: Partial<Shop>;
  delivery: Partial<Delivery> | null;
  rider: RiderProfile | null;
  rider_location: RiderLocation | null;
}

export type ApplicationStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'RESUBMISSION_REQUIRED';

export interface RestaurantApplication {
  id: string;
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
  status: ApplicationStatus;
  admin_notes?: string;
  created_at: string;
  updated_at?: string;
}
