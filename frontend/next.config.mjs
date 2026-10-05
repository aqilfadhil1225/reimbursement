import withPWA from '@ducanh2912/next-pwa'

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
}

export default withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  cacheStartUrl: false,
  dynamicStartUrl: false,
  register: true,
  skipWaiting: true,
  fallbacks: {
    document: '/offline',
  },
  workboxOptions: {
    disableDevLogs: true,
    runtimeCaching: [
      {
        urlPattern: ({ request }) => request.mode === 'navigate',
        handler: 'NetworkFirst',
        options: {
          cacheName: 'navigation-pages',
          networkTimeoutSeconds: 3,
          expiration: {
            maxEntries: 10,
            maxAgeSeconds: 7 * 24 * 60 * 60,
          },
        },
      },
    ],
  },
})({
  ...nextConfig,
  turbopack: {},
})
