import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  MapPin,
  Clock,
  ShieldCheck,
  CreditCard,
  Banknote,
  ArrowRight,
  Plus,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { quoteOrder, placeOrder } from '../services/orders.service';
import { getCustomerAddresses, createCustomerAddress } from '../services/customer.service';
import type { CustomerAddress, QuoteResult } from '../types';
import { formatCurrency } from '../lib/format';

export const CheckoutPage: React.FC = () => {
  const { user, profile } = useAuth();
  const { items, shop, shopId, clearCart } = useCart();
  const navigate = useNavigate();

  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [isAddingNewAddress, setIsAddingNewAddress] = useState(false);
  const [newStreet, setNewStreet] = useState('');
  const [newCity, setNewCity] = useState(shop?.city || 'New York');
  const [newRecipient, setNewRecipient] = useState(profile?.full_name || '');
  const [newPhone, setNewPhone] = useState(profile?.phone_number || '');
  const [orderNotes, setOrderNotes] = useState('');

  const [quote, setQuote] = useState<QuoteResult | null>(null);
  const [isQuoting, setIsQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (items.length === 0) {
      navigate('/cart');
      return;
    }

    if (user) {
      getCustomerAddresses().then((list) => {
        setAddresses(list);
        const def = list.find((a) => a.is_default) || list[0];
        if (def) {
          setSelectedAddressId(def.id);
        } else {
          setIsAddingNewAddress(true);
        }
      });
    } else {
      setIsAddingNewAddress(true);
    }
  }, [user, items.length, navigate]);

  // Request trusted server-side quote whenever items or shop change
  useEffect(() => {
    if (!shopId || items.length === 0) return;

    setIsQuoting(true);
    setQuoteError(null);

    const payloadItems = items.map((i) => ({
      product_id: i.product.id,
      quantity: i.quantity,
    }));

    quoteOrder(shopId, payloadItems)
      .then(setQuote)
      .catch((err) => {
        console.error('Quote error:', err);
        setQuoteError(err.message || 'Unable to quote order');
      })
      .finally(() => setIsQuoting(false));
  }, [shopId, items]);

  const handleCreateInlineAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStreet.trim() || !newCity.trim()) return;

    try {
      if (user) {
        const created = await createCustomerAddress({
          label: 'Delivery Address',
          recipient_name: newRecipient || 'Customer',
          phone_number: newPhone || '000000000',
          street_address: newStreet.trim(),
          city: newCity.trim(),
          is_default: addresses.length === 0,
        });

        if (created) {
          setAddresses((prev) => [created, ...prev]);
          setSelectedAddressId(created.id);
          setIsAddingNewAddress(false);
        }
      }
    } catch (err) {
      console.error('Failed to create address:', err);
    }
  };

  const handlePlaceOrder = async () => {
    if (!user) {
      navigate(`/login?redirect=${encodeURIComponent('/checkout')}`);
      return;
    }
    if (!shopId || items.length === 0) return;

    setIsSubmitting(true);
    try {
      const payloadItems = items.map((i) => ({
        product_id: i.product.id,
        quantity: i.quantity,
      }));

      let res;
      if (selectedAddressId) {
        res = await placeOrder({
          shopId,
          items: payloadItems,
          addressId: selectedAddressId,
          paymentMethod: 'cod',
          notes: orderNotes,
        });
      } else {
        res = await placeOrder({
          shopId,
          items: payloadItems,
          address: {
            street_address: newStreet.trim(),
            city: newCity.trim(),
            recipient_name: newRecipient || profile?.full_name || 'Customer',
            phone_number: newPhone || profile?.phone_number || '',
          },
          paymentMethod: 'cod',
          notes: orderNotes,
        });
      }

      clearCart();
      navigate(`/order-confirmation/${res.order_id}`);
    } catch (err: any) {
      console.error('Failed to place order:', err);
      alert(`Order placement failed: ${err.message || 'Please check your information'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Checkout
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review your delivery details, trusted server quote, and confirm your order.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Delivery Address & Payment */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* 1. Delivery Address Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-600" />
                <span>Delivery Address</span>
              </h3>
              {user && !isAddingNewAddress && (
                <button
                  type="button"
                  onClick={() => setIsAddingNewAddress(true)}
                  className="text-xs font-semibold text-blue-700 hover:text-blue-800 flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Address</span>
                </button>
              )}
            </div>

            {/* Address List or New Address Form */}
            {isAddingNewAddress ? (
              <form onSubmit={handleCreateInlineAddress} className="space-y-3 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-500 mb-1">
                    Street Address & House/Apartment No.
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="123 Ocean View Ave, Apt 4B"
                    value={newStreet}
                    onChange={(e) => setNewStreet(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      City
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="City"
                      value={newCity}
                      onChange={(e) => setNewCity(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 mb-1">
                      Contact Phone
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="+1 555-0199"
                      value={newPhone}
                      onChange={(e) => setNewPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
                    />
                  </div>
                </div>

                {user && addresses.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setIsAddingNewAddress(false)}
                    className="text-xs text-slate-500 hover:underline pt-1 inline-block"
                  >
                    Cancel and use saved address
                  </button>
                )}
              </form>
            ) : (
              <div className="space-y-2 pt-2">
                {addresses.map((addr) => {
                  const isSelected = selectedAddressId === addr.id;
                  return (
                    <label
                      key={addr.id}
                      className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition ${
                        isSelected
                          ? 'bg-blue-50/50 border-blue-500'
                          : 'bg-white border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="address_choice"
                        checked={isSelected}
                        onChange={() => setSelectedAddressId(addr.id)}
                        className="mt-1 text-blue-600 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-800">
                            {addr.label}
                          </span>
                          {addr.is_default && (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-sm">
                              Default
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          {addr.street_address}, {addr.city}
                        </p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {addr.recipient_name} • {addr.phone_number}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          {/* 2. Payment Method Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Banknote className="w-5 h-5 text-emerald-600" />
              <span>Payment Method</span>
            </h3>

            <div className="p-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50/40 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                  COD
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Cash on Delivery
                  </h4>
                  <p className="text-xs text-slate-500">
                    Pay securely in cash directly to your rider upon arrival
                  </p>
                </div>
              </div>
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
            </div>
          </div>

          {/* 3. Delivery Notes */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500">
              Delivery Instructions for Rider
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Ring the bell twice, leave at apartment door, gate code #4490"
              value={orderNotes}
              onChange={(e) => setOrderNotes(e.target.value)}
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-sm text-slate-800 outline-none transition resize-none"
            />
          </div>
        </div>

        {/* Right Column: Server Quote & Confirmation */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-6 border border-slate-100 shadow-xl space-y-6 sticky top-28">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Order Summary</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Verified by YUMMY server-side pricing
            </p>
          </div>

          {/* Items Preview */}
          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {items.map(({ product, quantity }) => (
              <div
                key={product.id}
                className="flex items-center justify-between text-xs"
              >
                <span className="text-slate-700">
                  <strong className="text-slate-900 font-semibold">{quantity}x</strong>{' '}
                  {product.title}
                </span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(Number(product.price) * quantity, shop?.currency_code)}
                </span>
              </div>
            ))}
          </div>

          {/* Price Breakdown */}
          <div className="border-t border-slate-100 pt-4 space-y-2.5 text-xs text-slate-600">
            <div className="flex justify-between">
              <span>Items Subtotal</span>
              <span className="font-bold text-slate-900">
                {formatCurrency(quote?.subtotal, quote?.currency_code || shop?.currency_code)}
              </span>
            </div>

            <div className="flex justify-between">
              <span>Delivery Fee</span>
              <span className="font-bold text-slate-900">
                {quote ? formatCurrency(quote.delivery_fee, quote.currency_code) : 'Calculating...'}
              </span>
            </div>

            {quote && quote.tax_amount > 0 && (
              <div className="flex justify-between">
                <span>Tax ({quote.tax_rate}%)</span>
                <span className="font-bold text-slate-900">
                  {formatCurrency(quote.tax_amount, quote.currency_code)}
                </span>
              </div>
            )}

            <div className="border-t border-slate-200 pt-3 flex justify-between text-base font-extrabold text-slate-900">
              <span>Total Amount</span>
              <span className="text-blue-700">
                {formatCurrency(quote?.total_amount, quote?.currency_code || shop?.currency_code)}
              </span>
            </div>
          </div>

          {quoteError && (
            <div className="p-3 rounded-xl bg-red-50 text-red-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{quoteError}</span>
            </div>
          )}

          {/* Place Order CTA */}
          <button
            type="button"
            disabled={isQuoting || isSubmitting || !!quoteError}
            onClick={handlePlaceOrder}
            className="w-full py-4 px-6 rounded-full font-bold text-sm text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 shadow-lg transition flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <span>Place Order with Cash</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>

          <p className="text-[11px] text-slate-400 text-center leading-relaxed">
            By confirming your order, you agree to YUMMY's Terms of Service and live order dispatch rules.
          </p>
        </div>

      </div>
    </div>
  );
};
