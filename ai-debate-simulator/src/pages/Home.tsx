import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { debateTopics } from '../data/debates';
import { Play, Globe, Volume2, VolumeX, Upload, User, X } from 'lucide-react';
import i18n from '../i18n/config';

const Home: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [side1Image, setSide1Image] = useState<string | null>(localStorage.getItem('side1Image'));
  const [side2Image, setSide2Image] = useState<string | null>(localStorage.getItem('side2Image'));
  const [showImageUpload, setShowImageUpload] = useState(false);
  
  const side1InputRef = useRef<HTMLInputElement>(null);
  const side2InputRef = useRef<HTMLInputElement>(null);

  const isArabic = i18n.language === 'ar';
  
  const handleImageUpload = (side: 'side1' | 'side2', event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        if (side === 'side1') {
          setSide1Image(base64);
          localStorage.setItem('side1Image', base64);
        } else {
          setSide2Image(base64);
          localStorage.setItem('side2Image', base64);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const removeImage = (side: 'side1' | 'side2') => {
    if (side === 'side1') {
      setSide1Image(null);
      localStorage.removeItem('side1Image');
    } else {
      setSide2Image(null);
      localStorage.removeItem('side2Image');
    }
  };

  const toggleLanguage = () => {
    const newLang = isArabic ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
    localStorage.setItem('language', newLang);
    document.documentElement.lang = newLang;
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr';
  };

  const categories = ['all', ...new Set(debateTopics.map(t => isArabic ? t.categoryAr : t.categoryEn))];
  
  const filteredTopics = selectedCategory === 'all' 
    ? debateTopics 
    : debateTopics.filter(t => (isArabic ? t.categoryAr : t.categoryEn) === selectedCategory);

  const handleStartDebate = () => {
    if (selectedTopic) {
      localStorage.setItem('soundEnabled', String(soundEnabled));
      navigate(`/debate/${selectedTopic}`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      {/* Header */}
      <header className="p-4 flex justify-between items-center">
        <h1 className="text-2xl md:text-3xl font-bold text-white">
          {t('appTitle')}
        </h1>
        <div className="flex gap-2">
          {/* Sound Toggle */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
          >
            {soundEnabled ? <Volume2 size={24} /> : <VolumeX size={24} />}
          </button>
          {/* Language Toggle */}
          <button
            onClick={toggleLanguage}
            className="p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors flex items-center gap-2"
          >
            <Globe size={24} />
            <span>{isArabic ? 'EN' : 'عربي'}</span>
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">
            {t('home.title')}
          </h2>
          <p className="text-xl text-gray-300">
            {t('home.subtitle')}
          </p>
        </div>

        {/* Custom Character Images Section */}
        <div className="mb-8">
          <button
            onClick={() => setShowImageUpload(!showImageUpload)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:opacity-90 transition-opacity mb-4"
          >
            <Upload size={20} />
            {isArabic ? 'تخصيص صور الشخصيات' : 'Customize Character Images'}
          </button>
          
          {showImageUpload && (
            <div className="bg-gray-800/80 rounded-2xl p-6 mb-6">
              <h3 className="text-white text-lg mb-4">
                {isArabic ? 'ارفع صورك لتصبح شخصيات المناظرة' : 'Upload your photos to become debate characters'}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Side 1 Image Upload */}
                <div className="flex flex-col items-center">
                  <p className="text-green-400 font-bold mb-3">
                    {isArabic ? 'الطرف الأول' : 'Side 1'}
                  </p>
                  <div 
                    className="relative w-32 h-32 rounded-full border-4 border-green-500 overflow-hidden bg-gray-700 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => side1InputRef.current?.click()}
                  >
                    {side1Image ? (
                      <>
                        <img src={side1Image} alt="Side 1" className="w-full h-full object-cover" />
                        <button
                          onClick={(e) => { e.stopPropagation(); removeImage('side1'); }}
                          className="absolute top-0 right-0 p-1 bg-red-500 rounded-full"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <User size={40} />
                        <span className="text-xs mt-1">{isArabic ? 'اضغط للرفع' : 'Click to upload'}</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={side1InputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload('side1', e)}
                  />
                </div>
                
                {/* Side 2 Image Upload */}
                <div className="flex flex-col items-center">
                  <p className="text-blue-400 font-bold mb-3">
                    {isArabic ? 'الطرف الثاني' : 'Side 2'}
                  </p>
                  <div 
                    className="relative w-32 h-32 rounded-full border-4 border-blue-500 overflow-hidden bg-gray-700 cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={() => side2InputRef.current?.click()}
                  >
                    {side2Image ? (
                      <>
                        <img src={side2Image} alt="Side 2" className="w-full h-full object-cover" />
                        <button
                          onClick={(e) => { e.stopPropagation(); removeImage('side2'); }}
                          className="absolute top-0 right-0 p-1 bg-red-500 rounded-full"
                        >
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
                        <User size={40} />
                        <span className="text-xs mt-1">{isArabic ? 'اضغط للرفع' : 'Click to upload'}</span>
                      </div>
                    )}
                  </div>
                  <input
                    ref={side2InputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleImageUpload('side2', e)}
                  />
                </div>
              </div>
              <p className="text-gray-400 text-sm text-center mt-4">
                {isArabic 
                  ? 'الصور ستظهر كوجوه الشخصيات في المناظرة مع الجسم ثلاثي الأبعاد' 
                  : 'Images will appear as character faces in the debate with 3D body'}
              </p>
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div className="mb-8">
          <h3 className="text-white text-lg mb-3">{t('home.categories')}</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full transition-all ${
                  selectedCategory === category
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {category === 'all' ? t('home.allTopics') : category}
              </button>
            ))}
          </div>
        </div>

        {/* Topic Selection */}
        <div className="mb-8">
          <h3 className="text-white text-lg mb-3">{t('home.selectTopic')}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTopics.map((topic) => (
              <button
                key={topic.id}
                onClick={() => setSelectedTopic(topic.id)}
                className={`p-6 rounded-2xl text-right transition-all transform hover:scale-105 ${
                  selectedTopic === topic.id
                    ? 'bg-gradient-to-br from-blue-500 to-purple-500 ring-4 ring-blue-400'
                    : 'bg-gray-800/80 hover:bg-gray-700/80'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    selectedTopic === topic.id ? 'bg-white/20' : 'bg-gray-700'
                  } text-gray-300`}>
                    {isArabic ? topic.categoryAr : topic.categoryEn}
                  </span>
                </div>
                <h4 className="text-xl font-bold text-white mb-4">
                  {isArabic ? topic.titleAr : topic.titleEn}
                </h4>
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: topic.side1.color }}
                    />
                    <span className="text-sm text-gray-300">
                      {isArabic ? topic.side1.nameAr : topic.side1.nameEn}
                    </span>
                  </div>
                  <span className="text-gray-500">vs</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-300">
                      {isArabic ? topic.side2.nameAr : topic.side2.nameEn}
                    </span>
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: topic.side2.color }}
                    />
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Start Button */}
        <div className="flex justify-center">
          <button
            onClick={handleStartDebate}
            disabled={!selectedTopic}
            className={`flex items-center gap-3 px-8 py-4 rounded-2xl text-xl font-bold transition-all transform ${
              selectedTopic
                ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white hover:scale-105 hover:shadow-2xl hover:shadow-green-500/50'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Play size={28} />
            {t('home.startDebate')}
          </button>
        </div>
      </main>

      {/* Decorative Elements */}
      <div className="fixed top-20 left-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-20 right-10 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />
    </div>
  );
};

export default Home;
