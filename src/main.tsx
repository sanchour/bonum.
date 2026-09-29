import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'

// Enable active press states on iOS Safari
document.addEventListener('touchstart', () => {}, { passive: true })

// Mark standalone (Home Screen / PWA) launches
const isStandalone =
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone === true
if (isStandalone) {
  document.documentElement.dataset.standalone = 'true'
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Automatic update engine for PWA & Service Worker
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  let refreshing = false

  // When a new service worker takes over, reload instantly so user sees latest version
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true
      window.location.reload()
    }
  })

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((registration) => {
        // Query server immediately for newer sw.js
        registration.update().catch(() => {})

        registration.addEventListener('updatefound', () => {
          const worker = registration.installing
          worker?.addEventListener('statechange', () => {
            if (worker.state === 'activated' && navigator.serviceWorker.controller) {
              window.location.reload()
            }
          })
        })
      })
      .catch((err) => console.warn('Bonum SW error:', err))
  })

  // Whenever user returns to the app from background/another tab, check for updates
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      navigator.serviceWorker.getRegistration().then((reg) => reg?.update().catch(() => {}))
    }
  })
}
