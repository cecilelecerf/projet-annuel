import * as Sentry from '@sentry/vue'
import type { App } from 'vue'
import type { Router } from 'vue-router'

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined

export function initSentry(app: App, router: Router): void {
  if (!SENTRY_DSN) return

  Sentry.init({
    app,
    dsn: SENTRY_DSN,
    environment: import.meta.env.MODE,
    integrations: [Sentry.browserTracingIntegration({ router })],
    tracesSampleRate: 0.1,
  })
}
