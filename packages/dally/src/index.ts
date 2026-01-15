export const openlaneAPIUrl = process.env.NEXT_PUBLIC_OPENLANE_URL!
export const openlaneGQLUrl = `${process.env.NEXT_PUBLIC_OPENLANE_URL!}/query`
export const websocketGQLUrl = openlaneGQLUrl.replace(/^https/, 'wss').replace(/^http/, 'ws')

export const sessionCookieName = process.env.SESSION_COOKIE_NAME
export const sessionCookieDomain = process.env.SESSION_COOKIE_DOMAIN
export const sessionCookieExpiration = process.env.SESSION_COOKIE_EXPIRATION_MINUTES
export const allowedLoginDomains = !!process.env.NEXT_PUBLIC_ALLOWED_LOGIN_DOMAINS ? process.env.NEXT_PUBLIC_ALLOWED_LOGIN_DOMAINS?.split(',') : []

export const cookieDomain = process.env.COOKIE_DOMAIN || '.theopenlane.io'

export const csrfCookieName = process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME || 'ol.csrf-token'
export const csrfHeader = process.env.NEXT_PUBLIC_CSRF_HEADER || 'X-CSRF-Token'

export const includeQuestionnaireCreation = process.env.NEXT_PUBLIC_INCLUDE_QUESTIONNAIRE_CREATION
export const surveyLicenseKey = process.env.NEXT_PUBLIC_SURVEYJS_KEY

export const pirschAnalyticsKey = process.env.NEXT_PUBLIC_PIRSCH_KEY
export const isDevelopment = process.env.NODE_ENV === 'development'
export const isVercelDev = process.env.VERCEL_ENV === 'development' || process.env.VERCEL_ENV === 'preview'

export const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY

export const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3001')

export const chatAppId = process.env.NEXT_PUBLIC_CHAT_APP_ID

export const enableDevrevChat = process.env.NEXT_PUBLIC_ENABLE_DEVREV_CHAT

export const cname = process.env.NEXT_PUBLIC_CUSTOMDOMAIN_CNAME

export const stripeSecretKey = process.env.STRIPE_SECRET_KEY
