import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { getMaintenanceState, setMaintenanceState, isAdminAuthenticated } from '@/utils/localStorage';
import type { MaintenanceState, CountdownSettings } from '@/types/maintenance';

export function AdminEditCountdown() {
  const navigate = useNavigate();
  const [maintenanceState, setMaintenanceStateLocal] = useState<MaintenanceState>(() => getMaintenanceState());

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate('/admin');
    }
  }, [navigate]);

  const handleMaintenanceToggle = () => {
    const newState: MaintenanceState = {
      ...maintenanceState,
      isEnabled: !maintenanceState.isEnabled,
      countdown: !maintenanceState.isEnabled ? {
        days: maintenanceState.countdown?.days ?? 0,
        hours: maintenanceState.countdown?.hours ?? 0,
        minutes: maintenanceState.countdown?.minutes ?? 30,
        seconds: maintenanceState.countdown?.seconds ?? 0,
        reason: maintenanceState.countdown?.reason ?? 'الصيانة الدورية',
        endMessage: maintenanceState.countdown?.endMessage ?? 'انتهت فترة الصيانة'
      } : null
    };
    setMaintenanceStateLocal(newState);
    setMaintenanceState(newState);
  };

  const handleInputChange = (field: keyof CountdownSettings, value: string | number) => {
    setMaintenanceStateLocal(prev => ({
      ...prev,
      countdown: prev.countdown ? {
        ...prev.countdown,
        [field]: typeof value === 'string' ? value : (parseInt(String(value)) || 0)
      } : null
    }));
  };

  const handleSave = () => {
    if (!maintenanceState.isEnabled) {
      setMaintenanceStateLocal(prev => ({ ...prev, countdown: null }));
      setMaintenanceState({ ...maintenanceState, countdown: null });
    } else {
      const newState: MaintenanceState = {
        ...maintenanceState,
        countdown: maintenanceState.countdown ?? {
          days: 0,
          hours: 0,
          minutes: 30,
          seconds: 0,
          reason: '',
          endMessage: ''
        }
      };
      setMaintenanceStateLocal(newState);
      setMaintenanceState(newState);
    }
    import('@/utils/eventBus').then(({ eventBus }) => {
      eventBus.emit('maintenanceStateChanged');
    });
    navigate('/admin/dashboard');
  };

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">إعدادات العد التنازلي</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-4">
              <Label htmlFor="maintenance-mode">وضع الصيانة</Label>
              <Switch
                id="maintenance-mode"
                checked={maintenanceState.isEnabled}
                onCheckedChange={handleMaintenanceToggle}
              />
            </div>

            {maintenanceState.isEnabled && (
              <>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <label className="block text-sm mb-1">أيام</label>
                    <Input
                      type="number"
                      min="0"
                      value={maintenanceState.countdown?.days ?? 0}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('days', e.target.value)}
                      className="text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">ساعات</label>
                    <Input
                      type="number"
                      min="0"
                      max="23"
                      value={maintenanceState.countdown?.hours ?? 0}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('hours', e.target.value)}
                      className="text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">دقائق</label>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={maintenanceState.countdown?.minutes ?? 0}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('minutes', e.target.value)}
                      className="text-right"
                    />
                  </div>
                  <div>
                    <label className="block text-sm mb-1">ثواني</label>
                    <Input
                      type="number"
                      min="0"
                      max="59"
                      value={maintenanceState.countdown?.seconds ?? 0}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('seconds', e.target.value)}
                      className="text-right"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm mb-1">سبب العد التنازلي</label>
                  <Input
                    value={maintenanceState.countdown?.reason ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('reason', e.target.value)}
                    className="text-right"
                    placeholder="أدخل السبب"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">رسالة النهاية</label>
                  <Input
                    value={maintenanceState.countdown?.endMessage ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('endMessage', e.target.value)}
                    className="text-right"
                    placeholder="الرسالة التي ستظهر عند انتهاء العد"
                  />
                </div>
              </>
            )}
            <div className="flex gap-4">
              <Button onClick={handleSave} className="flex-1">
                حفظ التغييرات
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate('/admin/dashboard')}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
