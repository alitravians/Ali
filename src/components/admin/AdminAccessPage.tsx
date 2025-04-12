import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Lock } from 'lucide-react';
import { GameSettings } from '../../game/types';
import { t, isRTL } from '../../game/localization';

interface AdminAccessPageProps {
  settings: GameSettings;
  onAccessGranted: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

const AdminAccessPage: React.FC<AdminAccessPageProps> = ({
  settings,
  onAccessGranted,
  onCancel,
  isOpen
}) => {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState('');
  
  const isRtl = isRTL(settings.language);
  
  const handleSubmit = () => {
    if (accessCode === '3131') {
      onAccessGranted();
      setAccessCode('');
      setError('');
    } else {
      setError(t('invalidAccessCode', settings.language) || 'Invalid access code');
    }
  };
  
  const handleClose = () => {
    setAccessCode('');
    setError('');
    onCancel();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={isRtl ? 'rtl' : 'ltr'}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            <span>{t('adminAccess', settings.language) || 'Admin Access'}</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="py-4">
          <div className="mb-4 text-sm text-gray-600">
            {t('enterAdminCode', settings.language) || 'Please enter the admin access code to continue'}
          </div>
          
          <Input
            type="password"
            placeholder={t('accessCode', settings.language) || 'Access Code'}
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            dir={isRtl ? 'rtl' : 'ltr'}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit();
              }
            }}
            className="mt-2"
            autoFocus
          />
          
          {error && (
            <p className="text-red-500 text-sm mt-2">{error}</p>
          )}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            {t('cancel', settings.language) || 'Cancel'}
          </Button>
          <Button onClick={handleSubmit}>
            {t('submit', settings.language) || 'Submit'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AdminAccessPage;
