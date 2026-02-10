import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout';

const LAST_UPDATED = '10 February 2026';
const COMPANY = 'Constructive Solutions Ibiza';

const Terms = () => (
  <PublicLayout>
    <div className="container max-w-3xl py-16 space-y-10">
      <header>
        <h1 className="font-display text-3xl font-bold text-foreground">Terms of Service</h1>
        <p className="text-sm text-muted-foreground mt-2">Last updated: {LAST_UPDATED}</p>
      </header>

      <section className="space-y-4 text-muted-foreground leading-relaxed">
        <p>
          Welcome to {COMPANY}. By accessing or using our platform, you agree to be bound by these
          Terms of Service. If you do not agree, please do not use the platform.
        </p>
      </section>

      <Section title="1. Platform Description">
        <p>
          {COMPANY} is a marketplace that connects property owners and managers in Ibiza with
          qualified construction and trade professionals. We facilitate introductions and
          communication but are not a party to any agreement between clients and professionals.
        </p>
      </Section>

      <Section title="2. User Accounts">
        <ul className="list-disc pl-5 space-y-1">
          <li>You must provide accurate and complete registration information.</li>
          <li>You are responsible for maintaining the security of your account.</li>
          <li>You must not share your login credentials with others.</li>
          <li>You must be at least 18 years old to create an account.</li>
        </ul>
      </Section>

      <Section title="3. Posting Jobs">
        <p>
          Clients may post job requests describing the work they need. Job descriptions must be
          accurate, lawful, and related to construction, property, or trade services. We reserve the
          right to remove listings that violate these terms.
        </p>
      </Section>

      <Section title="4. Professional Obligations">
        <p>
          Professionals listed on the platform represent that they have the necessary skills,
          qualifications, and where applicable, licences to perform the services they offer. Any
          agreements, pricing, and timelines are between the client and professional directly.
        </p>
      </Section>

      <Section title="5. Prohibited Conduct">
        <ul className="list-disc pl-5 space-y-1">
          <li>Posting false, misleading, or fraudulent content</li>
          <li>Harassing, threatening, or abusing other users</li>
          <li>Attempting to circumvent platform security measures</li>
          <li>Using the platform for services unrelated to construction and trades</li>
          <li>Spamming or sending unsolicited promotional messages</li>
        </ul>
      </Section>

      <Section title="6. Limitation of Liability">
        <p>
          {COMPANY} acts solely as an intermediary platform. We do not guarantee the quality,
          safety, or legality of services offered by professionals. We are not liable for any
          disputes, damages, or losses arising from interactions between clients and professionals.
        </p>
      </Section>

      <Section title="7. Modifications">
        <p>
          We may update these Terms from time to time. Continued use of the platform after changes
          constitutes acceptance of the updated Terms. Material changes will be communicated via
          email or platform notification.
        </p>
      </Section>

      <Section title="8. Contact">
        <p>
          If you have questions about these Terms, please reach out via our{' '}
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

export default Terms;
