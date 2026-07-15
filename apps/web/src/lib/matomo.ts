declare global {
  interface Window {
    _paq?: unknown[][]
  }
}

const MATOMO_URL = import.meta.env.VITE_MATOMO_URL as string | undefined
const MATOMO_SITE_ID = import.meta.env.VITE_MATOMO_SITE_ID as string | undefined

let initialized = false

export function initMatomo(): void {
  if (initialized || !MATOMO_URL || !MATOMO_SITE_ID) return
  initialized = true

  const trackerUrl = MATOMO_URL.endsWith('/') ? MATOMO_URL : `${MATOMO_URL}/`

  window._paq = window._paq || []
  window._paq.push(['setTrackerUrl', `${trackerUrl}matomo.php`])
  window._paq.push(['setSiteId', MATOMO_SITE_ID])
  // Les vues de page sont trackées manuellement via trackPageView (SPA, pas de reload)
  window._paq.push(['enableLinkTracking'])

  const script = document.createElement('script')
  script.async = true
  script.src = `${trackerUrl}matomo.js`
  document.head.appendChild(script)
}

export function trackPageView(path: string, title?: string): void {
  if (!window._paq) return
  window._paq.push(['setCustomUrl', path])
  if (title) window._paq.push(['setDocumentTitle', title])
  window._paq.push(['trackPageView'])
}

export function trackEvent(category: string, action: string, name?: string, value?: number): void {
  if (!window._paq) return
  window._paq.push(['trackEvent', category, action, name, value])
}
