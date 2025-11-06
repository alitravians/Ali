import { useState } from 'react';
import { Upload, Check, Edit2, Archive, Eye, EyeOff } from 'lucide-react';
import { useBannerSettings } from '../hooks/useBannerSettings';
import { uploadBannerImage } from '../utils/uploadImage';

function BannerImageManager() {
  const {
    listBanners,
    getActiveBanner,
    addBanner,
    setActiveBanner,
    renameBanner,
    archiveBanner
  } = useBannerSettings();

  const [uploadFile, setUploadFile] = useState(null);
  const [uploadPreview, setUploadPreview] = useState(null);
  const [bannerName, setBannerName] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState(null);
  const [editingName, setEditingName] = useState('');

  const activeBanner = getActiveBanner();
  const banners = listBanners(showArchived);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadFile(file);
    setUploadError('');
    
    const fileName = file.name.replace(/\.[^/.]+$/, '');
    setBannerName(fileName);

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!uploadFile || !bannerName.trim()) {
      setUploadError('يرجى اختيار صورة وإدخال اسم للبنر');
      return;
    }

    setIsUploading(true);
    setUploadError('');

    try {
      const bannerId = 'b_' + Date.now();
      const { secureUrl, publicId } = await uploadBannerImage(uploadFile, bannerId);
      
      const result = await addBanner(bannerName.trim(), secureUrl, publicId);
      
      if (result.success) {
        alert('✓ تم حفظ البنر وجعله الافتراضي بنجاح!');
        setUploadFile(null);
        setUploadPreview(null);
        setBannerName('');
      } else {
        setUploadError(result.error || 'فشل حفظ البنر');
      }
    } catch (error) {
      setUploadError(error.message || 'حدث خطأ أثناء رفع البنر');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSetActive = async (bannerId) => {
    const result = await setActiveBanner(bannerId);
    if (result.success) {
      alert('✓ تم تعيين البنر كافتراضي');
    } else {
      alert('✗ فشل تعيين البنر: ' + result.error);
    }
  };

  const handleStartEdit = (banner) => {
    setEditingBannerId(banner.id);
    setEditingName(banner.name);
  };

  const handleSaveEdit = async (bannerId) => {
    if (!editingName.trim()) return;
    
    const result = await renameBanner(bannerId, editingName.trim());
    if (result.success) {
      setEditingBannerId(null);
      setEditingName('');
    } else {
      alert('✗ فشل إعادة التسمية: ' + result.error);
    }
  };

  const handleArchive = async (bannerId) => {
    if (!confirm('هل أنت متأكد من أرشفة هذا البنر؟')) return;
    
    const result = await archiveBanner(bannerId, true);
    if (result.success) {
      alert('✓ تم أرشفة البنر');
    } else {
      alert('✗ فشل الأرشفة: ' + result.error);
    }
  };

  const handleRestore = async (bannerId) => {
    const result = await archiveBanner(bannerId, false);
    if (result.success) {
      alert('✓ تم استعادة البنر');
    } else {
      alert('✗ فشل الاستعادة: ' + result.error);
    }
  };

  return (
    <div className="space-y-8">
      {/* Upload Section */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
        <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Upload size={24} />
          <span>رفع بنر جديد</span>
        </h3>

        <div className="space-y-4">
          {/* File Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              اختر صورة البنر
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={isUploading}
              className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-600 file:text-white hover:file:bg-cyan-700 disabled:opacity-50"
            />
          </div>

          {/* Preview */}
          {uploadPreview && (
            <div className="relative rounded-lg overflow-hidden border-2 border-cyan-500">
              <div
                className="w-full bg-cover bg-center"
                style={{
                  backgroundImage: `url(${uploadPreview})`,
                  paddingBottom: '61.39%'
                }}
              />
            </div>
          )}

          {/* Name Input */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              اسم البنر
            </label>
            <input
              type="text"
              value={bannerName}
              onChange={(e) => setBannerName(e.target.value)}
              disabled={isUploading}
              placeholder="أدخل اسم البنر..."
              className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 disabled:opacity-50"
            />
          </div>

          {/* Error Message */}
          {uploadError && (
            <div className="bg-red-500/20 border border-red-500 rounded-lg p-3 text-red-200 text-sm">
              {uploadError}
            </div>
          )}

          {/* Upload Button */}
          <button
            onClick={handleUpload}
            disabled={isUploading || !uploadFile || !bannerName.trim()}
            className="w-full px-6 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold rounded-lg shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {isUploading ? 'جاري الرفع...' : 'حفظ البنر وجعله افتراضي'}
          </button>
        </div>
      </div>

      {/* Banners List */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <span>البنرات المحفوظة</span>
          </h3>
          <button
            onClick={() => setShowArchived(!showArchived)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition-all"
          >
            {showArchived ? <EyeOff size={16} /> : <Eye size={16} />}
            <span>{showArchived ? 'إخفاء المؤرشفة' : 'عرض المؤرشفة'}</span>
          </button>
        </div>

        {banners.length === 0 ? (
          <div className="text-center text-slate-400 py-8">
            لا توجد بنرات {showArchived ? 'مؤرشفة' : 'محفوظة'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {banners.map((banner) => (
              <div
                key={banner.id}
                className={`relative rounded-lg overflow-hidden border-2 transition-all ${
                  banner.id === activeBanner?.id
                    ? 'border-green-500 shadow-lg shadow-green-500/50'
                    : banner.archived
                    ? 'border-slate-600 opacity-60'
                    : 'border-slate-600 hover:border-cyan-500'
                }`}
              >
                {/* Banner Preview */}
                <div
                  className="w-full bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${banner.imageUrl})`,
                    paddingBottom: '61.39%'
                  }}
                />

                {/* Active Badge */}
                {banner.id === activeBanner?.id && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                    <Check size={14} />
                    <span>افتراضي</span>
                  </div>
                )}

                {/* Archived Badge */}
                {banner.archived && (
                  <div className="absolute top-2 left-2 bg-slate-700 text-white px-3 py-1 rounded-full text-xs font-bold">
                    مؤرشف
                  </div>
                )}

                {/* Banner Info */}
                <div className="bg-slate-800/95 p-3 space-y-2">
                  {/* Name */}
                  {editingBannerId === banner.id ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="flex-1 px-2 py-1 bg-slate-700 border border-slate-600 rounded text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                      <button
                        onClick={() => handleSaveEdit(banner.id)}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-sm"
                      >
                        حفظ
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <span className="text-white font-semibold text-sm">{banner.name}</span>
                      <button
                        onClick={() => handleStartEdit(banner)}
                        className="p-1 hover:bg-slate-700 rounded transition-all"
                      >
                        <Edit2 size={14} className="text-slate-400" />
                      </button>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2">
                    {!banner.archived && banner.id !== activeBanner?.id && (
                      <button
                        onClick={() => handleSetActive(banner.id)}
                        className="flex-1 px-3 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-sm font-medium transition-all"
                      >
                        اجعله افتراضي
                      </button>
                    )}
                    {banner.id !== 'default' && (
                      <button
                        onClick={() => banner.archived ? handleRestore(banner.id) : handleArchive(banner.id)}
                        className={`flex-1 px-3 py-1.5 rounded text-sm font-medium transition-all ${
                          banner.archived
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : 'bg-slate-700 hover:bg-slate-600 text-white'
                        }`}
                      >
                        {banner.archived ? 'استعادة' : 'أرشفة'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BannerImageManager;
