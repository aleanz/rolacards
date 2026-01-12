/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.ygoprodeck.com',
        pathname: '/images/cards/**',
      },
      {
        protocol: 'https',
        hostname: 'images.ygoprodeck.com',
        pathname: '/images/cards_small/**',
      },
    ],
  },
};

module.exports = nextConfig;
