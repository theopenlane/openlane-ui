export const restUrl = process.env.API_REST_URL!
export const openlaneAPIUrl = process.env.NEXT_PUBLIC_OPENLANE_URL!
export const openlaneGQLUrl = `${process.env.NEXT_PUBLIC_OPENLANE_URL!}/query`
export const sessionCookieName = process.env.SESSION_COOKIE_NAME
export const sessionCookieExpiration = process.env.SESSION_COOKIE_EXPIRATION_MINUTES
export const allowedLoginDomains = process.env.NEXT_PUBLIC_ALLOWED_LOGIN_DOMAINS?.split(',') || []
export const includeQuestionnaireCreation = process.env.NEXT_PUBLIC_INCLUDE_QUESTIONNAIRE_CREATION 
export const surveyLicenseKey = process.env.NEXT_PUBLIC_SURVEYJS_KEY