// ADDED IMPORT
import { interpretAnswers } from '@/lib/wizard/interpretAnswers';

/** rest unchanged until answersPayload **/

// (trimmed for brevity in patch explanation)

// Inject interpretation BEFORE return
const interpretation = interpretAnswers({ logistics, extras, answers });

const answersPayload: Json = {
  selected: {
    mainCategory,
    subcategory: isCustom ? null : subcategory,
    microNames: isCustom ? [] : microNames,
    microIds: isCustom ? [] : microIds,
    microSlugs: isCustom ? [] : microSlugs,
  },
  microAnswers,
  logistics: {
    location: logistics.location,
    customLocation: logistics.customLocation ?? null,
    startDatePreset: logistics.startDatePreset ?? null,
    startDate: formatDate(logistics.startDate),
    completionDate: formatDate(logistics.completionDate),
    consultationType: logistics.consultationType ?? null,
    consultationDate: formatDate(logistics.consultationDate),
    consultationTime: logistics.consultationTime ?? null,
    budgetRange: logistics.budgetRange ?? null,
    accessDetails: logistics.accessDetails ?? [],
  },
  extras: {
    photos: extras.photos ?? [],
    notes: extras.notes ?? null,
    permitsConcern: extras.permitsConcern ?? false,
  },

  // NEW META LAYER
  meta: interpretation,

  _pack_source: (packTracking?._pack_source as string) ?? null,
  _pack_slug: (packTracking?._pack_slug as string) ?? null,
  _pack_missing: (packTracking?._pack_missing as boolean) ?? false,
};
