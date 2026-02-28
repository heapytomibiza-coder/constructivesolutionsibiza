

## Wizard Breadcrumb Tags

Add a persistent "selection breadcrumb" strip below the progress bar that accumulates tags as the user advances through the wizard. Each tag shows what was chosen in a previous step, giving clear context of the path taken.

### Behavior

- **Step 1 (Category):** No tags shown (nothing selected yet)
- **Step 2 (Subcategory):** Shows category tag, e.g. `🔧 Painting & Decorating`
- **Step 3 (Micro):** Shows category + subcategory tags
- **Step 4+ (Questions, Logistics, Extras, Review):** Shows category + subcategory + micro count tag (e.g. "3 tasks selected"), all marked with a check icon
- Tags are tappable — clicking one navigates back to that step
- Completed tags get a subtle check/filled style; the "current step" tag is highlighted

### Visual Design

- Horizontal scrollable row of `Badge` components (outline variant) sitting between the progress bar and the card
- Small text, compact pills — no clutter
- Uses existing `txCategory` / `txSubcategory` / `txMicro` for localized labels
- On mobile: horizontal scroll with `overflow-x-auto` and hidden scrollbar

### Implementation

1. **Create `WizardBreadcrumbs` component** (`src/features/wizard/canonical/components/WizardBreadcrumbs.tsx`)
   - Props: `wizardState`, `currentStep`, `onStepClick`
   - Renders conditionally based on what's been selected (only show tags for completed prior steps)
   - Each tag: icon + label, click handler calls `onStepClick(targetStep)`

2. **Mount in `CanonicalJobWizard.tsx`**
   - Insert `<WizardBreadcrumbs>` between the progress bar div and the step content Card (~line 902)
   - Pass `wizardState`, `currentStep`, and a step-click handler that validates backward navigation

3. **Add i18n keys** to `wizard.json` (EN/ES)
   - `breadcrumbs.tasksSelected`: "{{count}} tasks" / "{{count}} tareas"

