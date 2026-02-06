

# Localize Remaining Public Pages

## Problem

Four public pages still display hardcoded English text when the user switches to Spanish:

| Page | Route | Issues |
|------|-------|--------|
| **Contact** | `/contact` | Hero title/subtitle/badge, form labels, contact card labels, button |
| **How It Works** | `/how-it-works` | Hero title/subtitle/badge, section headers, 8 step cards, CTA buttons |
| **Professionals** | `/professionals` | Hero title/subtitle/badge, search placeholder, filter UI, empty states |
| **Job Board** | `/jobs` | Already using `jobs` namespace - appears to work |

---

## Solution: Add Translation Keys to `common.json`

### Part 1: Contact Page Keys

**EN:**
```json
"contact": {
  "title": "Contact Us",
  "subtitle": "Have a question? We're here to help.",
  "trustBadge": "Local team, real responses",
  "formTitle": "Send us a message",
  "formDesc": "Fill out the form and we'll get back to you shortly.",
  "labelName": "Name",
  "labelEmail": "Email",
  "labelSubject": "Subject",
  "labelMessage": "Message",
  "placeholderName": "Your name",
  "placeholderEmail": "your@email.com",
  "placeholderSubject": "How can we help?",
  "placeholderMessage": "Tell us more about your enquiry...",
  "sendButton": "Send Message",
  "emailLabel": "Email",
  "phoneLabel": "Phone",
  "locationLabel": "Location",
  "locationValue": "Ibiza, Spain"
}
```

**ES:**
```json
"contact": {
  "title": "Contacto",
  "subtitle": "¿Tienes alguna pregunta? Estamos aquí para ayudarte.",
  "trustBadge": "Equipo local, respuestas reales",
  "formTitle": "Envíanos un mensaje",
  "formDesc": "Rellena el formulario y te responderemos pronto.",
  "labelName": "Nombre",
  "labelEmail": "Email",
  "labelSubject": "Asunto",
  "labelMessage": "Mensaje",
  "placeholderName": "Tu nombre",
  "placeholderEmail": "tu@email.com",
  "placeholderSubject": "¿En qué podemos ayudarte?",
  "placeholderMessage": "Cuéntanos más sobre tu consulta...",
  "sendButton": "Enviar Mensaje",
  "emailLabel": "Email",
  "phoneLabel": "Teléfono",
  "locationLabel": "Ubicación",
  "locationValue": "Ibiza, España"
}
```

---

### Part 2: How It Works Page Keys

**EN:**
```json
"howItWorks": {
  "title": "How It Works",
  "subtitle": "Connecting clients with trusted construction professionals in Ibiza",
  "trustBadge": "Verified trades • Same-day response • Ibiza-based",
  "forClients": "For Clients",
  "forProfessionals": "For Professionals",
  "postJobButton": "Post a Job",
  "joinAsProButton": "Join as Professional",
  "clientStep1Title": "Post Your Project",
  "clientStep1Desc": "Describe your construction or renovation needs using our guided wizard.",
  "clientStep2Title": "Get Matched",
  "clientStep2Desc": "We notify verified professionals who match your project requirements.",
  "clientStep3Title": "Receive Quotes",
  "clientStep3Desc": "Compare quotes, review profiles, and message professionals directly.",
  "clientStep4Title": "Hire & Complete",
  "clientStep4Desc": "Choose your professional and complete your project with confidence.",
  "proStep1Title": "Create Your Profile",
  "proStep1Desc": "Sign up and complete your professional profile with your services and portfolio.",
  "proStep2Title": "Get Verified",
  "proStep2Desc": "Complete our verification process to build trust with potential clients.",
  "proStep3Title": "Receive Job Alerts",
  "proStep3Desc": "Get notified when jobs matching your skills are posted in your area.",
  "proStep4Title": "Win Work",
  "proStep4Desc": "Send quotes, communicate with clients, and grow your business."
}
```

