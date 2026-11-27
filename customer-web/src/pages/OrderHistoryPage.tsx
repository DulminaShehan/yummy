import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, Bike, ArrowRight, ShoppingBag } from 'lucide-react';
import { getCustomerOrders } from '../services/orders.service';
import type { Order } from '../types';
import { formatCurrency, formatDateTime } from '../lib/format';

export const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getCustomerOrders()
      .then(setOrders)
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Order History
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your past deliveries, receipts, and track active orders.
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 mt-3">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-100 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">No orders yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Once you place an order with YUMMY, you can track it live and view all past order receipts here.
          </p>
          <Link
            to="/restaurants"
            className="inline-block px-6 py-2.5 rounded-full bg-blue-700 text-white text-xs font-bold"
          >
            Explore Restaurants
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isActive =
              order.order_status !== 'delivered' &&
              order.order_status !== 'cancelled';

            return (
              <div
                key={order.id}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-extrabold text-slate-900">
                      {order.shop?.name || 'Restaurant'}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isActive
                          ? 'bg-blue-100 text-blue-800 animate-pulse'
                          : order.order_status === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {order.order_status?.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 mt-1">
                    #{order.order_number} • {formatDateTime(order.created_at)}
                  </p>

                  {order.items && order.items.length > 0 && (
                    <p className="text-xs text-slate-600 mt-2 line-clamp-1">
                      {order.items
                        .map((i) => `${i.quantity}x ${i.product_title}`)
                        .join(', ')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0">
                  <span className="text-base font-extrabold text-slate-900">
                    {formatCurrency(order.total_amount, order.currency_code)}
                  </span>

                  <Link
                    to={`/orders/${order.id}/track`}
                    className={`px-4 py-2 rounded-full text-xs font-bold transition flex items-center gap-1.5 ${
                      isActive
                        ? 'bg-blue-700 text-white hover:bg-blue-800 shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Bike className="w-3.5 h-3.5" />
                    <span>{isActive ? 'Track Live' : 'Details'}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
