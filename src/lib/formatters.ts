 import { useTranslation } from 'react-i18next';
 
 export function useFormatters() {
   const { i18n } = useTranslation();
   const locale = i18n.language?.startsWith('es') ? 'es-ES' : 'en-GB';
 
   return {
     formatDate: (date: Date | string) => {
       const d = typeof date === 'string' ? new Date(date) : date;
       return new Intl.DateTimeFormat(locale, {
         dateStyle: 'medium',
       }).format(d);
     },
 
     formatDateTime: (date: Date | string) => {
       const d = typeof date === 'string' ? new Date(date) : date;
       return new Intl.DateTimeFormat(locale, {
         dateStyle: 'medium',
         timeStyle: 'short',
       }).format(d);
     },
 
     formatCurrency: (amount: number) =>
       new Intl.NumberFormat(locale, {
         style: 'currency',
         currency: 'EUR',
       }).format(amount),
 
     formatNumber: (num: number) =>
       new Intl.NumberFormat(locale).format(num),
   };
 }