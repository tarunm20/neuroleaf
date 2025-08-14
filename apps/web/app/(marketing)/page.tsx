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
import { DemoVideo } from './_components/demo-video';
import { TestimonialsSection } from './_components/testimonials-section';
import { TrustSignals } from './_components/trust-signals';

function Home() {
  return (
    <div className={'mt-4 flex flex-col space-y-24 py-14'}>
      <div>
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
              Stop spending hours creating study materials. Upload any lecture or document 
              and get intelligent flashcards with AI-powered test mode in seconds. 
              Join students worldwide who are improving their grades with smarter studying.
            </span>
          }
          cta={<MainCallToActionButton />}
          image={<div id="video"><DemoVideo /></div>}
        />
      </div>

      <TrustSignals />

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
                label={'Study 3x Faster'}
                description={`Upload lecture notes, PDFs, or documents and get comprehensive flashcards instantly. No more manual creation - focus on learning, not making cards.`}
              />

              <FeatureCard
                className={
                  'relative col-span-2 w-full overflow-hidden lg:col-span-1'
                }
                label={'Remember More'}
                description={`Rich, detailed flashcards with advanced formatting help you retain complex information better than traditional study methods.`}
              />

              <FeatureCard
                className={'relative col-span-2 overflow-hidden lg:col-span-1'}
                label={'Get Better Grades'}
                description={`AI test mode generates personalized questions with detailed feedback, helping you identify weak spots and improve exam performance.`}
              />

              <FeatureCard
                className={'relative col-span-2 overflow-hidden'}
                label={'Works for Any Subject'}
                description={`From medical school to law studies, our AI adapts to your field and creates relevant, high-quality study materials automatically.`}
              />
            </FeatureGrid>
          </FeatureShowcase>
        </div>
      </div>

      <TestimonialsSection />
    </div>
  );
}

export default withI18n(Home);

function MainCallToActionButton() {
  return (
    <div className={'flex flex-col sm:flex-row gap-4 items-center'}>
      <CtaButton>
        <Link href={'/auth/sign-up'}>
          <span className={'flex items-center space-x-0.5'}>
            <span>
              Start Learning for Free
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

      <div className={'flex space-x-3'}>
        <CtaButton variant={'outline'}>
          <Link href={'#video'}>
            Watch Demo
          </Link>
        </CtaButton>

        <CtaButton variant={'link'}>
          <Link href={'/pricing'}>
            View Pricing
          </Link>
        </CtaButton>
      </div>
    </div>
  );
}
