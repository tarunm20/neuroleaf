import { SitePageHeader } from '~/(marketing)/_components/site-page-header';
import { createI18nServerInstance } from '~/lib/i18n/i18n.server';
import { withI18n } from '~/lib/i18n/with-i18n';

export async function generateMetadata() {
  const { t } = await createI18nServerInstance();

  return {
    title: t('marketing:cookiePolicy'),
  };
}

async function CookiePolicyPage() {
  const { t } = await createI18nServerInstance();

  return (
    <div>
      <SitePageHeader
        title={t(`marketing:cookiePolicy`)}
        subtitle={t(`marketing:cookiePolicyDescription`)}
      />

      <div className={'container mx-auto py-8 max-w-4xl'}>
        <div className="prose prose-lg mx-auto">
          <div className="mb-8 text-sm text-muted-foreground">
            <strong>Last Updated:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </div>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. What Are Cookies</h2>
            <p className="mb-4">
              Cookies are small text files that are stored on your device when you visit our website. 
              They help us provide you with a better experience by remembering your preferences and 
              understanding how you use our service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. How Neuroleaf Uses Cookies</h2>
            <p className="mb-4">
              We use cookies and similar technologies to enhance your experience on our platform. 
              This includes maintaining your session, personalizing content, and analyzing usage patterns.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. Types of Cookies We Use</h2>
            
            <h3 className="text-xl font-semibold mb-3">3.1 Essential Cookies</h3>
            <p className="mb-4">
              These cookies are necessary for the website to function properly:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Authentication cookies:</strong> Keep you logged in to your account</li>
              <li><strong>Session cookies:</strong> Maintain your session state as you navigate</li>
              <li><strong>Security cookies:</strong> Protect against cross-site request forgery</li>
              <li><strong>Load balancing cookies:</strong> Ensure optimal performance</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">3.2 Functional Cookies</h3>
            <p className="mb-4">
              These cookies enhance functionality and personalization:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Preference cookies:</strong> Remember your settings and preferences</li>
              <li><strong>Language cookies:</strong> Store your language preference</li>
              <li><strong>Theme cookies:</strong> Remember your display preferences</li>
              <li><strong>Dashboard layout cookies:</strong> Save your customized layouts</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">3.3 Analytics Cookies</h3>
            <p className="mb-4">
              These cookies help us understand how users interact with our service:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Usage analytics:</strong> Track feature usage and user behavior</li>
              <li><strong>Performance monitoring:</strong> Identify and fix technical issues</li>
              <li><strong>A/B testing cookies:</strong> Test different features and improvements</li>
              <li><strong>Error tracking:</strong> Help us identify and resolve bugs</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">3.4 Third-Party Cookies</h3>
            <p className="mb-4">
              We may use cookies from trusted third-party services:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Supabase:</strong> Authentication and database management</li>
              <li><strong>Stripe:</strong> Payment processing and subscription management</li>
              <li><strong>Vercel/Railway:</strong> Hosting and performance optimization</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. Cookie Duration</h2>
            
            <h3 className="text-xl font-semibold mb-3">4.1 Session Cookies</h3>
            <p className="mb-4">
              These cookies are temporary and are deleted when you close your browser. 
              They include authentication and security cookies.
            </p>

            <h3 className="text-xl font-semibold mb-3">4.2 Persistent Cookies</h3>
            <p className="mb-4">
              These cookies remain on your device for a specified period:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Preference cookies:</strong> 1 year</li>
              <li><strong>Authentication tokens:</strong> 30 days (or until logout)</li>
              <li><strong>Analytics cookies:</strong> 2 years</li>
              <li><strong>Remember me cookies:</strong> 30 days</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. Managing Your Cookie Preferences</h2>
            
            <h3 className="text-xl font-semibold mb-3">5.1 Browser Controls</h3>
            <p className="mb-4">
              Most browsers allow you to control cookies through their settings:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>Block all cookies</li>
              <li>Block third-party cookies only</li>
              <li>Delete existing cookies</li>
              <li>Set cookies to be deleted when you close your browser</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">5.2 Impact of Disabling Cookies</h3>
            <p className="mb-4">
              Please note that disabling certain cookies may affect your experience:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>You may need to log in each time you visit</li>
              <li>Your preferences and settings may not be saved</li>
              <li>Some features may not work properly</li>
              <li>Performance and personalization may be reduced</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3">5.3 Cookie Consent</h3>
            <p className="mb-4">
              By continuing to use Neuroleaf, you consent to our use of cookies as described in this policy. 
              You can withdraw consent at any time by adjusting your browser settings.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. Local Storage and Similar Technologies</h2>
            <p className="mb-4">
              In addition to cookies, we may use other browser storage technologies:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li><strong>Local Storage:</strong> Store larger amounts of data locally for better performance</li>
              <li><strong>Session Storage:</strong> Temporarily store data for your current session</li>
              <li><strong>IndexedDB:</strong> Store complex data structures for offline functionality</li>
              <li><strong>Cache Storage:</strong> Store resources for faster loading</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Updates to This Cookie Policy</h2>
            <p className="mb-4">
              We may update this Cookie Policy from time to time to reflect changes in our practices 
              or applicable laws. We will notify you of any significant changes through our service 
              or by email.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. Contact Us</h2>
            <p className="mb-4">
              If you have any questions about our use of cookies or this Cookie Policy, 
              please contact us through the contact information provided on our website 
              or within the application.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. Additional Resources</h2>
            <p className="mb-4">
              For more information about cookies and how to manage them:
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li><a href="https://www.allaboutcookies.org/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">AllAboutCookies.org</a></li>
              <li><a href="https://www.youronlinechoices.com/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">Your Online Choices</a></li>
              <li>Your browser's help documentation</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}

export default withI18n(CookiePolicyPage);
