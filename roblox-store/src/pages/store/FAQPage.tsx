import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp, HelpCircle, Search } from 'lucide-react';
import { ref, onValue } from 'firebase/database';
import { database } from '../../firebase/config';
import Header from '../../components/ui/Header';
import Footer from '../../components/ui/Footer';

interface FAQItem {
  id: string;
  question_ar: string;
  question_en: string;
  answer_ar: string;
  answer_en: string;
  category: string;
  order: number;
}

const FAQPage: React.FC = () => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  const [faqs, setFaqs] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const faqRef = ref(database, 'faqs');
    const unsubscribe = onValue(faqRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const faqList = Object.entries(data).map(([id, faq]) => ({
          id,
          ...(faq as Omit<FAQItem, 'id'>)
        }));
        faqList.sort((a, b) => (a.order || 0) - (b.order || 0));
        setFaqs(faqList);
      } else {
        setFaqs([]);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const categories = [
    { id: 'all', label_ar: 'الكل', label_en: 'All' },
    { id: 'orders', label_ar: 'الطلبات', label_en: 'Orders' },
    { id: 'payment', label_ar: 'الدفع', label_en: 'Payment' },
    { id: 'delivery', label_ar: 'التسليم', label_en: 'Delivery' },
    { id: 'account', label_ar: 'الحساب', label_en: 'Account' },
    { id: 'other', label_ar: 'أخرى', label_en: 'Other' }
  ];

  const filteredFaqs = faqs.filter(faq => {
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    const matchesSearch = searchQuery === '' || 
      (isArabic ? faq.question_ar : faq.question_en).toLowerCase().includes(searchQuery.toLowerCase()) ||
      (isArabic ? faq.answer_ar : faq.answer_en).toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Display FAQs from database only (no defaults)
  const displayFaqs = filteredFaqs;

  return (
    <div className={`min-h-screen bg-gray-50 ${isArabic ? 'rtl' : 'ltr'}`} dir={isArabic ? 'rtl' : 'ltr'}>
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Hero Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
            <HelpCircle size={32} className="text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            {isArabic ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
          </h1>
          <p className="text-gray-600">
            {isArabic ? 'ابحث عن إجابات لأسئلتك الشائعة' : 'Find answers to your common questions'}
          </p>
        </div>

        {/* Search and Filter */}
        <div className="max-w-3xl mx-auto mb-8">
          {/* Search */}
          <div className="relative mb-4">
            <Search size={20} className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isArabic ? 'right-4' : 'left-4'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={isArabic ? 'ابحث عن سؤال...' : 'Search for a question...'}
              className={`w-full py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${isArabic ? 'pr-12 pl-4' : 'pl-12 pr-4'}`}
            />
          </div>

          {/* Categories */}
          <div className="flex flex-wrap gap-2 justify-center">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-purple-50 border border-gray-200'
                }`}
              >
                {isArabic ? category.label_ar : category.label_en}
              </button>
            ))}
          </div>
        </div>

        {/* FAQ List */}
        <div className="max-w-3xl mx-auto">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">{isArabic ? 'جاري التحميل...' : 'Loading...'}</p>
            </div>
          ) : displayFaqs.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <HelpCircle size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">
                {isArabic ? 'لا توجد أسئلة مطابقة' : 'No matching questions found'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {displayFaqs.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedId(expandedId === faq.id ? null : faq.id)}
                    className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50 transition-colors"
                  >
                    <span className="font-medium text-gray-800">
                      {isArabic ? faq.question_ar : faq.question_en}
                    </span>
                    {expandedId === faq.id ? (
                      <ChevronUp size={20} className="text-purple-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown size={20} className="text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {expandedId === faq.id && (
                    <div className="px-6 pb-4 text-gray-600 border-t border-gray-100 pt-4">
                      {isArabic ? faq.answer_ar : faq.answer_en}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Contact Support */}
        <div className="max-w-3xl mx-auto mt-12 text-center">
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-lg p-8 text-white">
            <h2 className="text-xl font-bold mb-2">
              {isArabic ? 'لم تجد إجابة لسؤالك؟' : "Didn't find your answer?"}
            </h2>
            <p className="mb-4 opacity-90">
              {isArabic ? 'تواصل معنا وسنساعدك' : 'Contact us and we will help you'}
            </p>
            <a
              href="/customer/create-ticket"
              className="inline-block bg-white text-purple-600 px-6 py-2 rounded-lg font-medium hover:bg-gray-100 transition-colors"
            >
              {isArabic ? 'فتح تذكرة دعم' : 'Open Support Ticket'}
            </a>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FAQPage;
