// هذا المكون يدير الإشعارات المعروضة للمستخدم
import React from 'react';
import { useToast } from '@chakra-ui/react';

const NotificationSystem = () => {
  const toast = useToast();

  const showNotification = (status, trendName) => {
    toast({
      title: status === 'Approved' ? 'تمت الموافقة على طلب الاتجاه' : 'تم رفض طلب الاتجاه',
      description: status === 'Approved'
        ? `تمت الموافقة على طلب الاتجاه "${trendName}" الخاص بك.`
        : `تم رفض طلب الاتجاه "${trendName}" الخاص بك.`,
      status: status === 'Approved' ? 'success' : 'error',
      duration: 5000,
      isClosable: true,
      position: 'top',
    });
  };

  return { showNotification };
};

export default NotificationSystem;
