import React, { useState } from 'react';
import { X, Plus, Minus, ShoppingBag } from 'lucide-react';
import type { Product, Shop } from '../types';
import { formatCurrency } from '../lib/format';
import { useCart } from '../context/CartContext';

interface FoodDetailsModalProps {
  product: Product | null;
  shop: Shop | null;
  onClose: () => void;
}

export const FoodDetailsModal: React.FC<FoodDetailsModalProps> = ({
  product,
  shop,
  onClose,
}) => {
  const { addItem, confirmSwitchRestaurantAndAdd, setIsCartDrawerOpen } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [notes, setNotes] = useState('');

  if (!product || !shop) return null;

  const defaultImg =
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
  const imageUrl =
    product.images && product.images.length > 0 ? product.images[0] : defaultImg;

  const totalPrice = Number(product.price) * quantity;

  const handleAddToCart = () => {
    const res = addItem(product, shop, quantity, notes);
    if (!res.success && res.conflictShopName) {
      if (
        window.confirm(
          `Your cart contains items from "${res.conflictShopName}". Clear your cart and add this item from "${shop.name}"?`
        )
      ) {
        confirmSwitchRestaurantAndAdd(product, shop, quantity, notes);
        onClose();
        setIsCartDrawerOpen(true);
      }
      return;
    }
    onClose();
    setIsCartDrawerOpen(true);
  };

  const isOutOfStock = product.stock_quantity <= 0 || !product.is_available;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Top Image banner with close button */}
        <div className="relative aspect-[16/9] w-full bg-slate-100 shrink-0">
          <img
            src={imageUrl}
            alt={product.title}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultImg;
            }}
          />
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-slate-900/50 hover:bg-slate-900/70 text-white transition backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <h3 className="text-xl font-bold text-slate-900">
                {product.title}
              </h3>
              <span className="text-lg font-extrabold text-blue-700 shrink-0">
                {formatCurrency(product.price, shop.currency_code)}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">from {shop.name}</p>
          </div>

          <p className="text-sm text-slate-600 leading-relaxed">
            {product.description ||
              'Crafted to order with quality ingredients, authentic herbs and spices, and served fresh.'}
          </p>

          {/* Notes / Special Instructions */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1.5">
              Special Instructions
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Extra spicy, dressing on the side, no onions..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white text-sm text-slate-800 outline-none transition resize-none"
            />
          </div>
        </div>

        {/* Bottom Bar: Quantity & Add Button */}
        <div className="p-5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-4">
          
          {/* Quantity Controls */}
          <div className="flex items-center gap-3 bg-white border border-slate-200 rounded-full px-3 py-1.5 shadow-xs">
            <button
              type="button"
              disabled={quantity <= 1 || isOutOfStock}
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 transition"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="font-extrabold text-sm text-slate-800 min-w-4 text-center">
              {quantity}
            </span>
            <button
              type="button"
              disabled={isOutOfStock}
              onClick={() => setQuantity((q) => q + 1)}
              className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart CTA */}
          <button
            type="button"
            disabled={isOutOfStock}
            onClick={handleAddToCart}
            className="flex-1 flex items-center justify-center gap-2 py-3 px-5 rounded-full font-bold text-sm text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 shadow-md transition"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>
              {isOutOfStock
                ? 'Out of Stock'
                : `Add to Order • ${formatCurrency(totalPrice, shop.currency_code)}`}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
