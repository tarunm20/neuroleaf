'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSupabase } from '@kit/supabase/hooks/use-supabase';
import { extractDeckIdsFromPath } from '@kit/ui/use-deck-breadcrumbs';
import { usePathname } from 'next/navigation';

interface DeckBreadcrumbContextValue {
  deckNames: Record<string, string>;
  loading: boolean;
}

const DeckBreadcrumbContext = createContext<DeckBreadcrumbContextValue>({
  deckNames: {},
  loading: false,
});

export function useDeckBreadcrumbContext() {
  return useContext(DeckBreadcrumbContext);
}

interface DeckBreadcrumbProviderProps {
  children: ReactNode;
}

export function DeckBreadcrumbProvider({ children }: DeckBreadcrumbProviderProps) {
  const [deckNames, setDeckNames] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const supabase = useSupabase();
  const pathname = usePathname();

  useEffect(() => {
    const deckIds = extractDeckIdsFromPath(pathname);
    
    if (deckIds.length === 0) {
      return;
    }

    // Check if we already have all the deck names
    const missingDeckIds = deckIds.filter(id => !deckNames[id]);
    
    if (missingDeckIds.length === 0) {
      return;
    }

    setLoading(true);
    
    const fetchDeckNames = async () => {
      try {
        const { data, error } = await supabase
          .from('decks')
          .select('id, name')
          .in('id', missingDeckIds);

        if (!error && data) {
          const newDeckNames = data.reduce((acc, deck) => {
            acc[deck.id] = deck.name;
            return acc;
          }, {} as Record<string, string>);
          
          setDeckNames(prev => ({ ...prev, ...newDeckNames }));
        }
      } catch (error) {
        console.error('Failed to fetch deck names:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDeckNames();
  }, [pathname, supabase, deckNames]);

  return (
    <DeckBreadcrumbContext.Provider value={{ deckNames, loading }}>
      {children}
    </DeckBreadcrumbContext.Provider>
  );
}