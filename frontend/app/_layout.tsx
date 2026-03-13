import React, { useEffect } from 'react';
import { Platform } from 'react-native';
import '../global.css';
import { AppLayout } from '../components/ui/AppLayout';

export default function Layout() {
  useEffect(() => {
    if (Platform.OS === 'web' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((reg) => console.log('SW registered!', reg.scope))
        .catch((err) => console.log('SW registration failed:', err));
    }
  }, []);

  return <AppLayout />;
}