**ES:**
```json
"howItWorks": {
  "title": "Cómo Funciona",
  "subtitle": "Conectando clientes con profesionales de construcción de confianza en Ibiza",
  "trustBadge": "Oficios verificados • Respuesta el mismo día • En Ibiza",
  "forClients": "Para Clientes",
  "forProfessionals": "Para Profesionales",
  "postJobButton": "Publicar un Trabajo",
  "joinAsProButton": "Unirse como Profesional",
  "clientStep1Title": "Publica Tu Proyecto",
  "clientStep1Desc": "Describe tus necesidades de construcción o reforma usando nuestro asistente guiado.",
  "clientStep2Title": "Recibe Coincidencias",
  "clientStep2Desc": "Notificamos a profesionales verificados que coincidan con los requisitos de tu proyecto.",
  "clientStep3Title": "Recibe Presupuestos",
  "clientStep3Desc": "Compara presupuestos, revisa perfiles y contacta directamente con los profesionales.",
  "clientStep4Title": "Contrata y Completa",
  "clientStep4Desc": "Elige a tu profesional y completa tu proyecto con confianza.",
  "proStep1Title": "Crea Tu Perfil",
  "proStep1Desc": "Regístrate y completa tu perfil profesional con tus servicios y portafolio.",
  "proStep2Title": "Verifica Tu Cuenta",
  "proStep2Desc": "Completa nuestro proceso de verificación para generar confianza con clientes potenciales.",
  "proStep3Title": "Recibe Alertas de Trabajos",
  "proStep3Desc": "Recibe notificaciones cuando se publiquen trabajos que coincidan con tus habilidades.",
  "proStep4Title": "Gana Trabajo",
  "proStep4Desc": "Envía presupuestos, comunícate con clientes y haz crecer tu negocio."
}
```

---

### Part 3: Professionals Page Keys

**EN:**
```json
"professionals": {
  "title": "Browse Professionals",
  "titleSelect": "Choose a Professional",
  "subtitle": "Discover verified professionals offering premium services across Ibiza",
  "subtitleSelect": "Select who you'd like to send your job request to",
  "trustBadge": "All professionals are verified",
  "searchPlaceholder": "Search professionals...",
  "searchButton": "Search",
  "filteringBy": "Filtering by:",
  "clearAll": "Clear all",
  "servicesOffered": "{{count}} services offered",
  "viewButton": "View",
  "selectButton": "Select",
  "backToJob": "Back to Job",
  "selectProBanner": "Select a professional to send your job to",
  "noResultsFiltered": "No professionals found matching these filters.",
  "noResultsEmpty": "No professionals listed yet. Check back soon!",
  "clearFilters": "Clear Filters",
  "joinAsPro": "Join as Professional"
}
```

**ES:**
```json
"professionals": {
  "title": "Explorar Profesionales",
  "titleSelect": "Elige un Profesional",
  "subtitle": "Descubre profesionales verificados que ofrecen servicios premium en Ibiza",
  "subtitleSelect": "Selecciona a quién te gustaría enviar tu solicitud de trabajo",
  "trustBadge": "Todos los profesionales están verificados",
  "searchPlaceholder": "Buscar profesionales...",
  "searchButton": "Buscar",
  "filteringBy": "Filtrando por:",
  "clearAll": "Limpiar todo",
  "servicesOffered": "{{count}} servicios ofrecidos",
  "viewButton": "Ver",
  "selectButton": "Seleccionar",
  "backToJob": "Volver al Trabajo",
  "selectProBanner": "Selecciona un profesional para enviar tu trabajo",
  "noResultsFiltered": "No se encontraron profesionales con estos filtros.",
  "noResultsEmpty": "Aún no hay profesionales listados. ¡Vuelve pronto!",
  "clearFilters": "Limpiar Filtros",
  "joinAsPro": "Unirse como Profesional"
}
```

---

## Files to Modify

