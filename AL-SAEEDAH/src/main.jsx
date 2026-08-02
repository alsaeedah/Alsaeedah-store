import React from 'react'
import ReactDOM from 'react-dom/client'
import { SplashScreen } from '@capacitor/splash-screen'
import { Capacitor } from '@capacitor/core'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Delay hiding the native splash screen so the onboarding welcome screen
// has time to paint its first frame — preventing any black screen flash.
if (Capacitor.isNativePlatform()) {
  setTimeout(() => SplashScreen.hide(), 300);
}
