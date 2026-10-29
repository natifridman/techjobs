import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { PostHogProvider } from 'posthog-js/react'
import type { PostHogConfig } from 'posthog-js'
import { ThemeProvider } from './components/ThemeProvider'

const posthogKey = import.meta.env.VITE_PUBLIC_POSTHOG_KEY
const posthogHost = import.meta.env.VITE_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'

const options: Partial<PostHogConfig> = {
  api_host: posthogHost,
  capture_pageview: true,
  autocapture: true,
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      {posthogKey ? (
        <PostHogProvider apiKey={posthogKey} options={options}>
          <App />
        </PostHogProvider>
      ) : (
        <App />
      )}
    </ThemeProvider>
  </StrictMode>,
)