| File | Changes |
|------|---------|
| `public/locales/en/common.json` | Add `contact`, `howItWorks`, `professionals` namespaces |
| `public/locales/es/common.json` | Add Spanish translations for all new keys |
| `src/pages/public/Contact.tsx` | Import `useTranslation`, wire all strings to `t()` |
| `src/pages/public/HowItWorks.tsx` | Import `useTranslation`, wire hero + all 8 step cards |
| `src/pages/public/Professionals.tsx` | Import `useTranslation`, wire hero + search + empty states |

---

## Implementation Details

### Contact.tsx Changes

```tsx
import { useTranslation } from 'react-i18next';

const Contact = () => {
  const { t } = useTranslation('common');
  
  return (
    <PublicLayout>
      <HeroBanner
        title={t('contact.title')}
        subtitle={t('contact.subtitle')}
        trustBadge={<div className="hero-trust-badge">
          <Shield className="h-4 w-4" />
          {t('contact.trustBadge')}
        </div>}
      />
      
      {/* Form */}
      <CardTitle>{t('contact.formTitle')}</CardTitle>
      <Label htmlFor="name">{t('contact.labelName')}</Label>
      <Input placeholder={t('contact.placeholderName')} />
      {/* ... etc for all fields */}
      
      {/* Contact cards */}
      <h3>{t('contact.emailLabel')}</h3>
      <h3>{t('contact.phoneLabel')}</h3>
      <h3>{t('contact.locationLabel')}</h3>
      <p>{t('contact.locationValue')}</p>
    </PublicLayout>
  );
};
```

### HowItWorks.tsx Changes

```tsx
import { useTranslation } from 'react-i18next';

const HowItWorks = () => {
  const { t } = useTranslation('common');
  
  return (
    <PublicLayout>
      <HeroBanner
        title={t('howItWorks.title')}
        subtitle={t('howItWorks.subtitle')}
        trustBadge={...{t('howItWorks.trustBadge')}}
      />
      
      <h2>{t('howItWorks.forClients')}</h2>
      <StepCard title={t('howItWorks.clientStep1Title')} 
                description={t('howItWorks.clientStep1Desc')} />
      {/* ... 3 more client steps */}
      
      <h2>{t('howItWorks.forProfessionals')}</h2>
      <StepCard title={t('howItWorks.proStep1Title')} 
                description={t('howItWorks.proStep1Desc')} />
      {/* ... 3 more pro steps */}
    </PublicLayout>
  );
};
```

### Professionals.tsx Changes

```tsx
import { useTranslation } from 'react-i18next';

const Professionals = () => {
  const { t } = useTranslation('common');
  
  return (
    <PublicLayout>
      <HeroBanner
        title={selectMode ? t('professionals.titleSelect') : t('professionals.title')}
        subtitle={selectMode ? t('professionals.subtitleSelect') : t('professionals.subtitle')}
        trustBadge={...{t('professionals.trustBadge')}}
      />
      
      <Input placeholder={t('professionals.searchPlaceholder')} />
      <Button>{t('professionals.searchButton')}</Button>
      
      {/* Filter badges */}
      <span>{t('professionals.filteringBy')}</span>
      <Button>{t('professionals.clearAll')}</Button>
      
      {/* Professional cards */}
      <p>{t('professionals.servicesOffered', { count: pro.services_count })}</p>
      <Button>{t('professionals.viewButton')}</Button>
      
      {/* Empty state */}
      <p>{hasFilters ? t('professionals.noResultsFiltered') : t('professionals.noResultsEmpty')}</p>
    </PublicLayout>
  );
};
```

---

## Summary

This plan adds **~60 translation keys** across 3 namespaces (`contact`, `howItWorks`, `professionals`) to fully localize the remaining public pages. After implementation:

- `/contact` displays "Contacto" with Spanish form labels
- `/how-it-works` shows "Cómo Funciona" with all 8 steps in Spanish
- `/professionals` shows "Explorar Profesionales" with Spanish search/filter UI

All pages will correctly switch between EN/ES based on the language selector.
