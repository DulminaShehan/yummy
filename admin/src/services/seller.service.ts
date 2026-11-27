import { supabase } from '../lib/supabaseClient'
import { Shop, Product, OrderWithDetails, OrderStatus } from '../types'
import { slugify } from '../utils/formatters'

export interface PartnerMetrics {
  totalOrders: number
  pendingOrders: number
  preparingOrders: number
  completedOrders: number
  todayRevenue: number
  isOpen: boolean
}

export const sellerService = {
  /**
   * Fetch the active shop for the authenticated seller.
   * If none exists for the seller (e.g. admin browsing portal), falls back to first shop.
   */
  async getSellerShop(userId: string): Promise<Shop | null> {
    try {
      const { data, error } = await supabase
        .from('shops')
        .select('*')
        .eq('seller_id', userId)
        .maybeSingle()

      if (error) throw error
      if (data) return data

      // Fallback for admin or testing: pick first available shop
      const { data: fallbackShop } = await supabase
        .from('shops')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle()

      return fallbackShop || null
    } catch (err) {
      console.error('Error fetching seller shop:', err)
      return null
    }
  },

  /**
   * Update restaurant profile details & operational hours
   */
  async updateShop(shopId: string, updates: Partial<Shop>): Promise<Shop> {
    const { data, error } = await supabase
      .from('shops')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', shopId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Toggle restaurant open/close status
   */
  async toggleShopStatus(shopId: string, isOpen: boolean): Promise<Shop> {
    const newStatus = isOpen ? 'approved' : 'suspended'
    return this.updateShop(shopId, { status: newStatus })
  },

  /**
   * Get products/menu items for this restaurant
   */
  async getShopProducts(shopId: string, search?: string, categoryId?: string): Promise<Product[]> {
    try {
      let query = supabase
        .from('products')
        .select('*, category:categories!category_id(*)')
        .eq('shop_id', shopId)

      if (categoryId && categoryId !== 'all') {
        query = query.eq('category_id', categoryId)
      }

      if (search && search.trim()) {
        query = query.ilike('title', `%${search.trim()}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error
      return (data as any) || []
    } catch (err) {
      console.error('Error fetching shop products:', err)
      return []
    }
  },

  /**
   * Add a new food item to restaurant menu
   */
  async createProduct(payload: {
    shop_id: string
    title: string
    description?: string | null
    price: number
    original_price?: number | null
    stock_quantity: number
    category_id?: string | null
    images?: string[]
    status?: 'published' | 'draft' | 'pending_approval'
  }): Promise<Product> {
    const slug = `${slugify(payload.title)}-${Date.now().toString(36)}`
    const { data, error } = await supabase
      .from('products')
      .insert({
        shop_id: payload.shop_id,
        title: payload.title,
        slug,
        description: payload.description || null,
        price: payload.price,
        original_price: payload.original_price || null,
        stock_quantity: payload.stock_quantity,
        category_id: payload.category_id || null,
        images: payload.images && payload.images.length > 0 ? payload.images : ['https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'],
        status: payload.status || 'published',
      })
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update an existing food item
   */
  async updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
    const { data, error } = await supabase
      .from('products')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Delete a menu item
   */
  async deleteProduct(id: string): Promise<void> {
    const { error } = await supabase.from('products').delete().eq('id', id)
    if (error) throw error
  },

  /**
   * Upload food photo to Supabase storage
   */
  async uploadFoodImage(file: File, shopId: string): Promise<string> {
    const fileExt = file.name.split('.').pop()
    const fileName = `${shopId}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('product-images')
      .upload(fileName, file, { cacheControl: '3600', upsert: true })

    if (uploadError) {
      // If product-images bucket is unavailable, fallback to shops bucket
      const { error: fallbackError } = await supabase.storage
        .from('shops')
        .upload(`menu/${fileName}`, file, { cacheControl: '3600', upsert: true })
      
      if (fallbackError) throw uploadError
      const { data } = supabase.storage.from('shops').getPublicUrl(`menu/${fileName}`)
      return data.publicUrl
    }

    const { data } = supabase.storage.from('product-images').getPublicUrl(fileName)
    return data.publicUrl
  },

  /**
   * Get orders for this restaurant with customer, items, and delivery info
   */
  async getShopOrders(shopId: string, statusFilter?: string): Promise<OrderWithDetails[]> {
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          customer:profiles!customer_id(*),
          items:order_items(*),
          delivery:deliveries(
            *,
            rider:riders(
              *,
              profile:profiles!id(*)
            )
          )
        `)
        .eq('shop_id', shopId)

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('order_status', statusFilter as OrderStatus)
      }

      const { data, error } = await query.order('created_at', { ascending: false })
      if (error) throw error

      // Flatten single delivery array if returned as array
      return ((data as any) || []).map((o: any) => ({
        ...o,
        delivery: Array.isArray(o.delivery) ? o.delivery[0] || null : o.delivery,
      }))
    } catch (err) {
      console.error('Error fetching shop orders:', err)
      return []
    }
  },

  /**
   * Update order status (e.g. Accept -> processing, Reject -> cancelled, Ready -> ready_for_pickup)
   */
  async updateOrderStatus(orderId: string, status: OrderStatus, rejectReason?: string): Promise<void> {
    const updatePayload: any = {
      order_status: status,
      updated_at: new Date().toISOString(),
    }

    if (rejectReason) {
      updatePayload.customer_notes = `[Cancelled by Restaurant: ${rejectReason}]`
    }

    const { error } = await supabase
      .from('orders')
      .update(updatePayload)
      .eq('id', orderId)

    if (error) throw error
  },

  /**
   * Calculate partner dashboard KPI metrics
   */
  async getShopMetrics(shopId: string): Promise<PartnerMetrics> {
    try {
      const orders = await this.getShopOrders(shopId)
      const shop = await supabase.from('shops').select('status').eq('id', shopId).maybeSingle()

      const todayStr = new Date().toISOString().split('T')[0]
      let todayRev = 0

      let pending = 0
      let preparing = 0
      let completed = 0

      for (const o of orders) {
        if (o.order_status === 'pending') pending++
        if (o.order_status === 'processing') preparing++
        if (o.order_status === 'delivered') completed++

        const orderDate = o.created_at ? o.created_at.split('T')[0] : ''
        if (orderDate === todayStr && o.order_status !== 'cancelled') {
          todayRev += Number(o.total_amount) || 0
        }
      }

      return {
        totalOrders: orders.length,
        pendingOrders: pending,
        preparingOrders: preparing,
        completedOrders: completed,
        todayRevenue: todayRev,
        isOpen: shop.data?.status === 'approved',
      }
    } catch (err) {
      console.error('Error calculating partner metrics:', err)
      return {
        totalOrders: 0,
        pendingOrders: 0,
        preparingOrders: 0,
        completedOrders: 0,
        todayRevenue: 0,
        isOpen: true,
      }
    }
  },
}
