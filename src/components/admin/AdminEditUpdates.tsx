import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';

const AdminEditUpdates: React.FC = () => {
  const [updates, setUpdates] = useState('');

  const handleSave = () => {
    // Implementation for saving updates
    console.log('Saving updates:', updates);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">تعديل التحديثات</h1>
      <div className="space-y-4">
        <div>
          <label className="block mb-2">التحديثات</label>
          <Textarea
            value={updates}
            onChange={(e) => setUpdates(e.target.value)}
            className="w-full h-64"
            placeholder="أدخل التحديثات هنا"
          />
        </div>
        <Button onClick={handleSave}>حفظ التغييرات</Button>
      </div>
    </div>
  );
};

export default AdminEditUpdates;
