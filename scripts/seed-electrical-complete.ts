/**
 * Electrical Category - Complete Pack Seeder (V2)
 * 
 * Seeds all 11 Electrical packs:
 * - 4 Gold Standards (with metadata.rules for inspection/safety flags)
 * - 7 Lite packs (non-generic, trade-correct)
 * 
 * Run: npx tsx scripts/seed-electrical-complete.ts
 */

const EDGE_FUNCTION_URL = process.env.SEEDPACKS_URL || 
  "https://ngwbpuxltyfweikdupoj.supabase.co/functions/v1/seedpacks";

// Helper to normalize options to {value, label} format
function normalizeOptions(labels: string[]): Array<{ value: string; label: string }> {
  return labels.map(label => ({
    value: label.toLowerCase().trim()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, ""),
    label,
  }));
}

// ============================================================================
// Type definitions for rules engine
// ============================================================================
type PackRule = {
  id: string;
  when: { questionId: string; op: "eq" | "in"; value: string | string[] };
  add_flags: string[];
  set?: { 
    inspection_bias?: "low" | "medium" | "high" | "mandatory"; 
    safety?: "green" | "amber" | "red" 
  };
};

// ============================================================================
// ELECTRICAL PACKS (Complete Category Batch - 11 packs)
// ============================================================================
const electricalPacks = [
  // =========================================================================
  // GOLD STANDARD #1: extra-sockets-power-points
  // =========================================================================
  {
    micro_slug: "extra-sockets-power-points",
    title: "Install Extra Sockets",
    version: 2,
    is_active: true,
    metadata: {
      category_contract: "electrical",
      pattern: "add_install_points",
      inspection_bias: "medium",
      scope_unit: "points",
      rules: [
        {
          id: "sock_outdoor_requires_rcd",
          when: { questionId: "el_sock_01_task_type", op: "eq", value: "outdoor_socket" },
          add_flags: ["RCD_PROTECTION_REQUIRED", "OUTDOOR_SUITABILITY_CONFIRM"],
          set: { inspection_bias: "high" },
        },
        {
          id: "sock_unknown_cu_or_circuit",
          when: { questionId: "el_sock_03_like_for_like", op: "in", value: ["not_sure", "no_a_new_circuit_may_be_needed"] },
          add_flags: ["QUOTE_SUBJECT_TO_INSPECTION", "POSSIBLE_NEW_CIRCUIT"],
          set: { inspection_bias: "high" },
        },
        {
          id: "sock_old_cu",
          when: { questionId: "el_sock_05_cu_condition", op: "eq", value: "old_ceramic_fuses" },
          add_flags: ["CONSUMER_UNIT_OLD_CHECK_REQUIRED", "QUOTE_SUBJECT_TO_INSPECTION"],
          set: { inspection_bias: "high" },
        },
      ] as PackRule[],
    },
    questions: [
      {
        id: "el_sock_01_task_type",
        label: "What do you need installed?",
        type: "radio",
        required: true,
        options: normalizeOptions([
          "Additional wall socket(s)",
          "USB socket(s)",
          "Appliance socket (washer/oven/AC)",
          "Outdoor socket",
          "Not sure",
        ]),
        help: "Choose the closest match.",
      },
      {
        id: "el_sock_02_quantity",
        label: "How many new sockets are required?",
        type: "radio",
        required: true,
        options: normalizeOptions(["1", "2", "3–4", "5+"]),
      },
      {
        id: "el_sock_03_like_for_like",
        label: "Is this a like-for-like addition to an existing circuit?",
        type: "radio",
        required: true,
        options: normalizeOptions(["Yes", "Not sure", "No (a new circuit may be needed)"]),
      },
      {
        id: "el_sock_04_property_type",
        label: "Property type",
        type: "radio",
        required: true,
        options: normalizeOptions(["Apartment", "House", "Commercial"]),
      },
      {
        id: "el_sock_05_cu_condition",
        label: "Fuse box / consumer unit type (if known)",
        type: "radio",
        required: true,
        options: normalizeOptions(["Modern with RCD/RCBO", "Old / ceramic fuses", "Not sure"]),
      },
      {
        id: "el_sock_06_wall_method",
        label: "Do you want cables concealed (chased) or surface-mounted?",
        type: "radio",
        required: true,
        options: normalizeOptions(["Chased (concealed)", "Surface-mounted", "Not sure"]),
      },
      {
        id: "el_sock_07_occupied",
        label: "Is the property occupied during works?",
        type: "radio",
        required: true,
        options: normalizeOptions(["Yes", "No"]),
      },
      {
        id: "el_sock_08_uploads",
        label: "Upload photos (recommended for accurate quote)",
        type: "file",
        required: true,
        accept: "image/jpeg,image/png,image/webp",
        help: "Upload: wall location, nearest existing socket, consumer unit (door open).",
      },
      {
        id: "el_sock_09_notes",
        label: "Anything else the electrician should know? (optional)",
        type: "textarea",
        required: false,
      },
    ],
  },

  // =========================================================================
  // GOLD STANDARD #2: no-power-tripping-circuits
  // =========================================================================
  {
    micro_slug: "no-power-tripping-circuits",
    title: "No Power / Tripping Circuits",
    version: 2,
    is_active: true,
    metadata: {
      category_contract: "electrical",
      pattern: "fault_finding",
      inspection_bias: "high",
      scope_unit: "circuits",
      emergency_capable: true,
      rules: [
        {
          id: "fault_red_sparks",
          when: { questionId: "el_fault_01_symptom", op: "eq", value: "burning_smell_or_sparks" },
          add_flags: ["EMERGENCY", "ISOLATE_SUPPLY_NOW"],
          set: { safety: "red", inspection_bias: "mandatory" },
        },
        {
          id: "fault_possible_supply_issue",
          when: { questionId: "el_fault_02_scope", op: "eq", value: "whole_property" },
          add_flags: ["POSSIBLE_SUPPLY_ISSUE"],
        },
        {
          id: "fault_old_cu_and_wont_reset",
          when: { questionId: "el_fault_06_cu_type", op: "eq", value: "old_ceramic_fuses_rewirable" },
          add_flags: ["QUOTE_SUBJECT_TO_INSPECTION"],
          set: { inspection_bias: "high" },
        },
        {
          id: "fault_wont_reset",
          when: { questionId: "el_fault_04_reset_status", op: "eq", value: "no_it_wont_reset" },
          add_flags: ["INSPECTION_REQUIRED"],
          set: { inspection_bias: "high" },
        },
      ] as PackRule[],
    },
    questions: [
      {
        id: "el_fault_01_symptom",
        label: "What's happening?",
        type: "radio",
        required: true,
        options: normalizeOptions([
          "No power at all (whole property)",
          "No power in one area only",
          "Circuit keeps tripping",
          "Lights flickering / dimming",
          "Burning smell or sparks",
          "Other / not sure",
        ]),
      },
      {
        id: "el_fault_02_scope",
        label: "How widespread is the issue?",
        type: "radio",
        required: true,
        options: normalizeOptions([
          "Whole property",
          "One floor / section",
          "Single room",
          "Single circuit (sockets only / lights only)",
          "Outdoor supply",
        ]),
      },
      {
        id: "el_fault_03_started",
        label: "When did this start?",
        type: "radio",
        required: true,
        options: normalizeOptions([
          "Just now / today",
          "Within the last few days",
          "Ongoing / intermittent",
          "After recent work or appliance installation",
        ]),
      },
      {
        id: "el_fault_04_reset_status",
        label: "Have you been able to reset the trip?",
        type: "radio",
        required: true,
        options: normalizeOptions([
          "Yes, but it trips again",
          "Yes, and it's holding for now",
          "No, it won't reset",
          "I haven't tried / don't know how",
        ]),
      },
      {
        id: "el_fault_06_cu_type",
        label: "Type of fuse box / consumer unit",
        type: "radio",
        required: true,
        options: normalizeOptions(["Modern (switches / RCDs)", "Old (ceramic fuses / rewirable)", "Not sure"]),
      },
      {
        id: "el_fault_07_property_type",
        label: "Property type",
        type: "radio",
        required: true,
        options: normalizeOptions(["Apartment", "House", "Commercial"]),
      },
      {
        id: "el_fault_08_uploads",
        label: "Upload photos (recommended)",
        type: "file",
        required: true,
        accept: "image/jpeg,image/png,image/webp",
        help: "Consumer unit (door open) + affected area + any burn marks.",
      },
      {
        id: "el_fault_09_notes",
        label: "Extra details (optional)",
        type: "textarea",
        required: false,
      },
    ],
  },

  // =========================================================================
  // GOLD STANDARD #3: electrical-safety-checks-reports
  // =========================================================================
  {
    micro_slug: "electrical-safety-checks-reports",
    title: "Electrical Safety Check (EICR)",
    version: 2,
    is_active: true,
    metadata: {
      category_contract: "electrical",
      pattern: "compliance_inspection",
      inspection_bias: "mandatory",
      scope_unit: "property",
      compliance_required: true,
      rules: [
        {
          id: "eicr_hmo_flag",
          when: { questionId: "el_eicr_02_property_type", op: "eq", value: "hmo" },
          add_flags: ["HMO_COMPLIANCE_CONTEXT"],
        },
        {
          id: "eicr_old_cu",
          when: { questionId: "el_eicr_08_cu_type", op: "in", value: ["old_ceramic_fuses", "mixed"] },
          add_flags: ["LIKELY_REMEDIAL_RECOMMENDATIONS"],
        },
      ] as PackRule[],
    },
    questions: [
      {
        id: "el_eicr_01_purpose",
        label: "Purpose of inspection",
        type: "radio",
        required: true,
        options: normalizeOptions([
          "Landlord certificate (rental property)",
          "Buying / selling property",
          "Insurance requirement",
          "Routine safety check",
          "After recent electrical work",
        ]),
      },
      {
        id: "el_eicr_02_property_type",
        label: "Property type",
        type: "radio",
        required: true,
        options: normalizeOptions(["Apartment", "Terraced", "Semi-detached", "Detached", "Commercial", "HMO"]),
      },
      {
        id: "el_eicr_03_size",
        label: "Property size",
        type: "radio",
        required: true,
        options: normalizeOptions(["Studio–1 bed", "2–3 bed", "4–5 bed", "6+ bed"]),
      },
      {
        id: "el_eicr_04_floors",
        label: "Number of floors",
        type: "radio",
        required: true,
        options: normalizeOptions(["1", "2", "3+"]),
      },
      {
        id: "el_eicr_05_last_inspection",
        label: "Last inspection/EICR",
        type: "radio",
        required: true,
        options: normalizeOptions(["Never / don't know", "More than 10 years ago", "5–10 years ago", "Within last 5 years"]),
      },
      {
        id: "el_eicr_08_cu_type",
        label: "Consumer unit type",
        type: "radio",
        required: true,
        options: normalizeOptions(["Modern (MCBs/RCDs)", "Old (ceramic fuses)", "Mixed", "Not sure"]),
      },
      {
        id: "el_eicr_10_access",
        label: "Access to all areas (loft/garage/outbuildings)?",
        type: "radio",
        required: true,
        options: normalizeOptions(["Yes", "Partial", "Not sure"]),
      },
      {
        id: "el_eicr_11_occupancy",
        label: "Property occupancy",
        type: "radio",
        required: true,
        options: normalizeOptions(["Occupied", "Vacant", "Tenanted"]),
      },
      {
        id: "el_eicr_12_uploads",
        label: "Upload (optional)",
        type: "file",
        required: false,
        accept: "image/jpeg,image/png,image/webp,application/pdf",
        help: "Consumer unit photo + previous EICR (PDF) if available.",
      },
    ],
  },

  // =========================================================================
  // GOLD STANDARD #4: fuse-box-consumer-unit-replacement
  // =========================================================================
  {
    micro_slug: "fuse-box-consumer-unit-replacement",
    title: "Fuse Box / Consumer Unit Replacement",
    version: 2,
    is_active: true,
    metadata: {
      category_contract: "electrical",
      pattern: "major_works",
      inspection_bias: "mandatory",
      scope_unit: "circuits",
      compliance_required: true,
      rules: [
        {
          id: "cu_pre1960_old",
          when: { questionId: "el_cu_06_property_age", op: "eq", value: "pre_1960" },
          add_flags: ["EARTHING_BONDING_UPGRADE_LIKELY", "INSPECTION_MANDATORY"],
          set: { inspection_bias: "mandatory" },
        },
        {
          id: "cu_failed_eicr",
          when: { questionId: "el_cu_01_reason", op: "eq", value: "failed_eicr_safety_report" },
          add_flags: ["REMEDIAL_SCOPE_DEPENDENCY", "INSPECTION_MANDATORY"],
        },
        {
          id: "cu_16_plus",
          when: { questionId: "el_cu_04_circuits", op: "eq", value: "16" },
          add_flags: ["LARGE_BOARD_COMPLEXITY"],
        },
        {
          id: "cu_critical_equipment",
          when: { questionId: "el_cu_09_power_off_tolerance", op: "eq", value: "no_critical_equipment" },
          add_flags: ["PLANNED_SHUTDOWN_REQUIRED"],
        },
      ] as PackRule[],
    },
    questions: [
      {
        id: "el_cu_01_reason",
        label: "Reason for replacement",
        type: "radio",
        required: true,
        options: normalizeOptions([
          "Current one is old / ceramic fuses",
          "Failed EICR / safety report",
          "Adding circuits / extending property",
          "Insurance or landlord requirement",
          "Electrician recommended it",
        ]),
      },
      {
        id: "el_cu_02_cu_type",
        label: "Current consumer unit type",
        type: "radio",
        required: true,
        options: normalizeOptions(["Old (ceramic fuses)", "Modern but outdated", "Modern with RCD", "Not sure"]),
      },
      {
        id: "el_cu_04_circuits",
        label: "Approx. number of circuits",
        type: "radio",
        required: true,
        options: normalizeOptions(["Up to 6", "7–10", "11–15", "16+", "Not sure"]),
      },
      {
        id: "el_cu_05_property_type",
        label: "Property type",
        type: "radio",
        required: true,
        options: normalizeOptions(["Apartment", "Terraced", "Semi", "Detached", "Commercial"]),
      },
      {
        id: "el_cu_06_property_age",
        label: "Approx. property age",
        type: "radio",
        required: true,
        options: normalizeOptions(["Pre-1960", "1960–1990", "1990–2010", "Post-2010"]),
      },
      {
        id: "el_cu_07_earthing_bonding",
        label: "Earthing & bonding checked recently?",
        type: "radio",
        required: true,
        options: normalizeOptions(["Yes", "No", "Don't know"]),
      },
      {
        id: "el_cu_09_power_off_tolerance",
        label: "Can power be off for several hours?",
        type: "radio",
        required: true,
        options: normalizeOptions(["Yes", "Yes, minimal disruption needed", "No (critical equipment)"]),
      },
      {
        id: "el_cu_10_uploads",
        label: "Upload photos (required)",
        type: "file",
        required: true,
        accept: "image/jpeg,image/png,image/webp",
        help: "Consumer unit cover on + door open + meter/incoming supply. Cover-off only if safe.",
      },
      {
        id: "el_cu_11_notes",
        label: "Anything else? (optional)",
        type: "textarea",
        required: false,
      },
    ],
  },

  // =========================================================================
  // LITE PACK #1: install-sockets
  // =========================================================================
  {
    micro_slug: "install-sockets",
    title: "Install Sockets",
    version: 1,
    is_active: true,
    metadata: {
      category_contract: "electrical",
      pattern: "add_install_points",
      inspection_bias: "medium",
      scope_unit: "points",
      rules: [
        {
          id: "install_socket_outdoor",
          when: { questionId: "el_isock_01_socket_type", op: "eq", value: "outdoor_socket" },
          add_flags: ["RCD_PROTECTION_REQUIRED", "OUTDOOR_SUITABILITY_CONFIRM"],
          set: { inspection_bias: "high" },
        },
        {
          id: "install_socket_new_circuit_possible",
          when: { questionId: "el_isock_03_existing_circuit", op: "eq", value: "not_sure" },
          add_flags: ["POSSIBLE_NEW_CIRCUIT", "QUOTE_SUBJECT_TO_INSPECTION"],
          set: { inspection_bias: "high" },
        },
      ] as PackRule[],
    },
    questions: [
      {
        id: "el_isock_01_socket_type",
        label: "What type of socket(s)?",
        type: "radio",
        required: true,
        options: normalizeOptions(["Standard socket", "USB socket", "Appliance socket", "Outdoor socket", "Not sure"]),
      },
      {
        id: "el_isock_02_quantity",
        label: "How many sockets?",
        type: "radio",
        required: true,
        options: normalizeOptions(["1", "2", "3–4", "5+"]),
      },
      {
        id: "el_isock_03_existing_circuit",
        label: "Is there an existing socket nearby that it can extend from?",
        type: "radio",
        required: true,
        options: normalizeOptions(["Yes", "No", "Not sure"]),
      },
      {
        id: "el_isock_04_property_type",
        label: "Property type",
        type: "radio",
        required: true,
        options: normalizeOptions(["Apartment", "House", "Commercial"]),
      },
      {
        id: "el_isock_05_finish_method",
        label: "Cables concealed (chased) or surface-mounted?",
        type: "radio",
        required: true,
        options: normalizeOptions(["Chased (concealed)", "Surface-mounted", "Not sure"]),
      },
      {
        id: "el_isock_06_uploads",
        label: "Upload photos (recommended)",
        type: "file",
        required: true,
        accept: "image/jpeg,image/png,image/webp",
        help: "Wall location + nearest existing socket + consumer unit (door open).",
      },
      {
        id: "el_isock_07_notes",
        label: "Notes (optional)",
        type: "textarea",
        required: false,
      },
    ],
  },

  // =========================================================================
  // LITE PACK #2: rewiring
  // =========================================================================
  {
    micro_slug: "rewiring",
    title: "Rewiring",
    version: 1,
    is_active: true,
    metadata: {
      category_contract: "electrical",
      pattern: "major_works",
      inspection_bias: "mandatory",
      scope_unit: "circuits",
      compliance_required: true,
      rules: [
        {
          id: "rewire_full_property",
          when: { questionId: "el_rewire_01_scope", op: "eq", value: "full_property_rewire" },
          add_flags: ["MAJOR_WORKS", "INSPECTION_MANDATORY", "BUILDING_NOTICE_LIKELY"],
          set: { inspection_bias: "mandatory" },
        },
        {
          id: "rewire_old_wiring",
          when: { questionId: "el_rewire_03_wiring_type", op: "in", value: ["rubber_or_lead_sheathed", "fabric_covered_cables"] },
          add_flags: ["URGENT_SAFETY_CONCERN", "FULL_REWIRE_LIKELY"],
          set: { safety: "amber" },
        },
        {
          id: "rewire_pre1960",
          when: { questionId: "el_rewire_02_property_age", op: "eq", value: "pre_1960" },
          add_flags: ["EARTHING_BONDING_UPGRADE_LIKELY"],
        },
      ] as PackRule[],
    },
    questions: [
      {
        id: "el_rewire_01_scope",
        label: "Scope of work",
        type: "radio",
        required: true,
        options: normalizeOptions([
          "Full property rewire",
          "Partial rewire (one floor/section)",
          "Single room rewire",
          "Not sure - need assessment",
        ]),
      },
      {
        id: "el_rewire_02_property_age",
        label: "Approx. property age",
        type: "radio",
        required: true,
        options: normalizeOptions(["Pre-1960", "1960–1980", "1980–2000", "Post-2000", "Not sure"]),
      },
      {
        id: "el_rewire_03_wiring_type",
        label: "Current wiring type (if known)",
        type: "radio",
        required: true,
        options: normalizeOptions([
          "Modern PVC cables",
          "Fabric-covered cables",
          "Rubber or lead-sheathed",
          "Not sure",
        ]),
      },
      {
        id: "el_rewire_04_property_type",
        label: "Property type",
        type: "radio",
        required: true,
        options: normalizeOptions(["Apartment", "Terraced", "Semi-detached", "Detached", "Commercial"]),
      },
      {
        id: "el_rewire_05_size",
        label: "Property size",
        type: "radio",
        required: true,
        options: normalizeOptions(["Studio–1 bed", "2–3 bed", "4–5 bed", "6+ bed"]),
      },
      {
        id: "el_rewire_06_occupancy",
        label: "Will property be occupied during works?",
        type: "radio",
        required: true,
        options: normalizeOptions(["Yes", "No (vacant)", "Partially"]),
      },
      {
        id: "el_rewire_07_decoration",
        label: "Are you planning redecoration after?",
        type: "radio",
        required: true,
        options: normalizeOptions(["Yes", "No - minimal disruption needed", "Not sure"]),
        help: "Chasing cables requires making good afterwards.",
      },
      {
        id: "el_rewire_08_uploads",
        label: "Upload photos (recommended)",
        type: "file",
        required: true,
        accept: "image/jpeg,image/png,image/webp",
        help: "Consumer unit + sample wiring visible + any known issues.",
      },
    ],
  },

  // =========================================================================
  // LITE PACK #3: fuse-box-upgrade
  // =========================================================================
  {
    micro_slug: "fuse-box-upgrade",
    title: "Fuse Box Upgrade",
    version: 1,
    is_active: true,
    metadata: {
      category_contract: "electrical",
      pattern: "major_works",
      inspection_bias: "high",
      scope_unit: "circuits",
      rules: [
        {
          id: "upgrade_old_cu",
          when: { questionId: "el_fbu_02_current_type", op: "eq", value: "old_ceramic_fuses" },
          add_flags: ["FULL_REPLACEMENT_LIKELY", "EARTHING_CHECK_REQUIRED"],
          set: { inspection_bias: "mandatory" },
        },
        {
          id: "upgrade_adding_circuits",
          when: { questionId: "el_fbu_01_reason", op: "eq", value: "adding_new_circuits" },
          add_flags: ["CAPACITY_ASSESSMENT_NEEDED"],
        },
      ] as PackRule[],
    },
    questions: [
      {
        id: "el_fbu_01_reason",
        label: "Reason for upgrade",
        type: "radio",
        required: true,
        options: normalizeOptions([
          "Current one is old / outdated",
          "Adding new circuits",
          "Electrician / EICR recommended",
          "Insurance requirement",
          "Not sure",
        ]),
      },
      {
        id: "el_fbu_02_current_type",
        label: "Current fuse box type",
        type: "radio",
        required: true,
        options: normalizeOptions(["Old (ceramic fuses)", "Modern but no RCD", "Modern with RCD", "Not sure"]),
      },
      {
        id: "el_fbu_03_circuits",
        label: "Approx. number of circuits",
        type: "radio",
        required: true,
        options: normalizeOptions(["Up to 6", "7–10", "11–15", "16+", "Not sure"]),
      },
      {
        id: "el_fbu_04_property_type",
        label: "Property type",
        type: "radio",
        required: true,
        options: normalizeOptions(["Apartment", "House", "Commercial"]),
      },
      {
        id: "el_fbu_05_power_off",
        label: "Can power be off for several hours?",
        type: "radio",
        required: true,
        options: normalizeOptions(["Yes", "Minimal disruption needed", "No (critical equipment)"]),
      },
      {
        id: "el_fbu_06_uploads",
        label: "Upload photos (required)",
        type: "file",
        required: true,
        accept: "image/jpeg,image/png,image/webp",
        help: "Consumer unit (door open) + meter area.",
      },
    ],
  },

  // =========================================================================
  // LITE PACK #4: fix-faulty-outlet
  // =========================================================================
  {
    micro_slug: "fix-faulty-outlet",
    title: "Fix Faulty Outlet",
    version: 1,
    is_active: true,
    metadata: {
      category_contract: "electrical",
      pattern: "fault_finding",
      inspection_bias: "medium",
      scope_unit: "points",
      rules: [
        {
          id: "outlet_burning",
          when: { questionId: "el_ffo_01_symptom", op: "in", value: ["burning_smell_scorch_marks", "sparking"] },
          add_flags: ["EMERGENCY", "ISOLATE_CIRCUIT"],
          set: { safety: "red", inspection_bias: "mandatory" },
        },
        {
          id: "outlet_multiple",
          when: { questionId: "el_ffo_02_affected", op: "eq", value: "multiple_outlets" },
          add_flags: ["CIRCUIT_FAULT_LIKELY"],
          set: { inspection_bias: "high" },
        },
      ] as PackRule[],
    },
    questions: [
      {
        id: "el_ffo_01_symptom",
        label: "What's the problem?",
        type: "radio",
        required: true,
        options: normalizeOptions([
          "No power from outlet",
          "Intermittent power",
          "Burning smell / scorch marks",
          "Sparking",
          "Loose / damaged faceplate",
          "Other",
        ]),
      },
      {
        id: "el_ffo_02_affected",
        label: "How many outlets affected?",
        type: "radio",
        required: true,
        options: normalizeOptions(["Single outlet", "Multiple outlets", "Whole circuit"]),
      },
      {
        id: "el_ffo_03_outlet_type",
        label: "Outlet type",
        type: "radio",
        required: true,
        options: normalizeOptions(["Standard socket", "USB socket", "Cooker outlet", "Shaver socket", "Other"]),
      },
      {
        id: "el_ffo_04_property_type",
        label: "Property type",
        type: "radio",
        required: true,
        options: normalizeOptions(["Apartment", "House", "Commercial"]),
      },
      {
        id: "el_ffo_05_uploads",
        label: "Upload photos",
        type: "file",
        required: true,
        accept: "image/jpeg,image/png,image/webp",
        help: "Affected outlet + any visible damage + consumer unit.",
      },
    ],
  },

  // =========================================================================
  // LITE PACK #5: replace-switch
  // =========================================================================
  {
    micro_slug: "replace-switch",
    title: "Replace Switch",
    version: 1,
    is_active: true,
    metadata: {
      category_contract: "electrical",
      pattern: "like_for_like",
      inspection_bias: "low",
      scope_unit: "points",
      rules: [
        {
          id: "switch_sparking",
          when: { questionId: "el_rsw_02_symptom", op: "in", value: ["sparking_when_used", "burning_smell"] },
          add_flags: ["URGENT_SAFETY", "ISOLATE_CIRCUIT"],
          set: { safety: "amber", inspection_bias: "high" },
        },
        {
          id: "switch_dimmer_upgrade",
          when: { questionId: "el_rsw_03_switch_type", op: "eq", value: "dimmer_switch" },
          add_flags: ["LED_COMPATIBILITY_CHECK"],
        },
      ] as PackRule[],
    },
    questions: [
      {
        id: "el_rsw_01_quantity",
        label: "How many switches?",
        type: "radio",
        required: true,
        options: normalizeOptions(["1", "2", "3–5", "6+"]),
      },
      {
        id: "el_rsw_02_symptom",
        label: "What's the issue?",
        type: "radio",
        required: true,
        options: normalizeOptions([
          "Not working at all",
          "Intermittent",
          "Sparking when used",
          "Burning smell",
          "Cosmetic upgrade only",
        ]),
      },
      {
        id: "el_rsw_03_switch_type",
        label: "Switch type needed",
        type: "radio",
        required: true,
        options: normalizeOptions([
          "Standard light switch",
          "Dimmer switch",
          "Smart switch",
          "2-way / 3-way switch",
          "Not sure",
        ]),
      },
      {
        id: "el_rsw_04_property_type",
        label: "Property type",
        type: "radio",
        required: true,
        options: normalizeOptions(["Apartment", "House", "Commercial"]),
      },
      {
        id: "el_rsw_05_uploads",
        label: "Upload photos (optional)",
        type: "file",
        required: false,
        accept: "image/jpeg,image/png,image/webp",
        help: "Current switch + any visible damage.",
      },
    ],
  },

  // =========================================================================
  // LITE PACK #6: install-ceiling-lights
  // =========================================================================
  {
    micro_slug: "install-ceiling-lights",
    title: "Install Ceiling Lights",
    version: 1,
    is_active: true,
    metadata: {
      category_contract: "electrical",
      pattern: "add_install_points",
      inspection_bias: "medium",
      scope_unit: "points",
      rules: [
        {
          id: "ceiling_new_positions",
          when: { questionId: "el_icl_02_existing", op: "eq", value: "no_new_positions" },
          add_flags: ["NEW_CABLING_REQUIRED", "QUOTE_SUBJECT_TO_INSPECTION"],
          set: { inspection_bias: "high" },
        },
        {
          id: "ceiling_downlights_many",
          when: { questionId: "el_icl_03_quantity", op: "in", value: ["6_10", "10"] },
          add_flags: ["CIRCUIT_CAPACITY_CHECK"],
        },
      ] as PackRule[],
    },
    questions: [
      {
        id: "el_icl_01_type",
        label: "Type of ceiling light",
        type: "radio",
        required: true,
        options: normalizeOptions([
          "Pendant / chandelier",
          "Flush mount / ceiling rose",
          "Recessed downlights",
          "Track / spot lights",
          "Not sure",
        ]),
      },
      {
        id: "el_icl_02_existing",
        label: "Are there existing light points in these positions?",
        type: "radio",
        required: true,
        options: normalizeOptions(["Yes (replacing existing)", "No (new positions)", "Mix of both"]),
      },
      {
        id: "el_icl_03_quantity",
        label: "How many lights?",
        type: "radio",
        required: true,
        options: normalizeOptions(["1–2", "3–5", "6–10", "10+"]),
      },
      {
        id: "el_icl_04_dimming",
        label: "Do you need dimming capability?",
        type: "radio",
        required: true,
        options: normalizeOptions(["Yes", "No", "Not sure"]),
      },
      {
        id: "el_icl_05_property_type",
        label: "Property type",
        type: "radio",
        required: true,
        options: normalizeOptions(["Apartment", "House", "Commercial"]),
      },
      {
        id: "el_icl_06_uploads",
        label: "Upload photos",
        type: "file",
        required: true,
        accept: "image/jpeg,image/png,image/webp",
        help: "Ceiling area + existing lights (if any) + light fittings to install.",
      },
    ],
  },

  // =========================================================================
  // LITE PACK #7: outdoor-lighting
  // =========================================================================
  {
    micro_slug: "outdoor-lighting",
    title: "Outdoor Lighting",
    version: 1,
    is_active: true,
    metadata: {
      category_contract: "electrical",
      pattern: "outdoor_specialist",
      inspection_bias: "high",
      scope_unit: "points",
      rules: [
        {
          id: "outdoor_no_supply",
          when: { questionId: "el_ol_03_existing_supply", op: "eq", value: "no" },
          add_flags: ["NEW_OUTDOOR_CIRCUIT_REQUIRED", "RCD_PROTECTION_REQUIRED"],
          set: { inspection_bias: "high" },
        },
        {
          id: "outdoor_mains_voltage",
          when: { questionId: "el_ol_02_voltage", op: "eq", value: "mains_240v" },
          add_flags: ["IP_RATING_CRITICAL", "OUTDOOR_REGS_APPLY"],
        },
      ] as PackRule[],
    },
    questions: [
      {
        id: "el_ol_01_type",
        label: "Type of outdoor lighting",
        type: "radio",
        required: true,
        options: normalizeOptions([
          "Security / floodlights",
          "Garden path / bollard lights",
          "Wall lights",
          "Festoon / decorative",
          "Deck / step lights",
          "Not sure",
        ]),
      },
      {
        id: "el_ol_02_voltage",
        label: "Voltage preference",
        type: "radio",
        required: true,
        options: normalizeOptions(["Mains (240V)", "Low voltage (12V/24V)", "Solar", "Not sure"]),
      },
      {
        id: "el_ol_03_existing_supply",
        label: "Is there an existing outdoor power supply?",
        type: "radio",
        required: true,
        options: normalizeOptions(["Yes", "No", "Not sure"]),
      },
      {
        id: "el_ol_04_quantity",
        label: "How many light points?",
        type: "radio",
        required: true,
        options: normalizeOptions(["1–2", "3–5", "6–10", "10+"]),
      },
      {
        id: "el_ol_05_property_type",
        label: "Property type",
        type: "radio",
        required: true,
        options: normalizeOptions(["Apartment", "House", "Commercial"]),
      },
      {
        id: "el_ol_06_uploads",
        label: "Upload photos",
        type: "file",
        required: true,
        accept: "image/jpeg,image/png,image/webp",
        help: "Outdoor area + proposed positions + nearest power source.",
      },
    ],
  },
];

