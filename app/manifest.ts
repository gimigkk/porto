import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Gilang Muhamad Widiagung Portfolio",
    short_name: 'Gilang M W',
    description: 'Official portfolio of Gilang Muhamad Widiagung (Gimiaw), a Full-stack Developer and Product Designer.',
    start_url: '/',
    display: 'standalone',
    background_color: '#141416',
    theme_color: '#141416',
    icons: [
      {
        src: '/favicon.svg',
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
  };
}
