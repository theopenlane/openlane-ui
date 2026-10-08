import { decodeTokenClaims } from '@/lib/auth/utils/token-claims'

export type TQuestionnaireTokenClaims = {
  assessment_id?: string
  email?: string | null
  user_id?: string
  assessment_preview?: boolean
  exp?: number
}

export const decodeQuestionnaireToken = (token: string): TQuestionnaireTokenClaims | null => decodeTokenClaims<TQuestionnaireTokenClaims>(token)
