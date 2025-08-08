'use client';

import { usePathname } from 'next/navigation';

export function extractDeckIdsFromPath(pathname: string): string[] {
  const uuidRegex = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
  return pathname.match(uuidRegex) || [];
}

export function useDeckPath() {
  const pathname = usePathname();
  return {
    pathname,
    deckIds: extractDeckIdsFromPath(pathname),
  };
}