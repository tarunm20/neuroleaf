import { BreadcrumbLabelFetcher } from './app-breadcrumbs';

interface DeckData {
  [key: string]: string;
}

export function createDeckBreadcrumbFetcher(decks: DeckData): BreadcrumbLabelFetcher {
  return (path: string, fullPath: string[]): string | null => {
    // Check if this is a deck ID (UUID format)
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(path);
    
    if (isUUID && decks[path]) {
      return decks[path];
    }
    
    // Handle specific route translations
    const routeLabels: Record<string, string> = {
      'flashcards': 'Flashcards',
      'study': 'Study',
      'edit': 'Edit',
      'upload': 'Upload',
      'ai-convert': 'AI Convert',
      'settings': 'Settings',
      'decks': 'Decks',
      'home': 'Home',
    };
    
    return routeLabels[path] || null;
  };
}