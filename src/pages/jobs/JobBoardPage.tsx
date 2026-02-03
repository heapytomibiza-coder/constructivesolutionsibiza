import { PublicLayout } from "@/components/layout";
import { MobileFAB } from "@/components/MobileFAB";
import { JobsMarketplace } from "@/pages/jobs/JobsMarketplace";

export default function JobBoardPage() {
  return (
    <PublicLayout>
      <div className="border-b border-border bg-gradient-concrete">
        <div className="container py-8">
          <h1 className="text-3xl font-display font-bold text-foreground">Job Board</h1>
          <p className="text-muted-foreground mt-2">
            Browse open jobs with full specs from the wizard.
          </p>
        </div>
      </div>

      <div className="container py-8">
        <JobsMarketplace />
      </div>

      <MobileFAB />
    </PublicLayout>
  );
}
