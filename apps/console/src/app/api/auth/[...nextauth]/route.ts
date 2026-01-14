/**
 * Export the route handlers from our auth config
 * and set the runtime to the Edge
 */
export { GET, POST } from '@/lib/auth/auth'
export const runtime = 'edge'
