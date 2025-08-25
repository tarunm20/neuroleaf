'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Progress } from '@kit/ui/progress';
import { Badge } from '@kit/ui/badge';
import { Zap, Crown, AlertCircle } from 'lucide-react';

interface QuestionUsageCardProps {
  currentUsage: number;
  limit: number;
  isProTier: boolean;
  className?: string;
}

export function QuestionUsageCard({ 
  currentUsage, 
  limit, 
  isProTier,
  className = ""
}: QuestionUsageCardProps) {
  // Pro tier users have unlimited usage
  if (isProTier) {
    return (
      <Card className={`border-yellow-200 bg-yellow-50 ${className}`}>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Crown className="h-4 w-4 text-yellow-600" />
            Question Usage
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Badge className="bg-yellow-100 text-yellow-800 border-yellow-300">
              Unlimited
            </Badge>
            <span className="text-sm text-yellow-700">
              No limits this month
            </span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const usagePercentage = (currentUsage / limit) * 100;
  const remaining = limit - currentUsage;
  const isNearLimit = usagePercentage >= 80;
  const hasReachedLimit = currentUsage >= limit;

  const getStatusColor = () => {
    if (hasReachedLimit) return "text-red-600";
    if (isNearLimit) return "text-orange-600";
    return "text-green-600";
  };

  const getCardStyle = () => {
    if (hasReachedLimit) return "border-red-200 bg-red-50";
    if (isNearLimit) return "border-orange-200 bg-orange-50";
    return "border-green-200 bg-green-50";
  };

  const getIcon = () => {
    if (hasReachedLimit) return <AlertCircle className="h-4 w-4 text-red-600" />;
    return <Zap className="h-4 w-4 text-primary" />;
  };

  const formatNumber = (num: number) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  return (
    <Card className={`${getCardStyle()} ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {getIcon()}
          Questions Used This Month
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-baseline justify-between">
          <div>
            <span className={`text-2xl font-bold ${getStatusColor()}`}>
              {formatNumber(currentUsage)}
            </span>
            <span className="text-sm text-muted-foreground ml-1">
              / {formatNumber(limit)}
            </span>
          </div>
          <Badge variant="outline" className={getStatusColor()}>
            {Math.round(usagePercentage)}%
          </Badge>
        </div>

        <Progress 
          value={usagePercentage} 
          className="h-2" 
        />

        <div className="flex justify-between items-center text-xs text-muted-foreground">
          <span>
            {hasReachedLimit 
              ? "Limit reached" 
              : `${formatNumber(remaining)} questions remaining`
            }
          </span>
        </div>

        {hasReachedLimit && (
          <div className="text-xs text-red-600 mt-2">
            You've reached your monthly limit. Usage will reset next month.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Also export with old name for compatibility
export { QuestionUsageCard as TokenUsageCard };