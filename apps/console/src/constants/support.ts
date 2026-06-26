import { type User } from '@repo/codegen/src/schema'

export const OPENLANE_SUPPORT_USER_ID = process.env.NEXT_PUBLIC_SUPPORT_USER_ID ?? ''

export const OPENLANE_SUPPORT_USER_NAME = process.env.NEXT_PUBLIC_SUPPORT_USER_NAME || 'Openlane Support'

export const supportUser = (): User =>
  ({
    id: OPENLANE_SUPPORT_USER_ID,
    displayName: OPENLANE_SUPPORT_USER_NAME,
    email: '',
  }) as unknown as User
