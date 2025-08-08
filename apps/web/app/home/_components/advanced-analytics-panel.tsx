'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@kit/ui/collapsible';
import { ChevronDown, ChevronUp, BarChart3, Crown, Brain, TrendingUp } from 'lucide-react';
import { SessionQualityWidget } from './session-quality-widget';

interface AdvancedAnalyticsPanelProps {
  subscriptionInfo?: {
    tier: 'free' | 'pro' | 'premium';
  };
  sessionQualityStats?: {
    averageSessionQuality: number;
    optimalStudyTime: {
      hour: number;
      dayOfWeek: number;
    };
    sessionStreaks: {
      current: number;
      longest: number;
    };
    performanceInsights: {
      bestTimeSlot: string;
      averageSessionLength: number;
      consistencyScore: number;
    };
  };
  isSessionQualityLoading?: boolean;
  onUpgradeClick?: () => void;
}

export function AdvancedAnalyticsPanel({
  subscriptionInfo,
  sessionQualityStats,
  isSessionQualityLoading,
  onUpgradeClick,
}: AdvancedAnalyticsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isPremium = subscriptionInfo?.tier !== 'free';

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card className="neuroleaf-card border-emerald-100/50">
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-emerald-50/50 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-emerald-600" />
                  Advanced Analytics
                  {isPremium && (
                    <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                      <Crown className="h-2 w-2 mr-1" />
                      {subscriptionInfo?.tier === 'premium' ? 'Premium' : 'Pro'}
                    </Badge>
                  )}
                </CardTitle>
              </div>
              <div className="flex items-center gap-2">
                {!isPremium && (
                  <Badge variant="outline" className="text-xs text-muted-foreground">
                    Upgrade to unlock
                  </Badge>
                )}
                {isOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0">
            {isPremium ? (
              <div className="space-y-6">
                {/* Session Quality Analytics */}
                <div>
                  <h4 className="text-sm font-medium text-emerald-900 mb-3 flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Study Performance Insights
                  </h4>
                  <SessionQualityWidget 
                    qualityStats={sessionQualityStats}
                    isLoading={isSessionQualityLoading}
                  />
                </div>

                {/* Future Analytics Placeholder */}
                <div className="grid gap-4 md:grid-cols-2">
                  <Card className="border-emerald-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-emerald-600" />
                        Learning Velocity
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">Coming soon...</p>
                        <p className="text-xs mt-1">Track your learning acceleration over time</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-emerald-100">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-emerald-600" />
                        Retention Analysis
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-4 text-muted-foreground">
                        <p className="text-sm">Coming soon...</p>
                        <p className="text-xs mt-1">Analyze your long-term retention rates</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="pt-4 border-t border-muted-foreground/10">
                  <p className="text-xs text-muted-foreground text-center">
                    💡 More advanced analytics coming soon. Your premium features help fund development!
                  </p>
                </div>
              </div>
            ) : (
              /* Free User Upgrade Prompt */
              <div className="text-center py-8 space-y-4">
                <div className="h-16 w-16 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center mx-auto">
                  <BarChart3 className="h-8 w-8 text-emerald-600" />
                </div>
                
                <div>
                  <h4 className="font-semibold text-emerald-900 mb-2">
                    Unlock Advanced Analytics
                  </h4>
                  <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                    Get detailed insights into your study performance, optimal study times, learning velocity, and retention analysis.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-center max-w-md mx-auto">
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <div className="font-medium text-emerald-900">Study Quality</div>
                    <div className="text-emerald-600 mt-1">Performance scoring</div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <div className="font-medium text-emerald-900">Best Times</div>
                    <div className="text-emerald-600 mt-1">Optimal study hours</div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <div className="font-medium text-emerald-900">Learning Pace</div>
                    <div className="text-emerald-600 mt-1">Velocity tracking</div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-lg">
                    <div className="font-medium text-emerald-900">Retention</div>
                    <div className="text-emerald-600 mt-1">Memory analysis</div>
                  </div>
                </div>

                <Button 
                  onClick={onUpgradeClick}
                  className="neuroleaf-button-primary"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  Upgrade to Pro
                </Button>

                <p className="text-xs text-muted-foreground">
                  Starting at $9.99/month • Cancel anytime
                </p>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}