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
  // TEMP: disable webpack persistent file cache to avoid EIO on OneDrive/Windows
  webpack: (config) => {
    // Disable filesystem cache which can cause EIO errors on network/OneDrive paths
    config.cache = false;
    return config;
  },
};

export default nextConfig;
