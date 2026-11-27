import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { CheckCircle2, Bike, ArrowRight, Clock, Store } from 'lucide-react';
import { getOrderById } from '../services/orders.service';
import type { Order } from '../types';
import { formatCurrency, formatDateTime } from '../lib/format';

export const OrderConfirmationPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    getOrderById(orderId)
      .then(setOrder)
      .finally(() => setIsLoading(false));
  }, [orderId]);

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-16 text-center space-y-8">
      {/* Celebration Icon */}
      <div className="w-20 h-20 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
        <CheckCircle2 className="w-12 h-12" />
      </div>

      <div className="space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-emerald-600">
          Order Confirmed!
        </span>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Thank you for ordering with YUMMY
        </h1>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          Your order has been transmitted directly to the kitchen. You can track your rider live in real-time.
        </p>
      </div>

      {/* Order Summary Card */}
      {order && (
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm text-left space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <p className="text-xs text-slate-400">Order Number</p>
              <p className="text-sm font-extrabold text-blue-700">
                #{order.order_number}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Placed At</p>
              <p className="text-xs font-semibold text-slate-700">
                {formatDateTime(order.created_at)}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 font-medium">Restaurant</span>
            <span className="font-bold text-slate-900">
              {order.shop?.name || 'Restaurant'}
            </span>
          </div>

          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600 font-medium">Payment</span>
            <span className="font-bold text-slate-900 uppercase">
              {order.payment_method} (Cash on Delivery)
            </span>
          </div>

          <div className="flex items-center justify-between text-base font-extrabold border-t border-slate-100 pt-3">
            <span>Total Paid</span>
            <span className="text-blue-700">
              {formatCurrency(order.total_amount, order.currency_code)}
            </span>
          </div>
        </div>
      )}

      {/* CTA Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
        <Link
          to={`/orders/${orderId}/track`}
          className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
        >
          <Bike className="w-4 h-4" />
          <span>Track Order Live</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          to="/restaurants"
          className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition"
        >
          Continue Exploring
        </Link>
      </div>
    </div>
  );
};
