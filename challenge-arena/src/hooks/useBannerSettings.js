import { useState, useEffect } from 'react';
import { database } from '../utils/firebase';
import { ref, onValue, set } from 'firebase/database';

const DEFAULT_PRESETS = {
  default: {
    meta: { 
      name: 'افتراضي', 
      nameEn: 'Default',
      description: 'التصميم الافتراضي المتوازن'
    },
    base: {
      opponent1: { left: 30, top: 57.5, size: 29 },
      opponent2: { left: 70, top: 57.5, size: 29 },
      vs: { left: 50, top: 50, fontSize: 3 },
      score: { left: 50, top: 62, show: true },
      timeBadge: { left: 50, top: 96 },
      nameAlign: 'center',
      nameFontSize: 0.75,
      description: { enabled: false, left: 50, top: 75, width: 60, align: 'center' }
    }
  },
  compact: {
    meta: { 
      name: 'مضغوط', 
      nameEn: 'Compact',
      description: 'تصميم مضغوط للمساحات الصغيرة'
    },
    base: {
      opponent1: { left: 25, top: 50, size: 25 },
      opponent2: { left: 75, top: 50, size: 25 },
      vs: { left: 50, top: 50, fontSize: 2.5 },
      score: { left: 50, top: 68, show: true },
      timeBadge: { left: 50, top: 90 },
      nameAlign: 'center',
      nameFontSize: 0.7,
      description: { enabled: false, left: 50, top: 78, width: 50, align: 'center' }
    }
  },
  wide: {
    meta: { 
      name: 'عريض', 
      nameEn: 'Wide',
      description: 'تصميم عريض مع مساحة أكبر'
    },
    base: {
      opponent1: { left: 20, top: 57.5, size: 32 },
      opponent2: { left: 80, top: 57.5, size: 32 },
      vs: { left: 50, top: 50, fontSize: 3.5 },
      score: { left: 50, top: 65, show: true },
      timeBadge: { left: 50, top: 96 },
      nameAlign: 'center',
      nameFontSize: 0.85,
      description: { enabled: false, left: 50, top: 75, width: 70, align: 'center' }
    }
  },
  mirroredRtl: {
    meta: { 
      name: 'معكوس (RTL)', 
      nameEn: 'Mirrored RTL',
      description: 'تصميم معكوس للعربية'
    },
    base: {
      opponent1: { left: 70, top: 57.5, size: 29 },
      opponent2: { left: 30, top: 57.5, size: 29 },
      vs: { left: 50, top: 50, fontSize: 3 },
      score: { left: 50, top: 62, show: true },
      timeBadge: { left: 50, top: 96 },
      nameAlign: 'center',
      nameFontSize: 0.75,
      description: { enabled: false, left: 50, top: 75, width: 60, align: 'center' }
    }
  }
};

export function useBannerSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const settingsRef = ref(database, 'config/bannerSettings/v1');
    
    const unsubscribe = onValue(settingsRef, (snapshot) => {
      try {
        if (snapshot.exists()) {
          setSettings(snapshot.val());
        } else {
          const initialSettings = {
            global: {
              activePresetId: 'default',
              presets: DEFAULT_PRESETS
            },
            perChallenge: {}
          };
          setSettings(initialSettings);
        }
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    }, (err) => {
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const saveSettings = async (newSettings) => {
    try {
      const settingsRef = ref(database, 'config/bannerSettings/v1');
      await set(settingsRef, {
        ...newSettings,
        updatedAt: Date.now(),
        updatedBy: 'admin'
      });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  };

  const getActivePreset = () => {
    if (!settings) return DEFAULT_PRESETS.default;
    
    const activePresetId = settings.global?.activePresetId || 'default';
    const preset = settings.global?.presets?.[activePresetId];
    
    return preset || DEFAULT_PRESETS.default;
  };

  const getChallengeLayout = (challengeId) => {
    if (!settings) return DEFAULT_PRESETS.default;
    
    const challengeSettings = settings.perChallenge?.[challengeId];
    if (challengeSettings) {
      const presetId = challengeSettings.activePresetId || 'default';
      const basePreset = settings.global?.presets?.[presetId] || DEFAULT_PRESETS.default;
      
      if (challengeSettings.overrides) {
        return {
          ...basePreset,
          base: {
            ...basePreset.base,
            ...challengeSettings.overrides.base
          }
        };
      }
      return basePreset;
    }
    
    return getActivePreset();
  };

  const setActivePreset = async (presetId) => {
    if (!settings) return { success: false, error: 'Settings not loaded' };
    
    const newSettings = {
      ...settings,
      global: {
        ...settings.global,
        activePresetId: presetId
      }
    };
    
    return await saveSettings(newSettings);
  };

  const saveCustomPreset = async (presetId, presetData) => {
    if (!settings) return { success: false, error: 'Settings not loaded' };
    
    const newSettings = {
      ...settings,
      global: {
        ...settings.global,
        presets: {
          ...settings.global.presets,
          [presetId]: presetData
        }
      }
    };
    
    return await saveSettings(newSettings);
  };

  const resetToDefaults = async () => {
    const defaultSettings = {
      global: {
        activePresetId: 'default',
        presets: DEFAULT_PRESETS
      },
      perChallenge: {}
    };
    
    return await saveSettings(defaultSettings);
  };

  return {
    settings,
    loading,
    error,
    getActivePreset,
    getChallengeLayout,
    setActivePreset,
    saveCustomPreset,
    saveSettings,
    resetToDefaults,
    DEFAULT_PRESETS
  };
}
