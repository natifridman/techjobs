import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PostHogProvider } from 'posthog-js/react'
import type { PostHogConfig } from 'posthog-js'

const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

const options: Partial<PostHogConfig> = {
  api_host: posthogHost,
  capture_pageview: true,
  autocapture: {
    dom_event_allowlist: ['click', 'change', 'submit'],
    element_allowlist: ['button', 'a', 'input', 'select'],
    css_selector_allowlist: ['[data-track]', '.job-card', '.company-card'],
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {posthogKey ? (
      <PostHogProvider apiKey={posthogKey} options={options}>
        <App />
      </PostHogProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
)
