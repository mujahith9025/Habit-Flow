import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initPWAAutoUpdate } from './lib/pwaAutoUpdate';
import { initAppCheck } from './lib/firebase/appCheck';

// 1. Mount React DOM immediately for instant 0ms painting on mobile
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// 2. Initialize PWA Service Worker and Firebase App Check in non-blocking background microtasks
if (typeof window !== 'undefined') {
  const scheduleBackgroundInit = (window as any).requestIdleCallback || ((cb: () => void) => setTimeout(cb, 100));
  scheduleBackgroundInit(() => {
    initPWAAutoUpdate();
    initAppCheck();
  });
}

