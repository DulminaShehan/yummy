import React, { useEffect, useState } from 'react'
import { useOutletContext, Link } from 'react-router-dom'
import {
  ShoppingBag,
  Clock,
  ChefHat,
  CheckCircle2,
  DollarSign,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Eye,
} from 'lucide-react'
import { Shop, OrderWithDetails } from '../../types'
import { sellerService, PartnerMetrics } from '../../services/seller.service'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../context/ToastContext'

interface PartnerContextType {
  shop: Shop | null
  onRefreshShop: () => void
}

export const PartnerDashboardPage: React.FC = () => {
  const { shop, onRefreshShop } = useOutletContext<PartnerContextType>()
  const { success, error } = useToast()

  const [metrics, setMetrics] = useState<PartnerMetrics>({
    totalOrders: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    completedOrders: 0,
    todayRevenue: 0,
    isOpen: true,
  })
  const [recentOrders, setRecentOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  const loadDashboardData = async () => {
    if (!shop?.id) return
    setLoading(true)
    try {
      const [m, orders] = await Promise.all([
        sellerService.getShopMetrics(shop.id),
        sellerService.getShopOrders(shop.id),
      ])
      setMetrics(m)
      setRecentOrders(orders.slice(0, 6))
    } catch (err) {
      console.error('Failed to load partner dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDashboardData()
  }, [shop?.id])

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await sellerService.updateOrderStatus(orderId, 'processing')
      success('Order accepted! Preparing in kitchen.')
      loadDashboardData()
    } catch (err) {
      error('Failed to accept order')
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">New Order</Badge>
      case 'processing':
        return <Badge variant="info">Preparing</Badge>
      case 'ready_for_pickup':
        return <Badge variant="info">Ready for Pickup</Badge>
      case 'shipped':
        return <Badge variant="info">On Delivery</Badge>
      case 'delivered':
        return <Badge variant="success">Completed</Badge>
      case 'cancelled':
        return <Badge variant="danger">Cancelled</Badge>
      default:
        return <Badge variant="neutral">{status}</Badge>
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Top Banner / Store Status Warning if closed */}
      {!metrics.isOpen && (
        <div
          style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: 12,
            padding: '1rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: '#991b1b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <AlertTriangle size={22} color="#dc2626" />
            <div>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Store is currently Closed</div>
              <div style={{ fontSize: '0.85rem', opacity: 0.85 }}>
                Your restaurant is marked offline. Customers will not be able to browse or place orders.
              </div>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={async () => {
              if (shop?.id) {
                await sellerService.toggleShopStatus(shop.id, true)
                onRefreshShop()
                loadDashboardData()
              }
            }}
          >
            Re-open Store Now
          </Button>
        </div>
      )}

      {/* KPI Metric Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}
      >
        {/* Total Orders */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 12,
            padding: '1.25rem 1.5rem',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Orders</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
              {metrics.totalOrders}
            </div>
          </div>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: '#eff6ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563eb',
            }}
          >
            <ShoppingBag size={24} />
          </div>
        </div>

        {/* Pending Orders (Highlighted) */}
        <div
          style={{
            backgroundColor: metrics.pendingOrders > 0 ? '#fffbeb' : 'var(--bg-surface)',
            borderRadius: 12,
            padding: '1.25rem 1.5rem',
            border: `1px solid ${metrics.pendingOrders > 0 ? '#fde68a' : 'var(--border-color)'}`,
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.85rem', color: metrics.pendingOrders > 0 ? '#b45309' : 'var(--text-muted)', fontWeight: 600 }}>
              New Orders (Pending)
            </div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: metrics.pendingOrders > 0 ? '#d97706' : 'var(--text-main)', marginTop: '0.25rem' }}>
              {metrics.pendingOrders}
            </div>
          </div>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: '#fef3c7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#d97706',
            }}
          >
            <Clock size={24} />
          </div>
        </div>

        {/* Preparing */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 12,
            padding: '1.25rem 1.5rem',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Kitchen Preparing</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
              {metrics.preparingOrders}
            </div>
          </div>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: '#f3e8ff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#9333ea',
            }}
          >
            <ChefHat size={24} />
          </div>
        </div>

        {/* Completed */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 12,
            padding: '1.25rem 1.5rem',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Completed Orders</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '0.25rem' }}>
              {metrics.completedOrders}
            </div>
          </div>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: '#ecfdf5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10b981',
            }}
          >
            <CheckCircle2 size={24} />
          </div>
        </div>

        {/* Revenue Today */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 12,
            padding: '1.25rem 1.5rem',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>Today's Revenue</div>
            <div style={{ fontSize: '1.85rem', fontWeight: 800, color: '#1565C0', marginTop: '0.25rem' }}>
              {formatCurrency(metrics.todayRevenue)}
            </div>
          </div>
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: 12,
              backgroundColor: '#e0f2fe',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0284c7',
            }}
          >
            <DollarSign size={24} />
          </div>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderRadius: 14,
          border: '1px solid var(--border-color)',
          boxShadow: 'var(--shadow-sm)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
              Recent Orders
            </h2>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Live incoming customer orders requiring kitchen preparation
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Button variant="secondary" size="sm" onClick={loadDashboardData} disabled={loading}>
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Refresh</span>
            </Button>
            <Link to="/partner/orders" style={{ textDecoration: 'none' }}>
              <Button variant="primary" size="sm">
                <span>View All Orders</span>
                <ArrowRight size={16} />
              </Button>
            </Link>
          </div>
        </div>

        {recentOrders.length === 0 ? (
          <div style={{ padding: '3.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <ShoppingBag size={48} style={{ opacity: 0.3, marginBottom: '1rem' }} />
            <div style={{ fontWeight: 700, fontSize: '1.05rem', color: 'var(--text-main)' }}>
              No orders received yet
            </div>
            <div style={{ fontSize: '0.85rem', marginTop: '0.25rem' }}>
              When customers place orders from your restaurant, they will appear here in real time.
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '0.85rem 1.5rem', fontWeight: 700, color: 'var(--text-muted)' }}>Order ID</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-muted)' }}>Customer</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-muted)' }}>Items</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-muted)' }}>Total</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-muted)' }}>Status</th>
                  <th style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-muted)' }}>Placed At</th>
                  <th style={{ padding: '0.85rem 1.5rem', fontWeight: 700, color: 'var(--text-muted)', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    style={{
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background-color 0.15s ease',
                    }}
                  >
                    <td style={{ padding: '1rem 1.5rem', fontWeight: 700, color: '#1565C0' }}>
                      #{order.order_number}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>
                        {order.customer?.full_name || 'Guest Customer'}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {order.customer?.phone_number || 'No phone'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 500 }}>
                        {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {order.items?.map((i) => `${i.quantity}x ${i.product_title}`).join(', ') || '—'}
                      </div>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {formatCurrency(order.total_amount)}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      {getStatusBadge(order.order_status)}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {formatDate(order.created_at)}
                    </td>
                    <td style={{ padding: '1rem 1.5rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        {order.order_status === 'pending' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => handleAcceptOrder(order.id)}
                          >
                            Accept
                          </Button>
                        )}
                        <Link to="/partner/orders" style={{ textDecoration: 'none' }}>
                          <Button variant="secondary" size="sm">
                            <Eye size={15} />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
