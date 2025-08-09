import { SitePageHeader } from '~/(marketing)/_components/site-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export async function generateMetadata() {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:privacyPolicy'),
  };
}

async function PrivacyPolicyPage() {
  const { t } = await createI18nServerInstance();

  return (
    <div>
      <SitePageHeader
        title={t('marketing:privacyPolicy')}
        subtitle={t('marketing:privacyPolicyDescription')}
      />

      <div className={'container mx-auto py-8 max-w-4xl'}>
        <div className="prose prose-lg mx-auto">
          <div className="mb-8 text-sm text-muted-foreground">
            <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
            <p className="mb-4">
              Neuroleaf (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to protecting your privacy. This Privacy Policy explains 
              how we collect, use, disclose, and safeguard your information when you use our AI-powered flashcard platform.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
            
            <h3 className="text-xl font-semibold mb-3">2.1 Account Information</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Email address and name (for account creation and communication)</li>
              <li>Profile picture (if you choose to upload one)</li>
              <li>Authentication data (securely managed through Supabase)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">2.2 Content Data</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Flashcards you create (questions, answers, tags, difficulty levels)</li>
              <li>Decks and their organization</li>
              <li>Files you upload (PDFs, DOCX, TXT) for content extraction</li>
              <li>Test responses and performance data</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">2.3 Usage Analytics</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Study session data (time spent, cards reviewed, accuracy rates)</li>
              <li>Feature usage patterns</li>
              <li>Performance metrics and learning progress</li>
              <li>AI generation usage and quotas</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">2.4 Technical Data</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>IP address and device information</li>
              <li>Browser type and version</li>
              <li>Usage logs and error reports</li>
              <li>Cookies and similar tracking technologies</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
            
            <h3 className="text-xl font-semibold mb-3">3.1 Service Provision</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Creating and managing your account</li>
              <li>Storing and organizing your flashcards and decks</li>
              <li>Processing uploaded files for content extraction</li>
              <li>Tracking your learning progress and performance</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">3.2 AI Features</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Sending your content to Google&apos;s Gemini API for flashcard generation</li>
              <li>Generating AI-powered test questions and grading</li>
              <li>Analyzing content for optimal learning recommendations</li>
              <li>Providing personalized feedback and insights</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">3.3 Service Improvement</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Analyzing usage patterns to improve features</li>
              <li>Troubleshooting technical issues</li>
              <li>Developing new learning tools and capabilities</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">3.4 Communication</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Sending account-related notifications</li>
              <li>Providing customer support</li>
              <li>Notifying you of important service updates</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Information Sharing and Disclosure</h2>
            
            <h3 className="text-xl font-semibold mb-3">4.1 Third-Party Services</h3>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Supabase:</strong> Database hosting and authentication (your data is encrypted and secured)</li>
              <li><strong>Google Gemini API:</strong> AI content processing (content is processed but not stored by Google)</li>
              <li><strong>Stripe:</strong> Payment processing for subscriptions (financial data handled securely)</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">4.2 Legal Requirements</h3>
            <p className="mb-4">
              We may disclose your information if required by law, court order, or governmental request, 
              or to protect our rights, property, or safety.
            </p>

            <h3 className="text-xl font-semibold mb-3">4.3 Business Transfers</h3>
            <p className="mb-4">
              In the event of a merger, acquisition, or sale of assets, user information may be transferred 
              as part of the transaction, with appropriate notice provided.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
            <p className="mb-4">
              We implement appropriate technical and organizational measures to protect your data:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Encryption in transit and at rest</li>
              <li>Secure authentication through Supabase</li>
              <li>Regular security updates and monitoring</li>
              <li>Limited access to personal data on a need-to-know basis</li>
              <li>Secure file upload and processing procedures</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
            <p className="mb-4">
              We retain your information for as long as necessary to provide our services:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Account data: Until you delete your account</li>
              <li>Content data: Until you delete specific content or your account</li>
              <li>Usage analytics: Aggregated data may be retained indefinitely</li>
              <li>Technical logs: Typically deleted after 12 months</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Your Rights and Choices</h2>
            
            <h3 className="text-xl font-semibold mb-3">7.1 Access and Control</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>View and edit your account information</li>
              <li>Download your flashcard data</li>
              <li>Delete specific content or your entire account</li>
              <li>Control cookie preferences through your browser</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">7.2 Communication Preferences</h3>
            <ul className="list-disc pl-6 mb-4">
              <li>Opt out of non-essential communications</li>
              <li>Manage notification settings within the app</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">7.3 Data Portability</h3>
            <p className="mb-4">
              You can export your flashcard data in standard formats for use with other services.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. International Data Transfers</h2>
            <p className="mb-4">
              Your data may be processed in countries other than your own. We ensure appropriate safeguards 
              are in place to protect your information during such transfers.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Children&apos;s Privacy</h2>
            <p className="mb-4">
              Neuroleaf is not intended for children under 13. We do not knowingly collect personal information 
              from children under 13. If you believe we have collected such information, please contact us immediately.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. Changes to This Privacy Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. We will notify you of any material changes 
              by email or through prominent notice on our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about this Privacy Policy or our data practices, please contact us 
              through the contact information provided on our website or within the application.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export default withI18n(PrivacyPolicyPage);
