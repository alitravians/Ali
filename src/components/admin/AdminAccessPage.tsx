import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { GameSettings } from '../../game/types';
import { t, isRTL } from '../../game/localization';

interface AdminAccessPageProps {
  settings: GameSettings;
  onAccessGranted: () => void;
  onCancel: () => void;
  isOpen: boolean;
}

const ADMIN_ACCESS_CODE = '3131';

const AdminAccessPage: React.FC<AdminAccessPageProps> = ({
  settings,
  onAccessGranted,
  onCancel,
  isOpen
}) => {
  const [accessCode, setAccessCode] = useState('');
  const [error, setError] = useState(false);
  const isRtl = isRTL(settings.language);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (accessCode === ADMIN_ACCESS_CODE) {
      setError(false);
      onAccessGranted();
      setAccessCode('');
    } else {
      setError(true);
    }
  };
  
  const handleClose = () => {
    setAccessCode('');
    setError(false);
    onCancel();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className={`sm:max-w-md ${isRtl ? 'rtl' : 'ltr'}`}>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">
            {t('adminAccess', settings.language) || 'Admin Access'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="accessCode">
              {t('adminAccessCode', settings.language) || 'Enter Access Code'}
            </Label>
            <Input
              id="accessCode"
              type="password"
              value={accessCode}
              onChange={(e) => {
                setAccessCode(e.target.value);
                if (error) setError(false);
              }}
              placeholder="••••"
              className={error ? 'border-red-500' : ''}
              dir={isRtl ? 'rtl' : 'ltr'}
              autoFocus
            />
            
            {error && (
              <p className="text-sm text-red-500">
                {t('invalidAccessCode', settings.language) || 'Invalid access code'}
              </p>
            )}
          </div>
          
          <DialogFooter className="sm:justify-end">
            <Button type="button" variant="outline" onClick={handleClose}>
              {t('cancel', settings.language) || 'Cancel'}
            </Button>
            <Button type="submit">
              {t('adminAccess', settings.language) || 'Access'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AdminAccessPage;
