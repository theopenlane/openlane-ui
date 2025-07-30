export {}

declare global {
  const grecaptcha: {
    execute(siteKey: string, options: { action: string }): Promise<string>
  }

  interface Window {
    plugSDK?: {
      init: (config: {
        app_id: string
        theme: 'light' | 'dark' | string
        identity:
          | {
              session_token: string
            }
          | {
              user_ref: string
              user_traits: {
                display_name?: string
                email?: string
                custom_fields?: Record<string, unknown>
              }
            }
      }) => void
      __plug_initialized__?: boolean
    }
  }
}
