/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@vky/database', '@vky/shared'],
  experimental: {
    optimizePackageImports: ['@vky/shared'],
  },
};

module.exports = nextConfig;
