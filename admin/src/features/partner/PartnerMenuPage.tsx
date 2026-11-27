import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  UtensilsCrossed,
  Plus,
  Search,
  Edit2,
  Trash2,
  Check,
  X,
  Upload,
} from 'lucide-react'
import { Shop, Product, Category } from '../../types'
import { sellerService } from '../../services/seller.service'
import { categoriesService } from '../../services/categories.service'
import { formatCurrency } from '../../utils/formatters'
import { Button } from '../../components/ui/Button'
import { Modal } from '../../components/ui/Modal'
import { useToast } from '../../context/ToastContext'

interface PartnerContextType {
  shop: Shop | null
}

export const PartnerMenuPage: React.FC = () => {
  const { shop } = useOutletContext<PartnerContextType>()
  const { success, error } = useToast()

  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  // Filters
  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Product | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('')
  const [originalPrice, setOriginalPrice] = useState('')
  const [stockQuantity, setStockQuantity] = useState('50')
  const [categoryId, setCategoryId] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [isAvailable, setIsAvailable] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  // Delete State
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const loadMenuData = async () => {
    if (!shop?.id) return
    setLoading(true)
    try {
      const [prods, cats] = await Promise.all([
        sellerService.getShopProducts(shop.id, search, selectedCategory),
        categoriesService.getCategories(),
      ])
      setProducts(prods)
      setCategories(cats)
    } catch (err) {
      console.error('Failed to load menu:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadMenuData()
  }, [shop?.id, search, selectedCategory])

  const openAddModal = () => {
    setEditingProduct(null)
    setTitle('')
    setDescription('')
    setPrice('')
    setOriginalPrice('')
    setStockQuantity('50')
    setCategoryId(categories.length > 0 ? categories[0].id : '')
    setImageUrl('https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80')
    setIsAvailable(true)
    setIsModalOpen(true)
  }

  const openEditModal = (p: Product) => {
    setEditingProduct(p)
    setTitle(p.title)
    setDescription(p.description || '')
    setPrice(p.price.toString())
    setOriginalPrice(p.original_price ? p.original_price.toString() : '')
    setStockQuantity(p.stock_quantity.toString())
    setCategoryId(p.category_id || (categories.length > 0 ? categories[0].id : ''))
    setImageUrl(p.images && p.images.length > 0 ? p.images[0] : '')
    setIsAvailable(p.status === 'published')
    setIsModalOpen(true)
  }

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !shop?.id) return
    const file = e.target.files[0]
    setUploadingImage(true)
    try {
      const uploadedUrl = await sellerService.uploadFoodImage(file, shop.id)
      setImageUrl(uploadedUrl)
      success('Image uploaded successfully!')
    } catch (err) {
      error('Failed to upload image. You can also paste an image URL directly.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shop?.id) return
    if (!title.trim() || !price) {
      error('Please enter product title and price')
      return
    }

    setIsSaving(true)
    try {
      const numPrice = parseFloat(price)
      const numOriginalPrice = originalPrice ? parseFloat(originalPrice) : null
      const numStock = parseInt(stockQuantity, 10) || 0
      const status = isAvailable ? 'published' : 'draft'

      if (editingProduct) {
        await sellerService.updateProduct(editingProduct.id, {
          title,
          description,
          price: numPrice,
          original_price: numOriginalPrice,
          stock_quantity: numStock,
          category_id: categoryId || null,
          images: imageUrl ? [imageUrl] : editingProduct.images,
          status,
        })
        success(`"${title}" updated successfully!`)
      } else {
        await sellerService.createProduct({
          shop_id: shop.id,
          title,
          description,
          price: numPrice,
          original_price: numOriginalPrice,
          stock_quantity: numStock,
          category_id: categoryId || null,
          images: imageUrl ? [imageUrl] : [],
          status,
        })
        success(`"${title}" added to menu!`)
      }

      setIsModalOpen(false)
      loadMenuData()
    } catch (err) {
      error('Failed to save menu item')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleAvailability = async (product: Product) => {
    const nextStatus = product.status === 'published' ? 'draft' : 'published'
    try {
      await sellerService.updateProduct(product.id, { status: nextStatus })
      success(`Updated "${product.title}" availability`)
      loadMenuData()
    } catch (err) {
      error('Failed to update availability')
    }
  }

  const handleDeleteProduct = async () => {
    if (!deletingProduct) return
    setIsDeleting(true)
    try {
      await sellerService.deleteProduct(deletingProduct.id)
      success(`Removed "${deletingProduct.title}" from menu`)
      setDeletingProduct(null)
      loadMenuData()
    } catch (err) {
      error('Failed to delete item')
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 0.25rem', color: 'var(--text-main)' }}>
            Food Menu Management
          </h1>
          <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
            Manage dishes, pricing, inventory stock, and availability
          </p>
        </div>
        <Button variant="primary" onClick={openAddModal}>
          <Plus size={18} />
          <span>Add New Menu Item</span>
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <div
        style={{
          display: 'flex',
          gap: '1rem',
          alignItems: 'center',
          backgroundColor: 'var(--bg-surface)',
          padding: '1rem',
          borderRadius: 12,
          border: '1px solid var(--border-color)',
          flexWrap: 'wrap',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search size={18} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            value={search}
            disabled={loading}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu items..."
            style={{
              width: '100%',
              padding: '0.65rem 1rem 0.65rem 2.4rem',
              borderRadius: 8,
              border: '1px solid var(--border-color)',
              fontSize: '0.9rem',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          style={{
            padding: '0.65rem 1rem',
            borderRadius: 8,
            border: '1px solid var(--border-color)',
            fontSize: '0.9rem',
            backgroundColor: 'var(--bg-surface)',
            color: 'var(--text-main)',
            outline: 'none',
          }}
        >
          <option value="all">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Products Table / Cards Grid */}
      {products.length === 0 ? (
        <div
          style={{
            padding: '4rem 2rem',
            textAlign: 'center',
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 14,
            border: '1px solid var(--border-color)',
          }}
        >
          <UtensilsCrossed size={48} style={{ opacity: 0.25, marginBottom: '1rem', color: 'var(--text-muted)' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: '0 0 0.25rem', color: 'var(--text-main)' }}>
            No food items found
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Click "Add New Menu Item" above to publish your first dish.
          </p>
          <Button variant="primary" onClick={openAddModal}>
            <Plus size={18} />
            <span>Add Menu Item</span>
          </Button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))',
            gap: '1.25rem',
          }}
        >
          {products.map((item) => {
            const hasPromo = item.original_price && item.original_price > item.price
            const discountPct = hasPromo
              ? Math.round(((item.original_price! - item.price) / item.original_price!) * 100)
              : 0
            const isItemAvailable = item.status === 'published'

            return (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 14,
                  border: '1px solid var(--border-color)',
                  boxShadow: 'var(--shadow-sm)',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Photo & Badge */}
                <div style={{ position: 'relative', height: 160, backgroundColor: '#f1f5f9' }}>
                  <img
                    src={item.images && item.images.length > 0 ? item.images[0] : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80'}
                    alt={item.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  {hasPromo && (
                    <span
                      style={{
                        position: 'absolute',
                        top: 10,
                        left: 10,
                        backgroundColor: '#ef4444',
                        color: '#ffffff',
                        fontSize: '0.75rem',
                        fontWeight: 800,
                        padding: '0.2rem 0.5rem',
                        borderRadius: 6,
                      }}
                    >
                      {discountPct}% OFF
                    </span>
                  )}
                  <span
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      backgroundColor: isItemAvailable ? '#10b981' : '#64748b',
                      color: '#ffffff',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '0.2rem 0.6rem',
                      borderRadius: 12,
                    }}
                  >
                    {isItemAvailable ? 'Available' : 'Out of Stock'}
                  </span>
                </div>

                {/* Details */}
                <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ fontSize: '1.05rem', fontWeight: 800, margin: '0 0 0.35rem', color: 'var(--text-main)' }}>
                    {item.title}
                  </h3>
                  <p
                    style={{
                      fontSize: '0.825rem',
                      color: 'var(--text-muted)',
                      margin: '0 0 1rem',
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}
                  >
                    {item.description || 'Delicious freshly prepared dish.'}
                  </p>

                  <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                        <span style={{ fontSize: '1.25rem', fontWeight: 800, color: '#1565C0' }}>
                          {formatCurrency(item.price)}
                        </span>
                        {hasPromo && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                            {formatCurrency(item.original_price)}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                        Stock: {item.stock_quantity} units
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem' }}>
                      <button
                        onClick={() => handleToggleAvailability(item)}
                        title={isItemAvailable ? 'Mark as Out of Stock' : 'Mark as In Stock'}
                        style={{
                          padding: '6px',
                          borderRadius: 6,
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-surface)',
                          cursor: 'pointer',
                        }}
                      >
                        {isItemAvailable ? <Check size={16} color="#10b981" /> : <X size={16} color="#ef4444" />}
                      </button>
                      <button
                        onClick={() => openEditModal(item)}
                        title="Edit Dish"
                        style={{
                          padding: '6px',
                          borderRadius: 6,
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-surface)',
                          cursor: 'pointer',
                          color: '#2563eb',
                        }}
                      >
                        <Edit2 size={16} />
                      </button>
                      <button
                        onClick={() => setDeletingProduct(item)}
                        title="Delete Dish"
                        style={{
                          padding: '6px',
                          borderRadius: 6,
                          border: '1px solid var(--border-color)',
                          backgroundColor: 'var(--bg-surface)',
                          cursor: 'pointer',
                          color: '#ef4444',
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Dish Modal */}
      {isModalOpen && (
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={editingProduct ? 'Edit Food Menu Item' : 'Add New Food Menu Item'}
        >
          <form onSubmit={handleSaveProduct} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Item Name / Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Classic Burger & Fries"
                required
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Selling Price ($) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="8.50"
                  required
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Original / Strikethrough Price ($)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={originalPrice}
                  onChange={(e) => setOriginalPrice(e.target.value)}
                  placeholder="10.00"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    boxSizing: 'border-box',
                  }}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                  Stock Quantity
                </label>
                <input
                  type="number"
                  min="0"
                  value={stockQuantity}
                  onChange={(e) => setStockQuantity(e.target.value)}
                  placeholder="50"
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ingredients, preparation details, allergens..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 8,
                  border: '1px solid var(--border-color)',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Food Image Upload & Preview */}
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Food Image
              </label>
              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  style={{
                    flex: 1,
                    padding: '0.65rem 0.85rem',
                    borderRadius: 8,
                    border: '1px solid var(--border-color)',
                    boxSizing: 'border-box',
                  }}
                />
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 8,
                    backgroundColor: '#eff6ff',
                    color: '#1565C0',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    cursor: uploadingImage ? 'not-allowed' : 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <Upload size={16} />
                  <span>{uploadingImage ? 'Uploading...' : 'Upload'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    disabled={uploadingImage}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {imageUrl && (
                <div style={{ width: '100%', height: 120, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                  <img src={imageUrl} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>

            {/* Availability Checkbox */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginTop: '0.5rem' }}>
              <input
                type="checkbox"
                id="isAvailableCheckbox"
                checked={isAvailable}
                onChange={(e) => setIsAvailable(e.target.checked)}
                style={{ width: 18, height: 18 }}
              />
              <label htmlFor="isAvailableCheckbox" style={{ fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                Available for ordering immediately (In Stock)
              </label>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
              <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" disabled={isSaving || uploadingImage}>
                {isSaving ? 'Saving...' : editingProduct ? 'Update Dish' : 'Publish Dish'}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <Modal
          isOpen={Boolean(deletingProduct)}
          onClose={() => setDeletingProduct(null)}
          title="Delete Menu Item"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              Are you sure you want to permanently remove <strong>"{deletingProduct.title}"</strong> from your menu? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <Button variant="secondary" onClick={() => setDeletingProduct(null)}>
                Cancel
              </Button>
              <Button variant="danger" disabled={isDeleting} onClick={handleDeleteProduct}>
                {isDeleting ? 'Deleting...' : 'Confirm Delete'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
