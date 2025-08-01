export {}

declare global {
  const grecaptcha: {
    execute(siteKey: string, options: { action: string }): Promise<string>
  }

  interface Window {
    plugSDK?: {
      init: (config: { app_id: string; theme: 'light' | 'dark' | string; session_token: string }) => void
      __plug_initialized__?: boolean
      shutdown: () => void
    }
  }
}
