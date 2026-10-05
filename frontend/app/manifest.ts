import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Reimbursely',
    short_name: 'Reimbursely',
    description: 'Dashboard pengelolaan pengajuan reimburse untuk tim Anda.',
    lang: 'id-ID',
    start_url: '/',
    display: 'standalone',
    background_color: '#f5f7fb',
    theme_color: '#e8722a',
    categories: ['productivity', 'business'],
    shortcuts: [
      {
        name: 'Pengajuan baru',
        short_name: 'Baru',
        description: 'Buat pengajuan reimburse baru',
        url: '/?mode=new-claim',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
        ],
      },
    ],
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
