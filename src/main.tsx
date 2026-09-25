/// <reference types="vite/client" />
import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Manage PWA Service Worker: purge outdated caches and unregister during development
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  // Purge any stale cache storage entries that could hold mismatched React chunks
  if ('caches' in window) {
    caches.keys().then((keys) => {
      keys.forEach((key) => {
        if (key !== 'restochain-pwa-cache-v2') {
          caches.delete(key);
        }
      });
    }).catch(() => {});
  }

  const isDevMode = Boolean((import.meta as any).env?.DEV);

  if (isDevMode) {
    // In dev mode, unregister any active service worker to prevent any script caching
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    }).catch(() => {});
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          registration.update();
          console.log('⚡ PWA Service Worker actif:', registration.scope);
        })
        .catch((error) => {
          console.warn('⚠️ Service Worker :', error);
        });
    });
  }
}
