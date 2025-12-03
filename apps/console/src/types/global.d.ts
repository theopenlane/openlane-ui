export {}

declare global {
  const grecaptcha: {
    execute(siteKey: string, options: { action: string }): Promise<string>
  }

  interface Window {
    gtag_report_conversion?: (url?: string) => boolean
    plugSDK?: {
      init: (config: { app_id: string; theme: 'light' | 'dark' | string; session_token: string }) => void
      __plug_initialized__?: boolean
      shutdown: () => void
    }
  }
}

if (typeof window !== 'undefined') {
  window.gtag_report_conversion = function (url?: string): boolean {
    const callback = function () {
      if (typeof url !== 'undefined') {
        window.location.href = url
      }
    }

    if (typeof gtag !== 'undefined') {
      gtag('event', 'conversion', {
        send_to: 'AW-17756532539/XObnCI6h5MkbELve_JJC',
        value: 1.0,
        currency: 'USD',
        event_callback: callback,
      })
    }

    return false
  }
}
