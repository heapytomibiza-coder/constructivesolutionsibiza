

# Rollout Coherence Fixes

Two targeted changes, no layout or styling modifications.

## Fix 1 — Dispute Route Gating (App.tsx)

**Lines 249-251**: Change `min="service-layer"` → `min="escrow-beta"` on all three dispute routes.

## Fix 2 — "How We Work" i18n Strings

Replace steps 2-4 in both `public/locales/en/common.json` and `public/locales/es/common.json`. Step 1 ("Define the Project") is accurate and stays.

**English replacements:**
| Key | Current | New |
|-----|---------|-----|
| step2Title | Structured Payments | Get Matched |
| step2Desc | Payments are staged... | Relevant professionals are notified and can review your project details. |
| step3Title | Controlled Release | Discuss & Quote |
| step3Desc | Funds are only released... | Communicate directly with professionals and receive structured proposals. |
| step4Title | Built-In Resolution | Get It Done |
| step4Desc | If something goes wrong, a 28-day... | Track progress through the platform and complete your project with confidence. |

**Spanish replacements:**
| Key | Current | New |
|-----|---------|-----|
| step2Title | Pagos Estructurados | Conecta con Profesionales |
| step2Desc | Los pagos son escalonados... | Los profesionales relevantes son notificados y pueden revisar los detalles de tu proyecto. |
| step3Title | Liberación Controlada | Habla y Recibe Presupuesto |
| step3Desc | Los fondos solo se liberan... | Comunícate directamente con profesionales y recibe propuestas estructuradas. |
| step4Title | Resolución Integrada | Haz Realidad tu Proyecto |
| step4Desc | Si algo sale mal... | Sigue el progreso a través de la plataforma y completa tu proyecto con confianza. |

### Files touched
- `src/App.tsx` (3 attribute changes)
- `public/locales/en/common.json` (6 string replacements)
- `public/locales/es/common.json` (6 string replacements)

### Not touched
- Reviews, trust-engine gating, layout, styling, components — unchanged.

