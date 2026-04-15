import { EmailBrandingFont } from '@repo/codegen/src/schema'

export const DEFAULT_EMAIL_BRANDING = {
  fontFamily: EmailBrandingFont.HELVETICA,
  textColor: '#FFFFFF',
  backgroundColor: '#09151D',
  primaryColor: '#162431',
  secondaryColor: '#9AA5B0',
  linkColor: '#60E8C9',
  buttonColor: '#60E8C9',
  buttonTextColor: '#052E2A',
} as const
