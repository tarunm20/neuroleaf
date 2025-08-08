import Link from 'next/link';
import { CheckCircle, ArrowRight, TestTube } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';

export const metadata = {
  title: 'Welcome to Pro - Neuroleaf',
  description: 'Thank you for upgrading to Pro! Start exploring AI-powered testing features.',
};

export default function BillingSuccessPage() {
  return (
    <div className="container mx-auto px-4 py-16 max-w-2xl">
      <div className="text-center">
        {/* Success Icon */}
        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>

        {/* Success Message */}
        <h1 className="text-3xl font-bold mb-4">Welcome to Pro!</h1>
        <p className="text-muted-foreground mb-8">
          Your subscription is now active. You have full access to all Pro features including AI-powered testing.
        </p>

        {/* Feature Highlights */}
        <Card className="mb-8 text-left">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5 text-emerald-600" />
              What's unlocked for you
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Unlimited flashcard decks and cards</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>AI-powered critical thinking questions</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Instant AI grading with detailed feedback</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Advanced performance analytics</span>
            </div>
            <div className="flex items-center gap-3">
              <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Priority customer support</span>
            </div>
          </CardContent>
        </Card>

        {/* Next Steps */}
        <div className="space-y-4">
          <Button size="lg" asChild className="w-full">
            <Link href="/home">
              Start Using Pro Features
              <ArrowRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
          
          <Button variant="outline" size="lg" asChild className="w-full">
            <Link href="/home/billing">
              Manage Subscription
            </Link>
          </Button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-sm text-muted-foreground">
          <p>
            Need help getting started? Check out our{' '}
            <Link href="/faq" className="text-primary hover:underline">
              FAQ
            </Link>{' '}
            or contact support.
          </p>
        </div>
      </div>
    </div>
  );
}