'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { Clock, BookOpen, Plus, Brain } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Activity {
  id: string;
  type: 'study' | 'create' | 'review';
  deckName: string;
  timestamp: string;
  cardsStudied?: number;
}

interface RecentActivityProps {
  activities: Activity[];
}

export function RecentActivity({ activities }: RecentActivityProps) {
  const recentActivities = activities.slice(0, 5);

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'study':
        return <Brain className="h-4 w-4 text-emerald-600" />;
      case 'create':
        return <Plus className="h-4 w-4 text-emerald-500" />;
      default:
        return <Clock className="h-4 w-4 text-emerald-500" />;
    }
  };

  const getActivityText = (activity: Activity) => {
    switch (activity.type) {
      case 'study':
        return `Studied ${activity.cardsStudied || 0} cards in ${activity.deckName}`;
      case 'create':
        return `Created deck "${activity.deckName}"`;
      default:
        return `Activity in ${activity.deckName}`;
    }
  };

  if (recentActivities.length === 0) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card className="neuroleaf-card border-emerald-100/50">
          <CardHeader>
            <CardTitle className="text-lg text-emerald-800">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <div className="rounded-full p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 mx-auto mb-4 w-fit">
                <Clock className="h-8 w-8 text-emerald-600" />
              </div>
              <p className="text-emerald-700 font-medium">No recent activity</p>
              <p className="text-sm text-emerald-600 mt-1">
                Start studying to see your activity here
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Card className="neuroleaf-card border-emerald-100/50">
        <CardHeader>
          <CardTitle className="text-lg text-emerald-800">Recent Activity</CardTitle>
        </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-emerald-100 border border-emerald-100/30">
              <div className="mt-1 rounded-full p-1.5 bg-gradient-to-br from-emerald-100 to-emerald-200">
                {getActivityIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-emerald-900">
                  {getActivityText(activity)}
                </p>
                <p className="text-xs text-emerald-600">
                  {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
        </CardContent>
      </Card>
    </div>
  );
}