import React, { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Store, MapPin, Phone, Clock, Save, Check } from 'lucide-react';
import { sellerService } from '../../services/seller.service';
import type { Shop } from '../../types';

export const PartnerProfilePage: React.FC = () => {
  const { shop, onRefreshShop } = useOutletContext<{
    shop: Shop | null;
    onRefreshShop: () => void;
  }>();

  const [name, setName] = useState(shop?.name || '');
  const [description, setDescription] = useState(shop?.description || '');
  const [address, setAddress] = useState(shop?.address || '');
  const [city, setCity] = useState(shop?.city || '');
  const [contactPhone, setContactPhone] = useState(shop?.contact_phone || '');
  const [bannerUrl, setBannerUrl] = useState(shop?.banner_url || '');
  const [logoUrl, setLogoUrl] = useState(shop?.logo_url || '');

  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop?.id) return;

    setIsSaving(true);
    setMessage(null);
    try {
      await sellerService.updateShop(shop.id, {
        name: name.trim(),
        description: description.trim() || null,
        address: address.trim() || null,
        city: city.trim() || null,
        contact_phone: contactPhone.trim() || null,
        banner_url: bannerUrl.trim() || null,
        logo_url: logoUrl.trim() || null,
      });

      onRefreshShop();
      setMessage('Restaurant profile updated successfully!');
    } catch (err) {
      console.error('Failed to update shop profile:', err);
      alert('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  if (!shop) return null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Restaurant Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Configure your restaurant storefront, addresses, contact details and cover branding.
        </p>
      </div>

      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        {message && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 text-emerald-800 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Restaurant Name
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Description / Cuisine Bio
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500 resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                City / Region
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Contact Phone
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Physical Street Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Logo URL
              </label>
              <input
                type="url"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cover Banner URL
              </label>
              <input
                type="url"
                value={bannerUrl}
                onChange={(e) => setBannerUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3.5 px-6 rounded-full font-bold text-sm text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 shadow-md transition flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Restaurant Settings'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
