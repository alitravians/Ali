'use client';

import { useEffect } from 'react';
import { useSiteName } from '@/hooks/useSiteName';

export default function DynamicTitle() {
  const siteName = useSiteName();

  useEffect(() => {
    document.title = `${siteName} - منصة الدردشة الاحترافية`;
  }, [siteName]);

  return null;
}
