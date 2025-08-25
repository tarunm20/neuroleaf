'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Button } from '@kit/ui/button';
import { Badge } from '@kit/ui/badge';
import { Sparkles, Play, Clock, Target, Crown } from 'lucide-react';

interface StudyStatusCardProps {
  cardsDue: number;
  studyStreak: number;
  onStartStudying: () => void;
  sm2Features?: {
    isEnabled: boolean;
  };
  subscriptionInfo?: {
    tier: 'free' | 'pro' | 'premium';
  };
}

export function StudyStatusCard({
  cardsDue,
  studyStreak,
  onStartStudying,
  sm2Features,
  subscriptionInfo,
}: StudyStatusCardProps) {
  // Don't render if no cards are due and no streak
  if (cardsDue === 0 && studyStreak === 0) {
    return null;
  }

  const isPremium = subscriptionInfo?.tier !== 'free';
  const StudyIcon = isPremium ? Sparkles : Play;

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="neuroleaf-card border-primary/20 bg-gradient-to-r from-primary/5 to-primary/10">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2 text-card-foreground">
              <Target className="h-5 w-5 text-primary" />
              Study Status
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Cards Due Section */}
          {cardsDue > 0 && (
            <div className="flex items-center justify-between p-4 bg-card/60 rounded-lg border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-primary to-primary/80 rounded-full flex items-center justify-center">
                  <Clock className="h-5 w-5 text-white" />
                </div>
                <div>
                  <p className="font-semibold text-card-foreground">
                    {cardsDue} card{cardsDue !== 1 ? 's' : ''} ready
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isPremium ? 'Optimized for your learning pace' : 'Time to review!'}
                  </p>
                </div>
              </div>
              <Button 
                onClick={onStartStudying}
                className="neuroleaf-button-primary shadow-md"
              >
                <StudyIcon className="h-4 w-4 mr-2" />
                {isPremium ? 'Smart Study' : 'Start Study'}
              </Button>
            </div>
          )}

          {/* Study Streak Section */}
          {studyStreak > 0 && (
            <div className="flex items-center justify-between p-4 bg-card/40 rounded-lg border border-primary/20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-sm">{studyStreak}</span>
                </div>
                <div>
                  <p className="font-semibold text-card-foreground">
                    {studyStreak} day streak
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Keep it up! Consistency is key to learning
                  </p>
                </div>
              </div>
              {studyStreak >= 7 && (
                <Badge variant="outline" className="bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700">
                  🔥 On Fire!
                </Badge>
              )}
            </div>
          )}

          {/* No cards due but has streak */}
          {cardsDue === 0 && studyStreak > 0 && (
            <div className="text-center p-4 bg-primary/5 rounded-lg border border-primary/20">
              <p className="text-muted-foreground text-sm">
                Great job! No cards due right now. 
                {isPremium && sm2Features?.isEnabled && (
                  <span className="block mt-1 text-xs text-muted-foreground">
                    Your spaced repetition schedule is optimized for maximum retention.
                  </span>
                )}
              </p>
            </div>
          )}

          {/* Premium features hint for free users */}
          {!isPremium && cardsDue > 0 && (
            <div className="p-3 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border border-primary/20">
              <div className="text-center">
                <p className="text-xs text-muted-foreground mb-1">
                  💡 Upgrade for optimized spaced repetition and better retention
                </p>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => window.location.href = '/pricing'}
                  className="text-xs border-primary/20 text-primary hover:bg-primary/5"
                >
                  <Crown className="h-3 w-3 mr-1" />
                  See Plans
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}