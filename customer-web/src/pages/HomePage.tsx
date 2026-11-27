import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search,
  MapPin,
  ArrowRight,
  ShieldCheck,
  Bike,
  Sparkles,
  Store,
  ChevronRight,
  UtensilsCrossed
} from 'lucide-react';
import {
  getCategories,
  getFeaturedShops,
  getPopularProducts,
} from '../services/shops.service';
import type { Category, Product, Shop } from '../types';
import { RestaurantCard } from '../components/RestaurantCard';
import { FoodCard } from '../components/FoodCard';
import { FoodDetailsModal } from '../components/FoodDetailsModal';

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState<Category[]>([]);
  const [featuredShops, setFeaturedShops] = useState<Shop[]>([]);
  const [popularProducts, setPopularProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [searchLocation, setSearchLocation] = useState(() => {
    return localStorage.getItem('yummy_selected_city') || 'New York, USA';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    let mounted = true;
    Promise.all([
      getCategories(),
      getFeaturedShops(6),
      getPopularProducts(6),
    ])
      .then(([cats, shops, foods]) => {
        if (!mounted) return;
        setCategories(cats);
        setFeaturedShops(shops);
        setPopularProducts(foods);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const handleHeroSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      navigate('/restaurants');
    }
  };

  const selectedShop = selectedProduct
    ? featuredShops.find((s) => s.id === selectedProduct.shop_id) || featuredShops[0]
    : null;

  return (
    <div className="space-y-16 pb-20">
      
      {/* 1. Hero Section (Uber Eats Inspired) */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-blue-800 to-blue-900 text-white pt-16 pb-24 md:py-28">
        
        {/* Decorative Background Elements */}
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none" />
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Headline & Search Form */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-semibold text-blue-200">
                <Sparkles className="w-3.5 h-3.5 text-orange-400" />
                <span>Global Food Delivery • Trusted Local Kitchens</span>
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.15]">
                Discover Great Food <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-white">
                  Delivered Fast.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-blue-100 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
                Order from your favorite local restaurants, explore curated international cuisines, and watch your rider arrive with live GPS tracking.
              </p>

              {/* Big Search Bar */}
              <form
                onSubmit={handleHeroSearch}
                className="bg-white p-2.5 sm:p-3 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center gap-3 border border-white/20 max-w-xl mx-auto lg:mx-0"
              >
                <div className="flex items-center gap-2 px-3 py-1.5 w-full sm:w-auto text-slate-700 border-b sm:border-b-0 sm:border-r border-slate-200">
                  <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                  <span className="text-xs font-semibold text-slate-800 truncate max-w-[140px]">
                    {searchLocation}
                  </span>
                </div>

                <div className="flex-1 w-full flex items-center gap-2 px-2">
                  <Search className="w-4 h-4 text-slate-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="Search dishes, burgers, sushi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full text-sm text-slate-800 placeholder-slate-400 outline-none bg-transparent"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-6 py-3 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md transition transform active:scale-95 shrink-0 flex items-center justify-center gap-2"
                >
                  <span>Find Food</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </form>

              {/* Trust Badges */}
              <div className="pt-4 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-blue-200">
                <div className="flex items-center gap-2">
                  <Bike className="w-4 h-4 text-orange-400" />
                  <span>Real-Time GPS Tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Verified Restaurant Partners</span>
                </div>
              </div>
            </div>

            {/* Right Food Photography Showcase */}
            <div className="lg:col-span-5 relative hidden lg:block">
              <div className="relative mx-auto max-w-md aspect-square rounded-3xl overflow-hidden shadow-2xl border-4 border-white/10 group">
                <img
                  src="https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=800&q=80"
                  alt="Delicious Italian Pizza"
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                />
                
                {/* Floating pill: Live Delivery in 24m */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-xl border border-white/50 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                    <Bike className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      Rider On The Way
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Average arrival time: <strong className="text-blue-700">22 mins</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 2. Food Categories Bar */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Popular Categories
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Explore your cravings by cuisine
            </p>
          </div>
          <Link
            to="/restaurants"
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800"
          >
            <span>See all</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 sm:gap-4">
          {categories.slice(0, 8).map((cat) => (
            <Link
              key={cat.id}
              to={`/restaurants?category=${cat.id}`}
              className="group bg-white p-4 rounded-2xl border border-slate-100 hover:border-blue-300 shadow-xs hover:shadow-md transition text-center flex flex-col items-center justify-center gap-2"
            >
              <div className="w-12 h-12 rounded-2xl bg-blue-50 group-hover:bg-blue-600 text-blue-700 group-hover:text-white transition flex items-center justify-center text-xl shadow-xs">
                {cat.icon || '🍽️'}
              </div>
              <span className="text-xs font-bold text-slate-700 group-hover:text-blue-700 transition truncate w-full">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* 3. Featured Restaurants */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Featured Restaurants
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Top-rated culinary hotspots near you
            </p>
          </div>
          <Link
            to="/restaurants"
            className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800"
          >
            <span>View all ({featuredShops.length})</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {featuredShops.length === 0 && !isLoading ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-100">
            <UtensilsCrossed className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No restaurants yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Be the first to partner with us and feature your kitchen!
            </p>
            <Link
              to="/partner/apply"
              className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-blue-700 text-white text-xs font-bold"
            >
              <Store className="w-3.5 h-3.5" />
              <span>Become a Partner</span>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredShops.map((shop) => (
              <RestaurantCard key={shop.id} shop={shop} />
            ))}
          </div>
        )}
      </section>

      {/* 4. Popular Dishes Near You */}
      {popularProducts.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Trending Dishes
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Most ordered and recommended dishes
              </p>
            </div>
            <Link
              to="/restaurants"
              className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 hover:text-blue-800"
            >
              <span>Explore Menu</span>
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {popularProducts.map((prod) => {
              const shop = featuredShops.find((s) => s.id === prod.shop_id) || {
                id: prod.shop_id,
                name: 'Restaurant',
                currency_code: 'USD',
                status: 'approved',
                rating: 5,
                total_reviews: 10,
                is_open: true,
                logo_url: null,
                banner_url: null,
                description: null,
                address: null,
                city: null,
                contact_phone: null,
                latitude: null,
                longitude: null,
              } as Shop;

              return (
                <FoodCard
                  key={prod.id}
                  product={prod}
                  shop={shop}
                  onSelect={(p) => setSelectedProduct(p)}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* 5. How It Works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-100 shadow-sm text-center">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
            Simple 3-Step Experience
          </span>
          <h2 className="text-3xl font-extrabold text-slate-900 mt-1">
            How YUMMY Works
          </h2>
          <p className="text-xs text-slate-500 mt-2 max-w-lg mx-auto">
            From local kitchens to your dining table in record time with trusted pricing and live GPS tracking.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-10">
            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-700 flex items-center justify-center text-2xl font-black shadow-xs">
                1
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Choose Your Dishes
              </h3>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Browse hundreds of local verified restaurants and add mouthwatering meals to your cart.
              </p>
            </div>

            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-orange-50 text-orange-600 flex items-center justify-center text-2xl font-black shadow-xs">
                2
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Kitchen Prepares & Cooks
              </h3>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Your order is confirmed instantly by the restaurant staff and cooked fresh with quality ingredients.
              </p>
            </div>

            <div className="flex flex-col items-center space-y-3">
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center text-2xl font-black shadow-xs">
                3
              </div>
              <h3 className="text-base font-bold text-slate-800">
                Live Rider GPS Delivery
              </h3>
              <p className="text-xs text-slate-500 max-w-xs leading-relaxed">
                Watch your delivery driver move on the live interactive map right to your doorstep.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Become a Restaurant Partner Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-800 to-indigo-900 text-white p-8 sm:p-12 shadow-xl">
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-8 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-blue-200">
                <Store className="w-3.5 h-3.5 text-orange-400" />
                <span>Partner With YUMMY</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Grow Your Restaurant Business With YUMMY
              </h2>
              <p className="text-sm text-blue-100 max-w-2xl leading-relaxed">
                Join our international food delivery network. Reach thousands of hungry customers, manage live orders on your dedicated kitchen portal, and boost your revenue.
              </p>

              <div className="pt-2 flex flex-wrap gap-4">
                <Link
                  to="/partner/apply"
                  className="px-6 py-3 rounded-full bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm shadow-md transition transform active:scale-95 inline-flex items-center gap-2"
                >
                  <span>Apply Now as a Partner</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  to="/partner/status"
                  className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-semibold text-sm transition"
                >
                  Track Existing Application
                </Link>
              </div>
            </div>

            <div className="lg:col-span-4 text-center lg:text-right hidden sm:block">
              <div className="inline-block p-6 rounded-3xl bg-white/10 backdrop-blur-md border border-white/20">
                <p className="text-3xl font-extrabold text-orange-400">0%</p>
                <p className="text-xs font-semibold text-blue-100 mt-1">
                  Setup fee for early partner applications
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Selected Product Modal */}
      {selectedProduct && selectedShop && (
        <FoodDetailsModal
          product={selectedProduct}
          shop={selectedShop}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};
