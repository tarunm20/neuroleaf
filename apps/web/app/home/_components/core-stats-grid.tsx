'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Brain, Flame, BookOpen, Crown } from 'lucide-react';

interface CoreStatsGridProps {
  cardsDue: number;
  studyStreak: number;
  totalDecks: number;
  subscriptionInfo?: {
    tier: 'free' | 'pro' | 'premium';
  };
  sm2Features?: {
    isEnabled: boolean;
  };
}

export function CoreStatsGrid({ 
  cardsDue, 
  studyStreak, 
  totalDecks, 
  subscriptionInfo,
  sm2Features: _sm2Features 
}: CoreStatsGridProps) {
  const isPremium = subscriptionInfo?.tier !== 'free';

  const stats = [
    {
      title: isPremium ? "Smart Queue" : "Cards Due",
      value: cardsDue,
      icon: Brain,
      color: cardsDue > 0 ? "text-emerald-600" : "text-muted-foreground",
      bgColor: cardsDue > 0 ? "bg-gradient-to-br from-emerald-50 to-emerald-100" : "bg-muted/20",
      subtitle: isPremium ? "Optimized by SM-2" : `${cardsDue} cards ready`,
      isPremium,
    },
    {
      title: "Study Streak",
      value: studyStreak,
      icon: Flame,
      color: studyStreak > 0 ? "text-orange-600" : "text-muted-foreground",
      bgColor: studyStreak > 0 ? "bg-gradient-to-br from-orange-50 to-orange-100" : "bg-muted/20",
      subtitle: studyStreak === 1 ? "1 day" : `${studyStreak} days`,
      showBadge: studyStreak >= 7,
      badgeText: studyStreak >= 30 ? "🏆 Master" : studyStreak >= 14 ? "🔥 Hot" : "✨ Great",
    },
    {
      title: "Total Decks",
      value: totalDecks,
      icon: BookOpen,
      color: totalDecks > 0 ? "text-emerald-600" : "text-muted-foreground",
      bgColor: totalDecks > 0 ? "bg-gradient-to-br from-emerald-50 to-green-100" : "bg-muted/20",
      subtitle: totalDecks === 1 ? "1 deck" : `${totalDecks} decks`,
      showLimit: subscriptionInfo && subscriptionInfo.tier === 'free',
      limitText: subscriptionInfo?.tier === 'free' ? "3 deck limit" : undefined,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title} className="neuroleaf-card border-emerald-100/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
              </div>
              <div className={`rounded-full p-2 ${stat.bgColor} ring-1 ring-emerald-200/50`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold">
                    {stat.value}
                  </span>
                  {stat.showBadge && (
                    <Badge variant="outline" className="text-xs bg-orange-50 text-orange-700 border-orange-200">
                      {stat.badgeText}
                    </Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stat.subtitle}
                </p>
                {stat.showLimit && stat.limitText && (
                  <p className="text-xs text-emerald-600 mt-1">
                    {stat.limitText}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}