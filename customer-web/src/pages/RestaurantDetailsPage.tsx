import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  Star,
  Clock,
  MapPin,
  Phone,
  ArrowLeft,
  ShoppingBag,
  Info
} from 'lucide-react';
import { getShopById, getShopMenu } from '../services/shops.service';
import type { Product, Shop } from '../types';
import { FoodCard } from '../components/FoodCard';
import { FoodDetailsModal } from '../components/FoodDetailsModal';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../lib/format';

export const RestaurantDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [shop, setShop] = useState<Shop | null>(null);
  const [menu, setMenu] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchDish, setSearchDish] = useState('');

  const { items, subtotal, setIsCartDrawerOpen } = useCart();

  useEffect(() => {
    if (!id) return;
    setIsLoading(true);

    Promise.all([getShopById(id), getShopMenu(id)])
      .then(([s, m]) => {
        setShop(s);
        setMenu(m);
      })
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 mt-3 font-medium">Loading menu...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Restaurant Not Found</h2>
        <p className="text-xs text-slate-500 mt-2">
          This restaurant might be suspended, pending approval, or unavailable.
        </p>
        <Link
          to="/restaurants"
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-700 text-white rounded-full text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Restaurants</span>
        </Link>
      </div>
    );
  }

  const defaultBanner =
    'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80';
  const defaultLogo =
    'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=120&h=120&q=80';

  const filteredMenu = menu.filter((item) =>
    item.title.toLowerCase().includes(searchDish.toLowerCase())
  );

  return (
    <div className="pb-24">
      {/* 1. Header Banner */}
      <div className="relative h-64 sm:h-80 w-full overflow-hidden bg-slate-900">
        <img
          src={shop.banner_url || defaultBanner}
          alt={shop.name}
          className="w-full h-full object-cover opacity-85"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultBanner;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

        {/* Back Button */}
        <Link
          to="/restaurants"
          className="absolute top-6 left-6 p-2.5 rounded-full bg-white/90 hover:bg-white text-slate-800 transition shadow-md backdrop-blur-sm"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
      </div>

      {/* 2. Restaurant Profile Card (Overlapping Banner) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <img
              src={shop.logo_url || defaultLogo}
              alt={shop.name}
              className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white shadow-md bg-white shrink-0"
              onError={(e) => {
                (e.target as HTMLImageElement).src = defaultLogo;
              }}
            />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {shop.name}
                </h1>
                {shop.is_open ? (
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                    Open
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs font-bold">
                    Closed
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-500 mt-1 max-w-xl">
                {shop.description || 'Authentic dishes freshly cooked for delivery.'}
              </p>

              <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-600 font-medium">
                <div className="flex items-center gap-1 bg-amber-50 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{shop.rating > 0 ? Number(shop.rating).toFixed(1) : '4.8'}</span>
                  <span className="text-amber-700 font-normal">
                    ({shop.total_reviews > 0 ? shop.total_reviews : '25+'})
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  <span>20–35 min</span>
                </div>

                <div className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{shop.city || 'City Center'}</span>
                </div>

                {shop.contact_phone && (
                  <div className="flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{shop.contact_phone}</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick Cart Status Pill */}
          {items.length > 0 && (
            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(true)}
              className="px-5 py-3 rounded-2xl bg-blue-50 border border-blue-200 text-blue-800 hover:bg-blue-100 transition flex items-center justify-between gap-4 shrink-0"
            >
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-blue-600" />
                <span className="text-xs font-bold">{items.length} items</span>
              </div>
              <span className="text-xs font-extrabold text-blue-900">
                {formatCurrency(subtotal, shop.currency_code)}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* 3. Menu Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900">
              Menu & Food Selection
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select dishes to customize and add to your order
            </p>
          </div>

          {/* Search within Menu */}
          <div className="relative w-full sm:w-64">
            <input
              type="text"
              placeholder="Search in menu..."
              value={searchDish}
              onChange={(e) => setSearchDish(e.target.value)}
              className="w-full px-4 py-2 rounded-xl bg-slate-100 text-xs text-slate-800 outline-none focus:bg-white focus:border focus:border-blue-500 transition"
            />
          </div>
        </div>

        {/* Menu Items Grid */}
        {filteredMenu.length === 0 ? (
          <div className="py-16 text-center bg-white rounded-3xl border border-slate-100 p-8">
            <p className="text-sm font-bold text-slate-700">No dishes found</p>
            <p className="text-xs text-slate-500 mt-1">
              There are currently no dishes matching your query in this restaurant's menu.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMenu.map((product) => (
              <FoodCard
                key={product.id}
                product={product}
                shop={shop}
                onSelect={(p) => setSelectedProduct(p)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Selected Dish Detail Modal */}
      {selectedProduct && (
        <FoodDetailsModal
          product={selectedProduct}
          shop={shop}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};
