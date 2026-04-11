import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PLATFORM } from '@/domain/scope';
import { BuildStamp } from '@/shared/components/layout/BuildStamp';
import { ReportProblemButton } from '@/shared/components/ReportProblemButton';
import { useSession } from '@/contexts/SessionContext';

export function PublicFooter() {
  const { t } = useTranslation('common');
  const { user, activeRole } = useSession();

  return (
    <footer className="border-t border-border bg-card py-12 pb-24 md:pb-12 mt-auto">
      <div className="container">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-sm bg-gradient-steel shadow-md flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold">
                {PLATFORM.mark}
              </span>
            </div>
            <div>
              <p className="font-display font-semibold text-foreground">
                {PLATFORM.shortName}
              </p>
              <p className="text-sm text-muted-foreground">
                {t('footer.tagline')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-sm text-muted-foreground">
            <Link to="/how-it-works" className="hover:text-foreground transition-colors">
              {t('footer.howItWorks')}
            </Link>
            <Link to="/about" className="hover:text-foreground transition-colors">
              {t('footer.about')}
            </Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">
              {t('footer.contact')}
            </Link>
            <Link to="/privacy" className="hover:text-foreground transition-colors">
              {t('footer.privacy')}
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              {t('footer.terms')}
            </Link>
            <Link to="/dispute-policy" className="hover:text-foreground transition-colors">
              {t('footer.disputePolicy')}
            </Link>
          </div>

          <div className="flex flex-col items-end gap-1">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} {PLATFORM.name}
            </p>
            <div className="flex items-center gap-3">
              <BuildStamp />
              <ReportProblemButton userId={user?.id} activeRole={activeRole} />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
