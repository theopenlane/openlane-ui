/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/dally', '@repo/ui', '@repo/codegen', 'survey-core', 'survey-react-ui'],
  experimental: {
    useTypeScriptCli: true,
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
        source: '/organization-settings/integrations',
        destination: '/automation/integrations',
        permanent: true,
      },
      {
        source: '/organization-settings/integrations/:path*',
        destination: '/automation/integrations/:path*',
        permanent: true,
      },
      {
        source: '/registry',
        destination: '/registry/platforms',
        permanent: false,
      },
      {
        source: '/trust-center',
        destination: '/trust-center/overview',
        permanent: false,
      },
      {
        source: '/automation',
        destination: '/automation/tasks',
        permanent: false,
      },
      {
        source: '/user-management',
        destination: '/user-management/members',
        permanent: false,
      },
      {
        source: '/developers',
        destination: '/developers/api-tokens',
        permanent: false,
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
