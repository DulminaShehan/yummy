import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { PartnerProtectedRoute } from './PartnerProtectedRoute'
import { DashboardLayout } from '../components/layout/DashboardLayout'
import { PartnerLayout } from '../components/layout/PartnerLayout'
import { LoginPage } from '../features/auth/LoginPage'
import { OverviewPage } from '../features/overview/OverviewPage'
import { OrdersPage } from '../features/orders/OrdersPage'
import { CategoriesPage } from '../features/categories/CategoriesPage'
import { ProductsPage } from '../features/products/ProductsPage'
import { ShopsPage } from '../features/shops/ShopsPage'
import { SellersPage } from '../features/sellers/SellersPage'
import { RidersPage } from '../features/riders/RidersPage'
import { DeliveriesPage } from '../features/deliveries/DeliveriesPage'
import { CustomersPage } from '../features/customers/CustomersPage'
import { AdminsPage } from '../features/admins/AdminsPage'
import { ReportsPage } from '../features/reports/ReportsPage'
import { PartnerLoginPage } from '../features/partner/PartnerLoginPage'
import { PartnerDashboardPage } from '../features/partner/PartnerDashboardPage'
import { PartnerOrdersPage } from '../features/partner/PartnerOrdersPage'
import { PartnerMenuPage } from '../features/partner/PartnerMenuPage'
import { PartnerShopPage } from '../features/partner/PartnerShopPage'

export const AppRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Public Authentication Routes */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/partner/login" element={<PartnerLoginPage />} />

      {/* Protected Restaurant Partner Routes */}
      <Route element={<PartnerProtectedRoute />}>
        <Route element={<PartnerLayout />}>
          <Route path="/partner" element={<PartnerDashboardPage />} />
          <Route path="/partner/orders" element={<PartnerOrdersPage />} />
          <Route path="/partner/menu" element={<PartnerMenuPage />} />
          <Route path="/partner/profile" element={<PartnerShopPage />} />
        </Route>
      </Route>

      {/* Protected Admin Routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/shops" element={<ShopsPage />} />
          <Route path="/sellers" element={<SellersPage />} />
          <Route path="/riders" element={<RidersPage />} />
          <Route path="/deliveries" element={<DeliveriesPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/admins" element={<AdminsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>
      </Route>

      {/* Fallback Redirect */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
