import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatCurrency } from '../lib/format';

export const CartDrawer: React.FC = () => {
  const {
    items,
    shop,
    subtotal,
    itemCount,
    updateQuantity,
    removeItem,
    clearCart,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
  } = useCart();

  const navigate = useNavigate();

  if (!isCartDrawerOpen) return null;

  const handleCheckout = () => {
    setIsCartDrawerOpen(false);
    navigate('/checkout');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full max-w-md h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Your Cart</h3>
              <p className="text-xs text-slate-500">
                {itemCount} {itemCount === 1 ? 'item' : 'items'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                type="button"
                onClick={clearCart}
                className="text-xs text-red-500 hover:text-red-700 font-semibold px-2 py-1"
                title="Clear all items"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Restaurant Banner */}
        {shop && items.length > 0 && (
          <div className="px-6 py-3 bg-blue-50/60 border-b border-blue-100 flex items-center justify-between text-xs">
            <span className="text-slate-600">
              Ordering from <strong className="text-blue-900">{shop.name}</strong>
            </span>
            <span className="font-semibold text-blue-700">{shop.city}</span>
          </div>
        )}

        {/* Items List */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {items.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4 text-slate-300">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-700">Your cart is empty</h4>
              <p className="text-xs text-slate-500 mt-1 max-w-xs">
                Browse our selection of top restaurants and add your favorite dishes!
              </p>
            </div>
          ) : (
            items.map(({ product, quantity, notes }) => {
              const itemTotal = Number(product.price) * quantity;
              const img =
                product.images && product.images.length > 0
                  ? product.images[0]
                  : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=200&q=80';

              return (
                <div
                  key={product.id}
                  className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-100"
                >
                  <img
                    src={img}
                    alt={product.title}
                    className="w-16 h-16 rounded-xl object-cover shrink-0 bg-white"
                  />
                  <div className="flex-1 min-w-0">
                    <h5 className="text-sm font-bold text-slate-800 truncate">
                      {product.title}
                    </h5>
                    <p className="text-xs font-semibold text-blue-700 mt-0.5">
                      {formatCurrency(itemTotal, shop?.currency_code)}
                    </p>
                    {notes && (
                      <p className="text-[11px] text-slate-400 italic truncate mt-0.5">
                        "{notes}"
                      </p>
                    )}
                  </div>

                  {/* Quantity Stepper */}
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-full px-2 py-1 shadow-xs shrink-0">
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, quantity - 1)}
                      className="p-1 text-slate-500 hover:text-slate-800 transition"
                    >
                      {quantity === 1 ? (
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      ) : (
                        <Minus className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <span className="text-xs font-bold text-slate-800 min-w-3 text-center">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(product.id, quantity + 1)}
                      className="p-1 text-slate-500 hover:text-slate-800 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Drawer Footer / Checkout CTA */}
        {items.length > 0 && (
          <div className="p-6 border-t border-slate-100 bg-white space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Subtotal</span>
              <span className="text-base font-extrabold text-slate-900">
                {formatCurrency(subtotal, shop?.currency_code)}
              </span>
            </div>
            <p className="text-[11px] text-slate-400">
              Taxes and delivery fee calculated at checkout.
            </p>

            <button
              type="button"
              onClick={handleCheckout}
              className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-full font-bold text-sm text-white bg-blue-700 hover:bg-blue-800 shadow-md transition"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
