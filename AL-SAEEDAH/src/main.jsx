import './errorHandler.js' // MUST BE FIRST
import React from 'react'
import ReactDOM from 'react-dom/client'
import { SplashScreen } from '@capacitor/splash-screen'
import { Capacitor } from '@capacitor/core'
import App from './App.jsx'
import './index.css'

console.log('[Startup] [3] React Modules Loaded');

try {
  console.log('[Startup] [4] Mounting React App');
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
  console.log('[Startup] [5] React App Mounted Successfully');
} catch (error) {
  console.error('[Startup] FATAL: React Mounting failed:', error);
  throw error;
}


