import React from 'react';
import { Picker } from 'emoji-mart';
import 'emoji-mart/css/emoji-mart.css';
import { useTranslation } from 'react-i18next';

const EmojiPicker = ({ onEmojiSelect }) => {
  const { i18n } = useTranslation();
  
  return (
    <Picker
      set="apple"
      title="Pick your emoji"
      emoji="point_up"
      i18n={{
        search: i18n.language === 'ar' ? 'بحث' : 'Search',
        categories: {
          search: i18n.language === 'ar' ? 'نتائج البحث' : 'Search Results',
          recent: i18n.language === 'ar' ? 'الأخيرة' : 'Recent',
          smileys: i18n.language === 'ar' ? 'وجوه ضاحكة' : 'Smileys & Emotion',
          people: i18n.language === 'ar' ? 'أشخاص' : 'People & Body',
          nature: i18n.language === 'ar' ? 'طبيعة' : 'Animals & Nature',
          foods: i18n.language === 'ar' ? 'طعام' : 'Food & Drink',
          activity: i18n.language === 'ar' ? 'نشاط' : 'Activity',
          places: i18n.language === 'ar' ? 'أماكن' : 'Travel & Places',
          objects: i18n.language === 'ar' ? 'أشياء' : 'Objects',
          symbols: i18n.language === 'ar' ? 'رموز' : 'Symbols',
          flags: i18n.language === 'ar' ? 'أعلام' : 'Flags'
        }
      }}
      onSelect={onEmojiSelect}
      style={{ width: '100%' }}
    />
  );
};

export default EmojiPicker;
