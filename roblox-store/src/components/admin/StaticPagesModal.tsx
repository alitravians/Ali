import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Save, 
  RefreshCw,
  Check,
  AlertCircle
} from 'lucide-react';
import { ref, onValue, set } from 'firebase/database';
import { database } from '../../firebase/config';
import Modal from './Modal';

interface PageContent {
  title_ar: string;
  title_en: string;
  content_ar: string;
  content_en: string;
}

interface StaticPagesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const StaticPagesModal: React.FC<StaticPagesModalProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  const [activePage, setActivePage] = useState<'about' | 'returnPolicy' | 'deliveryTime'>('about');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [pages, setPages] = useState<{
    about: PageContent;
    returnPolicy: PageContent;
    deliveryTime: PageContent;
  }>({
    about: {
      title_ar: '',
      title_en: '',
      content_ar: '',
      content_en: ''
    },
    returnPolicy: {
      title_ar: '',
      title_en: '',
      content_ar: '',
      content_en: ''
    },
    deliveryTime: {
      title_ar: '',
      title_en: '',
      content_ar: '',
      content_en: ''
    }
  });

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    const pagesRef = ref(database, 'pages');
    const unsubscribe = onValue(pagesRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setPages({
          about: data.about || { title_ar: '', title_en: '', content_ar: '', content_en: '' },
          returnPolicy: data.returnPolicy || { title_ar: '', title_en: '', content_ar: '', content_en: '' },
          deliveryTime: data.deliveryTime || { title_ar: '', title_en: '', content_ar: '', content_en: '' }
        });
      } else {
        // No data in Firebase - show empty fields
        setPages({
          about: { title_ar: '', title_en: '', content_ar: '', content_en: '' },
          returnPolicy: { title_ar: '', title_en: '', content_ar: '', content_en: '' },
          deliveryTime: { title_ar: '', title_en: '', content_ar: '', content_en: '' }
        });
      }
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [isOpen]);

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    setSaveSuccess(false);

    try {
      await set(ref(database, `pages/${activePage}`), pages[activePage]);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving page:', err);
      setError(isArabic ? 'حدث خطأ أثناء الحفظ' : 'Error saving page');
    }

    setIsSaving(false);
  };

  const updatePageContent = (field: keyof PageContent, value: string) => {
    setPages(prev => ({
      ...prev,
      [activePage]: {
        ...prev[activePage],
        [field]: value
      }
    }));
  };

  const pageLabels = {
    about: { ar: 'من نحن', en: 'About Us' },
    returnPolicy: { ar: 'سياسة البيع والإرجاع', en: 'Return Policy' },
    deliveryTime: { ar: 'وقت تسليم الطلبات', en: 'Delivery Time' }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isArabic ? 'إدارة الصفحات الثابتة' : 'Static Pages Management'} size="xl">
      <div className="h-[70vh] flex flex-col">
        {/* Page Tabs */}
        <div className="flex gap-2 mb-6 border-b pb-4">
          {(Object.keys(pageLabels) as Array<keyof typeof pageLabels>).map(page => (
            <button
              key={page}
              onClick={() => setActivePage(page)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activePage === page
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {isArabic ? pageLabels[page].ar : pageLabels[page].en}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <RefreshCw size={32} className="animate-spin text-purple-600" />
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-6">
            {/* Arabic Title */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                {isArabic ? 'العنوان (عربي)' : 'Title (Arabic)'}
              </label>
              <input
                type="text"
                value={pages[activePage].title_ar}
                onChange={(e) => updatePageContent('title_ar', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                dir="rtl"
              />
            </div>

            {/* English Title */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                {isArabic ? 'العنوان (إنجليزي)' : 'Title (English)'}
              </label>
              <input
                type="text"
                value={pages[activePage].title_en}
                onChange={(e) => updatePageContent('title_en', e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                dir="ltr"
              />
            </div>

            {/* Arabic Content */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                {isArabic ? 'المحتوى (عربي)' : 'Content (Arabic)'}
              </label>
              <textarea
                value={pages[activePage].content_ar}
                onChange={(e) => updatePageContent('content_ar', e.target.value)}
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
                dir="rtl"
                placeholder={isArabic ? 'اكتب المحتوى بالعربية...' : 'Write content in Arabic...'}
              />
            </div>

            {/* English Content */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                {isArabic ? 'المحتوى (إنجليزي)' : 'Content (English)'}
              </label>
              <textarea
                value={pages[activePage].content_en}
                onChange={(e) => updatePageContent('content_en', e.target.value)}
                rows={8}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 resize-none"
                dir="ltr"
                placeholder={isArabic ? 'اكتب المحتوى بالإنجليزية...' : 'Write content in English...'}
              />
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t flex items-center justify-between">
          <div>
            {error && (
              <div className="flex items-center gap-2 text-red-600">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}
            {saveSuccess && (
              <div className="flex items-center gap-2 text-green-600">
                <Check size={18} />
                <span>{isArabic ? 'تم الحفظ بنجاح' : 'Saved successfully'}</span>
              </div>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700 disabled:opacity-50"
          >
            {isSaving ? (
              <RefreshCw size={18} className="animate-spin" />
            ) : (
              <Save size={18} />
            )}
            <span>{isArabic ? 'حفظ التغييرات' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};

export default StaticPagesModal;
