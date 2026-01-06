import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ShoppingCart, Globe, Settings, Home, Package, User, LogIn, Heart, Gift, Mail } from 'lucide-react';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCustomerAuth } from '../../contexts/CustomerAuthContext';
import NotificationDropdown from './NotificationDropdown';
import { subscribeCustomerMessages } from '../../services/firebase';

const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { itemCount } = useCart();
  const { isAdmin } = useAuth();
  const { customer, isLoggedIn } = useCustomerAuth();
  const location = useLocation();
  const isArabic = i18n.language === 'ar';
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);

  // Subscribe to customer messages for unread count
  useEffect(() => {
    if (!isLoggedIn || !customer?.id) {
      setUnreadMessageCount(0);
      return;
    }

    const unsubscribe = subscribeCustomerMessages(customer.id, (messages) => {
      const unreadCount = messages.filter(m => !m.isRead && !m.isDeleted).length;
      setUnreadMessageCount(unreadCount);
    });

    return () => unsubscribe();
  }, [isLoggedIn, customer?.id]);

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 text-xl font-bold">
            <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎮</span>
            </div>
            <span className="hidden sm:block">{t('store.name')}</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center gap-1 sm:gap-4">
            <Link
              to="/"
              className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive('/') ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
            >
              <Home size={18} />
              <span className="hidden sm:inline">{t('store.home')}</span>
            </Link>

            <Link
              to="/products"
              className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive('/products') ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
            >
              <Package size={18} />
              <span className="hidden sm:inline">{t('store.products')}</span>
            </Link>

            <Link
              to="/cart"
              className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors relative ${
                isActive('/cart') ? 'bg-white/20' : 'hover:bg-white/10'
              }`}
            >
              <ShoppingCart size={18} />
              <span className="hidden sm:inline">{t('store.cart')}</span>
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>

            {isAdmin && (
              <Link
                to="/admin"
                className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                  location.pathname.startsWith('/admin') ? 'bg-white/20' : 'hover:bg-white/10'
                }`}
              >
                <Settings size={18} />
                <span className="hidden sm:inline">{t('store.admin')}</span>
              </Link>
            )}

                      {!isAdmin && (
                        <Link
                          to="/admin/login"
                          className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                        >
                          <Settings size={18} />
                          <span className="hidden sm:inline">{t('store.admin')}</span>
                        </Link>
                      )}

                                            {/* Customer Account Button */}
                                            {isLoggedIn ? (
                                              <>
                                                {/* Notifications */}
                                                <NotificationDropdown />
                          
                                                {/* Wishlist */}
                                                <Link
                                                  to="/my-wishlist"
                                                  className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                                                  title={isArabic ? 'قائمة الأمنيات' : 'Wishlist'}
                                                >
                                                  <Heart size={18} />
                                                </Link>
                          
                                                                                                {/* Loyalty Points */}
                                                                                                <Link
                                                                                                  to="/my-loyalty"
                                                                                                  className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                                                                                                  title={isArabic ? 'نقاط الولاء' : 'Loyalty Points'}
                                                                                                >
                                                                                                  <Gift size={18} />
                                                                                                </Link>

                                                                                                                                                                                                {/* Inbox */}
                                                                                                                                                                                                <Link
                                                                                                                                                                                                  to="/my-inbox"
                                                                                                                                                                                                  className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors relative"
                                                                                                                                                                                                  title={isArabic ? 'صندوق الوارد' : 'Inbox'}
                                                                                                                                                                                                >
                                                                                                                                                                                                  <Mail size={18} />
                                                                                                                                                                                                  {unreadMessageCount > 0 && (
                                                                                                                                                                                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                                                                                                                                                                                                      {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                                                                                                                                                                                                    </span>
                                                                                                                                                                                                  )}
                                                                                                                                                                                                </Link>
                          
                                                                                                {/* Account */}
                                                <Link
                                                  to="/my-orders"
                                                  className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-600/80 hover:bg-green-600 transition-colors"
                                                >
                                                  <User size={18} />
                                                  <span className="hidden sm:inline">{customer?.username}</span>
                                                </Link>
                                              </>
                                            ) : (
                                              <Link
                                                to="/customer/auth"
                                                className="flex items-center gap-1 px-3 py-2 rounded-lg bg-purple-600/80 hover:bg-purple-600 transition-colors"
                                              >
                                                <LogIn size={18} />
                                                <span className="hidden sm:inline">{isArabic ? 'تسجيل دخول' : 'Login'}</span>
                                              </Link>
                                            )}

                      <button
                        onClick={toggleLanguage}
                        className="flex items-center gap-1 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors"
                      >
                        <Globe size={18} />
                        <span>{i18n.language === 'en' ? 'العربية' : 'English'}</span>
                      </button>
                    </nav>
        </div>
      </div>
    </header>
  );
};

export default Header;
