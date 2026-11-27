import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, Filter, UtensilsCrossed, Star } from 'lucide-react';
import { getApprovedShops, getCategories } from '../services/shops.service';
import type { Category, Shop } from '../types';
import { RestaurantCard } from '../components/RestaurantCard';

export const RestaurantsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [shops, setShops] = useState<Shop[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const initialCat = searchParams.get('category') || '';
  const initialSearch = searchParams.get('q') || '';

  const [search, setSearch] = useState(initialSearch);
  const [selectedCat, setSelectedCat] = useState(initialCat);
  const [minRating, setMinRating] = useState<number>(0);
  const [isOpenOnly, setIsOpenOnly] = useState(false);

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

  useEffect(() => {
    setIsLoading(true);
    getApprovedShops({
      search: search || undefined,
      categoryId: selectedCat || undefined,
      minRating: minRating > 0 ? minRating : undefined,
      isOpenOnly,
    })
      .then(setShops)
      .finally(() => setIsLoading(false));
  }, [search, selectedCat, minRating, isOpenOnly]);

  const handleCategoryClick = (catId: string) => {
    const next = selectedCat === catId ? '' : catId;
    setSelectedCat(next);
    if (next) {
      searchParams.set('category', next);
    } else {
      searchParams.delete('category');
    }
    setSearchParams(searchParams);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Title */}
      <div>
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Explore Restaurants
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Discover top kitchens, authentic street food and premier dining near you.
        </p>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by restaurant name or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-sm text-slate-800 outline-none transition"
          />
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap">
          {/* Rating Filter */}
          <select
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="px-3.5 py-2.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-700 outline-none"
          >
            <option value="0">All Ratings</option>
            <option value="4.5">★ 4.5 & up</option>
            <option value="4.0">★ 4.0 & up</option>
          </select>

          {/* Open only Toggle */}
          <button
            type="button"
            onClick={() => setIsOpenOnly(!isOpenOnly)}
            className={`px-4 py-2.5 rounded-2xl text-xs font-semibold transition border ${
              isOpenOnly
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
            }`}
          >
            Open Now Only
          </button>
        </div>
      </div>

      {/* Categories Horizontal Pills */}
      {categories.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
          <button
            type="button"
            onClick={() => handleCategoryClick('')}
            className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition ${
              !selectedCat
                ? 'bg-blue-700 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            All Cuisines
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleCategoryClick(c.id)}
              className={`px-4 py-2 rounded-full text-xs font-bold shrink-0 transition flex items-center gap-1.5 ${
                selectedCat === c.id
                  ? 'bg-blue-700 text-white shadow-xs'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{c.icon || '🍽️'}</span>
              <span>{c.name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Restaurant Grid */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 mt-3 font-medium">Loading restaurants...</p>
        </div>
      ) : shops.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-100 p-8">
          <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No restaurants match your filters</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try clearing search filters or choosing a different cuisine category.
          </p>
          <button
            type="button"
            onClick={() => {
              setSearch('');
              setSelectedCat('');
              setMinRating(0);
              setIsOpenOnly(false);
            }}
            className="mt-4 px-4 py-2 bg-blue-700 text-white rounded-full text-xs font-semibold"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {shops.map((shop) => (
            <RestaurantCard key={shop.id} shop={shop} />
          ))}
        </div>
      )}
    </div>
  );
};
