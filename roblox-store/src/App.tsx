import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { CartProvider } from './contexts/CartContext';
import { AuthProvider } from './contexts/AuthContext';
import { CustomerAuthProvider } from './contexts/CustomerAuthContext';
import { TicketProvider } from './contexts/TicketContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { CouponProvider } from './contexts/CouponContext';
import { WishlistProvider } from './contexts/WishlistContext';
import { ReviewProvider } from './contexts/ReviewContext';
import { LoyaltyProvider } from './contexts/LoyaltyContext';
import { SiteSettingsProvider, useSiteSettings } from './contexts/SiteSettingsContext';
import Header from './components/ui/Header';
import Footer from './components/ui/Footer';
import HomePage from './pages/store/HomePage';
import ProductsPage from './pages/store/ProductsPage';
import CartPage from './pages/store/CartPage';
import CheckoutPage from './pages/store/CheckoutPage';
import AboutPage from './pages/store/AboutPage';
import ReturnPolicyPage from './pages/store/ReturnPolicyPage';
import DeliveryTimePage from './pages/store/DeliveryTimePage';
import FAQPage from './pages/store/FAQPage';
import SiteClosedPage from './pages/store/SiteClosedPage';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import CustomerAuth from './pages/customer/CustomerAuth';
import MyOrders from './pages/customer/MyOrders';
import CreateTicket from './pages/customer/CreateTicket';
import MyTickets from './pages/customer/MyTickets';
import TrackTicket from './pages/customer/TrackTicket';
import CustomerLoyalty from './pages/customer/CustomerLoyalty';
import CustomerWishlist from './pages/customer/CustomerWishlist';
import CustomerInbox from './pages/customer/CustomerInbox';
import BannedPage from './pages/customer/BannedPage';
import { useCustomerAuth } from './contexts/CustomerAuthContext';

// Component to check if customer is banned
const BanGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { customer, isLoading } = useCustomerAuth();

  // Always allow admin routes
  if (location.pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  // Show loading while checking customer status
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // If customer is banned, show banned page
  if (customer?.isBanned) {
    return <BannedPage />;
  }

  // Customer is not banned, render normal content
  return <>{children}</>;
};

// Component to check site closure status
const SiteGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { settings, loading } = useSiteSettings();

  // Always allow admin routes
  if (location.pathname.startsWith('/admin')) {
    return <>{children}</>;
  }

  // Show loading spinner while checking settings
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  // Show closure page if site is closed
  if (settings && settings.isOpen === false) {
    return <SiteClosedPage settings={settings} />;
  }

  // Site is open, render normal content
  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <SiteSettingsProvider>
      <AuthProvider>
        <CustomerAuthProvider>
          <NotificationProvider>
            <WishlistProvider>
              <LoyaltyProvider>
                <ReviewProvider>
                  <CouponProvider>
                    <TicketProvider>
                      <CartProvider>
                        <Router>
                          <BanGate>
                            <SiteGate>
                              <Routes>
                              {/* Admin Routes - No Header/Footer */}
                              <Route path="/admin/login" element={<AdminLogin />} />
                              <Route path="/admin" element={<AdminDashboard />} />
                              
                              {/* Customer Routes - No Header/Footer */}
                              <Route path="/customer/auth" element={<CustomerAuth />} />
                              <Route path="/my-orders" element={<MyOrders />} />
                              <Route path="/create-ticket" element={<CreateTicket />} />
                              <Route path="/my-tickets" element={<MyTickets />} />
                              <Route path="/track-ticket" element={<TrackTicket />} />
                                                            <Route path="/my-loyalty" element={<CustomerLoyalty />} />
                                                            <Route path="/my-wishlist" element={<CustomerWishlist />} />
                                                            <Route path="/my-inbox" element={<CustomerInbox />} />
                              
                              {/* Store Routes - With Header/Footer */}
                              <Route
                                path="/*"
                                element={
                                  <div className="min-h-screen flex flex-col">
                                    <Header />
                                    <main className="flex-1">
                                      <Routes>
                                        <Route path="/" element={<HomePage />} />
                                        <Route path="/products" element={<ProductsPage />} />
                                        <Route path="/cart" element={<CartPage />} />
                                        <Route path="/checkout" element={<CheckoutPage />} />
                                        <Route path="/about" element={<AboutPage />} />
                                        <Route path="/return-policy" element={<ReturnPolicyPage />} />
                                        <Route path="/delivery-time" element={<DeliveryTimePage />} />
                                        <Route path="/faq" element={<FAQPage />} />
                                      </Routes>
                                    </main>
                                    <Footer />
                                  </div>
                                }
                              />
                              </Routes>
                            </SiteGate>
                          </BanGate>
                        </Router>
                      </CartProvider>
                    </TicketProvider>
                  </CouponProvider>
                </ReviewProvider>
              </LoyaltyProvider>
            </WishlistProvider>
          </NotificationProvider>
        </CustomerAuthProvider>
      </AuthProvider>
    </SiteSettingsProvider>
  );
};

export default App;
