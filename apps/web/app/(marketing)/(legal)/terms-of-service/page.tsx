import { SitePageHeader } from '~/(marketing)/_components/site-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export async function generateMetadata() {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:termsOfService'),
  };
}

async function TermsOfServicePage() {
  const { t } = await createI18nServerInstance();

  return (
    <div>
      <SitePageHeader
        title={t(`marketing:termsOfService`)}
        subtitle={t(`marketing:termsOfServiceDescription`)}
      />

      <div className={'container mx-auto py-8 max-w-4xl'}>
        <div className="prose prose-lg mx-auto">
          <div className="mb-8 text-sm text-muted-foreground">
            <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4">
              By accessing or using Neuroleaf ("the Service"), you agree to be bound by these Terms of Service ("Terms"). 
              If you do not agree to these Terms, you may not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
            <p className="mb-4">
              Neuroleaf is an AI-powered flashcard platform that provides:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Flashcard creation and management tools</li>
              <li>AI-powered content generation and analysis</li>
              <li>Intelligent testing and grading features</li>
              <li>Progress tracking and analytics</li>
              <li>File upload and content extraction capabilities</li>
              <li>Subscription-based access to premium features</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
            <p className="mb-4">
              To use certain features of the Service, you must create an account. You are responsible for:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Notifying us immediately of any unauthorized use</li>
              <li>Providing accurate and complete registration information</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Subscription Plans and Billing</h2>
            <p className="mb-4">
              Neuroleaf offers both free and paid subscription plans:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Free Plan:</strong> Limited to 3 decks with 50 cards each</li>
              <li><strong>Pro Plan:</strong> Unlimited decks, AI testing, and advanced features</li>
            </ul>
            <p className="mb-4">
              Paid subscriptions are billed monthly via Stripe. You may cancel your subscription at any time. 
              Refunds are not provided for partial months.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. User Content</h2>
            <p className="mb-4">
              You retain ownership of content you create or upload to Neuroleaf. By using the Service, you grant us:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Rights to store, process, and display your content as necessary to provide the Service</li>
              <li>Rights to use uploaded content for AI analysis and flashcard generation</li>
              <li>Rights to aggregate anonymized usage data for service improvement</li>
            </ul>
            <p className="mb-4">
              You are responsible for ensuring you have rights to any content you upload.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Acceptable Use</h2>
            <p className="mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Upload content that violates copyright, trademark, or other intellectual property rights</li>
              <li>Share accounts or attempt to circumvent usage limits</li>
              <li>Attempt to reverse engineer or access the Service's source code</li>
              <li>Use automated tools to access the Service without permission</li>
              <li>Upload malicious content or attempt to compromise the Service's security</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. AI Services</h2>
            <p className="mb-4">
              Our AI features use Google's Gemini API to:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Generate flashcards from uploaded content</li>
              <li>Create test questions and provide grading feedback</li>
              <li>Analyze content for optimal learning strategies</li>
            </ul>
            <p className="mb-4">
              AI-generated content is provided "as is" and may contain inaccuracies. You should review all AI-generated content.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Privacy and Data Protection</h2>
            <p className="mb-4">
              Your privacy is important to us. Please review our Privacy Policy to understand how we collect, 
              use, and protect your information. We use Supabase for secure data storage and authentication.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Limitation of Liability</h2>
            <p className="mb-4">
              To the maximum extent permitted by law, Neuroleaf shall not be liable for any indirect, 
              incidental, special, consequential, or punitive damages, or any loss of profits or revenues.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Termination</h2>
            <p className="mb-4">
              We may terminate or suspend your account at any time for violation of these Terms. 
              Upon termination, your right to use the Service ceases immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Changes to Terms</h2>
            <p className="mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of material changes 
              via email or through the Service. Continued use constitutes acceptance of the modified Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">12. Governing Law</h2>
            <p className="mb-4">
              These Terms shall be governed by and construed in accordance with the laws of the jurisdiction 
              where Neuroleaf operates, without regard to conflict of law principles.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">13. Contact Information</h2>
            <p className="mb-4">
              If you have any questions about these Terms, please contact us through the Service or via the 
              contact information provided on our website.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default withI18n(TermsOfServicePage);
