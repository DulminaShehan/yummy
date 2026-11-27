import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  ShoppingBag,
  Clock,
  ChefHat,
  CheckCircle2,
  Bike,
  AlertCircle
} from 'lucide-react';
import { sellerService } from '../../services/seller.service';
import { supabase } from '../../lib/supabase';
import type { Shop, Order, OrderStatus } from '../../types';
import { formatCurrency, formatDateTime } from '../../lib/format';

export const PartnerOrdersPage: React.FC = () => {
  const { shop } = useOutletContext<{ shop: Shop | null }>();

  const [orders, setOrders] = useState<Order[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'preparing' | 'ready'>('all');
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrders = () => {
    if (!shop?.id) return;
    sellerService
      .getShopOrders(shop.id)
      .then(setOrders)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchOrders();

    if (!shop?.id) return;

    // Realtime subscription for incoming orders
    const channel = supabase
      .channel(`partner-orders-${shop.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `shop_id=eq.${shop.id}`,
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [shop?.id]);

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    try {
      await sellerService.updateOrderStatus(orderId, nextStatus);
      fetchOrders();
    } catch (err) {
      console.error('Failed to update order status:', err);
      alert('Failed to update status');
    }
  };

  const filteredOrders = orders.filter((o) => {
    if (filterTab === 'pending') return o.order_status === 'pending';
    if (filterTab === 'preparing')
      return o.order_status === 'accepted' || o.order_status === 'preparing';
    if (filterTab === 'ready')
      return o.order_status === 'ready_for_pickup' || o.order_status === 'picked_up';
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Kitchen Orders
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Accept, prepare, and dispatch orders in real-time.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex gap-1.5 bg-slate-200/70 p-1.5 rounded-2xl text-xs font-bold text-slate-600">
          {(['all', 'pending', 'preparing', 'ready'] as const).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilterTab(tab)}
              className={`px-3 py-1.5 rounded-xl capitalize transition ${
                filterTab === tab
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'hover:text-slate-900'
              }`}
            >
              {tab === 'all'
                ? 'All Orders'
                : tab === 'pending'
                ? 'Pending'
                : tab === 'preparing'
                ? 'Cooking'
                : 'Ready / On Way'}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 mt-3">Loading orders...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-2">
          <ShoppingBag className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No orders in this queue</h3>
          <p className="text-xs text-slate-500">
            Incoming orders will appear automatically via live Realtime feed.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredOrders.map((order) => {
            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-4 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div>
                      <span className="font-mono text-sm font-extrabold text-blue-700">
                        #{order.order_number}
                      </span>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {formatDateTime(order.created_at)}
                      </p>
                    </div>

                    <span
                      className={`px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        order.order_status === 'pending'
                          ? 'bg-amber-100 text-amber-800 animate-pulse'
                          : order.order_status === 'preparing'
                          ? 'bg-blue-100 text-blue-800'
                          : order.order_status === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {order.order_status?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  {/* Items List */}
                  <div className="py-3 space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      Dishes Ordered:
                    </p>
                    {order.items?.map((item) => (
                      <div
                        key={item.id}
                        className="flex justify-between text-xs text-slate-800 font-medium"
                      >
                        <span>
                          <strong className="text-blue-700 font-extrabold">
                            {item.quantity}x
                          </strong>{' '}
                          {item.product_title}
                        </span>
                        <span className="font-bold">
                          {formatCurrency(item.total_price, order.currency_code)}
                        </span>
                      </div>
                    ))}
                  </div>

                  {order.customer_notes && (
                    <div className="p-2.5 rounded-xl bg-amber-50 text-amber-900 text-xs italic">
                      Note: "{order.customer_notes}"
                    </div>
                  )}
                </div>

                {/* Bottom Bar: Total & Status Action Button */}
                <div className="border-t border-slate-100 pt-3 flex items-center justify-between gap-3">
                  <span className="text-base font-black text-slate-900">
                    {formatCurrency(order.total_amount, order.currency_code)}
                  </span>

                  {order.order_status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(order.id, 'accepted')}
                      className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-sm transition"
                    >
                      Accept Order
                    </button>
                  )}

                  {order.order_status === 'accepted' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(order.id, 'preparing')}
                      className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                    >
                      <ChefHat className="w-3.5 h-3.5" />
                      <span>Start Cooking</span>
                    </button>
                  )}

                  {order.order_status === 'preparing' && (
                    <button
                      type="button"
                      onClick={() => handleUpdateStatus(order.id, 'ready_for_pickup')}
                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5"
                    >
                      <Bike className="w-3.5 h-3.5" />
                      <span>Ready for Rider</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
