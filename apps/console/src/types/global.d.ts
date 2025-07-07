declare global {
  const grecaptcha: {
    execute(siteKey: string, options: { action: string }): Promise<string>
  }
}

export {}

declare global {
  interface Window {
    plugSDK?: {
      init: (config: {
        app_id: string
        theme: 'light' | 'dark' | string
        identity: {
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
