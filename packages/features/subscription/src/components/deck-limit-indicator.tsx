import { Progress } from '@kit/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { isUnlimited } from '../config';
import type { SubscriptionInfo } from '../types';

interface DeckLimitIndicatorProps {
  subscriptionInfo: SubscriptionInfo;
}

export function DeckLimitIndicator({ subscriptionInfo }: DeckLimitIndicatorProps) {
  const { tier, deckLimit, currentDeckCount, remainingDecks } = subscriptionInfo;
  
  if (isUnlimited(deckLimit)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Deck Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            {currentDeckCount} decks created • Unlimited plan
          </p>
        </CardContent>
      </Card>
    );
  }
  
  const percentage = (currentDeckCount / deckLimit) * 100;
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Deck Usage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>{currentDeckCount} of {deckLimit} decks used</span>
          <span className="text-muted-foreground">{remainingDecks} remaining</span>
        </div>
        <Progress value={percentage} className="h-2" />
        {percentage >= 90 && (
          <p className="text-sm text-amber-600">
            You're approaching your deck limit. Consider upgrading your plan.
          </p>
        )}
      </CardContent>
    </Card>
  );
}