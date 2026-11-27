import React, { useEffect, useState } from 'react';
import { MapPin, Plus, Trash2, CheckCircle2, Home, Briefcase, X } from 'lucide-react';
import {
  getCustomerAddresses,
  createCustomerAddress,
  deleteCustomerAddress,
  updateCustomerAddress,
} from '../services/customer.service';
import type { CustomerAddress } from '../types';

export const SavedAddressesPage: React.FC = () => {
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form states
  const [label, setLabel] = useState('Home');
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('New York');
  const [recipientName, setRecipientName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchAddresses = () => {
    getCustomerAddresses()
      .then(setAddresses)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!streetAddress.trim() || !city.trim()) return;

    setIsSubmitting(true);
    try {
      await createCustomerAddress({
        label,
        recipient_name: recipientName || 'Customer',
        phone_number: phoneNumber || '000000000',
        street_address: streetAddress.trim(),
        city: city.trim(),
        delivery_instructions: instructions || null,
        is_default: isDefault || addresses.length === 0,
      });

      setIsModalOpen(false);
      setStreetAddress('');
      setInstructions('');
      fetchAddresses();
    } catch (err) {
      console.error('Failed to create address:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to remove this address?')) return;
    try {
      await deleteCustomerAddress(id);
      fetchAddresses();
    } catch (err) {
      console.error('Failed to delete address:', err);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await updateCustomerAddress(id, { is_default: true });
      fetchAddresses();
    } catch (err) {
      console.error('Failed to set default:', err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Saved Addresses
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your delivery dropoff points for fast 1-click checkout.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-5 py-2.5 rounded-full bg-blue-700 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add Address</span>
        </button>
      </div>

      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 mt-3">Loading addresses...</p>
        </div>
      ) : addresses.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-100 p-8 space-y-3">
          <MapPin className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No saved addresses</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Add your home or office address to make ordering faster.
          </p>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="mt-3 px-5 py-2.5 bg-blue-700 text-white rounded-full text-xs font-bold"
          >
            Add Address Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`p-6 rounded-3xl bg-white border transition relative flex flex-col justify-between ${
                addr.is_default
                  ? 'border-blue-500 shadow-md ring-2 ring-blue-50'
                  : 'border-slate-100 shadow-sm'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="p-2 rounded-xl bg-blue-50 text-blue-700">
                      {addr.label.toLowerCase() === 'work' ? (
                        <Briefcase className="w-4 h-4" />
                      ) : (
                        <Home className="w-4 h-4" />
                      )}
                    </span>
                    <h4 className="text-sm font-bold text-slate-900">{addr.label}</h4>
                  </div>

                  {addr.is_default && (
                    <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                      Default
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-700 font-medium leading-relaxed">
                  {addr.street_address}, {addr.city}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Recipient: {addr.recipient_name} ({addr.phone_number})
                </p>
                {addr.delivery_instructions && (
                  <p className="text-[11px] text-slate-500 italic mt-1 bg-slate-50 p-2 rounded-lg">
                    "{addr.delivery_instructions}"
                  </p>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100 mt-4 flex items-center justify-between text-xs">
                {!addr.is_default ? (
                  <button
                    type="button"
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-blue-700 font-semibold hover:underline"
                  >
                    Set as default
                  </button>
                ) : (
                  <span className="text-slate-400 font-medium">Default Address</span>
                )}

                <button
                  type="button"
                  onClick={() => handleDelete(addr.id)}
                  className="p-1.5 text-slate-400 hover:text-red-600 transition"
                  title="Delete address"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Address Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                Add New Delivery Address
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Address Label
                </label>
                <div className="flex gap-2">
                  {['Home', 'Work', 'Other'].map((l) => (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setLabel(l)}
                      className={`flex-1 py-1.5 rounded-xl text-xs font-bold border transition ${
                        label === l
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'bg-slate-50 text-slate-700 border-slate-200'
                      }`}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Street Address & Unit
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 742 Evergreen Terrace, Apt 1"
                  value={streetAddress}
                  onChange={(e) => setStreetAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    City
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="New York"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Recipient Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Full Name"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+1 555-0199"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Delivery Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Leave at front door, gate code #1234"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <label className="flex items-center gap-2 pt-1 text-xs text-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Set as default delivery address</span>
              </label>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 rounded-full font-bold text-sm text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 shadow-md transition"
              >
                {isSubmitting ? 'Saving...' : 'Save Address'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
