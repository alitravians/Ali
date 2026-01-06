import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { UserPlus, Trash2, Activity, Shield, Search } from 'lucide-react';
import Modal from './Modal';
import { subscribeStaff, addStaff, deleteStaff, subscribeAuditLog } from '../../services/firebase';
import type { Staff, AuditLogEntry, UserRole } from '../../types';
import { RolePermissions } from '../../types';

interface ModeratorManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const ModeratorManagementModal: React.FC<ModeratorManagementModalProps> = ({ isOpen, onClose }) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  const [staff, setStaff] = useState<Staff[]>([]);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'list' | 'add' | 'activity'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New staff form
  const [newStaff, setNewStaff] = useState({
    username: '',
    email: '',
    password: '',
    role: 'moderator' as UserRole
  });
  
  // Activity filter
  const [activityFilter, setActivityFilter] = useState('');

  useEffect(() => {
    if (isOpen) {
      const unsubscribeStaff = subscribeStaff(setStaff);
      const unsubscribeAudit = subscribeAuditLog(setAuditLog, 100);
      setLoading(false);
      return () => {
        unsubscribeStaff();
        unsubscribeAudit();
      };
    }
  }, [isOpen]);

  const handleAddStaff = async () => {
    if (!newStaff.username || !newStaff.email || !newStaff.password) {
      alert(isArabic ? 'يرجى ملء جميع الحقول' : 'Please fill all fields');
      return;
    }
    
    try {
      const permissions = RolePermissions[newStaff.role];
      await addStaff({
        username: newStaff.username,
        email: newStaff.email,
        role: newStaff.role,
        permissions,
        createdAt: new Date().toISOString(),
        isActive: true
      });
      setNewStaff({ username: '', email: '', password: '', role: 'moderator' });
      setActiveTab('list');
      alert(isArabic ? 'تمت إضافة المشرف بنجاح' : 'Staff member added successfully');
    } catch (error) {
      console.error('Error adding staff:', error);
      alert(isArabic ? 'حدث خطأ أثناء الإضافة' : 'Error adding staff member');
    }
  };

  const handleDeleteStaff = async (staffMember: Staff) => {
    if (!confirm(isArabic ? `هل أنت متأكد من حذف ${staffMember.username}؟` : `Are you sure you want to delete ${staffMember.username}?`)) {
      return;
    }
    
    try {
      await deleteStaff(staffMember.id);
      alert(isArabic ? 'تم حذف المشرف بنجاح' : 'Staff member deleted successfully');
    } catch (error) {
      console.error('Error deleting staff:', error);
      alert(isArabic ? 'حدث خطأ أثناء الحذف' : 'Error deleting staff member');
    }
  };

  const filteredStaff = staff.filter(s => 
    s.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredAuditLog = auditLog.filter(entry =>
    activityFilter ? entry.username.toLowerCase().includes(activityFilter.toLowerCase()) : true
  );

  const getRoleLabel = (role: UserRole) => {
    const labels = {
      owner: isArabic ? 'المالك' : 'Owner',
      admin: isArabic ? 'مدير' : 'Admin',
      moderator: isArabic ? 'مشرف' : 'Moderator',
      support: isArabic ? 'دعم' : 'Support'
    };
    return labels[role];
  };

  const getRoleColor = (role: UserRole) => {
    const colors = {
      owner: 'bg-purple-500',
      admin: 'bg-blue-500',
      moderator: 'bg-green-500',
      support: 'bg-yellow-500'
    };
    return colors[role];
  };

  const tabs = [
    { id: 'list', label: isArabic ? 'قائمة المشرفين' : 'Staff List', icon: Shield },
    { id: 'add', label: isArabic ? 'إضافة مشرف' : 'Add Staff', icon: UserPlus },
    { id: 'activity', label: isArabic ? 'سجل الأنشطة' : 'Activity Log', icon: Activity },
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isArabic ? 'إدارة المشرفين' : 'Staff Management'} size="xl">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b pb-4">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              activeTab === tab.id
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <tab.icon size={18} />
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
        </div>
      ) : (
        <>
          {/* Staff List Tab */}
          {activeTab === 'list' && (
            <div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={isArabic ? 'بحث...' : 'Search...'}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredStaff.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {isArabic ? 'لا يوجد مشرفين' : 'No staff members found'}
                  </div>
                ) : (
                  filteredStaff.map(member => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full ${getRoleColor(member.role)} flex items-center justify-center text-white font-bold`}>
                          {member.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{member.username}</p>
                          <p className="text-sm text-gray-500">{member.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-white text-sm ${getRoleColor(member.role)}`}>
                          {getRoleLabel(member.role)}
                        </span>
                        {member.role !== 'owner' && (
                          <button
                            onClick={() => handleDeleteStaff(member)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Add Staff Tab */}
          {activeTab === 'add' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isArabic ? 'اسم المستخدم' : 'Username'}
                </label>
                <input
                  type="text"
                  value={newStaff.username}
                  onChange={(e) => setNewStaff({ ...newStaff, username: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isArabic ? 'البريد الإلكتروني' : 'Email'}
                </label>
                <input
                  type="email"
                  value={newStaff.email}
                  onChange={(e) => setNewStaff({ ...newStaff, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isArabic ? 'كلمة المرور' : 'Password'}
                </label>
                <input
                  type="password"
                  value={newStaff.password}
                  onChange={(e) => setNewStaff({ ...newStaff, password: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {isArabic ? 'الدور' : 'Role'}
                </label>
                <select
                  value={newStaff.role}
                  onChange={(e) => setNewStaff({ ...newStaff, role: e.target.value as UserRole })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                >
                  <option value="admin">{isArabic ? 'مدير' : 'Admin'}</option>
                  <option value="moderator">{isArabic ? 'مشرف' : 'Moderator'}</option>
                  <option value="support">{isArabic ? 'دعم' : 'Support'}</option>
                </select>
              </div>
              
              {/* Permissions Preview */}
              <div className="p-4 bg-gray-50 rounded-lg">
                <h4 className="font-bold text-gray-800 mb-3">
                  {isArabic ? 'صلاحيات هذا الدور:' : 'Role Permissions:'}
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  {Object.entries(RolePermissions[newStaff.role]).map(([key, value]) => (
                    <div key={key} className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${value ? 'bg-green-500' : 'bg-red-500'}`}></span>
                      <span className="text-gray-600">{key}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <button
                onClick={handleAddStaff}
                className="w-full flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors"
              >
                <UserPlus size={18} />
                {isArabic ? 'إضافة المشرف' : 'Add Staff Member'}
              </button>
            </div>
          )}

          {/* Activity Log Tab */}
          {activeTab === 'activity' && (
            <div>
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  value={activityFilter}
                  onChange={(e) => setActivityFilter(e.target.value)}
                  placeholder={isArabic ? 'فلترة حسب اسم المشرف...' : 'Filter by staff name...'}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                />
              </div>
              
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {filteredAuditLog.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    {isArabic ? 'لا توجد أنشطة' : 'No activities found'}
                  </div>
                ) : (
                  filteredAuditLog.map(entry => (
                    <div key={entry.id} className="p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-gray-800">{entry.username}</span>
                        <span className="text-sm text-gray-500">
                          {new Date(entry.createdAt).toLocaleString(isArabic ? 'ar-SA' : 'en-US')}
                        </span>
                      </div>
                      <p className="text-gray-600">{entry.action}</p>
                      {entry.details && (
                        <p className="text-sm text-gray-500 mt-1">{entry.details}</p>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </>
      )}
    </Modal>
  );
};

export default ModeratorManagementModal;
