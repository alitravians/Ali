import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getMaintenanceState } from '@/utils/localStorage';
import { eventBus } from '@/utils/eventBus';

interface CountdownState {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isRunning: boolean;
  targetDate: Date | null;
}

export function CountdownTimer() {
  const [state, setState] = useState<CountdownState>(() => {
    const maintenance = getMaintenanceState();
    if (!maintenance.isEnabled || !maintenance.countdown) return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isRunning: false,
      targetDate: null
    };

    const now = new Date();
    const target = new Date(now.getTime() +
      (maintenance.countdown.days * 24 * 60 * 60 * 1000) +
      (maintenance.countdown.hours * 60 * 60 * 1000) +
      (maintenance.countdown.minutes * 60 * 1000) +
      (maintenance.countdown.seconds * 1000)
    );

    return {
      days: maintenance.countdown.days,
      hours: maintenance.countdown.hours,
      minutes: maintenance.countdown.minutes,
      seconds: maintenance.countdown.seconds,
      isRunning: true,
      targetDate: target
    };
  });

  useEffect(() => {
    const handleMaintenanceChange = () => {
      const maintenance = getMaintenanceState();
      if (!maintenance.isEnabled || !maintenance.countdown) {
        setState({
          days: 0,
          hours: 0,
          minutes: 0,
          seconds: 0,
          isRunning: false,
          targetDate: null
        });
        return;
      }

      const now = new Date();
      const target = new Date(now.getTime() +
        (maintenance.countdown.days * 24 * 60 * 60 * 1000) +
        (maintenance.countdown.hours * 60 * 60 * 1000) +
        (maintenance.countdown.minutes * 60 * 1000) +
        (maintenance.countdown.seconds * 1000)
      );

      setState({
        days: maintenance.countdown.days,
        hours: maintenance.countdown.hours,
        minutes: maintenance.countdown.minutes,
        seconds: maintenance.countdown.seconds,
        isRunning: true,
        targetDate: target
      });
    };

    eventBus.on('maintenanceStateChanged', handleMaintenanceChange);
    return () => eventBus.off('maintenanceStateChanged', handleMaintenanceChange);
  }, []);

  useEffect(() => {
    if (!state.isRunning || !state.targetDate) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const target = state.targetDate!.getTime();
      const distance = target - now;

      if (distance < 0) {
        setState(prev => ({ ...prev, isRunning: false }));
        clearInterval(interval);
        return;
      }

      setState(prev => ({
        ...prev,
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      }));
    }, 1000);

    return () => clearInterval(interval);
  }, [state.isRunning, state.targetDate]);

  const maintenance = getMaintenanceState();
  if (!maintenance.isEnabled || !maintenance.countdown) return null;

  return (
    <Card className="bg-white/10 backdrop-blur-lg border-none">
      <CardHeader>
        <CardTitle className="text-center text-3xl font-bold">الموقع مغلق للصيانة</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4 mb-8 text-center">
          <div className="flex flex-col items-center">
            <div className="text-4xl font-bold">{state.days}</div>
            <div className="text-sm">أيام</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-4xl font-bold">{state.hours}</div>
            <div className="text-sm">ساعات</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-4xl font-bold">{state.minutes}</div>
            <div className="text-sm">دقائق</div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-4xl font-bold">{state.seconds}</div>
            <div className="text-sm">ثواني</div>
          </div>
        </div>

        {maintenance.countdown?.reason && (
          <div className="mt-4 p-4 bg-white/10 rounded-lg text-center">
            <p className="text-lg">سبب الصيانة: {maintenance.countdown.reason}</p>
          </div>
        )}

        {!state.isRunning && state.targetDate && new Date().getTime() > state.targetDate.getTime() && (
          <div className="mt-4 p-4 bg-green-500/20 rounded-lg text-center">
            <h3 className="text-xl font-bold mb-2">{maintenance.countdown.endMessage || 'انتهى وقت الصيانة!'}</h3>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
