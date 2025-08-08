import { Home, User, BookOpen, BarChart3, CreditCard, TestTube } from 'lucide-react';
import { z } from 'zod';

import { NavigationConfigSchema } from '@kit/ui/navigation-schema';

import pathsConfig from '~/config/paths.config';

const iconClasses = 'w-4';

const routes = [
  {
    label: 'Learning',
    children: [
      {
        label: 'Dashboard',
        path: pathsConfig.app.home,
        Icon: <Home className={iconClasses} />,
        end: true,
      },
      {
        label: 'My Decks',
        path: '/home/decks',
        Icon: <BookOpen className={iconClasses} />,
      },
      {
        label: 'Analytics',
        path: '/home/analytics',
        Icon: <BarChart3 className={iconClasses} />,
      },
    ],
  },
  {
    label: 'Account',
    children: [
      {
        label: 'Billing',
        path: '/home/billing',
        Icon: <CreditCard className={iconClasses} />,
      },
      {
        label: 'Profile',
        path: pathsConfig.app.profileSettings,
        Icon: <User className={iconClasses} />,
      },
    ],
  },
] satisfies z.infer<typeof NavigationConfigSchema>['routes'];

export const navigationConfig = NavigationConfigSchema.parse({
  routes,
  style: process.env.NEXT_PUBLIC_NAVIGATION_STYLE,
  sidebarCollapsed: process.env.NEXT_PUBLIC_HOME_SIDEBAR_COLLAPSED,
});
