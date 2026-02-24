import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { getDebugContext } from '@/lib/debugContext';

interface Props {
  userId?: string | null;
  activeRole?: string | null;
}

export function ReportProblemButton({ userId, activeRole }: Props) {
  const { t, i18n } = useTranslation('common');

  const handleReport = async () => {
    const payload = {
      ts: new Date().toISOString(),
      url: window.location.href,
      build: {
        version: import.meta.env.VITE_APP_VERSION ?? 'dev',
        sha: import.meta.env.VITE_GIT_SHA ?? 'local',
        time: import.meta.env.VITE_BUILD_TIME ?? '',
      },
      auth: {
        loggedIn: !!userId,
        userId: userId ?? null,
        role: activeRole ?? null,
      },
      browser: {
        ua: navigator.userAgent,
        lang: navigator.language,
        platform: (navigator as any).userAgentData?.platform ?? navigator.platform,
        viewport: `${window.innerWidth}x${window.innerHeight}`,
      },
      appLang: i18n.language,
      debug: getDebugContext(),
    };

    try {
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      toast.success(t('debug.reportCopied'));
    } catch {
      // Fallback: select a hidden textarea (iOS Safari)
      toast.info(t('debug.reportCopied'));
    }
  };

  return (
    <button
      type="button"
      onClick={handleReport}
      className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
    >
      {t('debug.reportProblem')}
    </button>
  );
}
