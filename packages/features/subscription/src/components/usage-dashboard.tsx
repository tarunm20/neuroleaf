'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Progress } from '@kit/ui/progress';
import { Badge } from '@kit/ui/badge';
import { Crown, Zap, BookOpen, TestTube } from 'lucide-react';
import { UpgradePrompt } from './upgrade-prompt';

interface UsageData {
  tier: string;
  limits: {
    maxDecks: number;
    maxFlashcardsPerDeck: number;
    maxAIGenerationsPerMonth: number;
    maxTestSessionsPerMonth: number;
    hasUnlimitedTests: boolean;
  };
  usage: {
    decks: number;
    aiGenerations: number;
    testSessions: number;
  };
}

interface UsageDashboardProps {
  usageData: UsageData;
}

export function UsageDashboard({ usageData }: UsageDashboardProps) {
  const { tier, limits, usage } = usageData;

  const getProgressValue = (current: number, limit: number) => {
    if (limit === -1) return 0; // Unlimited
    return Math.min((current / limit) * 100, 100);
  };

  const getProgressColor = (current: number, limit: number) => {
    if (limit === -1) return 'bg-green-500'; // Unlimited
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 70) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const formatLimit = (limit: number) => {
    return limit === -1 ? '∞' : limit.toString();
  };

  const isNearLimit = (current: number, limit: number) => {
    if (limit === -1) return false;
    return current >= limit * 0.8;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Usage Overview</h3>
          <p className="text-sm text-muted-foreground">
            Track your current usage and limits
          </p>
        </div>
        <Badge variant={tier === 'free' ? 'secondary' : 'default'} className="flex items-center gap-1">
          {tier === 'pro' && <Crown className="h-3 w-3" />}
          {tier.charAt(0).toUpperCase() + tier.slice(1)} Plan
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Decks */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Decks</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usage.decks} / {formatLimit(limits.maxDecks)}
            </div>
            <Progress 
              value={getProgressValue(usage.decks, limits.maxDecks)} 
              className="mt-2"
            />
            {isNearLimit(usage.decks, limits.maxDecks) && (
              <div className="mt-2">
                <UpgradePrompt
                  type="deck"
                  current={usage.decks}
                  limit={limits.maxDecks}
                >
                  <Badge variant="outline" className="text-xs">
                    Near Limit
                  </Badge>
                </UpgradePrompt>
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Generations */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI Generations</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usage.aiGenerations} / {formatLimit(limits.maxAIGenerationsPerMonth)}
            </div>
            <Progress 
              value={getProgressValue(usage.aiGenerations, limits.maxAIGenerationsPerMonth)} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">This month</p>
            {isNearLimit(usage.aiGenerations, limits.maxAIGenerationsPerMonth) && (
              <div className="mt-2">
                <UpgradePrompt
                  type="ai-generation"
                  current={usage.aiGenerations}
                  limit={limits.maxAIGenerationsPerMonth}
                >
                  <Badge variant="outline" className="text-xs">
                    Near Limit
                  </Badge>
                </UpgradePrompt>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Test Sessions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Test Sessions</CardTitle>
            <TestTube className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {usage.testSessions} / {formatLimit(limits.maxTestSessionsPerMonth)}
            </div>
            <Progress 
              value={getProgressValue(usage.testSessions, limits.maxTestSessionsPerMonth)} 
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">This month</p>
            {isNearLimit(usage.testSessions, limits.maxTestSessionsPerMonth) && (
              <div className="mt-2">
                <UpgradePrompt
                  type="test-session"
                  current={usage.testSessions}
                  limit={limits.maxTestSessionsPerMonth}
                >
                  <Badge variant="outline" className="text-xs">
                    Near Limit
                  </Badge>
                </UpgradePrompt>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Flashcards per Deck */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cards per Deck</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              Up to {formatLimit(limits.maxFlashcardsPerDeck)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Per deck limit</p>
            {limits.maxFlashcardsPerDeck === 50 && (
              <div className="mt-2">
                <UpgradePrompt
                  type="flashcard"
                  current={50}
                  limit={50}
                >
                  <Badge variant="outline" className="text-xs">
                    Upgrade for ∞
                  </Badge>
                </UpgradePrompt>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {tier === 'free' && (
        <Card className="border-amber-200 bg-amber-50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-amber-800 mb-1">
                  Ready to unlock more?
                </h4>
                <p className="text-sm text-amber-700">
                  Upgrade to Pro for 25 decks, unlimited flashcards, 100 AI generations, and unlimited tests.
                </p>
              </div>
              <UpgradePrompt
                type="deck"
                current={usage.decks}
                limit={limits.maxDecks}
              />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}