import { useNavigate } from "react-router-dom";
import { PublicLayout, HeroBanner } from "@/components/layout";
import { MobileFAB } from "@/components/MobileFAB";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { JobsMarketplace } from "@/pages/jobs/JobsMarketplace";
import { Shield } from "lucide-react";
import heroJobs from "@/assets/heroes/hero-jobs.jpg";

export default function JobBoardPage() {
  const navigate = useNavigate();

  return (
    <PublicLayout>
      <HeroBanner
        imageSrc={heroJobs}
        title="Job Board"
        subtitle="Browse open jobs with full specs from the wizard"
        height="compact"
        trustBadge={
          <div className="hero-trust-badge">
            <Shield className="h-4 w-4" />
            Real specs • Less back-and-forth • Ibiza only
          </div>
        }
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
