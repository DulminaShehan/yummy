import React from 'react';
import { Link } from 'react-router-dom';
import { Store, ShieldCheck, Heart, Globe, ArrowUpRight } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          
          {/* Brand Col */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <img
                src="/yummy_logo.png"
                alt="YUMMY"
                className="h-10 w-auto object-contain brightness-0 invert"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="text-2xl font-extrabold tracking-tight text-white">
                YUMMY
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed">
              Food. Delivered. A global food ordering and local delivery platform connecting customers with authentic local kitchens, premium dining, and fast live delivery.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-400 pt-2">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>International Platform • Multi-Currency • Live Rider Tracking</span>
            </div>
          </div>

          {/* Col 1: Explore */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Explore
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/restaurants" className="hover:text-white transition">
                  All Restaurants
                </Link>
              </li>
              <li>
                <Link to="/search" className="hover:text-white transition">
                  Search Food & Dishes
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white transition">
                  Track Active Order
                </Link>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-white transition">
                  How YUMMY Works
                </a>
              </li>
            </ul>
          </div>

          {/* Col 2: Restaurant Partners */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Restaurant Partners
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link
                  to="/partner/apply"
                  className="inline-flex items-center gap-1.5 text-orange-400 hover:text-orange-300 font-semibold transition"
                >
                  <Store className="w-3.5 h-3.5" />
                  <span>Become a Partner</span>
                </Link>
              </li>
              <li>
                <Link to="/partner/status" className="hover:text-white transition">
                  Check Application Status
                </Link>
              </li>
              <li>
                <Link
                  to="/partner/login"
                  className="inline-flex items-center gap-1 hover:text-white transition"
                >
                  <span>Partner Portal Login</span>
                  <ArrowUpRight className="w-3 h-3 text-slate-500" />
                </Link>
              </li>
              {(import.meta.env.VITE_ADMIN_URL || import.meta.env.DEV) && (
                <li>
                  <a
                    href={import.meta.env.VITE_ADMIN_URL || 'http://localhost:5173/login'}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-slate-500 hover:text-slate-400 transition"
                  >
                    <span>Admin Panel</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Col 3: Customer Care */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">
              Account & Help
            </h4>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link to="/profile" className="hover:text-white transition">
                  My Profile
                </Link>
              </li>
              <li>
                <Link to="/addresses" className="hover:text-white transition">
                  Saved Addresses
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white transition">
                  Order History
                </Link>
              </li>
              <li>
                <Link to="/login" className="hover:text-white transition">
                  Sign In / Register
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} YUMMY Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Security & RLS Certified</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
