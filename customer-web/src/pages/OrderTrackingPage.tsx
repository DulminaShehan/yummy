import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Bike,
  Store,
  Phone,
  Clock,
  MapPin,
  Star,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';
import { getOrderTracking } from '../services/orders.service';
import { supabase } from '../lib/supabase';
import type { TrackingPayload } from '../types';
import { LiveTrackingMap } from '../components/LiveTrackingMap';
import { OrderTimeline } from '../components/OrderTimeline';
import { formatCurrency, formatDuration } from '../lib/format';

export const OrderTrackingPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [data, setData] = useState<TrackingPayload | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTracking = () => {
    if (!orderId) return;
    getOrderTracking(orderId)
      .then((res) => {
        setData(res);
        setError(null);
      })
      .catch((err) => {
        console.error('Tracking fetch error:', err);
        setError(err.message || 'Unable to retrieve tracking information');
      })
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchTracking();

    if (!orderId) return;

    // Supabase Realtime Subscription for Live Deliveries & Locations
    const channel = supabase
      .channel(`tracking-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries',
          filter: `order_id=eq.${orderId}`,
        },
        () => {
          fetchTracking();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rider_locations',
        },
        () => {
          fetchTracking();
        }
      )
      .subscribe();

    const interval = setInterval(fetchTracking, 10000); // 10s fallback polling

    return () => {
      channel.unsubscribe();
      clearInterval(interval);
    };
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 mt-3 font-medium">Connecting to live delivery feed...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800">
          Tracking Unavailable
        </h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">
          {error || 'You can only track active orders belonging to your customer account.'}
        </p>
        <Link
          to="/orders"
          className="mt-4 inline-flex items-center gap-2 px-6 py-2.5 bg-blue-700 text-white rounded-full text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to My Orders</span>
        </Link>
      </div>
    );
  }

  const { order, shop, delivery, rider, rider_location } = data;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Top Bar Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/orders"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-600 hover:text-blue-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>My Orders</span>
        </Link>

        <span className="text-xs font-extrabold text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">
          Order #{order.order_number}
        </span>
      </div>

      {/* Main Status Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
              Live Delivery Status
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1 capitalize">
              {order.order_status?.replace(/_/g, ' ') || 'Processing Order'}
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Restaurant: <strong className="text-slate-800">{shop.name}</strong>
            </p>
          </div>

          {/* Estimated Arrival Pill */}
          {delivery?.estimated_minutes && order.order_status !== 'delivered' && (
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-100 flex items-center gap-3 shrink-0">
              <Clock className="w-6 h-6 text-blue-600" />
              <div>
                <p className="text-[11px] text-slate-500 font-semibold">
                  Estimated Arrival
                </p>
                <p className="text-base font-black text-blue-900">
                  {formatDuration(delivery.estimated_minutes)}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Visual Timeline */}
        {order.order_status && (
          <OrderTimeline status={order.order_status as any} />
        )}
      </div>

      {/* Live Map Section */}
      <div className="space-y-4">
        <LiveTrackingMap
          pickupLat={delivery?.pickup_latitude || shop.latitude}
          pickupLng={delivery?.pickup_longitude || shop.longitude}
          dropoffLat={delivery?.dropoff_latitude}
          dropoffLng={delivery?.dropoff_longitude}
          riderLat={rider_location?.latitude}
          riderLng={rider_location?.longitude}
          restaurantName={shop.name}
          customerAddress={delivery?.dropoff_address || 'Customer Location'}
        />
      </div>

      {/* Rider & Restaurant Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Rider Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Bike className="w-5 h-5 text-orange-500" />
              <span>Assigned Delivery Rider</span>
            </h3>
            {rider && (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full">
                Active
              </span>
            )}
          </div>

          {rider ? (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold text-lg overflow-hidden shrink-0">
                  {rider.avatar_url ? (
                    <img
                      src={rider.avatar_url}
                      alt={rider.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    rider.full_name[0].toUpperCase()
                  )}
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    {rider.full_name}
                  </h4>
                  <p className="text-xs text-slate-500">
                    {rider.vehicle_type?.toUpperCase() || 'Motorcycle'} •{' '}
                    <strong className="text-slate-700">
                      {rider.vehicle_number || 'Standard Vehicle'}
                    </strong>
                  </p>
                  <div className="flex items-center gap-1 text-xs text-amber-600 font-bold mt-1">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                    <span>{Number(rider.rating || 5).toFixed(1)} Rating</span>
                  </div>
                </div>
              </div>

              {rider.phone_number && (
                <a
                  href={`tel:${rider.phone_number}`}
                  className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4 text-emerald-600" />
                  <span>Call Rider ({rider.phone_number})</span>
                </a>
              )}
            </div>
          ) : (
            <div className="py-6 text-center text-slate-400 text-xs">
              <p>Kitchen is currently preparing your order.</p>
              <p className="text-slate-500 font-medium mt-1">
                A nearby verified delivery rider will be assigned shortly.
              </p>
            </div>
          )}
        </div>

        {/* Restaurant Card */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Store className="w-5 h-5 text-blue-600" />
              <span>Restaurant Details</span>
            </h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <img
                src={shop.logo_url || 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=120&h=120&q=80'}
                alt={shop.name}
                className="w-14 h-14 rounded-2xl object-cover bg-slate-100 shrink-0"
              />
              <div>
                <h4 className="text-base font-bold text-slate-900">
                  {shop.name}
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  {shop.address}, {shop.city}
                </p>
              </div>
            </div>

            {shop.contact_phone && (
              <a
                href={`tel:${shop.contact_phone}`}
                className="w-full py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4 text-blue-600" />
                <span>Call Restaurant ({shop.contact_phone})</span>
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
