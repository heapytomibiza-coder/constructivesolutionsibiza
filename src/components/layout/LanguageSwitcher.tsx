 import { useTranslation } from 'react-i18next';
 import { Button } from '@/components/ui/button';
 import { Globe } from 'lucide-react';
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from '@/components/ui/dropdown-menu';
 
 export function LanguageSwitcher() {
   const { i18n } = useTranslation();
 
   const changeLanguage = (lng: string) => {
     i18n.changeLanguage(lng);
   };
 
   const currentLang = i18n.language?.startsWith('es') ? 'es' : 'en';
 
   return (
     <DropdownMenu>
       <DropdownMenuTrigger asChild>
         <Button variant="ghost" size="icon" className="gap-1">
           <Globe className="h-4 w-4" />
           <span className="text-xs font-medium uppercase">{currentLang}</span>
         </Button>
       </DropdownMenuTrigger>
       <DropdownMenuContent align="end">
         <DropdownMenuItem 
           onClick={() => changeLanguage('en')}
           className={currentLang === 'en' ? 'bg-accent' : ''}
         >
           🇬🇧 English
         </DropdownMenuItem>
         <DropdownMenuItem 
           onClick={() => changeLanguage('es')}
           className={currentLang === 'es' ? 'bg-accent' : ''}
         >
           🇪🇸 Español
         </DropdownMenuItem>
       </DropdownMenuContent>
     </DropdownMenu>
   );
 }