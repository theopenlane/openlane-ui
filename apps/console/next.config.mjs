import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const workspaceRoot = path.resolve(__dirname, '../..')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/dally', '@repo/ui', '@repo/codegen', 'survey-core', 'survey-react-ui'],
  experimental: {
    webpackMemoryOptimizations: true,
  },
  turbopack: {
    // force all graphql imports (including nested copies in graphiql-explorer)
    // to resolve to the same instance so instanceof checks don't fail
    resolveAlias: {
      graphql: '../../node_modules/graphql',
    },
  },
  async redirects() {
    return [
      {
        source: '/tasks',
        destination: '/automation/tasks',
        permanent: true,
      },
      {
        source: '/risks',
        destination: '/exposure/risks',
        permanent: true,
      },
      {
        source: '/risks/:path*',
        destination: '/exposure/risks/:path*',
        permanent: true,
      },
      {
        source: '/developers/query-builder',
        destination: '/reports/custom',
        permanent: true,
      },
    ]
  },
  images: {
    remotePatterns: [
      // {
      //   protocol: 'http',
      //   hostname: 'localhost',
      //   port: '17608',
      //   pathname: '/v1/files/**',
      // },
      // uncomment for local testing with local dev server
      {
        protocol: 'https',
        hostname: '*.r2.cloudflarestorage.com',
        pathname: '/**',
      },
    ],
  },
}

export default nextConfig
