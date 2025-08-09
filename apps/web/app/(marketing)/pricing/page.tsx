import Link from 'next/link';
import { ArrowRightIcon, CheckIcon, Crown, Sparkles, Zap, TestTube, Brain } from 'lucide-react';

import { Button } from '@kit/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@kit/ui/card';
import { Badge } from '@kit/ui/badge';
import { Hero, Pill, CtaButton } from '@kit/ui/marketing';
import { Trans } from '@kit/ui/trans';

import { withI18n } from '~/lib/i18n/with-i18n';
import { createCheckoutAction } from '../../../lib/server-actions/billing-actions';
import { pricingPlans, formatPrice } from '../../../config/billing.config';

function PricingPage() {
  return (
    <div className={'mt-4 flex flex-col space-y-24 py-14'}>
      {/* Hero Section */}
      <div className={'container mx-auto'}>
        <Hero
          pill={
            <Pill label={'Simple Pricing'}>
              <span>Choose the plan that fits your learning goals</span>
            </Pill>
          }
          title={
            <>
              <span>AI-powered learning for</span>
              <span>every student</span>
            </>
          }
          subtitle={
            <span>
              Start free with 3 decks, or upgrade to Pro for unlimited decks 
              and advanced features.
            </span>
          }
          cta={<PricingCallToActionButton />}
        />
      </div>

      {/* Pricing Cards */}
      <div id="pricing" className={'container mx-auto'}>
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 mb-4">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <span className="text-sm font-medium text-primary">Flexible Plans</span>
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Choose Your Learning Journey</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your learning needs - start free or upgrade to Pro for unlimited decks.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {pricingPlans.map((plan, index) => (
            <div 
              key={plan.id} 
              className="relative transition-all duration-300 hover:shadow-xl hover:-translate-y-1 animate-in fade-in slide-in-from-bottom-8 duration-700"
              style={{ animationDelay: `${index * 150}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 z-20">
                  <Badge className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground px-4 py-2 shadow-lg whitespace-nowrap">
                    <Crown className="h-3 w-3 mr-1" />
                    Most Popular
                  </Badge>
                </div>
              )}
              <Card 
                className={`
                  relative overflow-hidden
                  ${plan.popular 
                    ? 'border-2 border-primary shadow-lg ring-2 ring-primary/20 mt-4' 
                    : 'border hover:border-primary/50 mt-4'
                  }
                `}
              >

              {plan.popular && (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />
              )}
              
              <CardHeader className="text-center pb-6 pt-8">
                <div className="flex items-center justify-center gap-2 mb-4">
                  {plan.id === 'free' ? (
                    <Brain className="h-8 w-8 text-blue-500" />
                  ) : (
                    <TestTube className="h-8 w-8 text-primary" />
                  )}
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                </div>
                
                <div className="mb-4">
                  <span className="text-5xl font-bold">{formatPrice(plan.price.monthly)}</span>
                  {plan.price.monthly > 0 && (
                    <span className="text-muted-foreground text-lg">/month</span>
                  )}
                </div>
                
                <CardDescription className="text-base leading-relaxed">
                  {plan.description}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-6">
                <div className="space-y-4">
                  {plan.features.map((feature, featureIndex) => (
                    <div 
                      key={featureIndex} 
                      className="flex items-center gap-3 animate-in fade-in slide-in-from-left-4 duration-500"
                      style={{ animationDelay: `${(index * 150) + (featureIndex * 100)}ms` }}
                    >
                      <div className="flex-shrink-0">
                        <CheckIcon className="h-4 w-4 text-green-500" />
                      </div>
                      <span className="text-sm leading-relaxed">{feature}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-4">
                  {plan.id === 'free' ? (
                    <Button 
                      className="w-full transition-all duration-300 hover:scale-105" 
                      variant="outline" 
                      size="lg" 
                      asChild
                    >
                      <Link href="/auth/sign-up">
                        <span className="flex items-center gap-2">
                          Get Started Free
                          <ArrowRightIcon className="h-4 w-4" />
                        </span>
                      </Link>
                    </Button>
                  ) : (
                    <form action={createCheckoutAction}>
                      <input type="hidden" name="priceId" value={plan.stripePriceId.monthly} />
                      <Button 
                        type="submit" 
                        className="w-full bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary transition-all duration-300 hover:scale-105 shadow-lg" 
                        size="lg"
                      >
                        <span className="flex items-center gap-2">
                          <Zap className="h-4 w-4" />
                          Subscribe to Pro
                        </span>
                      </Button>
                    </form>
                  )}
                </div>
              </CardContent>
            </Card>
            </div>
          ))}
        </div>

      </div>

      {/* Feature Comparison */}
      <div className={'container mx-auto'}>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Compare Plans</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See exactly what&apos;s included to make the best choice for your learning goals.
          </p>
        </div>

        <Card className="max-w-4xl mx-auto overflow-hidden">
          <div className="overflow-x-auto">
            <div className="grid grid-cols-3 min-w-[600px]">
              {/* Header */}
              <div className="p-6 border-b border-r bg-muted/30">
                <h3 className="font-semibold text-base">Features</h3>
              </div>
              <div className="p-6 border-b border-r text-center bg-muted/10">
                <div className="flex items-center justify-center gap-2">
                  <Brain className="h-5 w-5 text-blue-500" />
                  <h3 className="font-semibold text-base">Free</h3>
                </div>
              </div>
              <div className="p-6 border-b text-center bg-primary/5">
                <div className="flex items-center justify-center gap-2">
                  <TestTube className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-base text-primary">Pro</h3>
                </div>
              </div>

              {/* Feature Rows */}
              <div className="p-4 border-b border-r">
                <span className="text-sm font-medium">Flashcard Decks</span>
              </div>
              <div className="p-4 border-b border-r text-center">
                <span className="text-sm text-muted-foreground">3 decks</span>
              </div>
              <div className="p-4 border-b text-center">
                <span className="text-sm text-primary font-medium">Unlimited</span>
              </div>

              <div className="p-4 border-b border-r">
                <span className="text-sm font-medium">File Upload Support</span>
              </div>
              <div className="p-4 border-b border-r text-center">
                <span className="text-sm text-muted-foreground">Text only</span>
              </div>
              <div className="p-4 border-b text-center">
                <span className="text-sm text-primary font-medium">PDF, DOCX, TXT</span>
              </div>

              <div className="p-4 border-r">
                <span className="text-sm font-medium">Rich Text Editing</span>
              </div>
              <div className="p-4 border-r text-center">
                <span className="text-sm text-muted-foreground">Basic</span>
              </div>
              <div className="p-4 text-center">
                <span className="text-sm text-primary font-medium">Advanced</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* FAQ Section */}
      <div className={'container mx-auto'}>
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Everything you need to know about our AI-powered learning platform.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-6">
          {[
            {
              question: "What file types can I upload for flashcard creation?",
              answer: "Pro users can upload PDF, DOCX, and TXT files to automatically extract content and create flashcard decks. Free users can create flashcards manually using our text editor.",
              icon: Brain
            },
            {
              question: "What happens when I upgrade to Pro?",
              answer: "You'll immediately get access to unlimited decks, file upload support for PDF/DOCX/TXT, advanced rich text editing, and enhanced study features. Your existing data stays safe and accessible.",
              icon: Zap
            },
            {
              question: "What happens to my data if I downgrade?",
              answer: "Your data is always safe with us. If you downgrade to free, you'll keep access to your first 3 decks with 50 cards each. Additional content remains saved but becomes read-only until you upgrade again.",
              icon: TestTube
            }
          ].map((faq, index) => (
            <Card 
              key={index} 
              className="transition-all duration-300 hover:shadow-lg animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 mt-1">
                    <faq.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-3 text-lg">{faq.question}</h3>
                    <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

export default withI18n(PricingPage);

function PricingCallToActionButton() {
  return (
    <div className={'flex space-x-4'}>
      <CtaButton>
        <Link href={'/auth/sign-up'}>
          <span className={'flex items-center space-x-0.5'}>
            <span>
              <Trans i18nKey={'common:getStarted'} />
            </span>
            <ArrowRightIcon
              className={
                'animate-in fade-in slide-in-from-left-8 h-4' +
                ' zoom-in fill-mode-both delay-1000 duration-1000'
              }
            />
          </span>
        </Link>
      </CtaButton>

      <CtaButton variant={'link'}>
        <a href="#pricing" className="scroll-smooth">
          View Plans
        </a>
      </CtaButton>
    </div>
  );
}