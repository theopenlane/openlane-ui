export type PlugWidgetView = 'create_conversation'

declare global {
  const grecaptcha: {
    execute(siteKey: string, options: { action: string }): Promise<string>
  }

  interface Window {
    _hsq?: (['setPath', string] | ['trackPageView'])[]

    plugSDK?: {
      init: (config: { app_id: string; theme: 'light' | 'dark' | string; session_token: string }) => void
      __plug_initialized__?: boolean
      shutdown: () => Promise<void> | void
      toggleWidget?: (open: boolean, view?: PlugWidgetView) => void
      onEvent?: (handler: (payload: { type: string }) => void) => void
    }
  }
}
