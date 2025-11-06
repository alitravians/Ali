import { useState, useRef, useEffect } from 'react';
import { Settings, RotateCcw, Save, Eye } from 'lucide-react';
import BannerCard from './BannerCard';

function BannerLayoutEditor({ 
  initialLayout, 
  onSave, 
  presets, 
  activePresetId,
  onPresetChange,
  challenges = []
}) {
  const [layout, setLayout] = useState(initialLayout);
  const [dragging, setDragging] = useState(null);
  const [previewChallenge, setPreviewChallenge] = useState(null);
  const bannerRef = useRef(null);
  const [bannerRect, setBannerRect] = useState(null);

  useEffect(() => {
    setLayout(initialLayout);
  }, [initialLayout]);

  useEffect(() => {
    if (challenges.length > 0 && !previewChallenge) {
      setPreviewChallenge(challenges[0]);
    }
  }, [challenges, previewChallenge]);

  useEffect(() => {
    if (bannerRef.current) {
      const rect = bannerRef.current.getBoundingClientRect();
      setBannerRect(rect);
    }
  }, []);

  const mockChallenge = previewChallenge || {
    id: 'preview',
    opponent1: 'اللاعب الأول',
    opponent2: 'اللاعب الثاني',
    opponent1Avatar: '/default-avatar.png',
    opponent2Avatar: '/default-avatar.png',
    opponent1PlatformId: '123456',
    opponent2PlatformId: '789012',
    dateTime: new Date().toISOString(),
    roundType: 'الجولة 1',
    score1: 5,
    score2: 3,
    result: null
  };

  const handleMouseDown = (element, e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!bannerRef.current) return;
    
    const rect = bannerRef.current.getBoundingClientRect();
    setBannerRect(rect);
    
    setDragging({
      element,
      startX: e.clientX,
      startY: e.clientY,
      startLeft: layout[element]?.left || 50,
      startTop: layout[element]?.top || 50
    });
  };

  const handleMouseMove = (e) => {
    if (!dragging || !bannerRect) return;

    const deltaX = e.clientX - dragging.startX;
    const deltaY = e.clientY - dragging.startY;
    
    const percentX = (deltaX / bannerRect.width) * 100;
    const percentY = (deltaY / bannerRect.height) * 100;
    
    let newLeft = dragging.startLeft + percentX;
    let newTop = dragging.startTop + percentY;
    
    newLeft = Math.max(0, Math.min(100, newLeft));
    newTop = Math.max(0, Math.min(100, newTop));
    
    newLeft = Math.round(newLeft * 2) / 2;
    newTop = Math.round(newTop * 2) / 2;

    setLayout(prev => ({
      ...prev,
      [dragging.element]: {
        ...prev[dragging.element],
        left: newLeft,
        top: newTop
      }
    }));
  };

  const handleMouseUp = () => {
    setDragging(null);
  };

  useEffect(() => {
    if (dragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [dragging, bannerRect]);

  const handleInputChange = (element, property, value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return;
    
    setLayout(prev => ({
      ...prev,
      [element]: {
        ...prev[element],
        [property]: numValue
      }
    }));
  };

  const handleSave = () => {
    onSave(layout);
  };

  const handleReset = () => {
    setLayout(initialLayout);
  };

  const handleMirror = () => {
    setLayout(prev => ({
      ...prev,
      opponent1: {
        ...prev.opponent1,
        left: 100 - prev.opponent1.left
      },
      opponent2: {
        ...prev.opponent2,
        left: 100 - prev.opponent2.left
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="bg-white/5 backdrop-blur-xl rounded-2xl p-6 border border-white/10">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Settings className="text-purple-400" size={24} />
            <h3 className="text-xl font-bold text-white">تخصيص تصميم البنر</h3>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <select
              value={activePresetId}
              onChange={(e) => onPresetChange(e.target.value)}
              className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              {Object.entries(presets).map(([id, preset]) => (
                <option key={id} value={id} className="bg-slate-800">
                  {preset.meta.name}
                </option>
              ))}
            </select>
            
            {challenges.length > 0 && (
              <select
                value={previewChallenge?.id || ''}
                onChange={(e) => {
                  const challenge = challenges.find(c => c.id === e.target.value);
                  setPreviewChallenge(challenge);
                }}
                className="px-4 py-2 bg-white/10 text-white border border-white/20 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="" className="bg-slate-800">معاينة تحدي حقيقي</option>
                {challenges.map((challenge) => (
                  <option key={challenge.id} value={challenge.id} className="bg-slate-800">
                    {challenge.opponent1} VS {challenge.opponent2}
                  </option>
                ))}
              </select>
            )}
            
            <button
              onClick={handleMirror}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all flex items-center gap-2"
            >
              <RotateCcw size={18} />
              عكس الاتجاه
            </button>
            
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl transition-all flex items-center gap-2"
            >
              <RotateCcw size={18} />
              إعادة تعيين
            </button>
            
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl transition-all flex items-center gap-2 font-bold"
            >
              <Save size={18} />
              حفظ التغييرات
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
              <h4 className="text-white font-bold mb-3 flex items-center gap-2">
                <Eye size={18} />
                معاينة مباشرة
              </h4>
              <p className="text-gray-400 text-sm mb-4">اسحب العناصر بالماوس لتحريكها</p>
              
              <div 
                ref={bannerRef}
                className="relative"
                style={{ 
                  cursor: dragging ? 'grabbing' : 'default',
                  userSelect: 'none'
                }}
              >
                <BannerCard challenge={mockChallenge} customLayout={layout} />
                
                <div 
                  className="absolute z-30 cursor-move hover:ring-4 hover:ring-orange-400 rounded-full transition-all"
                  style={{
                    left: `${layout.opponent1.left}%`,
                    top: `${layout.opponent1.top}%`,
                    transform: 'translate(-50%, -50%)',
                    width: `${layout.opponent1.size}%`,
                    aspectRatio: '1/1',
                    pointerEvents: dragging?.element === 'opponent1' ? 'none' : 'auto'
                  }}
                  onMouseDown={(e) => handleMouseDown('opponent1', e)}
                  title="اسحب لتحريك الخصم الأول"
                >
                  {dragging?.element === 'opponent1' && (
                    <div className="absolute inset-0 bg-orange-500/30 rounded-full border-4 border-orange-400 animate-pulse" />
                  )}
                </div>

                <div 
                  className="absolute z-30 cursor-move hover:ring-4 hover:ring-blue-400 rounded-full transition-all"
                  style={{
                    left: `${layout.opponent2.left}%`,
                    top: `${layout.opponent2.top}%`,
                    transform: 'translate(-50%, -50%)',
                    width: `${layout.opponent2.size}%`,
                    aspectRatio: '1/1',
                    pointerEvents: dragging?.element === 'opponent2' ? 'none' : 'auto'
                  }}
                  onMouseDown={(e) => handleMouseDown('opponent2', e)}
                  title="اسحب لتحريك الخصم الثاني"
                >
                  {dragging?.element === 'opponent2' && (
                    <div className="absolute inset-0 bg-blue-500/30 rounded-full border-4 border-blue-400 animate-pulse" />
                  )}
                </div>

                <div 
                  className="absolute z-30 cursor-move hover:ring-4 hover:ring-purple-400 transition-all"
                  style={{
                    left: `${layout.vs.left}%`,
                    top: `${layout.vs.top}%`,
                    transform: 'translate(-50%, -50%)',
                    width: '60px',
                    height: '60px',
                    pointerEvents: dragging?.element === 'vs' ? 'none' : 'auto'
                  }}
                  onMouseDown={(e) => handleMouseDown('vs', e)}
                  title="اسحب لتحريك VS"
                >
                  {dragging?.element === 'vs' && (
                    <div className="absolute inset-0 bg-purple-500/30 border-4 border-purple-400 animate-pulse rounded-lg" />
                  )}
                </div>

                <div 
                  className="absolute z-30 cursor-move hover:ring-4 hover:ring-green-400 transition-all"
                  style={{
                    left: `${layout.timeBadge.left}%`,
                    top: `${layout.timeBadge.top}%`,
                    transform: 'translate(-50%, -50%)',
                    width: '120px',
                    height: '40px',
                    pointerEvents: dragging?.element === 'timeBadge' ? 'none' : 'auto'
                  }}
                  onMouseDown={(e) => handleMouseDown('timeBadge', e)}
                  title="اسحب لتحريك شارة الوقت"
                >
                  {dragging?.element === 'timeBadge' && (
                    <div className="absolute inset-0 bg-green-500/30 border-4 border-green-400 animate-pulse rounded-full" />
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded-xl p-4 border border-white/10">
              <h4 className="text-white font-bold mb-3">التحكم الدقيق</h4>
              
              <div className="space-y-4">
                <div className="bg-white/5 rounded-lg p-3">
                  <h5 className="text-orange-400 font-bold mb-2 text-sm">الخصم الأول</h5>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">اليسار %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={layout.opponent1.left}
                        onChange={(e) => handleInputChange('opponent1', 'left', e.target.value)}
                        className="w-full px-2 py-1 bg-white/10 text-white text-sm border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">الأعلى %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={layout.opponent1.top}
                        onChange={(e) => handleInputChange('opponent1', 'top', e.target.value)}
                        className="w-full px-2 py-1 bg-white/10 text-white text-sm border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">الحجم %</label>
                      <input
                        type="number"
                        min="10"
                        max="50"
                        step="1"
                        value={layout.opponent1.size}
                        onChange={(e) => handleInputChange('opponent1', 'size', e.target.value)}
                        className="w-full px-2 py-1 bg-white/10 text-white text-sm border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-orange-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-3">
                  <h5 className="text-blue-400 font-bold mb-2 text-sm">الخصم الثاني</h5>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">اليسار %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={layout.opponent2.left}
                        onChange={(e) => handleInputChange('opponent2', 'left', e.target.value)}
                        className="w-full px-2 py-1 bg-white/10 text-white text-sm border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">الأعلى %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={layout.opponent2.top}
                        onChange={(e) => handleInputChange('opponent2', 'top', e.target.value)}
                        className="w-full px-2 py-1 bg-white/10 text-white text-sm border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">الحجم %</label>
                      <input
                        type="number"
                        min="10"
                        max="50"
                        step="1"
                        value={layout.opponent2.size}
                        onChange={(e) => handleInputChange('opponent2', 'size', e.target.value)}
                        className="w-full px-2 py-1 bg-white/10 text-white text-sm border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-3">
                  <h5 className="text-purple-400 font-bold mb-2 text-sm">VS</h5>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">اليسار %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={layout.vs.left}
                        onChange={(e) => handleInputChange('vs', 'left', e.target.value)}
                        className="w-full px-2 py-1 bg-white/10 text-white text-sm border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">الأعلى %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={layout.vs.top}
                        onChange={(e) => handleInputChange('vs', 'top', e.target.value)}
                        className="w-full px-2 py-1 bg-white/10 text-white text-sm border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">حجم الخط</label>
                      <input
                        type="number"
                        min="1"
                        max="6"
                        step="0.1"
                        value={layout.vs.fontSize}
                        onChange={(e) => handleInputChange('vs', 'fontSize', e.target.value)}
                        className="w-full px-2 py-1 bg-white/10 text-white text-sm border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-purple-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-3">
                  <h5 className="text-green-400 font-bold mb-2 text-sm">شارة الوقت</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">اليسار %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={layout.timeBadge.left}
                        onChange={(e) => handleInputChange('timeBadge', 'left', e.target.value)}
                        className="w-full px-2 py-1 bg-white/10 text-white text-sm border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">الأعلى %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.5"
                        value={layout.timeBadge.top}
                        onChange={(e) => handleInputChange('timeBadge', 'top', e.target.value)}
                        className="w-full px-2 py-1 bg-white/10 text-white text-sm border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-white/5 rounded-lg p-3">
                  <h5 className="text-yellow-400 font-bold mb-2 text-sm">إعدادات الأسماء</h5>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">محاذاة النص</label>
                      <select
                        value={layout.nameAlign}
                        onChange={(e) => setLayout(prev => ({ ...prev, nameAlign: e.target.value }))}
                        className="w-full px-2 py-1 bg-white/10 text-white text-sm border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      >
                        <option value="center" className="bg-slate-800">وسط</option>
                        <option value="left" className="bg-slate-800">يسار</option>
                        <option value="right" className="bg-slate-800">يمين</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 block mb-1">حجم الخط</label>
                      <input
                        type="number"
                        min="0.5"
                        max="2"
                        step="0.05"
                        value={layout.nameFontSize}
                        onChange={(e) => setLayout(prev => ({ ...prev, nameFontSize: parseFloat(e.target.value) }))}
                        className="w-full px-2 py-1 bg-white/10 text-white text-sm border border-white/20 rounded focus:outline-none focus:ring-2 focus:ring-yellow-500"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default BannerLayoutEditor;
