import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';

const AdminEditTeam: React.FC = () => {
  const [teamMembers, setTeamMembers] = useState('');
  const [description, setDescription] = useState('');

  const handleSave = () => {
    // Implementation for saving team info
    console.log('Saving team info:', { teamMembers, description });
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">تعديل الفريق</h1>
      <div className="space-y-4">
        <div>
          <label className="block mb-2">أعضاء الفريق</label>
          <Input
            type="text"
            value={teamMembers}
            onChange={(e) => setTeamMembers(e.target.value)}
            className="w-full"
            placeholder="أسماء أعضاء الفريق"
          />
        </div>
        <div>
          <label className="block mb-2">الوصف</label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full"
            placeholder="وصف الفريق"
          />
        </div>
        <Button onClick={handleSave}>حفظ التغييرات</Button>
      </div>
    </div>
  );
};

export default AdminEditTeam;
