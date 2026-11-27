import React, { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  UtensilsCrossed,
  ShoppingBag,
  Store,
  LogOut,
  Power,
  Menu,
  X,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { sellerService } from '../../services/seller.service'
import { Shop } from '../../types'
import { useToast } from '../../context/ToastContext'

export const PartnerLayout: React.FC = () => {
  const { user, isAdmin, signOut } = useAuth()
  const navigate = useNavigate()
  const { success, error } = useToast()

  const [shop, setShop] = useState<Shop | null>(null)
  const [loadingShop, setLoadingShop] = useState(true)
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    if (user?.id) {
      loadShop()
    }
  }, [user?.id])

  const loadShop = async () => {
    if (!user?.id) return
    setLoadingShop(true)
    try {
      const data = await sellerService.getSellerShop(user.id)
      setShop(data)
    } catch (err) {
      console.error('Failed to load partner shop:', err)
    } finally {
      setLoadingShop(false)
    }
  }

  const handleToggleStoreStatus = async () => {
    if (!shop) return
    setIsUpdatingStatus(true)
    const newIsOpen = shop.status !== 'approved'
    try {
      const updated = await sellerService.toggleShopStatus(shop.id, newIsOpen)
      setShop(updated)
      if (newIsOpen) {
        success('Store is now OPEN and accepting orders!')
      } else {
        success('Store is now CLOSED. Customers cannot place new orders.')
      }
    } catch (err) {
      error('Failed to update store availability')
    } finally {
      setIsUpdatingStatus(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/partner/login')
  }

  const isStoreOpen = shop?.status === 'approved'

  const navItems = [
    { name: 'Dashboard', path: '/partner', icon: LayoutDashboard, end: true },
    { name: 'Live Orders', path: '/partner/orders', icon: ShoppingBag },
    { name: 'Food Menu', path: '/partner/menu', icon: UtensilsCrossed },
    { name: 'Restaurant Profile', path: '/partner/profile', icon: Store },
  ]

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-app)' }}>
      {/* Sidebar Navigation */}
      <aside
        style={{
          width: 260,
          backgroundColor: '#0d1b2a',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          position: 'fixed',
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 40,
          borderRight: '1px solid #1b263b',
          transition: 'transform 0.3s ease',
          transform: mobileMenuOpen ? 'translateX(0)' : undefined,
        }}
      >
        {/* Brand & Logo Header */}
        <div
          style={{
            height: 72,
            padding: '0 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #1b263b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 10,
                backgroundColor: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                color: '#ffffff',
                fontSize: '1.2rem',
                boxShadow: '0 4px 12px rgba(21, 101, 192, 0.3)',
              }}
            >
              Y
            </div>
            <div>
              <div style={{ fontWeight: 800, fontSize: '1.1rem', letterSpacing: '-0.02em', color: '#ffffff' }}>
                YUMMY
              </div>
              <div style={{ fontSize: '0.7rem', color: '#90e0ef', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Partner Portal
              </div>
            </div>
          </div>
          {mobileMenuOpen && (
            <button
              onClick={() => setMobileMenuOpen(false)}
              style={{ background: 'none', border: 'none', color: '#ffffff', cursor: 'pointer' }}
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Restaurant Card Mini */}
        <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid #1b263b' }}>
          <div style={{ fontSize: '0.75rem', color: '#778da9', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.25rem' }}>
            Active Restaurant
          </div>
          <div style={{ fontWeight: 700, fontSize: '0.95rem', color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {shop?.name || (loadingShop ? 'Loading...' : 'Partner Restaurant')}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '0.4rem' }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isStoreOpen ? '#10b981' : '#ef4444',
                display: 'inline-block',
              }}
            />
            <span style={{ fontSize: '0.75rem', color: isStoreOpen ? '#34d399' : '#f87171', fontWeight: 600 }}>
              {isStoreOpen ? 'Online • Open' : 'Offline • Closed'}
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav style={{ flex: 1, padding: '1rem 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              onClick={() => setMobileMenuOpen(false)}
              style={({ isActive }) => ({
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#ffffff' : '#94a3b8',
                backgroundColor: isActive ? 'var(--primary)' : 'transparent',
                transition: 'all 0.15s ease',
              })}
            >
              <item.icon size={19} />
              <span>{item.name}</span>
            </NavLink>
          ))}

          {isAdmin && (
            <NavLink
              to="/"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: 8,
                textDecoration: 'none',
                fontSize: '0.85rem',
                fontWeight: 600,
                color: '#38bdf8',
                marginTop: '1.5rem',
                border: '1px dashed #38bdf8',
              }}
            >
              <ExternalLink size={17} />
              <span>Switch to Admin Panel</span>
            </NavLink>
          )}
        </nav>

        {/* User Footer & Sign Out */}
        <div style={{ padding: '1rem', borderTop: '1px solid #1b263b', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ overflow: 'hidden', paddingRight: '0.5rem' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.full_name || 'Restaurant Owner'}
            </div>
            <div style={{ fontSize: '0.75rem', color: '#778da9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.email}
            </div>
          </div>
          <button
            onClick={handleSignOut}
            title="Sign Out"
            style={{
              background: 'none',
              border: 'none',
              color: '#f87171',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, marginLeft: 260, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header Bar */}
        <header
          style={{
            height: 72,
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 2rem',
            position: 'sticky',
            top: 0,
            zIndex: 30,
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={() => setMobileMenuOpen(true)}
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '6px',
              }}
              id="partner-mobile-menu-btn"
            >
              <Menu size={22} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
                {shop?.name || 'Restaurant Partner Portal'}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                {shop?.city ? `${shop.city}${shop.district ? `, ${shop.district}` : ''}` : 'Global Partner Network'}
              </span>
            </div>
          </div>

          {/* Quick Open/Close Store Toggle Action */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <button
              onClick={handleToggleStoreStatus}
              disabled={isUpdatingStatus || !shop}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 1rem',
                borderRadius: 24,
                border: `1px solid ${isStoreOpen ? '#10b981' : '#f87171'}`,
                backgroundColor: isStoreOpen ? '#ecfdf5' : '#fef2f2',
                color: isStoreOpen ? '#065f46' : '#991b1b',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: isUpdatingStatus ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              <Power size={16} color={isStoreOpen ? '#10b981' : '#ef4444'} />
              <span>{isStoreOpen ? 'Store is Open' : 'Store is Closed'}</span>
            </button>
          </div>
        </header>

        {/* Content View */}
        <main style={{ flex: 1, padding: '2rem', maxWidth: 1400, width: '100%', margin: '0 auto' }}>
          <Outlet context={{ shop, onRefreshShop: loadShop }} />
        </main>
      </div>
    </div>
  )
}
