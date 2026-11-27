import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Clock, MapPin, Bike } from 'lucide-react';
import type { Shop } from '../types';

interface RestaurantCardProps {
  shop: Shop;
}

export const RestaurantCard: React.FC<RestaurantCardProps> = ({ shop }) => {
  const defaultBanner =
    'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80';
  const defaultLogo =
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=120&h=120&q=80';

  return (
    <Link
      to={`/restaurant/${shop.id}`}
      className="group bg-white rounded-3xl overflow-hidden border border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
    >
      {/* Cover Image Container */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
        <img
          src={shop.banner_url || defaultBanner}
          alt={shop.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultBanner;
          }}
        />

        {/* Closed/Open pill */}
        <div className="absolute top-3 left-3 flex gap-2">
          {shop.is_open ? (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/90 backdrop-blur-sm text-white text-xs font-bold tracking-wide shadow-sm">
              Open Now
            </span>
          ) : (
            <span className="px-2.5 py-1 rounded-full bg-slate-800/80 backdrop-blur-sm text-slate-200 text-xs font-bold tracking-wide shadow-sm">
              Closed
            </span>
          )}
        </div>

        {/* Delivery Estimate Badge */}
        <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-white/95 backdrop-blur-sm text-slate-800 text-xs font-bold shadow-md flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-blue-600" />
          <span>20–35 min</span>
        </div>
      </div>

      {/* Info Section */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-700 transition line-clamp-1">
              {shop.name}
            </h3>
            
            {/* Rating */}
            <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2 py-0.5 rounded-lg text-xs font-extrabold shrink-0 border border-amber-200/50">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span>{shop.rating > 0 ? Number(shop.rating).toFixed(1) : '4.8'}</span>
              <span className="text-amber-700 font-normal">
                ({shop.total_reviews > 0 ? shop.total_reviews : '25+'})
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-500 mt-1 line-clamp-1">
            {shop.description || 'Delicious freshly prepared dishes delivered to your door.'}
          </p>
        </div>

        {/* Footer Meta: City & Delivery Fee */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
          <div className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-slate-400" />
            <span className="truncate max-w-[150px]">{shop.city || 'Local Delivery'}</span>
          </div>

          <div className="flex items-center gap-1 text-slate-700">
            <Bike className="w-3.5 h-3.5 text-blue-600" />
            <span>Low delivery fee</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
