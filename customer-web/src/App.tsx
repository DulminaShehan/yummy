import React, { useEffect } from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  Navigate,
} from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { CartDrawer } from './components/CartDrawer';
import { ProtectedRoute } from './components/ProtectedRoute';

// Public & Customer Pages
import { HomePage } from './pages/HomePage';
import { RestaurantsPage } from './pages/RestaurantsPage';
import { RestaurantDetailsPage } from './pages/RestaurantDetailsPage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderConfirmationPage } from './pages/OrderConfirmationPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';
import { OrderHistoryPage } from './pages/OrderHistoryPage';
import { CustomerProfilePage } from './pages/CustomerProfilePage';
import { SavedAddressesPage } from './pages/SavedAddressesPage';
import { PartnerApplyPage } from './pages/PartnerApplyPage';
import { PartnerStatusPage } from './pages/PartnerStatusPage';
import { CustomerLoginPage } from './pages/CustomerLoginPage';
import { CustomerRegisterPage } from './pages/CustomerRegisterPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { NotFoundPage } from './pages/NotFoundPage';

// Restaurant Partner Portal Pages & Layout
import { PartnerLayout } from './components/partner/PartnerLayout';
import { PartnerLoginPage } from './pages/partner/PartnerLoginPage';
import { PartnerDashboardPage } from './pages/partner/PartnerDashboardPage';
import { PartnerOrdersPage } from './pages/partner/PartnerOrdersPage';
import { PartnerMenuPage } from './pages/partner/PartnerMenuPage';
import { PartnerProfilePage } from './pages/partner/PartnerProfilePage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

export function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <ScrollToTop />
          <Routes>
            {/* Dedicated Partner Portal Experience */}
            <Route path="/partner/login" element={<PartnerLoginPage />} />
            <Route path="/partner" element={<PartnerLayout />}>
              <Route index element={<Navigate to="/partner/dashboard" replace />} />
              <Route path="dashboard" element={<PartnerDashboardPage />} />
              <Route path="orders" element={<PartnerOrdersPage />} />
              <Route path="menu" element={<PartnerMenuPage />} />
              <Route path="profile" element={<PartnerProfilePage />} />
            </Route>

            {/* Public Customer Website (With standard Navbar & Footer) */}
            <Route
              path="*"
              element={
                <div className="min-h-screen flex flex-col bg-brand-bg text-brand-text">
                  <Navbar />
                  <main className="flex-1">
                    <Routes>
                      {/* Discovery */}
                      <Route path="/" element={<HomePage />} />
                      <Route path="/restaurants" element={<RestaurantsPage />} />
                      <Route path="/restaurant/:id" element={<RestaurantDetailsPage />} />
                      <Route path="/search" element={<SearchResultsPage />} />

                      {/* Cart & Checkout */}
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/checkout" element={<CheckoutPage />} />
                      <Route
                        path="/order-confirmation/:orderId"
                        element={<OrderConfirmationPage />}
                      />
                      <Route
                        path="/orders/:orderId/track"
                        element={<OrderTrackingPage />}
                      />

                      {/* Customer Profile & Orders */}
                      <Route
                        path="/orders"
                        element={
                          <ProtectedRoute>
                            <OrderHistoryPage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/profile"
                        element={
                          <ProtectedRoute>
                            <CustomerProfilePage />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/addresses"
                        element={
                          <ProtectedRoute>
                            <SavedAddressesPage />
                          </ProtectedRoute>
                        }
                      />

                      {/* Restaurant Application & Status */}
                      <Route path="/partner/apply" element={<PartnerApplyPage />} />
                      <Route path="/partner/status" element={<PartnerStatusPage />} />

                      {/* Auth */}
                      <Route path="/login" element={<CustomerLoginPage />} />
                      <Route path="/register" element={<CustomerRegisterPage />} />
                      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

                      {/* 404 */}
                      <Route path="*" element={<NotFoundPage />} />
                    </Routes>
                  </main>
                  <Footer />
                  <CartDrawer />
                </div>
              }
            />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
