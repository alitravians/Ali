import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Lock } from 'lucide-react';
import { GameSettings } from '../../game/types';
import { t, isRTL } from '../../game/localization';
import AdminAccessPage from './AdminAccessPage';

interface AdminAccessButtonProps {
  settings: GameSettings;
  onAccessGranted: () => void;
}

const AdminAccessButton: React.FC<AdminAccessButtonProps> = ({
  settings,
  onAccessGranted
}) => {
  const [showAccessDialog, setShowAccessDialog] = useState(false);
  const isRtl = isRTL(settings.language);
  
  const handleOpenAccessDialog = () => {
    setShowAccessDialog(true);
  };
  
  const handleCloseAccessDialog = () => {
    setShowAccessDialog(false);
  };
  
  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={handleOpenAccessDialog}
        className="flex items-center gap-2"
      >
        <Lock className="h-4 w-4" />
        <span className="hidden sm:inline">{t('adminDashboard', settings.language)}</span>
      </Button>
      
      <AdminAccessPage
        settings={settings}
        onAccessGranted={onAccessGranted}
        onCancel={handleCloseAccessDialog}
        isOpen={showAccessDialog}
      />
    </>
  );
};

export default AdminAccessButton;
