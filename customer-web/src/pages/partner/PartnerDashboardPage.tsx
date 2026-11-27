import React, { useEffect, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import {
  DollarSign,
  ShoppingBag,
  Clock,
  ChefHat,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { sellerService, PartnerMetrics } from '../../services/seller.service';
import type { Shop, Order } from '../../types';
import { formatCurrency, formatDateTime } from '../../lib/format';

export const PartnerDashboardPage: React.FC = () => {
  const { shop } = useOutletContext<{ shop: Shop | null }>();

  const [metrics, setMetrics] = useState<PartnerMetrics>({
    totalOrders: 0,
    pendingOrders: 0,
    preparingOrders: 0,
    completedOrders: 0,
    todayRevenue: 0,
    isOpen: true,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!shop?.id) return;
    setIsLoading(true);

    Promise.all([
      sellerService.getShopMetrics(shop.id),
      sellerService.getShopOrders(shop.id),
    ])
      .then(([m, orders]) => {
        setMetrics(m);
        setRecentOrders(orders.slice(0, 5));
      })
      .finally(() => setIsLoading(false));
  }, [shop?.id]);

  if (!shop) {
    return (
      <div className="bg-white rounded-3xl p-8 text-center space-y-4 max-w-lg mx-auto border border-slate-200">
        <AlertCircle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-lg font-bold text-slate-800">No Restaurant Profile Linked</h3>
        <p className="text-xs text-slate-500">
          Your account is not yet linked to an approved restaurant shop.
        </p>
        <Link
          to="/partner/apply"
          className="inline-block px-5 py-2.5 rounded-full bg-blue-700 text-white font-bold text-xs"
        >
          Submit Restaurant Application
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Kitchen Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time business performance for <strong>{shop.name}</strong>
          </p>
        </div>

        <Link
          to="/partner/orders"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-md transition"
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Open Kitchen Order Queue</span>
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's Revenue */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Today's Revenue</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {formatCurrency(metrics.todayRevenue, shop.currency_code)}
          </p>
          <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3" />
            <span>Active Sales</span>
          </p>
        </div>

        {/* Pending Orders */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Pending Acceptance</span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600">
            {metrics.pendingOrders}
          </p>
          <p className="text-[11px] text-slate-500">Requires Kitchen Action</p>
        </div>

        {/* In Preparation */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Cooking Now</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <ChefHat className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-blue-700">
            {metrics.preparingOrders}
          </p>
          <p className="text-[11px] text-slate-500">In Kitchen</p>
        </div>

        {/* Total Lifetime Orders */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Total Orders</span>
            <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900">
            {metrics.totalOrders}
          </p>
          <p className="text-[11px] text-slate-500">Delivered & Dispatched</p>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Recent Customer Orders</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live orders received across web and mobile platforms
            </p>
          </div>
          <Link
            to="/partner/orders"
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            <span>View All</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="py-12 text-center text-slate-400 text-xs">
            <ShoppingBag className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="font-bold text-slate-700">No orders received yet today</p>
            <p className="text-slate-500 mt-0.5">
              New customer orders from the web and mobile app will appear here in real-time.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentOrders.map((order) => (
              <div
                key={order.id}
                className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-slate-900">
                      #{order.order_number}
                    </span>
                    <span
                      className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                        order.order_status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : order.order_status === 'delivered'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {order.order_status?.replace(/_/g, ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {formatDateTime(order.created_at)}
                  </p>
                </div>

                <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                  <span className="text-sm font-extrabold text-slate-900">
                    {formatCurrency(order.total_amount, order.currency_code)}
                  </span>
                  <Link
                    to="/partner/orders"
                    className="px-3.5 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-100"
                  >
                    Manage
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
