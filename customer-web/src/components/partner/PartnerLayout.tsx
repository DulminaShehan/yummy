import React, { useEffect, useState } from 'react';
import { Link, Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Store,
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Settings,
  LogOut,
  ExternalLink,
  Power
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { sellerService } from '../../services/seller.service';
import type { Shop } from '../../types';

export const PartnerLayout: React.FC = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [shop, setShop] = useState<Shop | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  const loadShop = async () => {
    if (!user) return;
    try {
      const data = await sellerService.getSellerShop(user.id);
      setShop(data);
    } catch (err) {
      console.error('Failed to load seller shop:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadShop();
  }, [user]);

  const handleToggleOpen = async () => {
    if (!shop || isToggling) return;
    setIsToggling(true);
    try {
      const updated = await sellerService.toggleShopIsOpen(shop.id, !shop.is_open);
      setShop(updated);
    } catch (err) {
      console.error('Failed to toggle shop status:', err);
    } finally {
      setIsToggling(false);
    }
  };

  const navLinks = [
    { to: '/partner/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/partner/orders', label: 'Kitchen Orders', icon: ShoppingBag },
    { to: '/partner/menu', label: 'Menu & Dishes', icon: UtensilsCrossed },
    { to: '/partner/profile', label: 'Restaurant Settings', icon: Settings },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-400 mt-3">Loading restaurant partner portal...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Partner Top Navigation Bar */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 gap-4">
            
            {/* Left: Brand & Shop Info */}
            <div className="flex items-center gap-4">
              <Link to="/partner/dashboard" className="flex items-center gap-2">
                <span className="text-xl font-extrabold text-white tracking-tight">
                  YUMMY
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                  Partner Portal
                </span>
              </Link>

              {shop && (
                <div className="hidden md:flex items-center gap-2 pl-4 border-l border-slate-800">
                  <span className="text-sm font-bold text-slate-200">
                    {shop.name}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ({shop.city || 'Active Kitchen'})
                  </span>
                </div>
              )}
            </div>

            {/* Right: Open Status Switcher & External Links */}
            <div className="flex items-center gap-3">
              {/* Live Kitchen Open/Closed Toggle */}
              {shop && (
                <button
                  type="button"
                  disabled={isToggling}
                  onClick={handleToggleOpen}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shadow-xs ${
                    shop.is_open
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30 hover:bg-red-500/30'
                  }`}
                  title="Toggle accepting orders"
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{shop.is_open ? 'Accepting Orders' : 'Store Closed'}</span>
                </button>
              )}

              {/* View Public Storefront */}
              {shop && (
                <Link
                  to={`/restaurant/${shop.id}`}
                  target="_blank"
                  className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition px-2.5 py-1.5 rounded-lg hover:bg-slate-800"
                >
                  <span>Public Store</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              )}

              {/* Logout */}
              <button
                type="button"
                onClick={async () => {
                  await signOut();
                  navigate('/partner/login');
                }}
                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-800 transition"
                title="Sign out of Partner Portal"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Subnav Navigation Tabs */}
        <div className="bg-slate-950/60 border-t border-slate-800/80 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto py-1 scrollbar-none">
            {navLinks.map((link) => {
              const isActive = location.pathname === link.to;
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                    isActive
                      ? 'bg-orange-500 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Partner Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Outlet context={{ shop, onRefreshShop: loadShop }} />
      </main>
    </div>
  );
};
