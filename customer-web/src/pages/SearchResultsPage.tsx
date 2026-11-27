import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, UtensilsCrossed, Store } from 'lucide-react';
import { searchFoodAndRestaurants } from '../services/shops.service';
import type { Product, Shop } from '../types';
import { RestaurantCard } from '../components/RestaurantCard';
import { FoodCard } from '../components/FoodCard';
import { FoodDetailsModal } from '../components/FoodDetailsModal';

export const SearchResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';

  const [shops, setShops] = useState<Shop[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  useEffect(() => {
    if (!query.trim()) {
      setShops([]);
      setProducts([]);
      return;
    }

    setIsLoading(true);
    searchFoodAndRestaurants(query)
      .then((res) => {
        setShops(res.shops);
        setProducts(res.products);
      })
      .finally(() => setIsLoading(false));
  }, [query]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Search Results
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Showing results for <strong className="text-blue-700">"{query}"</strong>
        </p>
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 mt-3">Searching restaurants and dishes...</p>
        </div>
      ) : shops.length === 0 && products.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-100 p-8">
          <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No matching food or restaurants</h3>
          <p className="text-xs text-slate-500 mt-1">
            Try searching for a different dish, cuisine (like Pizza, Burgers, Sushi), or city.
          </p>
          <Link
            to="/restaurants"
            className="mt-4 inline-block px-5 py-2.5 rounded-full bg-blue-700 text-white text-xs font-semibold"
          >
            Explore All Restaurants
          </Link>
        </div>
      ) : (
        <div className="space-y-12">
          {/* Matching Restaurants */}
          {shops.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <Store className="w-5 h-5 text-blue-600" />
                <span>Matching Restaurants ({shops.length})</span>
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {shops.map((shop) => (
                  <RestaurantCard key={shop.id} shop={shop} />
                ))}
              </div>
            </div>
          )}

          {/* Matching Dishes */}
          {products.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                <UtensilsCrossed className="w-5 h-5 text-blue-600" />
                <span>Matching Dishes ({products.length})</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {products.map((product) => {
                  const shop = shops.find((s) => s.id === product.shop_id) || ({
                    id: product.shop_id,
                    name: 'Restaurant',
                    currency_code: 'USD',
                  } as Shop);

                  return (
                    <FoodCard
                      key={product.id}
                      product={product}
                      shop={shop}
                      onSelect={(p) => setSelectedProduct(p)}
                    />
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {selectedProduct && (
        <FoodDetailsModal
          product={selectedProduct}
          shop={
            shops.find((s) => s.id === selectedProduct.shop_id) || ({
              id: selectedProduct.shop_id,
              name: 'Restaurant',
              currency_code: 'USD',
            } as Shop)
          }
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};
