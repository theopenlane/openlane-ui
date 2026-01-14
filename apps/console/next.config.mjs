/** @type {import('next').NextConfig} */
console.log('Build Node version:', process.version)

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/dally', '@repo/ui', '@repo/codegen', 'survey-core', 'survey-react-ui'],
  experimental: {},

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
