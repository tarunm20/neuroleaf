import { cookies } from 'next/headers';

import { Toaster } from '@kit/ui/sonner';
import { cn } from '@kit/ui/utils';

import { RootProviders } from '~/components/root-providers';
import { heading, sans } from '~/lib/fonts';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { generateRootMetadata } from '~/lib/root-metdata';

import '../styles/globals.css';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { language } = await createI18nServerInstance();
  const theme = await getTheme();
  const className = getClassName();

  return (
    <html lang={language} className={className} suppressHydrationWarning>
      <body>
        <RootProviders theme={theme} lang={language}>
          {children}
        </RootProviders>

        <Toaster richColors={true} position="top-center" />
      </body>
    </html>
  );
}

function getClassName() {
  const font = [sans.variable, heading.variable].reduce<string[]>(
    (acc, curr) => {
      if (acc.includes(curr)) return acc;

      return [...acc, curr];
    },
    [],
  );

  return cn('bg-background min-h-screen antialiased', ...font);
}

async function getTheme() {
  const cookiesStore = await cookies();
  return cookiesStore.get('theme')?.value as 'light' | 'dark' | 'system';
}

export const generateMetadata = generateRootMetadata;
