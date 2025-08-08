'use client';

import type { User } from '@supabase/supabase-js';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarNavigation,
  useSidebar,
} from '@kit/ui/shadcn-sidebar';

import { AppLogo } from '~/components/app-logo';
import { ProfileAccountDropdownContainer } from '~/components/personal-account-dropdown-container';
import { navigationConfig } from '~/config/navigation.config';
import { Tables } from '~/lib/database.types';

export function HomeSidebar(props: {
  account?: Tables<'accounts'>;
  user: User;
}) {
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  return (
    <Sidebar collapsible={'icon'} className="border-r border-sidebar-border bg-sidebar-background">
      <SidebarHeader className={'h-16 justify-center px-4'}>
        <div className={'flex items-center justify-center w-full'}>
          <AppLogo 
            className={'transition-all duration-200'} 
            collapsed={isCollapsed}
          />
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2">
        <SidebarNavigation config={navigationConfig} />
      </SidebarContent>

      <SidebarFooter className="p-2">
        <ProfileAccountDropdownContainer
          user={props.user}
          account={props.account}
        />
      </SidebarFooter>
    </Sidebar>
  );
}
