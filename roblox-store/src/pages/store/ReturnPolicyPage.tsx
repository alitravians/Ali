import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FileText, ArrowRight, ArrowLeft, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebase/config';

const ReturnPolicyPage: React.FC = () => {
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
    const contentRef = ref(database, 'pages/returnPolicy');
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

  const highlights = [
    { icon: <CheckCircle size={24} />, text: isArabic ? 'معاملات آمنة ومشفرة' : 'Secure & encrypted transactions', color: 'green' },
    { icon: <AlertTriangle size={24} />, text: isArabic ? 'تواصل معنا خلال 24 ساعة' : 'Contact us within 24 hours', color: 'yellow' },
    { icon: <XCircle size={24} />, text: isArabic ? 'لا إرجاع بعد التسليم' : 'No returns after delivery', color: 'red' },
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
          <FileText size={48} className="mx-auto text-gray-300 mb-4" />
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
          <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText size={32} />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            {isArabic ? content.title_ar : content.title_en}
          </h1>
          <p className="text-purple-200 text-lg">
            {isArabic ? 'اقرأ سياستنا قبل الشراء' : 'Read our policy before purchasing'}
          </p>
        </div>
      </div>

      {/* Highlights */}
      <div className="container mx-auto px-4 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {highlights.map((item, index) => (
            <div key={index} className={`bg-white rounded-xl shadow-lg p-4 flex items-center gap-4 border-r-4 ${
              item.color === 'green' ? 'border-green-500' :
              item.color === 'yellow' ? 'border-yellow-500' :
              'border-red-500'
            }`}>
              <div className={`${
                item.color === 'green' ? 'text-green-500' :
                item.color === 'yellow' ? 'text-yellow-500' :
                'text-red-500'
              }`}>
                {item.icon}
              </div>
              <span className="font-medium text-gray-700">{item.text}</span>
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

      {/* Help Section */}
      <div className="container mx-auto px-4 pb-12">
        <div className="bg-purple-50 border border-purple-200 rounded-2xl p-8 text-center max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-purple-800 mb-4">
            {isArabic ? 'هل لديك مشكلة مع طلبك؟' : 'Having an issue with your order?'}
          </h2>
          <p className="text-purple-600 mb-6">
            {isArabic ? 'فريق الدعم جاهز لمساعدتك' : 'Our support team is ready to help you'}
          </p>
          <Link
            to="/create-ticket"
            className="inline-block bg-purple-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-purple-700 transition-colors"
          >
            {isArabic ? 'فتح تذكرة دعم' : 'Open Support Ticket'}
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

export default ReturnPolicyPage;
