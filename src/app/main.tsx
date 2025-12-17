import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import TestApi from './TestApi.tsx'
import Privacy from './Privacy.tsx'

import Transparency from './Transparency.tsx'

const path = window.location.pathname;
const Root = path === '/test' ? TestApi : path === '/privacy' ? Privacy : path === '/transparency' ? Transparency : App;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Root />
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
