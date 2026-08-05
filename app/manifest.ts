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
        src: '/munching-cat.gif',
        sizes: 'any',
        type: 'image/gif',
      },
    ],
  };
}
