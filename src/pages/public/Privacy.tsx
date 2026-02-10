import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout';

const LAST_UPDATED = '10 February 2026';
const COMPANY = 'Constructive Solutions Ibiza';

const Privacy = () => (
  <PublicLayout>
    <div className="container max-w-3xl py-16 space-y-10">
      <header>
        <h1 className="font-display text-3xl font-bold text-foreground">Privacy Policy</h1>
        <p className="text-sm text-muted-foreground mt-2">Last updated: {LAST_UPDATED}</p>
      </header>

      <section className="space-y-4 text-muted-foreground leading-relaxed">
        <p>
          {COMPANY} (&quot;we&quot;, &quot;us&quot;, or &quot;our&quot;) operates a construction and trade services
          marketplace connecting property owners with qualified professionals in Ibiza. This Privacy
          Policy explains how we collect, use, and protect your personal information when you use our
          platform.
        </p>
      </section>

      <Section title="1. Information We Collect">
        <ul className="list-disc pl-5 space-y-1">
          <li>Account information (name, email address, phone number)</li>
          <li>Profile details you provide (business name, service areas, bio)</li>
          <li>Job posting content (descriptions, photos, location preferences)</li>
          <li>Messages exchanged through our platform</li>
          <li>Usage data (pages visited, features used, device information)</li>
        </ul>
      </Section>

      <Section title="2. How We Use Your Information">
        <ul className="list-disc pl-5 space-y-1">
          <li>To operate and improve the platform</li>
          <li>To match clients with suitable professionals</li>
          <li>To facilitate communication between users</li>
          <li>To send service-related notifications</li>
          <li>To ensure platform safety and prevent fraud</li>
          <li>To comply with legal obligations</li>
        </ul>
      </Section>

      <Section title="3. Data Sharing">
        <p>
          We do not sell your personal data. We share information only with: service providers who
          help us operate the platform, professionals or clients you choose to connect with, and
          authorities when required by law.
        </p>
      </Section>

      <Section title="4. Cookies &amp; Analytics">
        <p>
          We use essential cookies for authentication and session management. We may use analytics
          tools to understand how users interact with the platform. You can manage cookie preferences
          through your browser settings.
        </p>
      </Section>

      <Section title="5. Your Rights">
        <p>
          You may request access to, correction of, or deletion of your personal data at any time.
          To exercise these rights, contact us through our{' '}
          <Link to="/contact" className="text-primary underline hover:text-primary/80">
            contact page
          </Link>
          .
        </p>
      </Section>

      <Section title="6. Data Security">
        <p>
          We use industry-standard encryption and security measures to protect your data. However,
          no method of transmission over the internet is 100&percnt; secure.
        </p>
      </Section>

      <Section title="7. Contact">
        <p>
          For privacy-related questions, please reach out via our{' '}
          <Link to="/contact" className="text-primary underline hover:text-primary/80">
            contact page
          </Link>{' '}
          or email us at constructivesolutionsibiza@gmail.com.
        </p>
      </Section>
    </div>
  </PublicLayout>
);

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
      <div className="text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

export default Privacy;