// ============================================================================
// Seeder execution
// ============================================================================
async function seedElectricalPacks() {
  console.log("🔌 Seeding Electrical category (11 packs V2)...\n");

  // Dry run first
  console.log("📋 Running dry-run validation...");
  const dryRes = await fetch(`${EDGE_FUNCTION_URL}?dry_run=1`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packs: electricalPacks }),
  });

  const dryData = await dryRes.json();
  console.log("Dry-run result:", JSON.stringify(dryData, null, 2));

  if (dryData.missingCount > 0) {
    console.warn(`\n⚠️  Missing micro slugs: ${dryData.missingSlugs.join(", ")}`);
  }

  if (dryData.qualitySummary) {
    console.log("\n📊 Quality Summary:");
    console.log(`   STRONG: ${dryData.qualitySummary.STRONG}`);
    console.log(`   ACCEPTABLE: ${dryData.qualitySummary.ACCEPTABLE}`);
    console.log(`   WEAK: ${dryData.qualitySummary.WEAK}`);
    console.log(`   FAILING: ${dryData.qualitySummary.FAILING}`);
  }

  // Live upsert
  console.log("\n🚀 Executing live upsert...");
  const liveRes = await fetch(EDGE_FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ packs: electricalPacks }),
  });

  const liveData = await liveRes.json();
  console.log("Live result:", JSON.stringify(liveData, null, 2));

  if (liveData.success) {
    console.log(`\n✅ Successfully seeded ${liveData.inserted} Electrical packs (V2 with rules)!`);
  } else {
    console.error("\n❌ Seeding failed:", liveData.error);
  }
}

seedElectricalPacks().catch(console.error);
