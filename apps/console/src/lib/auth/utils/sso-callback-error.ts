export const SSO_CALLBACK_ERRORS = ['missing_oauth_params', 'missing_organization_id', 'sso_signin_failed', 'sso_callback_failed', 'sso_callback_error'] as const

export type SsoCallbackError = (typeof SSO_CALLBACK_ERRORS)[number]

export const isSsoCallbackError = (value?: string | null): value is SsoCallbackError => SSO_CALLBACK_ERRORS.some((code) => code === value)
