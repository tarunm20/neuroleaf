import { PageWithBreadcrumbs } from '@kit/ui/page-with-breadcrumbs';
import { Card, CardContent } from '@kit/ui/card';
import { BarChart3, Clock, TrendingUp } from 'lucide-react';

export const metadata = {
  title: 'Analytics - Neuroleaf',
  description: 'Analytics dashboard coming soon with detailed insights.',
};

export default function AnalyticsPage() {
  return (
    <PageWithBreadcrumbs
      title="Analytics"
      description="Track your learning progress and performance insights."
    >
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center py-16">
            <CardContent className="space-y-6">
              {/* Icon */}
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-primary/20 to-primary/30 rounded-full flex items-center justify-center">
                <BarChart3 className="h-10 w-10 text-primary" />
              </div>
              
              {/* Title */}
              <div className="space-y-2">
                <h1 className="text-3xl font-bold text-foreground">
                  Analytics Coming Soon
                </h1>
                <p className="text-lg text-muted-foreground max-w-md mx-auto">
                  We're building comprehensive analytics to help you track your learning progress and performance insights.
                </p>
              </div>

              {/* Features Preview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 max-w-lg mx-auto">
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span>Performance Trends</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4 text-primary" />
                  <span>Study Time Tracking</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <BarChart3 className="h-4 w-4 text-primary" />
                  <span>Test Scores Analysis</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span>Learning Insights</span>
                </div>
              </div>

              {/* Status */}
              <div className="pt-4">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium">
                  <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                  In Development
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageWithBreadcrumbs>
  );
}