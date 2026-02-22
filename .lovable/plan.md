

# Complete Spanish Translations for All Wizard Questions and Answer Options

## Overview

The wizard (Step 4 of 7) shows English text in Spanish mode because `public/locales/es/questions.json` is missing translations for ~143 question labels and ~1,533 answer options. The rendering code (`QuestionPackRenderer.tsx`) already handles lookups correctly — it just needs the translations to exist.

## What Changes

**Single file update:** `public/locales/es/questions.json`

No code changes, no database changes, no schema changes.

## Approach

The update will be done in multiple batches since the file will grow from ~700 lines to ~2,500+ lines:

### Batch 1: Missing Question Labels (~143)
- Labels like "Approximate number of windows", "Approximate windows per floor", "Are any windows above ground floor?", "Additional services needed?", "Any access difficulties?", all the "Briefly describe..." labels, and many others
- Many follow patterns already established (e.g. "How many X?" becomes "Cuantos X?")

### Batch 2-5: Missing Answer Options (~1,533)
These fall into clear categories that can be translated efficiently:

1. **Numeric/range patterns** (~40% of missing): "1-2 windows", "3-5 rooms", "6-10 filters", "50-100 m2" — these follow predictable Spanish patterns (ventanas, habitaciones, filtros, m2)

2. **Room/unit counts**: "1 room", "2-3 rooms", "4+ rooms", "1 shower", "2 taps" — straightforward unit translations

3. **Material/trade terms**: "Plasterboard", "Render", "Screed", "Bitumen felt" — construction-specific Spanish vocabulary for Ibiza market

4. **Descriptive options**: "Walk-in shower", "Freestanding bath", "Mixer tap", "Under-sink", "Thermostatic" — plumbing/bathroom/kitchen specific terms

5. **Service/scope options**: "Full rewire", "Partial rewire", "Safety check only", "Supply and fit" — trade service descriptions

6. **Window cleaning specific**: "1-5 windows", "6-15 windows", "1 storey", "2 storeys", "Shutters/bars", "Ground floor only" — the new packs we recently added

## Translation Tone

- Practical, construction-appropriate Spanish (Ibiza context)
- Consistent with existing translations already in the file
- Professional but not overly formal (matching the PA service brand)

## Result

After this update, every question pack in the wizard will render fully in Spanish. No more English leaking through labels or answer selections.

