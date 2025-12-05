/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@repo/dally', '@repo/ui', '@repo/codegen', 'survey-core', 'survey-react-ui'],
  experimental: {},
}

export default nextConfig
