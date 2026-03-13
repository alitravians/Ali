import { useState } from 'react';
import { useApp } from '../context/AppContext';
import Header from '../components/Header';
import Toggle from '../components/Toggle';
import {
  Power, Clock, UserX, Users, Moon, Sun, Bell,
  AlertTriangle, Shield, Plus, X, Smartphone
} from 'lucide-react';

export default function SettingsPage() {
  const { settings, updateSettings } = useApp();
  const [newNumber, setNewNumber] = useState('');

  const addExcludedNumber = () => {
    const num = newNumber.trim();
    if (num && !settings.excludedNumbers.includes(num)) {
      updateSettings({
        ...settings,
        excludedNumbers: [...settings.excludedNumbers, num],
      });
      setNewNumber('');
    }
  };

  const removeExcludedNumber = (num: string) => {
    updateSettings({
      ...settings,
      excludedNumbers: settings.excludedNumbers.filter(n => n !== num),
    });
  };

  return (
    <div className="min-h-screen bg-gray-950 pb-20">
      <Header title="الإعدادات" />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Service Control */}
        <SettingSection title="التحكم بالخدمة" icon={<Power size={16} className="text-emerald-400" />}>
          <SettingRow
            label="تشغيل الخدمة"
            description="تفعيل أو تعطيل الردود التلقائية بالكامل"
          >
            <Toggle
              enabled={settings.isServiceEnabled}
              onChange={(val) => updateSettings({ ...settings, isServiceEnabled: val })}
            />
          </SettingRow>
        </SettingSection>

        {/* Schedule */}
        <SettingSection title="الجدولة الزمنية" icon={<Clock size={16} className="text-blue-400" />}>
          <SettingRow
            label="تشغيل في أوقات محددة"
            description="تفعيل الردود فقط خلال ساعات محددة"
          >
            <Toggle
              enabled={settings.scheduleEnabled}
              onChange={(val) => updateSettings({ ...settings, scheduleEnabled: val })}
              size="sm"
            />
          </SettingRow>
          {settings.scheduleEnabled && (
            <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-800">
              <div>
                <label className="text-xs text-gray-400 mb-1 block">من الساعة</label>
                <input
                  type="time"
                  value={settings.scheduleFrom}
                  onChange={(e) => updateSettings({ ...settings, scheduleFrom: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  dir="ltr"
                />
              </div>
              <div>
                <label className="text-xs text-gray-400 mb-1 block">إلى الساعة</label>
                <input
                  type="time"
                  value={settings.scheduleTo}
                  onChange={(e) => updateSettings({ ...settings, scheduleTo: e.target.value })}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg py-2 px-3 text-sm text-white focus:outline-none focus:border-emerald-500/50"
                  dir="ltr"
                />
              </div>
            </div>
          )}
        </SettingSection>

        {/* Reply Target */}
        <SettingSection title="هدف الرد" icon={<Users size={16} className="text-purple-400" />}>
          <div className="space-y-2">
            {[
              { value: 'all' as const, label: 'الجميع', desc: 'الرد على جميع الرسائل الواردة' },
              { value: 'unsaved' as const, label: 'الأرقام غير المحفوظة', desc: 'الرد فقط على الأرقام غير المسجلة في جهات الاتصال' },
              { value: 'saved' as const, label: 'جهات الاتصال المحفوظة', desc: 'الرد فقط على الأرقام المسجلة' },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => updateSettings({ ...settings, replyTarget: option.value })}
                className={`w-full text-right p-3 rounded-xl border transition-all ${
                  settings.replyTarget === option.value
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-gray-800/50 border-gray-800 hover:border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                    settings.replyTarget === option.value
                      ? 'border-emerald-400'
                      : 'border-gray-600'
                  }`}>
                    {settings.replyTarget === option.value && (
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                    )}
                  </div>
                  <div>
                    <p className={`text-sm font-medium ${
                      settings.replyTarget === option.value ? 'text-emerald-400' : 'text-white'
                    }`}>{option.label}</p>
                    <p className="text-[11px] text-gray-500 mt-0.5">{option.desc}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </SettingSection>

        {/* Excluded Numbers */}
        <SettingSection title="الأرقام المستثناة" icon={<UserX size={16} className="text-red-400" />}>
          <p className="text-xs text-gray-500 mb-3">أرقام لن يتم الرد عليها تلقائياً</p>
          <div className="flex items-center gap-2 mb-3">
            <input
              type="tel"
              value={newNumber}
              onChange={(e) => setNewNumber(e.target.value)}
              placeholder="+966501234567"
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl py-2 px-3 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50"
              dir="ltr"
            />
            <button
              onClick={addExcludedNumber}
              disabled={!newNumber.trim()}
              className={`p-2.5 rounded-xl transition-colors ${
                newNumber.trim()
                  ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                  : 'bg-gray-800 text-gray-600'
              }`}
            >
              <Plus size={16} />
            </button>
          </div>
          {settings.excludedNumbers.length > 0 && (
            <div className="space-y-1.5">
              {settings.excludedNumbers.map((num) => (
                <div
                  key={num}
                  className="flex items-center justify-between bg-gray-800/50 rounded-lg px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <Smartphone size={12} className="text-gray-500" />
                    <span className="text-sm text-gray-300" dir="ltr">{num}</span>
                  </div>
                  <button
                    onClick={() => removeExcludedNumber(num)}
                    className="p-1 text-gray-500 hover:text-red-400"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </SettingSection>

        {/* Appearance */}
        <SettingSection
          title="المظهر"
          icon={settings.darkMode ? <Moon size={16} className="text-indigo-400" /> : <Sun size={16} className="text-amber-400" />}
        >
          <SettingRow label="الوضع الداكن" description="تبديل بين الوضع الداكن والفاتح">
            <Toggle
              enabled={settings.darkMode}
              onChange={(val) => updateSettings({ ...settings, darkMode: val })}
              size="sm"
            />
          </SettingRow>
        </SettingSection>

        {/* Notifications */}
        <SettingSection title="الإشعارات" icon={<Bell size={16} className="text-amber-400" />}>
          <SettingRow label="تنبيه عند مطابقة كلمة" description="إشعار عند وصول رسالة تطابق كلمة مفتاحية">
            <Toggle
              enabled={settings.notifyOnMatch}
              onChange={(val) => updateSettings({ ...settings, notifyOnMatch: val })}
              size="sm"
            />
          </SettingRow>
          <div className="border-t border-gray-800 my-2" />
          <SettingRow label="تنبيه فشل الإرسال" description="إشعار عند فشل إرسال الرد التلقائي">
            <Toggle
              enabled={settings.notifyOnFailure}
              onChange={(val) => updateSettings({ ...settings, notifyOnFailure: val })}
              size="sm"
            />
          </SettingRow>
          <div className="border-t border-gray-800 my-2" />
          <SettingRow label="تنبيه إيقاف الخدمة" description="إشعار عند توقف الخدمة أو مشكلة في الصلاحيات">
            <Toggle
              enabled={settings.notifyOnServiceStop}
              onChange={(val) => updateSettings({ ...settings, notifyOnServiceStop: val })}
              size="sm"
            />
          </SettingRow>
        </SettingSection>

        {/* WhatsApp Integration Info */}
        <SettingSection title="تكامل واتساب" icon={<Shield size={16} className="text-emerald-400" />}>
          <div className="bg-amber-500/10 rounded-xl p-3 border border-amber-500/20">
            <div className="flex items-start gap-2">
              <AlertTriangle size={14} className="text-amber-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs text-amber-400 font-medium mb-1">ملاحظة مهمة</p>
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  يعمل التطبيق عبر قراءة إشعارات واتساب والرد من خلال خاصية الرد السريع في الإشعارات. 
                  يحتاج التطبيق صلاحية الوصول للإشعارات (Notification Access) ليعمل بشكل صحيح.
                </p>
              </div>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            <InfoRow label="الطريقة" value="NotificationListener" />
            <InfoRow label="التوافق" value="واتساب العادي" />
            <InfoRow label="الصلاحية" value="الوصول للإشعارات" />
            <InfoRow label="الأمان" value="نظامي وآمن" />
          </div>
        </SettingSection>

        {/* App Info */}
        <div className="text-center py-4">
          <p className="text-xs text-gray-600">الردود التلقائية لواتساب</p>
          <p className="text-[10px] text-gray-700 mt-1">الإصدار 1.0.0</p>
        </div>
      </div>
    </div>
  );
}

function SettingSection({ title, icon, children }: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
      <div className="flex items-center gap-2 px-4 pt-4 pb-2">
        {icon}
        <h3 className="text-sm font-bold text-white">{title}</h3>
      </div>
      <div className="px-4 pb-4">{children}</div>
    </div>
  );
}

function SettingRow({ label, description, children }: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex-1 min-w-0 ml-3">
        <p className="text-sm text-white">{label}</p>
        {description && <p className="text-[11px] text-gray-500 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-xs text-gray-300 font-medium">{value}</span>
    </div>
  );
}
