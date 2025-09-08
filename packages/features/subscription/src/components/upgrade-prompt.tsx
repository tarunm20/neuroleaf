'use client';

import Link from 'next/link';
import { AlertTriangle, Crown, Zap } from 'lucide-react';

import { Alert, AlertDescription } from '@kit/ui/alert';
import { Button } from '@kit/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@kit/ui/dialog';

interface UpgradePromptProps {
  type: 'deck' | 'flashcard' | 'ai-generation' | 'test-session';
  current: number;
  limit: number;
  children?: React.ReactNode;
}

const UPGRADE_MESSAGES = {
  deck: {
    title: 'Deck Limit Reached',
    description: 'You\'ve reached your deck limit. Upgrade to Pro to create up to 25 decks!',
    icon: Crown,
  },
  flashcard: {
    title: 'Flashcard Limit Reached',
    description: 'You\'ve reached the flashcard limit for this deck. Upgrade to Pro for unlimited flashcards!',
    icon: Crown,
  },
  'ai-generation': {
    title: 'AI Generation Limit Reached',
    description: 'You\'ve used all your AI generations this month. Upgrade to Pro for 100 monthly AI generations!',
    icon: Zap,
  },
  'test-session': {
    title: 'Test Session Limit Reached',
    description: 'You\'ve reached your monthly test limit. Upgrade to Pro for unlimited AI-powered tests!',
    icon: Zap,
  },
};

export function UpgradePrompt({ type, current, limit, children }: UpgradePromptProps) {
  const config = UPGRADE_MESSAGES[type];
  const Icon = config.icon;

  const trigger = children || (
    <Button variant="outline" size="sm">
      <Icon className="h-4 w-4 mr-2" />
      Upgrade
    </Button>
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-amber-500" />
            {config.title}
          </DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Current usage: {current} / {limit === -1 ? '∞' : limit}
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-2 gap-3">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-muted-foreground mb-1">Free</div>
              <div className="text-sm text-muted-foreground">Current Plan</div>
            </div>
            <div className="text-center p-4 border-2 border-primary rounded-lg bg-primary/5">
              <div className="text-2xl font-bold text-primary mb-1">Pro</div>
              <div className="text-sm text-primary">$5.99/month</div>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Decks</span>
              <span>3 → 25</span>
            </div>
            <div className="flex justify-between">
              <span>Flashcards per deck</span>
              <span>50 → Unlimited</span>
            </div>
            <div className="flex justify-between">
              <span>AI generations/month</span>
              <span>10 → 100</span>
            </div>
            <div className="flex justify-between">
              <span>Test sessions/month</span>
              <span>5 → Unlimited</span>
            </div>
          </div>

          <Button asChild className="w-full" size="lg">
            <Link href="/pricing">
              <Crown className="h-4 w-4 mr-2" />
              Upgrade to Pro
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function InlineUpgradeAlert({ type, current, limit }: Omit<UpgradePromptProps, 'children'>) {
  const config = UPGRADE_MESSAGES[type];
  const Icon = config.icon;

  return (
    <Alert className="border-amber-200 bg-amber-50">
      <Icon className="h-4 w-4 text-amber-600" />
      <AlertDescription className="text-amber-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">{config.title}</div>
            <div className="text-sm">{config.description}</div>
            <div className="text-xs mt-1">Usage: {current} / {limit === -1 ? '∞' : limit}</div>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/pricing">Upgrade</Link>
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}