import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Users, Shield, Clock, Award, ArrowRight, ArrowLeft } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebase/config';

const AboutPage: React.FC = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const [content, setContent] = useState<{
    title_ar: string;
    title_en: string;
    content_ar: string;
    content_en: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const contentRef = ref(database, 'pages/about');
    const unsubscribe = onValue(contentRef, (snapshot) => {
      if (snapshot.exists()) {
        setContent(snapshot.val());
      } else {
        setContent(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const features = [
    { icon: <Shield size={32} />, title: isArabic ? 'آمن وموثوق' : 'Safe & Trusted', desc: isArabic ? 'جميع المعاملات مؤمنة' : 'All transactions are secured' },
    { icon: <Clock size={32} />, title: isArabic ? 'تسليم سريع' : 'Fast Delivery', desc: isArabic ? 'تسليم خلال دقائق' : 'Delivery within minutes' },
    { icon: <Users size={32} />, title: isArabic ? 'دعم 24/7' : '24/7 Support', desc: isArabic ? 'فريق دعم متاح دائماً' : 'Support team always available' },
    { icon: <Award size={32} />, title: isArabic ? '+100K عميل' : '+100K Customers', desc: isArabic ? 'عملاء راضون' : 'Satisfied customers' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Users size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-500">{isArabic ? 'لم يتم إعداد هذه الصفحة بعد' : 'This page has not been set up yet'}</p>
          <Link to="/" className="text-purple-600 hover:underline mt-4 inline-block">
            {isArabic ? 'العودة للرئيسية' : 'Back to Home'}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-blue-900 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">
            {isArabic ? content.title_ar : content.title_en}
          </h1>
          <p className="text-purple-200 text-lg">
            {isArabic ? 'تعرف على متجرنا وخدماتنا' : 'Learn about our store and services'}
          </p>
        </div>
      </div>

      {/* Features */}
      <div className="container mx-auto px-4 -mt-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {features.map((feature, index) => (
            <div key={index} className="bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4 text-purple-600">
                {feature.icon}
              </div>
              <h3 className="font-bold text-gray-800 mb-1">{feature.title}</h3>
              <p className="text-sm text-gray-500">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-3xl mx-auto">
          <div className="prose prose-lg max-w-none">
            <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
              {isArabic ? content.content_ar : content.content_en}
            </div>
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="container mx-auto px-4 pb-12">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-8 text-center text-white max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-4">
            {isArabic ? 'هل لديك أسئلة؟' : 'Have Questions?'}
          </h2>
          <p className="mb-6 opacity-90">
            {isArabic ? 'فريق الدعم جاهز لمساعدتك على مدار الساعة' : 'Our support team is ready to help you 24/7'}
          </p>
          <Link
            to="/create-ticket"
            className="inline-block bg-white text-purple-600 px-8 py-3 rounded-lg font-bold hover:bg-gray-100 transition-colors"
          >
            {isArabic ? 'تواصل معنا' : 'Contact Us'}
          </Link>
        </div>
      </div>

      {/* Back Link */}
      <div className="container mx-auto px-4 pb-8 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          {isArabic ? <ArrowRight size={18} /> : <ArrowLeft size={18} />}
          <span>{isArabic ? 'العودة للرئيسية' : 'Back to Home'}</span>
        </Link>
      </div>
    </div>
  );
};

export default AboutPage;
