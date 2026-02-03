import { useNavigate } from "react-router-dom";
import { PublicLayout, PageHeader } from "@/components/layout";
import { MobileFAB } from "@/components/MobileFAB";
import { Button } from "@/components/ui/button";
import { JobsMarketplace } from "@/pages/jobs/JobsMarketplace";

export default function JobBoardPage() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <PageHeader
        title="Job Board"
        subtitle="Browse open jobs with full specs from the wizard."
        trustBadge="Real specs • Less back-and-forth • Ibiza only"
        action={
          <Button variant="accent" onClick={() => navigate("/post")}>
            Post a Job
          </Button>
        }
      />

      <div className="container py-8">
        <JobsMarketplace />
      </div>

      <MobileFAB />
    </PublicLayout>
  );
}
