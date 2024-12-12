import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { KEYS, isAdminAuthenticated } from '@/utils/localStorage';
import { TeamMember } from '@/types/team';
import { v4 as uuidv4 } from 'uuid';

export function AdminEditTeam() {
  const navigate = useNavigate();
  const [teamMembers, setLocalTeamMembers] = useLocalStorage<TeamMember[]>(KEYS.TEAM_MEMBERS, []);
  const [newMember, setNewMember] = useState<Partial<TeamMember>>({
    name: '',
    role: '',
    avatar: ''
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (!isAdminAuthenticated()) {
      navigate('/admin');
      return;
    }
  }, [navigate]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB limit
        setError('حجم الصورة يجب أن لا يتجاوز 2 ميجابايت');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setNewMember(prev => ({ ...prev, avatar: reader.result as string }));
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddMember = async () => {
    if (!newMember.name || !newMember.role) {
      setError('يجب ملء جميع الحقول المطلوبة');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSaveSuccess(false);

      const member: TeamMember = {
        id: uuidv4(),
        name: newMember.name,
        role: newMember.role,
        avatar: newMember.avatar || '',
        createdAt: new Date().toISOString()
      };

      const updatedMembers = [...teamMembers, member];
      setLocalTeamMembers(updatedMembers);

      setNewMember({
        name: '',
        role: '',
        avatar: ''
      });

      setSaveSuccess(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error adding team member:', error);
      setError('حدث خطأ أثناء إضافة عضو الفريق');
    } finally {
      setIsSaving(false);
    }
  };

  const handleRemoveMember = async (id: string) => {
    try {
      setIsSaving(true);
      setError(null);
      setSaveSuccess(false);

      const updatedMembers = teamMembers.filter(member => member.id !== id);
      setLocalTeamMembers(updatedMembers);

      setSaveSuccess(true);
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error('Error removing team member:', error);
      setError('حدث خطأ أثناء إزالة عضو الفريق');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">إدارة فريق العمل</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {saveSuccess && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
                تم حفظ التغييرات بنجاح
              </div>
            )}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                {error}
              </div>
            )}

            {/* Add New Member Form */}
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="name">الاسم</Label>
                <Input
                  id="name"
                  value={newMember.name}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMember(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="أدخل اسم العضو"
                  dir="rtl"
                />
              </div>

              <div className="flex flex-col space-y-2">
                <Label htmlFor="role">الصلاحية</Label>
                <Input
                  id="role"
                  value={newMember.role}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewMember(prev => ({ ...prev, role: e.target.value }))}
                  placeholder="أدخل صلاحية العضو"
                  dir="rtl"
                />
              </div>

              <div className="flex flex-col space-y-2">
                <Label htmlFor="avatar">الافتار</Label>
                <Input
                  id="avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="flex items-center space-x-4 rtl:space-x-reverse">
                  <Avatar className="h-20 w-20">
                    <AvatarImage src={newMember.avatar} />
                    <AvatarFallback>{newMember.name?.slice(0, 2)}</AvatarFallback>
                  </Avatar>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('avatar')?.click()}
                  >
                    اختر صورة
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleAddMember}
                className="w-full"
                disabled={isSaving}
              >
                {isSaving ? 'جاري الإضافة...' : 'إضافة عضو جديد'}
              </Button>
            </div>

            {/* Current Team Members */}
            <div className="mt-8">
              <h3 className="text-lg font-semibold mb-4">أعضاء الفريق الحاليين</h3>
              <div className="space-y-4">
                {teamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-4 rtl:space-x-reverse">
                      <Avatar>
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback>{member.name.slice(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium">{member.name}</div>
                        <div className="text-sm text-gray-500">{member.role}</div>
                      </div>
                    </div>
                    <Button
                      variant="destructive"
                      onClick={() => handleRemoveMember(member.id)}
                      disabled={isSaving}
                    >
                      إزالة
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
