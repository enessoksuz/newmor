import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Mor Fikirler - Girişimcilik ve İş Fikirleri',
    short_name: 'Mor Fikirler',
    description: 'Girişimcilik, yatırımcılık, iş fikirleri ve kişisel gelişim platformu',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#9333ea',
    icons: [
      {
        src: '/icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
    ],
  };
}

