import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Truck, Clock, Zap, CheckCircle, ArrowRight, ArrowLeft } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebase/config';

const DeliveryTimePage: React.FC = () => {
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
    const contentRef = ref(database, 'pages/deliveryTime');
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

  const steps = [
    { icon: <CheckCircle size={24} />, title: isArabic ? 'إتمام الشراء' : 'Complete Purchase', time: isArabic ? 'فوري' : 'Instant' },
    { icon: <Clock size={24} />, title: isArabic ? 'مراجعة الطلب' : 'Order Review', time: isArabic ? '5-15 دقيقة' : '5-15 min' },
    { icon: <Zap size={24} />, title: isArabic ? 'التحقق من الدفع' : 'Payment Verification', time: isArabic ? '5-10 دقائق' : '5-10 min' },
    { icon: <Truck size={24} />, title: isArabic ? 'تسليم العناصر' : 'Item Delivery', time: isArabic ? 'فوري' : 'Instant' },
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
          <Truck size={48} className="mx-auto text-gray-300 mb-4" />
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
            <Truck size={32} />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            {isArabic ? content.title_ar : content.title_en}
          </h1>
          <p className="text-purple-200 text-lg">
            {isArabic ? 'تسليم سريع وآمن لجميع الطلبات' : 'Fast and secure delivery for all orders'}
          </p>
        </div>
      </div>

      {/* Timeline */}
      <div className="container mx-auto px-4 -mt-8">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="flex flex-wrap justify-between items-center gap-4">
            {steps.map((step, index) => (
              <React.Fragment key={index}>
                <div className="flex flex-col items-center text-center flex-1 min-w-[120px]">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 mb-2">
                    {step.icon}
                  </div>
                  <h3 className="font-bold text-gray-800 text-sm">{step.title}</h3>
                  <span className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded mt-1">{step.time}</span>
                </div>
                {index < steps.length - 1 && (
                  <div className="hidden md:block text-gray-300">
                    {isArabic ? <ArrowLeft size={24} /> : <ArrowRight size={24} />}
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      </div>

      {/* Average Time */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl p-8 text-center text-white max-w-xl mx-auto">
          <Clock size={48} className="mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-2">
            {isArabic ? 'متوسط وقت التسليم' : 'Average Delivery Time'}
          </h2>
          <p className="text-5xl font-bold mb-2">15-30</p>
          <p className="text-green-100">{isArabic ? 'دقيقة' : 'minutes'}</p>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pb-12">
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
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center max-w-3xl mx-auto">
          <h2 className="text-xl font-bold text-yellow-800 mb-4">
            {isArabic ? 'تأخر في التسليم؟' : 'Delivery Delayed?'}
          </h2>
          <p className="text-yellow-600 mb-6">
            {isArabic ? 'إذا مر أكثر من ساعة على طلبك، تواصل معنا فوراً' : 'If more than an hour has passed, contact us immediately'}
          </p>
          <Link
            to="/create-ticket"
            className="inline-block bg-yellow-500 text-white px-8 py-3 rounded-lg font-bold hover:bg-yellow-600 transition-colors"
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

export default DeliveryTimePage;
