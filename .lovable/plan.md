
# Implement Homepage Rebrand: Guide + Mediator Positioning

## Overview

Apply the refined copy that repositions Constructive Solutions Ibiza from a "find workers" marketplace to a **guide/mediator** platform that bridges clients and construction.

## Files to Update

| File | Sections to Modify |
|------|-------------------|
| `public/locales/en/common.json` | hero, trust, home, footer.tagline |
| `public/locales/es/common.json` | hero, trust, home, footer.tagline |

## English Updates

### Hero Section (lines 38-43)
```json
"hero": {
  "title": "Bridging the gap between idea and build",
  "subtitle": "We help you understand your project — then connect you with the right professionals",
  "postJob": "Start Your Project",
  "browsePros": "Browse Professionals"
}
```

### Trust Badges (lines 44-51)
```json
"trust": {
  "verified": "Verified trades",
  "sameDay": "Same-day response",
  "local": "Ibiza-based",
  "guided": "Guided process",
  "clarity": "Clear communication",
  "realSpecs": "Clear specs",
  "lessBackForth": "Less back-and-forth",
  "ibizaOnly": "Ibiza only"
}
```

### Footer Tagline (line 60)
```json
"tagline": "Bridging clients and construction professionals in Ibiza."
```

### Home Section (lines 107-120)
```json
"home": {
  "ourServices": "What Do You Need?",
  "ourServicesDesc": "Tell us about your project — we help clarify the scope and connect you with the right trade",
  "viewAllServices": "View All Services",
  "verifiedTitle": "Clarity First",
  "verifiedDesc": "Our guided questions translate your idea into a clear, build-ready brief",
  "quickTitle": "Aligned Expectations",
  "quickDesc": "Clients and professionals start on the same page from day one",
  "qualityTitle": "Trusted Connections",
  "qualityDesc": "Verified professionals who understand exactly what's required",
  "ctaTitle": "Not sure where to start?",
  "ctaDesc": "Answer a few quick questions and we'll help you define the scope.",
  "ctaButton": "Get Started"
}
```

## Spanish Updates

### Hero Section
```json
"hero": {
  "title": "El puente entre tu idea y la obra",
  "subtitle": "Te ayudamos a entender tu proyecto y te conectamos con los profesionales adecuados",
  "postJob": "Iniciar proyecto",
  "browsePros": "Ver profesionales"
}
```

### Trust Badges
```json
"trust": {
  "verified": "Oficios verificados",
  "sameDay": "Respuesta el mismo día",
  "local": "En Ibiza",
  "guided": "Proceso guiado",
  "clarity": "Comunicación clara",
  "realSpecs": "Especificaciones claras",
  "lessBackForth": "Menos ida y vuelta",
  "ibizaOnly": "Solo Ibiza"
}
```

### Footer Tagline
```json
"tagline": "Conectando clientes y profesionales de la construcción en Ibiza."
```

### Home Section
```json
"home": {
  "ourServices": "¿Qué necesitas?",
  "ourServicesDesc": "Cuéntanos tu proyecto: te ayudamos a definirlo y a conectar con el oficio adecuado",
  "viewAllServices": "Ver Todos los Servicios",
  "verifiedTitle": "Claridad primero",
  "verifiedDesc": "Nuestras preguntas guiadas convierten tu idea en un encargo claro",
  "quickTitle": "Expectativas alineadas",
  "quickDesc": "Cliente y profesional empiezan con la misma visión desde el primer día",
  "qualityTitle": "Conexiones de confianza",
  "qualityDesc": "Profesionales verificados que entienden exactamente lo que se necesita",
  "ctaTitle": "¿No sabes por dónde empezar?",
  "ctaDesc": "Responde a unas preguntas rápidas y te ayudamos a definir el alcance.",
  "ctaButton": "Empezar"
}
```

## Component Updates (if needed)

The `Index.tsx` homepage already uses the `t()` function for all these keys, so no component changes are required. The new trust keys (`guided`, `clarity`) will need to be added to the hero trust badge in `Index.tsx`.

### Update Trust Badge in Index.tsx (lines 66-74)
Current badges use: `verified`, `sameDay`, `local`

Recommend updating to: `guided`, `clarity`, `local` to reinforce the mediator positioning.

## Result

After this change, the homepage will:
- Lead with "bridging" and "understanding" language
- Emphasize the guided process over worker search
- Position CS Ibiza as the translator between client needs and construction reality
- Have consistent native-feeling Spanish translations
