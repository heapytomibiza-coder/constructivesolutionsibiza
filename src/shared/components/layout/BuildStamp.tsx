import { useTranslation } from 'react-i18next';

export function BuildStamp() {
  const { t } = useTranslation('common');
  const version = import.meta.env.VITE_APP_VERSION ?? 'dev';
  const sha = import.meta.env.VITE_GIT_SHA ?? 'local';

  return (
    <span className="text-[10px] text-muted-foreground/60 select-all" title={t('debug.buildInfo', { defaultValue: 'Build info' })}>
      v{version} · {sha.slice(0, 7)}
    </span>
  );
}
