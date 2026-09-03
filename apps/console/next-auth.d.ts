import { type DefaultUser } from 'next-auth'
import { type PlanEnum } from '@/lib/subscription-plan/plan-enum'

/**
 * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
 */
declare module 'next-auth' {
  interface Session {
    user: DefaultUser & {
      accessToken: string
      refreshToken: string
      activeOrganizationId: string
      userId?: string | null
      image: string
      isTfaEnabled: boolean
      isOnboarding: boolean
      modules: PlanEnum[]
      isImpersonation?: boolean
      impersonator?: string | null
      impersonationSessionId?: string | null
    }
  }
  interface User extends DefaultUser {
    accessToken: string
    refreshToken: string
    session: string
    isTfaEnabled: boolean
    isOnboarding: boolean
  }
  interface Profile extends DefaultProfile {
    display_name: string
    first_name: string
    last_name: string
  }
}

declare module '@auth/core/jwt' {
  interface JWT {
    accessToken?: string
    refreshToken?: string
    isTfaEnabled?: boolean
    isOnboarding?: boolean
  }
}

declare module '@jsonwebtoken' {
  interface JwtPayload extends DefaultJwtPayload {
    org?: string
  }
}
