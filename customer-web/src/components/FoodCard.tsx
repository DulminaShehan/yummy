import React from 'react';
import { Plus, Check } from 'lucide-react';
import type { Product, Shop } from '../types';
import { formatCurrency } from '../lib/format';
import { useCart } from '../context/CartContext';

interface FoodCardProps {
  product: Product;
  shop: Shop;
  onSelect: (product: Product) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({
  product,
  shop,
  onSelect,
}) => {
  const { items, addItem, confirmSwitchRestaurantAndAdd } = useCart();
  const defaultImg =
    'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';

  const imageUrl =
    product.images && product.images.length > 0 ? product.images[0] : defaultImg;

  const currentCartItem = items.find((i) => i.product.id === product.id);

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    const res = addItem(product, shop, 1);
    if (!res.success && res.conflictShopName) {
      if (
        window.confirm(
          `Your cart already contains dishes from "${res.conflictShopName}". Would you like to clear your cart and start a new order with "${shop.name}"?`
        )
      ) {
        confirmSwitchRestaurantAndAdd(product, shop, 1);
      }
    }
  };

  const isOutOfStock = product.stock_quantity <= 0 || !product.is_available;

  return (
    <div
      onClick={() => onSelect(product)}
      className="group bg-white rounded-2xl p-4 border border-slate-100 hover:border-blue-200 shadow-sm hover:shadow-md transition-all cursor-pointer flex gap-4 items-center justify-between"
    >
      {/* Details */}
      <div className="flex-1 pr-2">
        <h4 className="text-base font-bold text-slate-800 group-hover:text-blue-700 transition line-clamp-1">
          {product.title}
        </h4>
        <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
          {product.description || 'Authentic recipe crafted with premium ingredients.'}
        </p>

        <div className="mt-3 flex items-center gap-2">
          <span className="text-sm font-extrabold text-slate-900">
            {formatCurrency(product.price, shop.currency_code)}
          </span>
          {product.original_price && product.original_price > product.price && (
            <span className="text-xs text-slate-400 line-through">
              {formatCurrency(product.original_price, shop.currency_code)}
            </span>
          )}
        </div>
      </div>

      {/* Image & Quick Add Button */}
      <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden shrink-0 bg-slate-100">
        <img
          src={imageUrl}
          alt={product.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultImg;
          }}
        />

        {isOutOfStock ? (
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-1">
            <span className="text-[10px] uppercase font-bold text-white text-center">
              Sold Out
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleQuickAdd}
            className={`absolute bottom-2 right-2 p-2 rounded-xl shadow-md transition transform active:scale-90 flex items-center justify-center ${
              currentCartItem
                ? 'bg-emerald-600 text-white'
                : 'bg-white hover:bg-blue-600 text-slate-800 hover:text-white'
            }`}
            title="Add to cart"
          >
            {currentCartItem ? (
              <span className="text-xs font-bold px-0.5">{currentCartItem.quantity}</span>
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        )}
      </div>
    </div>
  );
};
