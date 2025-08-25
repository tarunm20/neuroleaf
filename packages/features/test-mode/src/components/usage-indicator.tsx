'use client';

import React from 'react';
import Link from 'next/link';
import { Progress } from '@kit/ui/progress';
import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import { Card, CardContent } from '@kit/ui/card';
import { Zap, Crown, AlertCircle } from 'lucide-react';

interface UsageIndicatorProps {
  currentUsage: number;
  limit: number;
  isProTier: boolean;
  _remainingQuestions?: number;
  className?: string;
  showTestSessions?: boolean; // New prop to show test sessions instead of questions
}

export function UsageIndicator({ 
  currentUsage, 
  limit, 
  isProTier,
  _remainingQuestions,
  className = "",
  showTestSessions = false
}: UsageIndicatorProps) {
  // Pro tier users have unlimited usage
  if (isProTier) {
    return (
      <Card className={`border-yellow-200 bg-yellow-50 ${className}`}>
        <CardContent className="flex items-center gap-3 p-4">
          <Crown className="h-5 w-5 text-yellow-600" />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
                Pro Plan
              </Badge>
              <span className="text-sm font-medium text-yellow-800">
                Unlimited AI Questions
              </span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              Generate unlimited tests with AI this month
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Constants for test session calculations
  const QUESTIONS_PER_TEST = 10; // Average questions per test
  
  // Calculate test session metrics if showTestSessions is enabled
  const currentTestSessions = showTestSessions ? Math.floor(currentUsage / QUESTIONS_PER_TEST) : 0;
  const maxTestSessions = showTestSessions ? Math.floor(limit / QUESTIONS_PER_TEST) : 0;
  const remainingTestSessions = showTestSessions ? Math.floor((_remainingQuestions ?? (limit - currentUsage)) / QUESTIONS_PER_TEST) : 0;
  
  const usagePercentage = (currentUsage / limit) * 100;
  const isNearLimit = usagePercentage >= 80;
  const hasReachedLimit = currentUsage >= limit;

  const getStatusColor = () => {
    if (hasReachedLimit) return "text-red-600";
    if (isNearLimit) return "text-orange-600";
    return "text-green-600";
  };

  const getProgressColor = () => {
    if (hasReachedLimit) return "bg-red-500";
    if (isNearLimit) return "bg-orange-500";
    return "bg-green-500";
  };

  const getCardStyle = () => {
    if (hasReachedLimit) return "border-red-200 bg-red-50";
    if (isNearLimit) return "border-orange-200 bg-orange-50";
    return "border-green-200 bg-green-50";
  };

  const getIcon = () => {
    if (hasReachedLimit) return <AlertCircle className="h-5 w-5 text-red-600" />;
    return <Zap className="h-5 w-5 text-primary" />;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  const getMessage = () => {
    const remaining = _remainingQuestions ?? (limit - currentUsage);
    
    if (showTestSessions) {
      if (hasReachedLimit) {
        return "You've reached your monthly test limit. Upgrade to Pro for unlimited tests!";
      }
      if (isNearLimit) {
        return "Almost at your monthly test limit. Consider upgrading for unlimited tests.";
      }
      return `${remainingTestSessions} test sessions remaining this month`;
    } else {
      if (hasReachedLimit) {
        return "You've reached your monthly question limit. Upgrade to Pro for unlimited questions!";
      }
      if (isNearLimit) {
        return "Almost at your monthly limit. Consider upgrading for unlimited questions.";
      }
      return `${formatNumber(remaining)} questions remaining this month`;
    }
  };

  return (
    <Card className={`${getCardStyle()} ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-3 mb-3">
          {getIcon()}
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-card-foreground">
                {showTestSessions ? "AI Test Sessions" : "AI Question Usage"}
              </span>
              <Badge variant="outline" className={getStatusColor()}>
                {showTestSessions 
                  ? `${currentTestSessions}/${maxTestSessions}` 
                  : `${formatNumber(currentUsage)}/${formatNumber(limit)}`
                }
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {getMessage()}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <Progress 
            value={usagePercentage} 
            className="h-2" 
            style={{
              '--progress-foreground': getProgressColor()
            } as React.CSSProperties}
          />
          
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0</span>
            <span>
              {showTestSessions 
                ? `${maxTestSessions} tests/month` 
                : `${formatNumber(limit)} questions/month`
              }
            </span>
          </div>
        </div>

        {/* Upgrade CTA for near limit or reached limit */}
        {(isNearLimit || hasReachedLimit) && (
          <div className="mt-3 pt-3 border-t border-current/10">
            <Button 
              asChild 
              size="sm" 
              className="w-full"
              variant={hasReachedLimit ? "default" : "outline"}
            >
              <Link href="/home/billing">
                <Crown className="h-4 w-4 mr-2" />
                Upgrade to Pro
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Compact version for inline display
interface CompactUsageIndicatorProps {
  currentUsage: number;
  limit: number;
  isProTier: boolean;
  _remainingQuestions?: number;
  className?: string;
}

export function CompactUsageIndicator({ 
  currentUsage, 
  limit, 
  isProTier,
  _remainingQuestions,
  className = ""
}: CompactUsageIndicatorProps) {
  if (isProTier) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Crown className="h-4 w-4 text-yellow-600" />
        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
          Pro - Unlimited
        </Badge>
      </div>
    );
  }

  const hasReachedLimit = currentUsage >= limit;
  const isNearLimit = (currentUsage / limit) >= 0.8;

  const getBadgeVariant = () => {
    if (hasReachedLimit) return "destructive";
    if (isNearLimit) return "outline";
    return "secondary";
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Zap className="h-4 w-4 text-primary" />
      <Badge variant={getBadgeVariant()}>
        {formatNumber(currentUsage)}/{formatNumber(limit)} questions used
      </Badge>
      {hasReachedLimit && (
        <Button asChild size="sm" variant="outline">
          <Link href="/home/billing">
            Upgrade
          </Link>
        </Button>
      )}
    </div>
  );
}