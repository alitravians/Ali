import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

const AdminEditCountdown: React.FC = () => {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');

  const handleSave = () => {
    // Implementation for saving countdown
    console.log('Saving countdown:', { date, time });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">تعديل العد التنازلي</h1>
      <div className="space-y-4">
        <div>
          <label className="block mb-2">التاريخ</label>
          <Input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full"
          />
        </div>
        <div>
          <label className="block mb-2">الوقت</label>
          <Input
            type="time"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            className="w-full"
          />
        </div>
        <Button onClick={handleSave}>حفظ التغييرات</Button>
      </div>
    </div>
  );
};

export default AdminEditCountdown;
