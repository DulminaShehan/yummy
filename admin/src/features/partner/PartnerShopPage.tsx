import React, { useEffect, useState } from 'react'
import { useOutletContext } from 'react-router-dom'
import {
  Store,
  Save,
  Upload,
} from 'lucide-react'
import { Shop } from '../../types'
import { sellerService } from '../../services/seller.service'
import { Button } from '../../components/ui/Button'
import { useToast } from '../../context/ToastContext'

interface PartnerContextType {
  shop: Shop | null
  onRefreshShop: () => void
}

export const PartnerShopPage: React.FC = () => {
  const { shop, onRefreshShop } = useOutletContext<PartnerContextType>()
  const { success, error } = useToast()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [district, setDistrict] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [bannerUrl, setBannerUrl] = useState('')

  // Operating Hours State
  const [openingTime, setOpeningTime] = useState('09:00')
  const [closingTime, setClosingTime] = useState('22:00')
  const [operatingDays, setOperatingDays] = useState('Monday - Sunday (Daily)')
  const [deliveryRadiusKm, setDeliveryRadiusKm] = useState('10')

  const [isSaving, setIsSaving] = useState(false)
  const [uploadingLogo, setUploadingLogo] = useState(false)
  const [uploadingBanner, setUploadingBanner] = useState(false)

  useEffect(() => {
    if (shop) {
      setName(shop.name || '')
      setDescription(shop.description || '')
      setAddress(shop.address || '')
      setCity(shop.city || '')
      setDistrict(shop.district || '')
      setContactPhone(shop.contact_phone || '')
      setLogoUrl(shop.logo_url || '')
      setBannerUrl(shop.banner_url || '')
    }
  }, [shop])

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !shop?.id) return
    const file = e.target.files[0]
    setUploadingLogo(true)
    try {
      const url = await sellerService.uploadFoodImage(file, shop.id)
      setLogoUrl(url)
      success('Logo uploaded!')
    } catch (err) {
      error('Failed to upload logo image')
    } finally {
      setUploadingLogo(false)
    }
  }

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !shop?.id) return
    const file = e.target.files[0]
    setUploadingBanner(true)
    try {
      const url = await sellerService.uploadFoodImage(file, shop.id)
      setBannerUrl(url)
      success('Banner uploaded!')
    } catch (err) {
      error('Failed to upload banner image')
    } finally {
      setUploadingBanner(false)
    }
  }

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!shop?.id) return
    if (!name.trim()) {
      error('Restaurant name is required')
      return
    }

    setIsSaving(true)
    try {
      await sellerService.updateShop(shop.id, {
        name,
        description,
        address,
        city,
        district,
        contact_phone: contactPhone,
        logo_url: logoUrl || null,
        banner_url: bannerUrl || null,
      })
      success('Restaurant profile updated successfully!')
      onRefreshShop()
    } catch (err) {
      error('Failed to update restaurant profile')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      <div>
        <h1 style={{ fontSize: '1.6rem', fontWeight: 800, margin: '0 0 0.25rem', color: 'var(--text-main)' }}>
          Restaurant Profile & Operating Hours
        </h1>
        <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-muted)' }}>
          Manage your storefront details, delivery range, operating schedule, and brand assets
        </p>
      </div>

      <form onSubmit={handleSaveProfile} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Banner and Logo Preview Section */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 14,
            border: '1px solid var(--border-color)',
            overflow: 'hidden',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              height: 180,
              backgroundColor: '#e2e8f0',
              position: 'relative',
              backgroundImage: bannerUrl ? `url(${bannerUrl})` : undefined,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <label
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                backgroundColor: 'rgba(15, 23, 42, 0.75)',
                color: '#ffffff',
                padding: '0.45rem 0.85rem',
                borderRadius: 8,
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: uploadingBanner ? 'not-allowed' : 'pointer',
                backdropFilter: 'blur(4px)',
              }}
            >
              <Upload size={14} />
              <span>{uploadingBanner ? 'Uploading...' : 'Change Cover Banner'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadBanner}
                disabled={uploadingBanner}
                style={{ display: 'none' }}
              />
            </label>

            {/* Logo Avatar Overlap */}
            <div
              style={{
                position: 'absolute',
                bottom: -32,
                left: 24,
                width: 80,
                height: 80,
                borderRadius: 16,
                backgroundColor: '#ffffff',
                border: '4px solid #ffffff',
                boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                overflow: 'hidden',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {logoUrl ? (
                <img src={logoUrl} alt="Restaurant Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Store size={36} color="#1565C0" />
              )}
            </div>
          </div>

          <div style={{ padding: '3rem 1.5rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: '0 0 0.2rem', color: 'var(--text-main)' }}>
                {name || 'Restaurant Name'}
              </h2>
              <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                {city ? `${city}, ${district || ''}` : 'Location not configured'}
              </p>
            </div>

            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.9rem',
                borderRadius: 8,
                backgroundColor: '#eff6ff',
                color: '#1565C0',
                fontSize: '0.85rem',
                fontWeight: 600,
                cursor: uploadingLogo ? 'not-allowed' : 'pointer',
              }}
            >
              <Upload size={14} />
              <span>{uploadingLogo ? 'Uploading...' : 'Update Logo'}</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleUploadLogo}
                disabled={uploadingLogo}
                style={{ display: 'none' }}
              />
            </label>
          </div>
        </div>

        {/* General Store Details */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 14,
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            General Restaurant Information
          </h3>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
              Restaurant Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
              Restaurant Description & Cuisine Story
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Tell customers about your kitchen, specialties, dietary options..."
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 8,
                border: '1px solid var(--border-color)',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Street Address
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="123 Culinary Boulevard"
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
                City
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="San Francisco"
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
                State / District / Province
              </label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="CA"
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
                Contact Phone
              </label>
              <input
                type="text"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+1 (415) 555-0199"
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
        </div>

        {/* Operating Hours & Delivery Radius */}
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderRadius: 14,
            padding: '1.5rem',
            border: '1px solid var(--border-color)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          <h3 style={{ fontSize: '1.05rem', fontWeight: 700, margin: 0, color: 'var(--text-main)' }}>
            Operating Hours & Delivery Coverage
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.35rem' }}>
                Opening Time
              </label>
              <input
                type="time"
                value={openingTime}
                onChange={(e) => setOpeningTime(e.target.value)}
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
                Closing Time
              </label>
              <input
                type="time"
                value={closingTime}
                onChange={(e) => setClosingTime(e.target.value)}
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
                Days of Operation
              </label>
              <input
                type="text"
                value={operatingDays}
                onChange={(e) => setOperatingDays(e.target.value)}
                placeholder="Monday - Sunday"
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
                Delivery Radius (km)
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={deliveryRadiusKm}
                onChange={(e) => setDeliveryRadiusKm(e.target.value)}
                placeholder="10"
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
        </div>

        {/* Submit Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <Button variant="primary" size="lg" disabled={isSaving}>
            <Save size={18} />
            <span>{isSaving ? 'Saving Changes...' : 'Save Restaurant Profile'}</span>
          </Button>
        </div>
      </form>
    </div>
  )
}
