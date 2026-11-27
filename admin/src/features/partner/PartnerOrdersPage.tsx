import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  ShoppingBag,
  Phone,
  RefreshCw,
  Bike,
} from 'lucide-react'
import { Shop, OrderWithDetails, OrderStatus } from '../../types'
import { sellerService } from '../../services/seller.service'
import { supabase } from '../../lib/supabaseClient'
import { formatCurrency, formatDate } from '../../utils/formatters'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../context/ToastContext'

interface PartnerContextType {
  shop: Shop | null
}

export const PartnerOrdersPage: React.FC = () => {
  const { shop } = useOutletContext<PartnerContextType>()
  const { success, error } = useToast()

  const [orders, setOrders] = useState<OrderWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<string>('all')

  // Selected Order for Details Modal
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
  const [isDetailsOpen, setIsDetailsOpen] = useState(false)

  // Reject Order State & Modal
  const [rejectingOrder, setRejectingOrder] = useState<OrderWithDetails | null>(null)
  const [rejectReason, setRejectReason] = useState('Out of stock / item unavailable')
  const [customReason, setCustomReason] = useState('')
  const [isRejecting, setIsRejecting] = useState(false)

  const loadOrders = async () => {
    if (!shop?.id) return
    setLoading(true)
    try {
      const data = await sellerService.getShopOrders(shop.id, activeTab)
      setOrders(data)
    } catch (err) {
      console.error('Failed to load orders:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders()
  }, [shop?.id, activeTab])

  // Realtime Supabase Subscription for incoming orders
  useEffect(() => {
    if (!shop?.id) return

    const channel = supabase
      .channel(`partner-orders-${shop.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `shop_id=eq.${shop.id}` },
        () => {
          loadOrders()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [shop?.id, activeTab])

  const handleUpdateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await sellerService.updateOrderStatus(orderId, status)
      success(`Order status updated to ${status.replace('_', ' ')}`)
      loadOrders()
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder((prev) => (prev ? { ...prev, order_status: status } : null))
      }
    } catch (err) {
      error('Failed to update order status')
    }
  }

  const handleConfirmReject = async () => {
    if (!rejectingOrder) return
    setIsRejecting(true)
    const finalReason = rejectReason === 'Other' ? customReason : rejectReason
    try {
      await sellerService.updateOrderStatus(rejectingOrder.id, 'cancelled', finalReason)
      success('Order rejected and cancelled.')
      setRejectingOrder(null)
      loadOrders()
      if (selectedOrder?.id === rejectingOrder.id) {
        setIsDetailsOpen(false)
      }
    } catch (err) {
      error('Failed to reject order')
    } finally {
      setIsRejecting(false)
    }
  }

  const tabs = [
    { key: 'all', label: 'All Orders' },
    { key: 'pending', label: 'New / Pending' },
    { key: 'processing', label: 'Preparing' },
    { key: 'ready_for_pickup', label: 'Ready for Pickup' },
    { key: 'delivered', label: 'Completed' },
    { key: 'cancelled', label: 'Cancelled' },
  ]

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header & Controls */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 0.25rem', color: 'var(--text-main)' }}>
            Live Kitchen & Order Queue
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Real-time incoming customer orders and food preparation tracking
          </p>
        </div>
        <Button variant="secondary" size="sm" onClick={loadOrders} disabled={loading}>
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', overflowX: 'auto' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '0.5rem 1rem',
              borderRadius: 8,
              border: 'none',
              backgroundColor: activeTab === tab.key ? '#1565C0' : 'transparent',
              color: activeTab === tab.key ? '#ffffff' : 'var(--text-muted)',
              fontWeight: activeTab === tab.key ? 700 : 500,
              fontSize: '0.85rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              transition: 'all 0.15s ease',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List / Cards */}
      {orders.length === 0 ? (
        <div
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 14,
            border: '1px solid var(--border-color)',
          }}
        >
          <ShoppingBag size={48} style={{ opacity: 0.25, marginBottom: '1rem', color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--text-main)' }}>
            No orders found
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>
            {activeTab === 'all' ? 'Your restaurant has not received any orders yet.' : `No orders with status "${activeTab}".`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
          {orders.map((order) => {
            const rider = order.delivery?.rider
            const riderProfile = rider?.profile

            return (
              <div
                key={order.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 14,
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Order Top Bar */}
                <div
                  style={{
                    padding: '1rem 1.25rem',
                    borderBottom: '1px solid var(--border-color)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    backgroundColor: order.order_status === 'pending' ? '#fffbeb' : '#f8fafc',
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#1565C0' }}>
                      #{order.order_number}
                    </span>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
                      {formatDate(order.created_at)}
                    </div>
                  </div>
                  {getStatusBadge(order.order_status)}
                </div>

                {/* Body Content */}
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* Customer Information */}
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Customer
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', marginTop: '0.15rem' }}>
                      {order.customer?.full_name || 'Guest Customer'}
                    </div>
                    {order.customer?.phone_number && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>
                        <Phone size={13} />
                        <span>{order.customer.phone_number}</span>
                      </div>
                    )}
                  </div>

                  {/* Order Items Summary */}
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.35rem' }}>
                      Items ({order.items?.length || 0})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', fontSize: '0.85rem' }}>
                      {order.items?.map((item) => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>
                            <strong style={{ color: '#1565C0' }}>{item.quantity}x</strong> {item.product_title}
                          </span>
                          <span style={{ fontWeight: 600 }}>{formatCurrency(item.total_price)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Customer Notes if any */}
                  {order.customer_notes && (
                    <div style={{ backgroundColor: '#f1f5f9', padding: '0.5rem 0.75rem', borderRadius: 8, fontSize: '0.8rem', color: '#334155' }}>
                      <strong>Note:</strong> {order.customer_notes}
                    </div>
                  )}

                  {/* Assigned Rider Banner if present */}
                  {rider && (
                    <div
                      style={{
                        backgroundColor: '#f0fdf4',
                        border: '1px solid #bbf7d0',
                        borderRadius: 8,
                        padding: '0.65rem 0.85rem',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Bike size={18} color="#15803d" />
                        <div>
                          <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#166534' }}>
                            Rider: {riderProfile?.full_name || 'Assigned Rider'}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#15803d' }}>
                            {rider.vehicle_type} • {rider.vehicle_number}
                          </div>
                        </div>
                      </div>
                      {riderProfile?.phone_number && (
                        <a
                          href={`tel:${riderProfile.phone_number}`}
                          style={{
                            color: '#166534',
                            display: 'flex',
                            alignItems: 'center',
                            padding: '4px',
                          }}
                        >
                          <Phone size={16} />
                        </a>
                      )}
                    </div>
                  )}

                  {/* Total & Payment */}
                  <div style={{ marginTop: 'auto', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Total Amount</span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {formatCurrency(order.total_amount)}
                    </span>
                  </div>
                </div>

                {/* Action Buttons Footer */}
                <div
                  style={{
                    padding: '0.85rem 1.25rem',
                    borderTop: '1px solid var(--border-color)',
                    backgroundColor: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.5rem',
                  }}
                >
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      setSelectedOrder(order)
                      setIsDetailsOpen(true)
                    }}
                  >
                    Details
                  </Button>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {order.order_status === 'pending' && (
                      <>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={() => setRejectingOrder(order)}
                        >
                          Reject
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleUpdateStatus(order.id, 'processing')}
                        >
                          Accept Order
                        </Button>
                      </>
                    )}

                    {order.order_status === 'processing' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleUpdateStatus(order.id, 'ready_for_pickup')}
                      >
                        Ready for Pickup
                      </Button>
                    )}

                    {order.order_status === 'ready_for_pickup' && (
                      <span style={{ fontSize: '0.8rem', color: '#0284c7', fontWeight: 600 }}>
                        Waiting for rider pickup
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Reject Order Modal */}
      {rejectingOrder && (
        <Modal
          isOpen={Boolean(rejectingOrder)}
          onClose={() => setRejectingOrder(null)}
          title={`Reject Order #${rejectingOrder.order_number}`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Please select a reason for rejecting this order. The customer will be notified immediately.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {[
                'Out of stock / item unavailable',
                'Kitchen at maximum capacity / peak rush',
                'Closing soon / outside operating hours',
                'Other',
              ].map((reason) => (
                <label
                  key={reason}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                  }}
                >
                  <input
                    type="radio"
                    name="rejectReason"
                    value={reason}
                    checked={rejectReason === reason}
                    onChange={(e) => setRejectReason(e.target.value)}
                  />
                  <span>{reason}</span>
                </label>
              ))}
            </div>

            {rejectReason === 'Other' && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter specific reason..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  boxSizing: 'border-box',
                }}
              />
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button variant="secondary" onClick={() => setRejectingOrder(null)}>
                Cancel
              </Button>
              <Button
                variant="danger"
                disabled={isRejecting || (rejectReason === 'Other' && !customReason.trim())}
                onClick={handleConfirmReject}
              >
                {isRejecting ? 'Rejecting...' : 'Confirm Reject'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Full Order Details Modal */}
      {selectedOrder && (
        <Modal
          isOpen={isDetailsOpen}
          onClose={() => setIsDetailsOpen(false)}
          title={`Order #${selectedOrder.order_number} Details`}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Placed On</div>
                <div style={{ fontWeight: 600 }}>{formatDate(selectedOrder.created_at)}</div>
              </div>
              {getStatusBadge(selectedOrder.order_status)}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: 700 }}>Customer Details</h4>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>
                <strong>Name:</strong> {selectedOrder.customer?.full_name || 'Guest'}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-main)', marginTop: '0.2rem' }}>
                <strong>Phone:</strong> {selectedOrder.customer?.phone_number || 'N/A'}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.9rem', fontWeight: 700 }}>Ordered Items</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {selectedOrder.items?.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>
                      {item.quantity}x {item.product_title}
                    </span>
                    <span style={{ fontWeight: 600 }}>{formatCurrency(item.total_price)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem', display: 'flex', justifyContent: 'space-between', fontWeight: 800 }}>
              <span>Total Price:</span>
              <span style={{ color: '#1565C0', fontSize: '1.1rem' }}>{formatCurrency(selectedOrder.total_amount)}</span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
              <Button variant="secondary" onClick={() => setIsDetailsOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
