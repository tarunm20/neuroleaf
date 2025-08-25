'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Brain, BookOpen, TestTube } from 'lucide-react';

interface SimpleStatsProps {
  totalDecks: number;
  totalCards: number;
  testsCompleted?: number;
  subscriptionInfo?: {
    tier: 'free' | 'pro' | 'premium';
    canCreateDeck: boolean;
    deckLimit: number;
  };
}

export function SimpleStats({ 
  totalDecks, 
  totalCards, 
  testsCompleted = 0, 
  subscriptionInfo 
}: SimpleStatsProps) {
  const stats = [
    {
      title: "Total Decks",
      value: totalDecks,
      icon: BookOpen,
      color: totalDecks > 0 ? "text-primary" : "text-muted-foreground",
      bgColor: totalDecks > 0 ? "bg-gradient-to-br from-primary/10 to-primary/5" : "bg-muted/20",
      subtitle: `${subscriptionInfo?.deckLimit === -1 ? 'Unlimited' : subscriptionInfo?.deckLimit || 3} deck limit`,
    },
    {
      title: "Total Cards",
      value: totalCards,
      icon: Brain,
      color: totalCards > 0 ? "text-primary" : "text-muted-foreground",
      bgColor: totalCards > 0 ? "bg-gradient-to-br from-primary/10 to-primary/5" : "bg-muted/20",
      subtitle: "across all decks",
    },
    {
      title: "Tests Completed",
      value: testsCompleted,
      icon: TestTube,
      color: testsCompleted > 0 ? "text-primary" : "text-muted-foreground",
      bgColor: testsCompleted > 0 ? "bg-gradient-to-br from-primary/10 to-primary/5" : "bg-muted/20",
      subtitle: "AI-powered tests",
      isPro: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card 
            key={index} 
            className={`${stat.bgColor} border-primary/20 hover:shadow-md transition-shadow duration-200`}
          >
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${stat.color}`} />
                  <span className="text-card-foreground">{stat.title}</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl font-bold ${stat.color}`}>
                  {stat.value}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{stat.subtitle}</p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}