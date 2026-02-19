import { PublicLayout } from '@/components/layout';

// NOTE: Legal pages are intentionally hardcoded in English for precision.
// Matches existing Terms/Privacy approach.

const COMPANY = 'Constructive Solutions Ibiza';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>
      <div className="text-muted-foreground leading-relaxed">{children}</div>
    </section>
  );
}

export default function DisputePolicy() {
  return (
    <PublicLayout>
      <div className="container max-w-3xl py-16 space-y-10">
        <header>
          <h1 className="font-display text-3xl font-bold text-foreground">
            28-Day Fair Resolution & Payment Protection Policy
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: 19 February 2026
          </p>
          <p className="text-muted-foreground mt-4 leading-relaxed">
            This policy applies to jobs arranged through {COMPANY} between
            clients (Askers) and professionals (Taskers).
          </p>
        </header>

        <div className="space-y-10">
          <Section title="1. Purpose of This Policy">
            <p>
              {COMPANY} provides a structured and neutral dispute facilitation
              process for construction projects arranged through the platform.
            </p>
            <p className="mt-3">This policy is designed to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Protect client payments</li>
              <li>Protect professional earnings</li>
              <li>Encourage fair outcomes</li>
              <li>Reduce escalation</li>
              <li>Promote constructive resolution</li>
            </ul>
            <p className="mt-3">
              {COMPANY} does not perform construction work, supervise works, or
              act as a court or arbitrator. Our role is limited to platform-based
              facilitation and governance.
            </p>
          </Section>

          <Section title="2. Payment Protection Framework">
            <p>
              Payments processed through the platform are handled via Stripe's
              secure payment infrastructure.
            </p>
            <p className="mt-3">Where funds are pending release:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                Funds may be temporarily held or frozen in accordance with
                platform rules.
              </li>
              <li>Funds are not released while an active dispute is under review.</li>
              <li>
                Release of funds occurs only in accordance with agreed resolution
                terms.
              </li>
            </ul>
            <p className="mt-3">
              {COMPANY} does not guarantee recovery of funds already released
              prior to a dispute.
            </p>
          </Section>

          <Section title="3. Pre-Dispute Communication Stage">
            <p>Before opening a formal dispute, parties are encouraged to:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Clarify expectations</li>
              <li>Share updated photos or documentation</li>
              <li>Confirm scope alignment</li>
              <li>Attempt direct resolution</li>
            </ul>
            <p className="mt-3">
              A 24-hour cooling-off period is recommended before escalation.
            </p>
            <p className="mt-2">Many misunderstandings resolve at this stage.</p>
          </Section>

          <Section title="4. The 28-Day Resolution Pathway">
            <p>All disputes follow a structured five-stage process.</p>

            <div className="mt-6 space-y-6">
              <div>
                <h3 className="font-semibold text-foreground">
                  Stage 1 — Issue Notification (Days 1–3)
                </h3>
                <p className="mt-2">Either party may submit a dispute including:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>Description of the issue</li>
                  <li>Original expectations or scope</li>
                  <li>Supporting documentation</li>
                </ul>
                <p className="mt-2">The platform confirms:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>Receipt of dispute</li>
                  <li>Payment status</li>
                  <li>Next procedural steps</li>
                </ul>
                <p className="mt-2">All pending funds remain protected during this stage.</p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground">
                  Stage 2 — Evidence Submission (Days 4–10)
                </h3>
                <p className="mt-2">Both parties may submit:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>Photographs or videos</li>
                  <li>Plans, drawings, or specifications</li>
                  <li>Written communication</li>
                  <li>Invoices or receipts</li>
                </ul>
                <p className="mt-2">
                  Evidence is submitted independently. The platform prepares a
                  neutral factual summary outlining:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>Agreed facts</li>
                  <li>Disputed issues</li>
                  <li>Relevant scope references</li>
                </ul>
                <p className="mt-2">
                  This summary is non-binding and provided solely for facilitation
                  purposes.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground">
                  Stage 3 — Platform Review (Days 11–17)
                </h3>
                <p className="mt-2">
                  {COMPANY} reviews submitted documentation in relation to:
                </p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>The documented scope of work</li>
                  <li>Communication records</li>
                  <li>Industry-standard expectations</li>
                  <li>
                    Common construction variables in Ibiza (e.g., weather delays,
                    material availability)
                  </li>
                </ul>
                <p className="mt-2">
                  Where appropriate, either party may request an independent
                  third-party specialist review. Such review is optional and
                  subject to availability and cost allocation agreement.
                </p>
                <p className="mt-2">
                  The platform may issue a non-binding recommendation to assist
                  resolution.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground">
                  Stage 4 — Resolution Options (Days 18–24)
                </h3>
                <p className="mt-2">Parties may agree to one of the following:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>A. Corrective Work</li>
                  <li>B. Partial or Full Fund Release</li>
                  <li>C. Refund or Reallocation</li>
                  <li>D. Shared Responsibility Adjustment</li>
                </ul>
                <p className="mt-2">
                  Any agreement must be confirmed in writing within the platform
                  before fund release.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-foreground">
                  Stage 5 — Finalisation (Days 25–28)
                </h3>
                <p className="mt-2">Upon mutual confirmation:</p>
                <ul className="list-disc pl-5 space-y-1 mt-1">
                  <li>Funds are released in accordance with the agreed outcome</li>
                  <li>The dispute is formally closed</li>
                </ul>
                <p className="mt-2">
                  A limited procedural review may be requested within five (5)
                  days only where new material evidence becomes available.
                </p>
              </div>
            </div>
          </Section>

          <Section title="5. Participation Requirements">
            <p>To maintain efficiency:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                Parties are expected to respond within 48 hours to platform
                requests
              </li>
              <li>
                After 72 hours of non-response, the platform may proceed based
                on available information
              </li>
            </ul>
            <p className="mt-3">
              Non-response does not automatically determine outcome but may
              limit that party's contribution.
            </p>
          </Section>

          <Section title="6. Professional Reputation Protection">
            <p>
              Where a dispute is resolved in favour of the professional (Tasker):
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>
                Reviews directly contradicting documented findings may be
                moderated
              </li>
              <li>
                Repeated unfounded disputes by clients (Askers) may result in
                warnings or suspension
              </li>
            </ul>
            <p className="mt-3">
              Completion metrics are not penalised for unsubstantiated claims.
            </p>
          </Section>

          <Section title="7. Client Protection">
            <p>Clients (Askers) are protected through:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Documented review rights</li>
              <li>Payment protection during disputes</li>
              <li>Structured evidence submission</li>
              <li>Transparent procedural steps</li>
            </ul>
            <p className="mt-3">No pending funds are released during active dispute review.</p>
          </Section>

          <Section title="8. Construction Reality Guidance">
            <p>Users are reminded that normal construction variables may include:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Minor colour or material variations</li>
              <li>Weather-related delays</li>
              <li>Supply chain disruptions</li>
              <li>Settlement cracks after plastering</li>
            </ul>
            <p className="mt-3">These factors are considered during review.</p>
          </Section>

          <Section title="9. Platform Role Clarification">
            <p>{COMPANY}:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Does not act as a court or arbitrator</li>
              <li>Does not provide legal advice</li>
              <li>Does not certify construction quality</li>
              <li>Does not supervise works</li>
            </ul>
            <p className="mt-3">
              All contractual responsibility remains between client and
              professional.
            </p>
            <p className="mt-2">
              Platform recommendations are non-binding unless mutually accepted.
            </p>
          </Section>

          <Section title="10. Objective">
            <p>
              The objective of this framework is not to assign blame, but to
              provide a fair, structured, and transparent pathway toward
              resolution.
            </p>
          </Section>
        </div>
      </div>
    </PublicLayout>
  );
}
