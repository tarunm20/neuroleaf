import { Metadata } from 'next';

import { headers } from 'next/headers';

import appConfig from '~/config/app.config';

/**
 * @name generateRootMetadata
 * @description Generates the root metadata for the application
 */
export const generateRootMetadata = async (): Promise<Metadata> => {
  const headersStore = await headers();
  const csrfToken = headersStore.get('x-csrf-token') ?? '';

  return {
    title: appConfig.title,
    description: appConfig.description,
    metadataBase: new URL(appConfig.url),
    applicationName: appConfig.name,
    openGraph: {
      url: appConfig.url,
      siteName: appConfig.name,
      title: appConfig.title,
      description: appConfig.description,
    },
    twitter: {
      card: 'summary_large_image',
      title: appConfig.title,
      description: appConfig.description,
    },
    icons: {
      icon: [
        { url: '/images/favicon/favicon.ico' },
        { url: '/images/favicon/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
        { url: '/images/favicon/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
        { url: '/images/favicon/android-chrome-192x192.png', sizes: '192x192', type: 'image/png' },
        { url: '/images/favicon/android-chrome-512x512.png', sizes: '512x512', type: 'image/png' },
      ],
      apple: '/images/favicon/apple-touch-icon.png',
      other: [
        {
          rel: 'manifest',
          url: '/images/favicon/site.webmanifest',
        },
        {
          rel: 'mask-icon',
          url: '/images/favicon/safari-pinned-tab.svg',
          color: '#667eea',
        },
        {
          rel: 'shortcut icon',
          url: '/images/favicon/favicon.ico',
        },
      ],
    },
    other: {
      'csrf-token': csrfToken,
      'msapplication-TileColor': '#667eea',
      'msapplication-config': '/images/favicon/browserconfig.xml',
      'theme-color': '#667eea',
    },
  };
};
