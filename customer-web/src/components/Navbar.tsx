import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  Search,
  ShoppingBag,
  User as UserIcon,
  Store,
  Menu,
  X,
  LogOut,
  ChevronDown,
  Clock,
  Heart,
  FileText
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { LocationModal } from './LocationModal';

export const Navbar: React.FC = () => {
  const { user, profile, signOut } = useAuth();
  const { itemCount, setIsCartDrawerOpen } = useCart();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [selectedCity, setSelectedCity] = useState(() => {
    return localStorage.getItem('yummy_selected_city') || 'New York, USA';
  });
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setIsMobileMenuOpen(false);
    }
  };

  const handleCitySelect = (city: string) => {
    setSelectedCity(city);
    localStorage.setItem('yummy_selected_city', city);
    setIsLocationModalOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-sm transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 gap-4">
            
            {/* 1. Left: Brand Logo & Tagline */}
            <div className="flex items-center gap-6">
              <Link to="/" className="flex items-center gap-3 group">
                <img
                  src="/yummy_logo.png"
                  alt="YUMMY"
                  className="h-10 w-auto object-contain transition-transform group-hover:scale-105"
                  onError={(e) => {
                    // Fallback text if logo file is loading
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div className="flex flex-col">
                  <span className="text-2xl font-extrabold tracking-tight text-blue-800">
                    YUMMY
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-orange-500 -mt-1">
                    Food. Delivered.
                  </span>
                </div>
              </Link>

              {/* Location Pill Selector */}
              <button
                type="button"
                onClick={() => setIsLocationModalOpen(true)}
                className="hidden md:flex items-center gap-2 px-3.5 py-2 rounded-full bg-slate-50 hover:bg-slate-100 border border-slate-200 text-sm font-medium text-slate-700 transition"
                title="Select Delivery Location"
              >
                <MapPin className="w-4 h-4 text-blue-600 shrink-0" />
                <span className="max-w-[140px] truncate">{selectedCity}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>
            </div>

            {/* 2. Center: Global Search Bar */}
            <form
              onSubmit={handleSearchSubmit}
              className="hidden lg:flex flex-1 max-w-md relative"
            >
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search restaurants, cuisines or dishes..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 rounded-full bg-slate-100 hover:bg-slate-50 focus:bg-white border border-transparent focus:border-blue-500 text-sm text-slate-800 placeholder-slate-400 outline-none transition"
                />
              </div>
            </form>

            {/* 3. Right: Actions & User Navigation */}
            <div className="flex items-center gap-3">
              
              {/* Become a Restaurant Partner CTA */}
              <Link
                to="/partner/apply"
                className="hidden sm:inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-xs md:text-sm font-semibold text-blue-700 hover:bg-blue-50 border border-blue-200 transition"
              >
                <Store className="w-4 h-4 text-blue-600" />
                <span>Become a Partner</span>
              </Link>

              {/* Cart Button */}
              <button
                type="button"
                onClick={() => setIsCartDrawerOpen(true)}
                className="relative flex items-center justify-center p-2.5 rounded-full bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition"
                aria-label="View shopping cart"
              >
                <ShoppingBag className="w-5 h-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-5 h-5 px-1.5 text-xs font-bold text-white bg-orange-500 rounded-full shadow-sm animate-pulse">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* User Account / Auth */}
              {user ? (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 p-1.5 rounded-full hover:bg-slate-100 border border-slate-200 transition"
                  >
                    <div className="w-8 h-8 rounded-full bg-blue-700 text-white flex items-center justify-center font-bold text-sm">
                      {profile?.full_name ? profile.full_name[0].toUpperCase() : 'U'}
                    </div>
                    <span className="hidden md:inline-block text-sm font-medium text-slate-700 max-w-[120px] truncate">
                      {profile?.full_name || 'My Account'}
                    </span>
                    <ChevronDown className="hidden md:inline-block w-4 h-4 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {isUserMenuOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 animate-in fade-in slide-in-from-top-2"
                      onClick={() => setIsUserMenuOpen(false)}
                    >
                      <div className="px-4 py-2 border-b border-slate-100">
                        <p className="text-xs text-slate-400">Signed in as</p>
                        <p className="text-sm font-semibold text-slate-800 truncate">
                          {user.email}
                        </p>
                      </div>
                      <Link
                        to="/orders"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>Order History</span>
                      </Link>
                      <Link
                        to="/addresses"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                      >
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span>Saved Addresses</span>
                      </Link>
                      <Link
                        to="/profile"
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition"
                      >
                        <UserIcon className="w-4 h-4 text-slate-400" />
                        <span>Profile Settings</span>
                      </Link>
                      <div className="border-t border-slate-100 my-1"></div>
                      <button
                        type="button"
                        onClick={signOut}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Log Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 rounded-full text-sm font-semibold text-slate-700 hover:bg-slate-100 transition"
                  >
                    Log In
                  </Link>
                  <Link
                    to="/register"
                    className="px-4 py-2 rounded-full text-sm font-semibold text-white bg-blue-700 hover:bg-blue-800 shadow-sm transition"
                  >
                    Sign Up
                  </Link>
                </div>
              )}

              {/* Mobile Hamburger Button */}
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
              >
                {isMobileMenuOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>

          {/* Mobile Search Bar Row */}
          <div className="lg:hidden pb-3">
            <form onSubmit={handleSearchSubmit}>
              <div className="relative w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search restaurants or food..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-full bg-slate-100 text-sm text-slate-800 outline-none"
                />
              </div>
            </form>
          </div>
        </div>

        {/* Mobile Navigation Dropdown Drawer */}
        {isMobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
            <button
              type="button"
              onClick={() => {
                setIsLocationModalOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-slate-50 text-sm font-medium text-slate-800"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-blue-600" />
                <span>Deliver to: {selectedCity}</span>
              </div>
              <span className="text-xs text-blue-600 font-semibold">Change</span>
            </button>

            <Link
              to="/restaurants"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 rounded-lg"
            >
              Explore Restaurants
            </Link>
            <Link
              to="/partner/apply"
              onClick={() => setIsMobileMenuOpen(false)}
              className="flex items-center gap-2 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 rounded-lg"
            >
              <Store className="w-4 h-4" />
              <span>Become a Restaurant Partner</span>
            </Link>

            {!user && (
              <div className="pt-2 border-t border-slate-100 flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 text-center py-2.5 rounded-full text-sm font-semibold text-slate-700 bg-slate-100"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex-1 text-center py-2.5 rounded-full text-sm font-semibold text-white bg-blue-700"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        )}
      </header>

      {/* Location Selector Modal */}
      {isLocationModalOpen && (
        <LocationModal
          currentCity={selectedCity}
          onSelect={handleCitySelect}
          onClose={() => setIsLocationModalOpen(false)}
        />
      )}
    </>
  );
};
