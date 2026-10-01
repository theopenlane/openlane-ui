import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { MutationCache, QueryCache, QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppTooltipProvider } from '@repo/ui/tooltip'
import { ApiRequestError, ApiUnauthorizedError } from '../lib/api'
import { clearConnection } from '../lib/connection'
import { App } from './app'
import { applyPopupTheme } from './theme'
import './popup.css'

const MAX_QUERY_RETRIES = 2

const disconnectWhenUnauthorized = (error: Error) => {
  if (error instanceof ApiUnauthorizedError) {
    clearConnection(error.message)
  }
}

const queryClient = new QueryClient({
  queryCache: new QueryCache({ onError: disconnectWhenUnauthorized }),
  mutationCache: new MutationCache({ onError: disconnectWhenUnauthorized }),
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => !(error instanceof ApiUnauthorizedError || error instanceof ApiRequestError) && failureCount < MAX_QUERY_RETRIES,
    },
  },
})

applyPopupTheme()

const root = document.getElementById('root')
if (root) {
  createRoot(root).render(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AppTooltipProvider>
          <App />
        </AppTooltipProvider>
      </QueryClientProvider>
    </StrictMode>,
  )
}
