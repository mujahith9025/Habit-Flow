import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { initPWAAutoUpdate } from './lib/pwaAutoUpdate';

// Initialize auto-update and automatic hard refresh on app opening/resuming
initPWAAutoUpdate();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
