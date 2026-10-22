import type { MetadataRoute } from 'next'

const robots = (): MetadataRoute.Robots => ({
  rules: { userAgent: '*', allow: '/' },
})

export default robots
