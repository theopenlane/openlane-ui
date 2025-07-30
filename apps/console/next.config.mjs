/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ['@repo/dally', '@repo/ui', '@repo/codegen'],
  experimental: {},
}

export default nextConfig
