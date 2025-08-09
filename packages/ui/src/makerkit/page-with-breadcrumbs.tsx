'use client';

import { AppBreadcrumbs } from './app-breadcrumbs';
import { PageBody, PageHeader } from './page';
import { createDeckBreadcrumbFetcher } from './deck-breadcrumb-fetcher';

interface PageWithBreadcrumbsProps {
  children: React.ReactNode;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  breadcrumbValues?: Record<string, string>;
  headerActions?: React.ReactNode;
  className?: string;
  deckNames?: Record<string, string>;
}

export function PageWithBreadcrumbs({
  children,
  title,
  description: _description,
  breadcrumbValues,
  headerActions,
  className,
  deckNames = {},
}: PageWithBreadcrumbsProps) {
  // Create the breadcrumb fetcher with deck names
  const breadcrumbLabelFetcher = createDeckBreadcrumbFetcher(deckNames);

  return (
    <>
      <PageHeader 
        title={title}
        description={
          <AppBreadcrumbs 
            values={breadcrumbValues}
            labelFetcher={breadcrumbLabelFetcher}
          />
        }
      >
        {headerActions}
      </PageHeader>
      
      <PageBody className={className}>
        <div className="py-8">
          {children}
        </div>
      </PageBody>
    </>
  );
}