import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Plus,
  Edit,
  Trash2,
  UtensilsCrossed,
  X,
  CheckCircle2,
  Power
} from 'lucide-react';
import { sellerService } from '../../services/seller.service';
import type { Shop, Product } from '../../types';
import { formatCurrency } from '../../lib/format';

export const PartnerMenuPage: React.FC = () => {
  const { shop } = useOutletContext<{ shop: Shop | null }>();

  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [originalPrice, setOriginalPrice] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [stockQuantity, setStockQuantity] = useState('50');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchProducts = () => {
    if (!shop?.id) return;
    sellerService
      .getShopProducts(shop.id)
      .then(setProducts)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, [shop?.id]);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setTitle('');
    setDescription('');
    setPrice('');
    setOriginalPrice('');
    setImageUrl('');
    setStockQuantity('50');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setTitle(p.title);
    setDescription(p.description || '');
    setPrice(String(p.price));
    setOriginalPrice(p.original_price ? String(p.original_price) : '');
    setImageUrl(p.images && p.images.length > 0 ? p.images[0] : '');
    setStockQuantity(String(p.stock_quantity));
    setIsModalOpen(true);
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shop?.id || !title.trim() || !price) return;

    setIsSubmitting(true);
    try {
      const payload = {
        shop_id: shop.id,
        category_id: null,
        title: title.trim(),
        description: description.trim() || null,
        price: Number(price),
        original_price: originalPrice ? Number(originalPrice) : null,
        images: imageUrl.trim() ? [imageUrl.trim()] : [],
        stock_quantity: Number(stockQuantity) || 0,
        is_available: true,
        status: 'published' as const,
      };

      if (editingProduct) {
        await sellerService.updateProduct(editingProduct.id, payload);
      } else {
        await sellerService.createProduct(payload);
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err) {
      console.error('Failed to save dish:', err);
      alert('Failed to save dish');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleAvailable = async (product: Product) => {
    try {
      await sellerService.updateProduct(product.id, {
        is_available: !product.is_available,
      });
      fetchProducts();
    } catch (err) {
      console.error('Failed to toggle availability:', err);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to remove this dish from your menu?')) return;
    try {
      await sellerService.deleteProduct(id);
      fetchProducts();
    } catch (err) {
      console.error('Failed to delete dish:', err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Menu Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Add dishes, configure pricing, upload photography, and manage live stock.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs shadow-md transition"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Dish</span>
        </button>
      </div>

      {/* Dishes Grid */}
      {isLoading ? (
        <div className="py-20 text-center">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs text-slate-400 mt-3">Loading menu...</p>
        </div>
      ) : products.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-3">
          <UtensilsCrossed className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">No dishes on menu yet</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Start by creating your first food item with pricing and photos.
          </p>
          <button
            type="button"
            onClick={handleOpenAddModal}
            className="mt-2 px-5 py-2.5 rounded-full bg-blue-700 text-white font-bold text-xs"
          >
            Add Your First Dish
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((p) => {
            const img =
              p.images && p.images.length > 0
                ? p.images[0]
                : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';

            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4"
              >
                <div className="flex gap-4">
                  <img
                    src={img}
                    alt={p.title}
                    className="w-20 h-20 rounded-2xl object-cover bg-slate-100 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-bold text-slate-900 truncate">
                        {p.title}
                      </h4>
                    </div>
                    <p className="text-xs font-extrabold text-blue-700 mt-0.5">
                      {formatCurrency(p.price, shop?.currency_code)}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Stock: <strong className="text-slate-700">{p.stock_quantity} units</strong>
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  {/* Availability Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggleAvailable(p)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1 ${
                      p.is_available
                        ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        p.is_available ? 'bg-emerald-500' : 'bg-slate-400'
                      }`}
                    />
                    <span>{p.is_available ? 'In Stock' : 'Sold Out'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleOpenEditModal(p)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-blue-700 hover:bg-slate-50 transition"
                      title="Edit dish"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteProduct(p.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-slate-50 transition"
                      title="Delete dish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900">
                {editingProduct ? 'Edit Dish' : 'Add New Dish'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Dish Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Classic Margherita Pizza"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Fresh buffalo mozzarella, san marzano tomato sauce, basil..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Price ({shop?.currency_code || 'USD'})
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="14.99"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Original Price (Optional)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="18.99"
                    value={originalPrice}
                    onChange={(e) => setOriginalPrice(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Stock Quantity
                  </label>
                  <input
                    type="number"
                    required
                    value={stockQuantity}
                    onChange={(e) => setStockQuantity(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Photo URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 px-6 rounded-full font-bold text-sm text-white bg-blue-700 hover:bg-blue-800 disabled:bg-slate-300 shadow-md transition"
              >
                {isSubmitting ? 'Saving...' : editingProduct ? 'Update Dish' : 'Publish Dish'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
