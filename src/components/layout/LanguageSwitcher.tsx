import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Globe, Loader2 } from 'lucide-react';
import { changeLanguageSafe } from '@/i18n/preload';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);

  const handleLanguageChange = async (lng: string) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await changeLanguageSafe(lng);
    } finally {
      setIsLoading(false);
    }
  };

  const currentLang = i18n.language?.startsWith('es') ? 'es' : 'en';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="gap-1">
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Globe className="h-4 w-4" />
          )}
          <span className="text-xs font-medium uppercase">{currentLang}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('en')}
          className={currentLang === 'en' ? 'bg-accent' : ''}
          disabled={isLoading}
        >
          🇬🇧 English
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={() => handleLanguageChange('es')}
          className={currentLang === 'es' ? 'bg-accent' : ''}
          disabled={isLoading}
        >
          🇪🇸 Español
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
