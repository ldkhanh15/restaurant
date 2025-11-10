/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Enable standalone output for Docker
  output: "standalone",
  // Allow build to continue even if static page generation fails
  experimental: {
    missingSuspenseWithCSRBailout: false,
  },
  // TEMP: disable webpack persistent file cache to avoid EIO on OneDrive/Windows
  webpack: (config) => {
    // Disable filesystem cache which can cause EIO errors on network/OneDrive paths
    config.cache = false;
    return config;
  },
  // Skip static page generation errors during build
  onDemandEntries: {
    maxInactiveAge: 25 * 1000,
    pagesBufferLength: 2,
  },
};

export default nextConfig;
