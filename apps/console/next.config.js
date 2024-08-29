/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  transpilePackages: ['@repo/dally', '@repo/ui', '@repo/codegen'],
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
}
