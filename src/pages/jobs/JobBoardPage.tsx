import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PublicLayout, HeroBanner } from "@/components/layout";
import { MobileFAB } from "@/components/MobileFAB";
import { Button } from "@/components/ui/button";
import { JobsMarketplace } from "@/pages/jobs/JobsMarketplace";
import { Shield } from "lucide-react";
import heroJobs from "@/assets/heroes/hero-jobs.jpg";
import { SEOHead } from "@/components/SEOHead";

export default function JobBoardPage() {
  const navigate = useNavigate();
  const { t } = useTranslation("jobs");
  const { t: tc } = useTranslation("common");

  return (
    <PublicLayout>
      <HeroBanner
        imageSrc={heroJobs}
        title={t('board.title')}
        subtitle={t('board.subtitle')}
        height="compact"
        trustBadge={
          <div className="hero-trust-badge">
            <Shield className="h-4 w-4" />
            {tc('trust.realSpecs')} • {tc('trust.lessBackForth')} • {tc('trust.ibizaOnly')}
          </div>
        }
        action={
          <Button variant="accent" onClick={() => navigate("/post")}>
            {tc('hero.postJob')}
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
