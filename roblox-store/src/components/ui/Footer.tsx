import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Zap, Shield, Clock, Ticket, FileText, Truck, Users, HelpCircle } from 'lucide-react';

const Footer: React.FC = () => {
  const { t, i18n } = useTranslation();
  const currentYear = new Date().getFullYear();
  const isArabic = i18n.language === 'ar';

  return (
    <footer className="bg-gradient-to-r from-gray-900 via-purple-900 to-gray-900 text-white mt-auto">
      {/* Features Section */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center mb-3">
                <Zap size={24} />
              </div>
              <span className="font-medium">{t('footer.delivery')}</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mb-3">
                <Shield size={24} />
              </div>
              <span className="font-medium">{t('footer.secure')}</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mb-3">
                <Clock size={24} />
              </div>
              <span className="font-medium">{t('footer.support')}</span>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 bg-indigo-600 rounded-full flex items-center justify-center mb-3">
                <HelpCircle size={24} />
              </div>
              <span className="font-medium">{isArabic ? 'الأسئلة الشائعة' : 'FAQ'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Links Section */}
      <div className="border-b border-white/10">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {/* Quick Links */}
            <div>
              <h4 className="font-bold text-lg mb-4">{isArabic ? 'روابط سريعة' : 'Quick Links'}</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/" className="text-gray-400 hover:text-white transition-colors">
                    {isArabic ? 'الرئيسية' : 'Home'}
                  </Link>
                </li>
                <li>
                  <Link to="/products" className="text-gray-400 hover:text-white transition-colors">
                    {isArabic ? 'المنتجات' : 'Products'}
                  </Link>
                </li>
                <li>
                  <Link to="/cart" className="text-gray-400 hover:text-white transition-colors">
                    {isArabic ? 'السلة' : 'Cart'}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Information */}
            <div>
              <h4 className="font-bold text-lg mb-4">{isArabic ? 'معلومات' : 'Information'}</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/about" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                    <Users size={16} />
                    {isArabic ? 'من نحن' : 'About Us'}
                  </Link>
                </li>
                <li>
                  <Link to="/return-policy" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                    <FileText size={16} />
                    {isArabic ? 'سياسة الإرجاع' : 'Return Policy'}
                  </Link>
                </li>
                <li>
                  <Link to="/delivery-time" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                    <Truck size={16} />
                    {isArabic ? 'وقت التسليم' : 'Delivery Time'}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Support */}
            <div>
              <h4 className="font-bold text-lg mb-4">{isArabic ? 'الدعم' : 'Support'}</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/create-ticket" className="text-gray-400 hover:text-white transition-colors flex items-center gap-2">
                    <Ticket size={16} />
                    {isArabic ? 'فتح تذكرة' : 'Open Ticket'}
                  </Link>
                </li>
                <li>
                  <Link to="/track-ticket" className="text-gray-400 hover:text-white transition-colors">
                    {isArabic ? 'تتبع تذكرة' : 'Track Ticket'}
                  </Link>
                </li>
                <li>
                  <Link to="/my-tickets" className="text-gray-400 hover:text-white transition-colors">
                    {isArabic ? 'تذاكري' : 'My Tickets'}
                  </Link>
                </li>
              </ul>
            </div>

            {/* Account */}
            <div>
              <h4 className="font-bold text-lg mb-4">{isArabic ? 'الحساب' : 'Account'}</h4>
              <ul className="space-y-2">
                <li>
                  <Link to="/customer/auth" className="text-gray-400 hover:text-white transition-colors">
                    {isArabic ? 'تسجيل الدخول' : 'Login'}
                  </Link>
                </li>
                <li>
                  <Link to="/my-orders" className="text-gray-400 hover:text-white transition-colors">
                    {isArabic ? 'طلباتي' : 'My Orders'}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-lg">🎮</span>
            </div>
            <span className="font-bold">{t('store.name')}</span>
          </div>
          <p className="text-gray-400 text-sm">
            © {currentYear} {t('store.name')}. {t('footer.rights')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
