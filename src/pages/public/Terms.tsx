import { Link } from 'react-router-dom';
import { PublicLayout } from '@/components/layout';

const LAST_UPDATED = '19 February 2026';
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

      <Section title="1. Platform Role">
        <p>
          {COMPANY} operates as a structured marketplace facilitating connections between
          clients (Askers) and construction professionals (Taskers).
        </p>
        <p className="mt-3">We provide:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Job posting infrastructure</li>
          <li>Payment processing integration</li>
          <li>A structured 28-day dispute facilitation process</li>
          <li>Account governance and moderation</li>
        </ul>
        <p className="mt-3">We do not:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Perform construction work</li>
          <li>Supervise works</li>
          <li>Enter into contracts on behalf of users</li>
          <li>Guarantee workmanship outcomes</li>
        </ul>
        <p className="mt-3">
          All agreements are formed directly between the client (Asker) and the professional (Tasker).
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
          Clients (Askers) may post job requests describing the work they need. Job descriptions must be
          accurate, lawful, and related to construction, property, or trade services. We reserve the
          right to remove listings that violate these terms.
        </p>
      </Section>

      <Section title="4. Professional Obligations">
        <p>
          Professionals (Taskers) listed on the platform represent that they have the necessary skills,
          qualifications, and where applicable, licences to perform the services they offer. Any
          agreements, pricing, and timelines are between the client (Asker) and professional (Tasker) directly.
        </p>
      </Section>

      <Section title="5. Payments">
        <p>
          Payments processed through the platform are facilitated via Stripe.
        </p>
        <p className="mt-3">
          Pending funds may be held in accordance with platform rules and are
          subject to temporary freeze during active dispute review.
        </p>
        <p className="mt-3">
          {COMPANY} does not guarantee recovery of funds already released prior to dispute initiation.
        </p>
      </Section>

      <Section title="6. Dispute Facilitation">
        <p>
          {COMPANY} provides a structured 28-day dispute facilitation framework as described in
          our Dispute Policy.
        </p>
        <p className="mt-3">
          You can read the full policy here:{' '}
          <Link to="/dispute-policy" className="text-primary underline hover:text-primary/80">
            /dispute-policy
          </Link>
          .
        </p>
        <p className="mt-3">The platform may:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Review documentation</li>
          <li>Summarise submitted evidence</li>
          <li>Provide non-binding recommendations</li>
          <li>Moderate communications</li>
        </ul>
        <p className="mt-3">
          The platform does not act as an arbitrator or legally binding adjudicator.
        </p>
      </Section>

      <Section title="7. Prohibited Conduct">
        <ul className="list-disc pl-5 space-y-1">
          <li>Posting false, misleading, or fraudulent content</li>
          <li>Harassing, threatening, or abusing other users</li>
          <li>Attempting to circumvent platform security measures</li>
          <li>Using the platform for services unrelated to construction and trades</li>
          <li>Spamming or sending unsolicited promotional messages</li>
        </ul>
      </Section>

      <Section title="8. Standards & Suspension">
        <p>We reserve the right to suspend or remove accounts that:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Repeatedly deliver demonstrably substandard work</li>
          <li>Engage in fraudulent behaviour</li>
          <li>Abuse the dispute process</li>
          <li>Withhold payment without documented justification</li>
        </ul>
        <p className="mt-3">
          Account removal decisions are made at the platform's discretion to maintain marketplace integrity.
        </p>
      </Section>

      <Section title="9. Limitation of Liability">
        <p>
          {COMPANY}'s liability is limited to platform functionality and governance.
        </p>
        <p className="mt-3">We are not liable for:</p>
        <ul className="list-disc pl-5 space-y-1 mt-2">
          <li>Construction defects</li>
          <li>Worksite injuries</li>
          <li>Project delays</li>
          <li>Contractual breaches between users</li>
        </ul>
        <p className="mt-3">
          Users remain solely responsible for their agreements and compliance with applicable laws.
        </p>
      </Section>

      <Section title="10. Modifications and Contact">
        <p>
          We may update these Terms from time to time. Continued use of the platform after changes
          constitutes acceptance of the updated Terms. Material changes will be communicated via
          email or platform notification.
        </p>
        <p className="mt-3">
          If you have questions about these Terms, please reach out via our{' '}
          <Link to="/contact" className="text-primary underline hover:text-primary/80">
            contact page
          </Link>{' '}
          or email us at{' '}
          <a
            href="mailto:constructivesolutionsibiza@gmail.com"
            className="text-primary underline hover:text-primary/80"
          >
            constructivesolutionsibiza@gmail.com
          </a>
          .
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
