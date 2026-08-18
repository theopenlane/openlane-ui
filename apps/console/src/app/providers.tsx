'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useSession } from 'next-auth/react'
import { ThemeProvider } from '@/providers/theme'
import { usePathname } from 'next/navigation'
import { type ReactNode, useMemo } from 'react'
import { Loading } from '@/components/shared/loading/loading'
import { NavigationGuardProvider } from 'next-navigation-guard'
import { BreadcrumbProvider } from '@/providers/BreadcrumbContext.tsx'
import { InitPlugSDK } from '@/providers/chatSdk'
import { TooltipProvider } from '@repo/ui/tooltip'
import { devrevChatEnabled } from '@repo/dally/auth'
import { WebSocketProvider } from '@/providers/websocket-provider'
import { NotificationsProvider } from '@/providers/notifications-provider'
import { NotificationToastContainer } from '@/components/shared/SystemNotification/notification-toast-container'
import { SessionUnavailableError } from '@/lib/auth/utils/session-health'
import { getIsSessionInvalid } from '@/lib/auth/utils/session-status'
import { useSessionTokenSync } from '@/lib/graphqlClient'
import { isNonRetryableGraphQlError } from '@/utils/graphQlErrorMatcher'

interface ProvidersProps {
  children: ReactNode
}

const publicPages = [
  '/login',
  '/login/sso',
  '/login/sso/enforce',
  '/login/support',
  '/login/support/callback',
  '/verify',
  '/resend-verify',
  '/invite',
  '/tfa',
  '/forgot-password',
  '/password-reset',
  '/signup',
  '/questionnaire',
]

// Client override on the server's Retry-After: a session outage is expected to be brief and
// self-healing, so waiting the full 60s a backend may ask for is worse for the user than one
// extra probe. With `failureCount < 5` below, a sustained outage gets ~5 attempts over about a
// minute. Unrelated errors take the other branch — ordinary exponential backoff to a 30s ceiling.
const SESSION_RETRY_CEILING_MS = 15_000

const sessionRetryDelay = (failureCount: number, error: Error) =>
  error instanceof SessionUnavailableError ? Math.min(error.retryAfterMs, SESSION_RETRY_CEILING_MS) : Math.min(1000 * 2 ** failureCount, 30_000)

const Providers = ({ children }: ProvidersProps) => {
  const { status, data } = useSession()
  const pathname = usePathname()
  useSessionTokenSync()
  const isPublicPage = publicPages.includes(pathname) || pathname.startsWith('/questionnaire/') || /^\/orgs\/[^/]+\/sso$/.test(pathname)

  const queryClient = useMemo(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            placeholderData: (prev: unknown) => prev,
            refetchOnWindowFocus: false,
            retry: (failureCount: number, error: Error) => {
              if (getIsSessionInvalid() || isNonRetryableGraphQlError(error)) return false
              return error instanceof SessionUnavailableError ? failureCount < 5 : failureCount < 3
            },
            retryDelay: sessionRetryDelay,
          },
          mutations: {
            retry: (failureCount: number, error: Error) => !getIsSessionInvalid() && error instanceof SessionUnavailableError && failureCount < 3,
            retryDelay: sessionRetryDelay,
          },
        },
      }),
    [],
  )

  if (isPublicPage) {
    return (
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      </ThemeProvider>
    )
  }

  if (status === 'loading' && !data) {
    return <Loading />
  }

  return (
    <NavigationGuardProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <QueryClientProvider client={queryClient}>
          <WebSocketProvider>
            <NotificationsProvider>
              <BreadcrumbProvider>
                {devrevChatEnabled && <InitPlugSDK />}
                <TooltipProvider disableHoverableContent delayDuration={500} skipDelayDuration={0}>
                  {children}
                </TooltipProvider>
                <NotificationToastContainer />
              </BreadcrumbProvider>
            </NotificationsProvider>
          </WebSocketProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </NavigationGuardProvider>
  )
}

export default Providers
