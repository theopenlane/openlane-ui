/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      { source: '/tasks', destination: '/automation/tasks', permanent: true },
      { source: '/questionnaires', destination: '/automation/assessments', permanent: true },
      { source: '/questionnaires/:path*', destination: '/automation/assessments/:path*', permanent: true },
    ]
  },
  reactStrictMode: true,
  transpilePackages: ['@repo/dally', '@repo/ui', '@repo/codegen', 'survey-core', 'survey-react-ui'],
  experimental: {
    webpackMemoryOptimizations: false,
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
