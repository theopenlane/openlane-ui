import { type User } from '@repo/codegen/src/schema'

// OPENLANE_SUPPORT_USER_ID is the ULID of the virtual Openlane support actor. It MUST match the core
// server's SupportAccess.SubjectID so records stamped by a support session resolve to this identity
export const OPENLANE_SUPPORT_USER_ID = process.env.NEXT_PUBLIC_SUPPORT_USER_ID ?? ''

// OPENLANE_SUPPORT_USER_NAME is the display name shown for support-attributed records
export const OPENLANE_SUPPORT_USER_NAME = process.env.NEXT_PUBLIC_SUPPORT_USER_NAME || 'Openlane Support'

// supportUser builds a synthetic User for the virtual Openlane support identity. The identity has no row
// in the database and cannot be resolved through the org-membership lookup that backs author attribution,
// so it is injected client-side wherever its ID is requested
export const supportUser = (): User =>
  ({
    id: OPENLANE_SUPPORT_USER_ID,
    displayName: OPENLANE_SUPPORT_USER_NAME,
    email: '',
  }) as unknown as User
