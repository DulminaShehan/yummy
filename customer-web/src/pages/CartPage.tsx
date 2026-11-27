import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Trash2, Plus, Minus, ArrowLeft } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../lib/format';

export const CartPage: React.FC = () => {
  const {
    items,
    shop,
    subtotal,
    itemCount,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-extrabold text-slate-800">Your cart is empty</h2>
        <p className="text-xs text-slate-500 mt-2 max-w-sm mx-auto">
          Explore our wide range of top restaurants and add delicious dishes to your order!
        </p>
        <Link
          to="/restaurants"
          className="mt-6 inline-flex items-center gap-2 px-6 py-3 rounded-full bg-blue-700 text-white text-xs font-bold shadow-md hover:bg-blue-800 transition"
        >
          <span>Browse Restaurants</span>
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
            Shopping Cart
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Ordering from <strong className="text-blue-700">{shop?.name}</strong> • {itemCount} {itemCount === 1 ? 'dish' : 'dishes'}
          </p>
        </div>

        <button
          type="button"
          onClick={clearCart}
          className="text-xs font-semibold text-red-500 hover:text-red-700 p-2"
        >
          Clear Cart
        </button>
      </div>

      {/* Cart Items List */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        {items.map(({ product, quantity, notes }) => {
          const itemTotal = Number(product.price) * quantity;
          const img =
            product.images && product.images.length > 0
              ? product.images[0]
              : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80';

          return (
            <div
              key={product.id}
              className="flex items-center justify-between gap-4 py-4 border-b border-slate-100 last:border-b-0"
            >
              <div className="flex items-center gap-4">
                <img
                  src={img}
                  alt={product.title}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-slate-100 shrink-0"
                />
                <div>
                  <h4 className="text-base font-bold text-slate-800">
                    {product.title}
                  </h4>
                  <p className="text-xs font-semibold text-blue-700 mt-0.5">
                    {formatCurrency(product.price, shop?.currency_code)} each
                  </p>
                  {notes && (
                    <p className="text-xs text-slate-400 italic mt-1">
                      Note: "{notes}"
                    </p>
                  )}
                </div>
              </div>

              {/* Quantity Controls & Total */}
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-full px-2.5 py-1">
                  <button
                    type="button"
                    onClick={() => updateQuantity(product.id, quantity - 1)}
                    className="p-1 text-slate-500 hover:text-slate-800"
                  >
                    {quantity === 1 ? (
                      <Trash2 className="w-3.5 h-3.5 text-red-500" />
                    ) : (
                      <Minus className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <span className="text-xs font-bold text-slate-800 min-w-4 text-center">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => updateQuantity(product.id, quantity + 1)}
                    className="p-1 text-slate-500 hover:text-slate-800"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>

                <span className="text-base font-extrabold text-slate-900 min-w-20 text-right">
                  {formatCurrency(itemTotal, shop?.currency_code)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900">Order Summary</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-bold text-slate-900">
              {formatCurrency(subtotal, shop?.currency_code)}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Delivery fee and applicable taxes will be calculated on the next checkout step.
          </p>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <Link
            to={`/restaurant/${shop?.id}`}
            className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Add more items</span>
          </Link>

          <button
            type="button"
            onClick={() => navigate('/checkout')}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-blue-700 hover:bg-blue-800 text-white font-bold text-sm shadow-md transition flex items-center justify-center gap-2"
          >
            <span>Proceed to Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
