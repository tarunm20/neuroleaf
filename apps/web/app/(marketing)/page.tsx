import Image from 'next/image';
import Link from 'next/link';

import { ArrowRightIcon, LayoutDashboard } from 'lucide-react';

import {
  CtaButton,
  FeatureCard,
  FeatureGrid,
  FeatureShowcase,
  FeatureShowcaseIconContainer,
  Hero,
  Pill,
} from '@kit/ui/marketing';
import { Trans } from '@kit/ui/trans';

import { withI18n } from '~/lib/i18n/with-i18n';

function Home() {
  return (
    <div className={'mt-4 flex flex-col space-y-24 py-14'}>
      <div className={'container mx-auto'}>
        <Hero
          pill={
            <Pill label={'AI-Powered'}>
              <span>Smart flashcards that adapt to your learning style</span>
            </Pill>
          }
          title={
            <>
              <span>Master any subject with</span>
              <span>AI-powered flashcards</span>
            </>
          }
          subtitle={
            <span>
              Transform any lecture or document into intelligent flashcards with AI-powered 
              test mode that provides personalized feedback on your learning progress.
            </span>
          }
          cta={<MainCallToActionButton />}
          image={
            <Image
              priority
              className={
                'dark:border-primary/10 rounded-2xl border border-gray-200'
              }
              width={3558}
              height={2222}
              src={`/images/dashboard.webp`}
              alt={`App Image`}
            />
          }
        />
      </div>

      <div className={'container mx-auto'}>
        <div
          className={'flex flex-col space-y-16 xl:space-y-32 2xl:space-y-36'}
        >
          <FeatureShowcase
            heading={
              <>
                <b className="font-semibold dark:text-white">
                  The smartest way to learn
                </b>
                .{' '}
                <span className="text-muted-foreground font-normal">
                  Harness the power of AI to create personalized study
                  experiences that adapt to your learning pace.
                </span>
              </>
            }
            icon={
              <FeatureShowcaseIconContainer>
                <LayoutDashboard className="h-5" />
                <span>Smart Learning Platform</span>
              </FeatureShowcaseIconContainer>
            }
          >
            <FeatureGrid>
              <FeatureCard
                className={'relative col-span-2 overflow-hidden'}
                label={'Convert Lectures to Flashcards'}
                description={`Upload any lecture notes, PDFs, or documents and automatically convert them into comprehensive flashcards using AI.`}
              />

              <FeatureCard
                className={
                  'relative col-span-2 w-full overflow-hidden lg:col-span-1'
                }
                label={'Create Detailed Flashcards'}
                description={`Build rich, detailed flashcards with advanced formatting and multimedia support for comprehensive learning.`}
              />

              <FeatureCard
                className={'relative col-span-2 overflow-hidden lg:col-span-1'}
                label={'AI Test Mode'}
                description={`Generate curated questions and get AI-powered grading with detailed feedback on your responses.`}
              />

              <FeatureCard
                className={'relative col-span-2 overflow-hidden'}
                label={'More Features Coming'}
                description={`We're constantly adding new features to enhance your learning experience. Stay tuned for exciting updates!`}
              />
            </FeatureGrid>
          </FeatureShowcase>
        </div>
      </div>
    </div>
  );
}

export default withI18n(Home);

function MainCallToActionButton() {
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
        <Link href={'/pricing'}>
          View Pricing
        </Link>
      </CtaButton>
    </div>
  );
}
