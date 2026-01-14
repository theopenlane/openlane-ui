// route.ts
export const runtime = 'nodejs'

import { GET, POST } from '@/lib/auth/auth'

console.log('NextAuth runtime Node version:', process.version)

export { GET, POST }
