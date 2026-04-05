'use client';

import { useState, useEffect } from 'react';

export function useSiteName(fallback = 'ChatZone') {
  const [siteName, setSiteName] = useState(fallback);

  useEffect(() => {
    const fetchSiteName = async () => {
      try {
        const res = await fetch('/api/site-status');
        if (res.ok) {
          const data = await res.json();
          setSiteName(data.siteName || fallback);
        }
      } catch { /* ignore */ }
    };
    fetchSiteName();
  }, [fallback]);

  return siteName;
}
