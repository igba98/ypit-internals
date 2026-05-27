import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // Receipts attached to petty-cash and expense records ride along inside the
  // server-action FormData as base64 data URLs; bump the default 1MB cap so a
  // typical phone-photo receipt (up to ~3MB after base64 inflation) fits.
  experimental: {
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },
  // Allow access to remote image placeholder.
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'picsum.photos', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'i.pravatar.cc', port: '', pathname: '/**' },
    ],
  },
  output: 'standalone',
  transpilePackages: ['motion'],
  webpack: (config, {dev}) => {
    // HMR is disabled in AI Studio via DISABLE_HMR env var.
    // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
    if (dev && process.env.DISABLE_HMR === 'true') {
      config.watchOptions = {
        ignored: /.*/,
      };
    }
    return config;
  },
};

export default nextConfig;
