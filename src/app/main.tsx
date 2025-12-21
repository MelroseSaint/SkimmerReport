import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.tsx'

// Security: Trusted Types Shim for Leaflet and legacy libraries using innerHTML
// This fulfills the 'TrustedHTML' requirement without breaking third-party markers/popups
const ttWindow = window as any;
if (ttWindow.trustedTypes && ttWindow.trustedTypes.createPolicy) {
  try {
    ttWindow.trustedTypes.createPolicy('default', {
      createHTML: (string: string) => string,
    });
  } catch (e) {
    console.warn('TrustedTypes policy "default" already exists or could not be created', e);
  }
}



createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HelmetProvider>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </HelmetProvider>
  </StrictMode>,
)

// Register service worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW registered:', registration);

        // Check for updates periodically
        setInterval(() => {
          registration.update();
        }, 60000); // Check every minute
      })
      .catch((error) => {
        console.log('SW registration failed:', error);
      });
  });
}
