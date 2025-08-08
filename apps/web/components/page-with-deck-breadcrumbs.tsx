'use client';

import { PageWithBreadcrumbs } from '@kit/ui/page-with-breadcrumbs';
import { useDeckBreadcrumbContext } from './deck-breadcrumb-provider';

interface PageWithDeckBreadcrumbsProps {
  children: React.ReactNode;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  breadcrumbValues?: Record<string, string>;
  headerActions?: React.ReactNode;
  className?: string;
}

export function PageWithDeckBreadcrumbs(props: PageWithDeckBreadcrumbsProps) {
  const { deckNames } = useDeckBreadcrumbContext();
  
  return (
    <PageWithBreadcrumbs {...props} deckNames={deckNames} />
  );
}