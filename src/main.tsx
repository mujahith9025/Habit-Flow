import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initPWAAutoUpdate } from './lib/pwaAutoUpdate';
import { initAppCheck } from './lib/firebase/appCheck';

// Initialize auto-update and automatic hard refresh on app opening/resuming
initPWAAutoUpdate();

// Initialize Firebase App Check (reCAPTCHA v3)
initAppCheck();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
