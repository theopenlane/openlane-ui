import { DefaultUser } from 'next-auth'

/**
 * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
 */
declare module 'next-auth' {
  interface Session {
    user: DefaultUser & {
      accessToken: string
      refreshToken: string
      activeOrganizationId: string
      image: string
      isTfaEnabled: boolean
      isOnboarding: boolean
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
    user: {
      accessToken: string
      refreshToken: string
    }
  }
}

declare module '@jsonwebtoken' {
  interface JwtPayload extends DefaultJwtPayload {
    org?: string
  }
}
