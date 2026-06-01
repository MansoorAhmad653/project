/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Ensure trailing slashes for Netlify compatibility
  trailingSlash: false,
};

export default nextConfig;
