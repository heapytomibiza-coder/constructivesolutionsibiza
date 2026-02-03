/**
 * Electrical Complete Seeder
 * - 7 lite packs for missing micro-services
 * - metadata.rules injection for all 4 Gold Standards
 */

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://ngwbpuxltyfweikdupoj.supabase.co";
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_PUBLISHABLE_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5nd2JwdXhsdHlmd2Vpa2R1cG9qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njk4ODg1NzUsImV4cCI6MjA4NTQ2NDU3NX0.ieckD2MOaexZk06ROQuUiGADLa_LlU4kVS-IrIzdqn4";

// ============================================================
// GOLD STANDARD PACKS WITH RULES (Updates to existing 4)
// ============================================================

const goldStandardsWithRules = [
  {
    microSlug: "extra-sockets-power-points",
    title: "Install Extra Sockets",
    metadata: {
      category_contract: "electrical",
      inspection_bias: "medium",
      pattern: "add_install_points",
      rules: [
        {
          id: "outdoor_rcd_required",
          when: { questionId: "task_type", op: "eq", value: "outdoor_socket" },
          add_flags: ["RCD_PROTECTION_REQUIRED", "OUTDOOR_SUITABILITY_CHECK"],
          set: { inspection_bias: "high" }
        },
        {
          id: "old_cu_inspection",
          when: { questionId: "cu_condition", op: "eq", value: "old_ceramic_fuses" },
          add_flags: ["INSPECTION_RECOMMENDED"],
          set: { inspection_bias: "high" }
        },
        {
          id: "new_circuit_likely",
          when: { questionId: "like_for_like", op: "eq", value: "no_new_circuit_needed" },
          add_flags: ["NEW_CIRCUIT_LIKELY", "QUOTE_SUBJECT_TO_INSPECTION"],
          set: { inspection_bias: "high" }
        },
        {
          id: "appliance_load_check",
          when: { questionId: "task_type", op: "eq", value: "appliance_socket" },
          add_flags: ["LOAD_ASSESSMENT_REQUIRED"]
        }
      ]
    },
    questions: [
      { id: "task_type", label: "What do you need installed?", type: "radio", required: true,
        options: [
          { value: "wall_sockets", label: "Additional wall socket(s)" },
          { value: "usb_sockets", label: "USB socket(s)" },
          { value: "appliance_socket", label: "Appliance socket (washer/oven/AC)" },
          { value: "outdoor_socket", label: "Outdoor socket" },
          { value: "not_sure", label: "Not sure" }
        ]
      },
      { id: "quantity", label: "How many new sockets?", type: "radio", required: true,
        options: [
          { value: "1", label: "1" },
          { value: "2", label: "2" },
          { value: "3_4", label: "3–4" },
          { value: "5_plus", label: "5+" }
        ]
      },
      { id: "like_for_like", label: "Adding to existing circuit or new circuit needed?", type: "radio", required: true,
        options: [
          { value: "existing_circuit", label: "Yes, existing circuit" },
          { value: "not_sure", label: "Not sure" },
          { value: "no_new_circuit_needed", label: "No, new circuit likely needed" }
        ]
      },
      { id: "cu_condition", label: "Consumer unit / fuse box type?", type: "radio", required: true,
        options: [
          { value: "modern_rcd", label: "Modern with RCD/RCBO" },
          { value: "old_ceramic_fuses", label: "Old / ceramic fuses" },
          { value: "not_sure", label: "Not sure" }
        ]
      },
      { id: "wall_method", label: "Concealed or surface-mounted cabling?", type: "radio", required: true,
        options: [
          { value: "concealed", label: "Concealed (wall chasing)" },
          { value: "surface", label: "Surface-mounted" },
          { value: "not_sure", label: "Not sure" }
        ]
      },
      { id: "property_type", label: "Property type", type: "radio", required: true,
        options: [
          { value: "apartment", label: "Apartment" },
          { value: "house", label: "House" },
          { value: "commercial", label: "Commercial" }
        ]
      },
      { id: "photos", label: "Upload photos: wall location, nearest socket, consumer unit", type: "file", required: true, accept: "image/*" },
      { id: "notes", label: "Anything else? (access, parking, finishes)", type: "textarea", required: false }
    ]
  },
  {
    microSlug: "no-power-tripping-circuits",
    title: "No Power / Tripping Circuits",
    metadata: {
      category_contract: "electrical",
      inspection_bias: "high",
      pattern: "fault_finding",
      rules: [
        {
          id: "emergency_sparks",
          when: { questionId: "symptom", op: "eq", value: "burning_smell_sparks" },
          add_flags: ["EMERGENCY", "ISOLATE_SUPPLY_NOW"],
          set: { safety: "red", inspection_bias: "mandatory" }
        },
        {
          id: "whole_property_supply",
          when: { questionId: "scope", op: "eq", value: "whole_property" },
          add_flags: ["POSSIBLE_SUPPLY_ISSUE", "CHECK_DNO"]
        },
        {
          id: "old_cu_wont_reset",
          when: { questionId: "cu_type", op: "eq", value: "old_ceramic" },
          add_flags: ["INSPECTION_MANDATORY"],
          set: { inspection_bias: "mandatory" }
        },
        {
          id: "wont_reset_urgent",
          when: { questionId: "reset_status", op: "eq", value: "wont_reset" },
          add_flags: ["URGENT_DIAGNOSIS"],
          set: { safety: "amber" }
        }
      ]
    },
    questions: [
      { id: "symptom", label: "What's happening?", type: "radio", required: true,
        options: [
          { value: "no_power_whole", label: "No power at all (whole property)" },
          { value: "no_power_area", label: "No power in one area only" },
          { value: "tripping", label: "Circuit keeps tripping" },
          { value: "flickering", label: "Lights flickering / dimming" },
          { value: "burning_smell_sparks", label: "Burning smell or sparks" },
          { value: "other", label: "Other / not sure" }
        ]
      },
      { id: "scope", label: "How widespread?", type: "radio", required: true,
        options: [
          { value: "whole_property", label: "Whole property" },
          { value: "one_floor", label: "One floor / section" },
          { value: "single_room", label: "Single room" },
          { value: "single_circuit", label: "Single circuit only" },
          { value: "outdoor", label: "Outdoor supply" }
        ]
      },
      { id: "started", label: "When did this start?", type: "radio", required: true,
        options: [
          { value: "today", label: "Just now / today" },
          { value: "few_days", label: "Within the last few days" },
          { value: "intermittent", label: "Ongoing / intermittent" },
          { value: "after_work", label: "After recent work or appliance" }
        ]
      },
      { id: "reset_status", label: "Have you tried resetting the trip?", type: "radio", required: true,
        options: [
          { value: "trips_again", label: "Yes, but it trips again" },
          { value: "holding", label: "Yes, holding for now" },
          { value: "wont_reset", label: "No, it won't reset" },
          { value: "not_tried", label: "Haven't tried / don't know how" }
        ]
      },
      { id: "cu_type", label: "Consumer unit type?", type: "radio", required: true,
        options: [
          { value: "modern", label: "Modern (switches / RCDs)" },
          { value: "old_ceramic", label: "Old (ceramic fuses / rewirable)" },
          { value: "not_sure", label: "Not sure" }
        ]
      },
      { id: "property_type", label: "Property type", type: "radio", required: true,
        options: [
          { value: "apartment", label: "Apartment" },
          { value: "house", label: "House" },
          { value: "commercial", label: "Commercial" }
        ]
      },
      { id: "photos", label: "Upload: consumer unit (open), affected area, any visible damage", type: "file", required: true, accept: "image/*" },
      { id: "notes", label: "Extra details (smells, patterns, appliance triggers)", type: "textarea", required: false }
    ]
  },
  {
    microSlug: "electrical-safety-checks-reports",
    title: "Electrical Safety Check (EICR)",
    metadata: {
      category_contract: "electrical",
      inspection_bias: "mandatory",
      pattern: "compliance",
      rules: [
        {
          id: "hmo_compliance",
          when: { questionId: "property_type", op: "eq", value: "hmo" },
          add_flags: ["HMO_COMPLIANCE", "LOCAL_REGS_CHECK"]
        },
        {
          id: "old_cu_remedials",
          when: { questionId: "cu_type", op: "in", value: ["old_ceramic", "mixed"] },
          add_flags: ["REMEDIALS_LIKELY"]
        },
        {
          id: "never_inspected",
          when: { questionId: "last_inspection", op: "eq", value: "never" },
          add_flags: ["EXTENDED_INSPECTION_TIME"]
        },
        {
          id: "known_issues",
          when: { questionId: "known_issues", op: "eq", value: "yes" },
          add_flags: ["PRE_EXISTING_ISSUES"],
          set: { inspection_bias: "mandatory" }
        }
      ]
    },
    questions: [
      { id: "purpose", label: "Purpose of inspection", type: "radio", required: true,
        options: [
          { value: "landlord", label: "Landlord certificate (rental)" },
          { value: "sale", label: "Buying / selling property" },
          { value: "insurance", label: "Insurance requirement" },
          { value: "routine", label: "Routine safety check" },
          { value: "post_work", label: "After recent electrical work" }
        ]
      },
      { id: "property_type", label: "Property type", type: "radio", required: true,
        options: [
          { value: "apartment", label: "Apartment" },
          { value: "house", label: "House" },
          { value: "commercial", label: "Commercial" },
          { value: "hmo", label: "HMO" }
        ]
      },
      { id: "bedrooms", label: "Property size (bedrooms)", type: "radio", required: true,
        options: [
          { value: "studio_1", label: "Studio–1 bed" },
          { value: "2_3", label: "2–3 bed" },
          { value: "4_5", label: "4–5 bed" },
          { value: "6_plus", label: "6+ bed" }
        ]
      },
      { id: "floors", label: "Number of floors", type: "radio", required: true,
        options: [
          { value: "1", label: "1" },
          { value: "2", label: "2" },
          { value: "3_plus", label: "3+" }
        ]
      },
      { id: "last_inspection", label: "Last inspection/EICR?", type: "radio", required: true,
        options: [
          { value: "never", label: "Never / don't know" },
          { value: "over_10", label: "More than 10 years ago" },
          { value: "5_10", label: "5–10 years ago" },
          { value: "under_5", label: "Within last 5 years" }
        ]
      },
      { id: "cu_type", label: "Consumer unit type", type: "radio", required: true,
        options: [
          { value: "modern", label: "Modern (MCBs/RCDs)" },
          { value: "old_ceramic", label: "Old (ceramic fuses)" },
          { value: "mixed", label: "Mixed" },
          { value: "not_sure", label: "Not sure" }
        ]
      },
      { id: "known_issues", label: "Any known electrical issues?", type: "radio", required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "not_sure", label: "Not sure" }
        ]
      },
      { id: "known_issues_desc", label: "Describe known issues", type: "textarea", required: false,
        show_if: { questionId: "known_issues", value: "yes" }
      },
      { id: "photos", label: "Upload: consumer unit photo, previous EICR if available", type: "file", required: false, accept: "image/*,application/pdf" }
    ]
  },
  {
    microSlug: "fuse-box-consumer-unit-replacement",
    title: "Fuse Box / Consumer Unit Replacement",
    metadata: {
      category_contract: "electrical",
      inspection_bias: "mandatory",
      pattern: "major_works",
      rules: [
        {
          id: "pre_1960_earthing",
          when: { questionId: "property_age", op: "eq", value: "pre_1960" },
          add_flags: ["EARTHING_BONDING_UPGRADE_LIKELY"],
          set: { inspection_bias: "mandatory" }
        },
        {
          id: "failed_eicr",
          when: { questionId: "reason", op: "eq", value: "failed_eicr" },
          add_flags: ["REMEDIAL_SCOPE_DEPENDENCY"]
        },
        {
          id: "large_board",
          when: { questionId: "circuits", op: "eq", value: "16_plus" },
          add_flags: ["LARGE_BOARD_COMPLEXITY"]
        },
        {
          id: "critical_equipment",
          when: { questionId: "power_tolerance", op: "eq", value: "no_critical" },
          add_flags: ["OUT_OF_HOURS_REQUIRED", "PLANNED_SHUTDOWN"],
          set: { inspection_bias: "high" }
        },
        {
          id: "earthing_unknown",
          when: { questionId: "earthing_bonding", op: "eq", value: "dont_know" },
          add_flags: ["EARTHING_CHECK_REQUIRED"]
        }
      ]
    },
    questions: [
      { id: "reason", label: "Reason for replacement", type: "radio", required: true,
        options: [
          { value: "old_fuses", label: "Current one is old / ceramic fuses" },
          { value: "failed_eicr", label: "Failed EICR / safety report" },
          { value: "adding_circuits", label: "Adding circuits / extending property" },
          { value: "requirement", label: "Insurance or landlord requirement" },
          { value: "recommended", label: "Electrician recommended it" }
        ]
      },
      { id: "cu_type", label: "Current consumer unit type", type: "radio", required: true,
        options: [
          { value: "old_ceramic", label: "Old (ceramic fuses)" },
          { value: "modern_outdated", label: "Modern but outdated" },
          { value: "modern_rcd", label: "Modern with RCD" },
          { value: "not_sure", label: "Not sure" }
        ]
      },
      { id: "circuits", label: "Approx. number of circuits", type: "radio", required: true,
        options: [
          { value: "up_to_6", label: "Up to 6" },
          { value: "7_10", label: "7–10" },
          { value: "11_15", label: "11–15" },
          { value: "16_plus", label: "16+" },
          { value: "not_sure", label: "Not sure" }
        ]
      },
      { id: "property_age", label: "Approx. property age", type: "radio", required: true,
        options: [
          { value: "pre_1960", label: "Pre-1960" },
          { value: "1960_1990", label: "1960–1990" },
          { value: "1990_2010", label: "1990–2010" },
          { value: "post_2010", label: "Post-2010" }
        ]
      },
      { id: "earthing_bonding", label: "Earthing & bonding checked recently?", type: "radio", required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "no", label: "No" },
          { value: "dont_know", label: "Don't know" }
        ]
      },
      { id: "power_tolerance", label: "Can power be off for several hours?", type: "radio", required: true,
        options: [
          { value: "yes", label: "Yes" },
          { value: "minimal", label: "Yes, minimal disruption needed" },
          { value: "no_critical", label: "No (critical equipment)" }
        ]
      },
      { id: "photos", label: "Upload: consumer unit (cover on & open), meter/incoming supply", type: "file", required: true, accept: "image/*" },
      { id: "notes", label: "Anything else? (critical equipment, access, tenancy)", type: "textarea", required: false }
    ]
  }
];

// ============================================================
// LITE PACKS FOR 7 MISSING MICRO-SERVICES
// ============================================================

const litePacks = [
  // Pattern: Add/Install Points
  {
    microSlug: "install-sockets",
    title: "Install Sockets",
    metadata: {
      category_contract: "electrical",
      inspection_bias: "medium",
      pattern: "add_install_points",
      rules: [
        { id: "old_cu", when: { questionId: "cu_condition", op: "eq", value: "old_ceramic" }, add_flags: ["INSPECTION_RECOMMENDED"], set: { inspection_bias: "high" } },
        { id: "new_circuit", when: { questionId: "circuit_type", op: "eq", value: "new_circuit" }, add_flags: ["NEW_CIRCUIT_REQUIRED"] }
      ]
    },
    questions: [
      { id: "socket_type", label: "What type of socket?", type: "radio", required: true,
        options: [
          { value: "standard_double", label: "Standard double socket" },
          { value: "single", label: "Single socket" },
          { value: "usb", label: "USB socket" },
          { value: "outdoor", label: "Outdoor socket" },
          { value: "appliance", label: "Appliance socket (oven/washer)" }
        ]
      },
      { id: "quantity", label: "How many sockets?", type: "radio", required: true,
        options: [{ value: "1", label: "1" }, { value: "2", label: "2" }, { value: "3_4", label: "3–4" }, { value: "5_plus", label: "5+" }]
      },
      { id: "circuit_type", label: "Existing circuit or new?", type: "radio", required: true,
        options: [{ value: "existing", label: "Add to existing circuit" }, { value: "new_circuit", label: "New circuit needed" }, { value: "not_sure", label: "Not sure" }]
      },
      { id: "cu_condition", label: "Consumer unit type?", type: "radio", required: true,
        options: [{ value: "modern", label: "Modern (RCD/RCBO)" }, { value: "old_ceramic", label: "Old / ceramic fuses" }, { value: "not_sure", label: "Not sure" }]
      },
      { id: "install_method", label: "Concealed or surface?", type: "radio", required: true,
        options: [{ value: "concealed", label: "Concealed (chasing)" }, { value: "surface", label: "Surface-mounted" }, { value: "not_sure", label: "Not sure" }]
      },
      { id: "photos", label: "Upload: location, nearest socket, consumer unit", type: "file", required: true, accept: "image/*" }
    ]
  },

  // Pattern: Major Works
  {
    microSlug: "rewiring",
    title: "Rewiring",
    metadata: {
      category_contract: "electrical",
      inspection_bias: "mandatory",
      pattern: "major_works",
      rules: [
        { id: "full_rewire", when: { questionId: "scope", op: "eq", value: "full" }, add_flags: ["SITE_VISIT_MANDATORY", "PLANS_REQUIRED"] },
        { id: "occupied", when: { questionId: "occupancy", op: "eq", value: "occupied" }, add_flags: ["PHASED_WORK_REQUIRED"] }
      ]
    },
    questions: [
      { id: "scope", label: "Rewiring scope?", type: "radio", required: true,
        options: [{ value: "full", label: "Full property rewire" }, { value: "partial", label: "Partial (one floor/section)" }, { value: "single_circuit", label: "Single circuit only" }]
      },
      { id: "property_type", label: "Property type", type: "radio", required: true,
        options: [{ value: "apartment", label: "Apartment" }, { value: "house", label: "House" }, { value: "commercial", label: "Commercial" }]
      },
      { id: "property_age", label: "Property age?", type: "radio", required: true,
        options: [{ value: "pre_1960", label: "Pre-1960" }, { value: "1960_1990", label: "1960–1990" }, { value: "post_1990", label: "Post-1990" }]
      },
      { id: "floors", label: "Number of floors", type: "radio", required: true,
        options: [{ value: "1", label: "1" }, { value: "2", label: "2" }, { value: "3_plus", label: "3+" }]
      },
      { id: "occupancy", label: "Property status during work?", type: "radio", required: true,
        options: [{ value: "vacant", label: "Vacant" }, { value: "occupied", label: "Occupied" }]
      },
      { id: "cu_replacement", label: "Include consumer unit replacement?", type: "radio", required: true,
        options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "not_sure", label: "Not sure" }]
      },
      { id: "photos", label: "Upload: existing wiring, consumer unit, property overview", type: "file", required: true, accept: "image/*" }
    ]
  },

  // Pattern: Major Works (Consumer Unit)
  {
    microSlug: "fuse-box-upgrade",
    title: "Fuse Box Upgrade",
    metadata: {
      category_contract: "electrical",
      inspection_bias: "mandatory",
      pattern: "major_works",
      rules: [
        { id: "old_system", when: { questionId: "current_type", op: "eq", value: "ceramic" }, add_flags: ["EARTHING_CHECK_REQUIRED"] },
        { id: "adding_circuits", when: { questionId: "reason", op: "eq", value: "add_circuits" }, add_flags: ["CAPACITY_ASSESSMENT"] }
      ]
    },
    questions: [
      { id: "reason", label: "Why upgrade?", type: "radio", required: true,
        options: [
          { value: "old_unsafe", label: "Old / unsafe unit" },
          { value: "add_circuits", label: "Adding circuits (EV, extension)" },
          { value: "compliance", label: "Compliance / EICR requirement" },
          { value: "recommended", label: "Electrician recommended" }
        ]
      },
      { id: "current_type", label: "Current fuse box type?", type: "radio", required: true,
        options: [{ value: "ceramic", label: "Old ceramic fuses" }, { value: "modern_old", label: "Modern but old" }, { value: "not_sure", label: "Not sure" }]
      },
      { id: "circuits", label: "Approx. circuits?", type: "radio", required: true,
        options: [{ value: "under_8", label: "Under 8" }, { value: "8_12", label: "8–12" }, { value: "over_12", label: "12+" }]
      },
      { id: "property_age", label: "Property age?", type: "radio", required: true,
        options: [{ value: "pre_1970", label: "Pre-1970" }, { value: "1970_2000", label: "1970–2000" }, { value: "post_2000", label: "Post-2000" }]
      },
      { id: "power_off", label: "Can power be off for hours?", type: "radio", required: true,
        options: [{ value: "yes", label: "Yes" }, { value: "limited", label: "Limited time only" }, { value: "critical", label: "Critical equipment" }]
      },
      { id: "photos", label: "Upload: current fuse box (open & closed)", type: "file", required: true, accept: "image/*" }
    ]
  },

  // Pattern: Fault Finding
  {
    microSlug: "fix-faulty-outlet",
    title: "Fix Faulty Outlet",
    metadata: {
      category_contract: "electrical",
      inspection_bias: "medium",
      pattern: "fault_finding",
      rules: [
        { id: "burning", when: { questionId: "symptom", op: "eq", value: "burning_marks" }, add_flags: ["EMERGENCY", "ISOLATE"], set: { safety: "red" } },
        { id: "multiple", when: { questionId: "affected_count", op: "eq", value: "multiple" }, add_flags: ["CIRCUIT_ISSUE_LIKELY"] }
      ]
    },
    questions: [
      { id: "symptom", label: "What's the problem?", type: "radio", required: true,
        options: [
          { value: "no_power", label: "No power from outlet" },
          { value: "intermittent", label: "Intermittent power" },
          { value: "sparking", label: "Sparking when plugging in" },
          { value: "burning_marks", label: "Burning smell / marks" },
          { value: "loose", label: "Loose / damaged faceplate" }
        ]
      },
      { id: "affected_count", label: "How many outlets affected?", type: "radio", required: true,
        options: [{ value: "one", label: "Just one" }, { value: "multiple", label: "Multiple in same area" }, { value: "circuit", label: "Whole circuit" }]
      },
      { id: "outlet_type", label: "Outlet type?", type: "radio", required: true,
        options: [{ value: "standard", label: "Standard socket" }, { value: "usb", label: "USB socket" }, { value: "outdoor", label: "Outdoor" }, { value: "other", label: "Other" }]
      },
      { id: "cu_type", label: "Consumer unit type?", type: "radio", required: true,
        options: [{ value: "modern", label: "Modern (RCD)" }, { value: "old", label: "Old / ceramic" }, { value: "not_sure", label: "Not sure" }]
      },
      { id: "photos", label: "Upload: affected outlet, consumer unit", type: "file", required: true, accept: "image/*" }
    ]
  },

  // Pattern: Replace Like-for-Like
  {
    microSlug: "replace-switch",
    title: "Replace Switch",
    metadata: {
      category_contract: "electrical",
      inspection_bias: "low",
      pattern: "replace_like_for_like",
      rules: [
        { id: "dimmer_load", when: { questionId: "switch_type", op: "eq", value: "dimmer" }, add_flags: ["LOAD_COMPATIBILITY_CHECK"] },
        { id: "smart", when: { questionId: "switch_type", op: "eq", value: "smart" }, add_flags: ["NEUTRAL_WIRE_CHECK"] }
      ]
    },
    questions: [
      { id: "switch_type", label: "What type of switch?", type: "radio", required: true,
        options: [
          { value: "standard", label: "Standard on/off" },
          { value: "dimmer", label: "Dimmer switch" },
          { value: "smart", label: "Smart switch" },
          { value: "outdoor", label: "Outdoor switch" }
        ]
      },
      { id: "quantity", label: "How many switches?", type: "radio", required: true,
        options: [{ value: "1", label: "1" }, { value: "2_3", label: "2–3" }, { value: "4_plus", label: "4+" }]
      },
      { id: "reason", label: "Reason for replacement?", type: "radio", required: true,
        options: [{ value: "broken", label: "Broken / not working" }, { value: "upgrade", label: "Upgrade / aesthetic" }, { value: "smart", label: "Converting to smart" }]
      },
      { id: "gang_type", label: "Single or multi-gang?", type: "radio", required: true,
        options: [{ value: "single", label: "Single gang" }, { value: "double", label: "Double gang" }, { value: "triple_plus", label: "Triple or more" }, { value: "mixed", label: "Mixed" }]
      },
      { id: "photos", label: "Upload: current switch(es)", type: "file", required: false, accept: "image/*" }
    ]
  },

  // Pattern: Add/Install Points (Lighting)
  {
    microSlug: "install-ceiling-lights",
    title: "Install Ceiling Lights",
    metadata: {
      category_contract: "electrical",
      inspection_bias: "low",
      pattern: "add_install_points",
      rules: [
        { id: "new_points", when: { questionId: "work_type", op: "eq", value: "new_points" }, add_flags: ["NEW_CABLING_REQUIRED"], set: { inspection_bias: "medium" } },
        { id: "bathroom", when: { questionId: "location", op: "eq", value: "bathroom" }, add_flags: ["IP_RATING_REQUIRED"] }
      ]
    },
    questions: [
      { id: "work_type", label: "What work is needed?", type: "radio", required: true,
        options: [
          { value: "replace", label: "Replace existing fitting(s)" },
          { value: "new_points", label: "New light point(s)" },
          { value: "convert", label: "Convert to LED" }
        ]
      },
      { id: "quantity", label: "How many lights?", type: "radio", required: true,
        options: [{ value: "1", label: "1" }, { value: "2_3", label: "2–3" }, { value: "4_6", label: "4–6" }, { value: "7_plus", label: "7+" }]
      },
      { id: "light_type", label: "Light type?", type: "radio", required: true,
        options: [{ value: "pendant", label: "Pendant / chandelier" }, { value: "recessed", label: "Recessed / downlights" }, { value: "flush", label: "Flush mount" }, { value: "track", label: "Track lighting" }]
      },
      { id: "location", label: "Location?", type: "radio", required: true,
        options: [{ value: "living", label: "Living area" }, { value: "bedroom", label: "Bedroom" }, { value: "kitchen", label: "Kitchen" }, { value: "bathroom", label: "Bathroom" }, { value: "outdoor", label: "Outdoor" }]
      },
      { id: "dimming", label: "Dimming required?", type: "radio", required: true,
        options: [{ value: "yes", label: "Yes" }, { value: "no", label: "No" }, { value: "not_sure", label: "Not sure" }]
      },
      { id: "photos", label: "Upload: current ceiling, light fitting if replacing", type: "file", required: false, accept: "image/*" }
    ]
  },

  // Pattern: Outdoor Specialist
  {
    microSlug: "outdoor-lighting",
    title: "Outdoor Lighting",
    metadata: {
      category_contract: "electrical",
      inspection_bias: "high",
      pattern: "outdoor_specialist",
      rules: [
        { id: "new_supply", when: { questionId: "supply_type", op: "eq", value: "new_circuit" }, add_flags: ["NEW_OUTDOOR_CIRCUIT", "RCD_MANDATORY"] },
        { id: "pool_area", when: { questionId: "location", op: "eq", value: "pool" }, add_flags: ["SPECIAL_ZONES", "IP_RATING_CRITICAL"] }
      ]
    },
    questions: [
      { id: "light_type", label: "What type of outdoor lighting?", type: "radio", required: true,
        options: [
          { value: "wall_mounted", label: "Wall-mounted lights" },
          { value: "post", label: "Post / pathway lights" },
          { value: "security", label: "Security / motion lights" },
          { value: "garden", label: "Garden / feature lighting" },
          { value: "festoon", label: "Festoon / string lights" }
        ]
      },
      { id: "quantity", label: "How many lights?", type: "radio", required: true,
        options: [{ value: "1_2", label: "1–2" }, { value: "3_5", label: "3–5" }, { value: "6_plus", label: "6+" }]
      },
      { id: "supply_type", label: "Power supply?", type: "radio", required: true,
        options: [{ value: "existing", label: "Extend existing outdoor circuit" }, { value: "new_circuit", label: "New outdoor circuit needed" }, { value: "solar", label: "Solar / low voltage" }, { value: "not_sure", label: "Not sure" }]
      },
      { id: "location", label: "Location?", type: "radio", required: true,
        options: [{ value: "front", label: "Front of property" }, { value: "rear", label: "Rear garden" }, { value: "driveway", label: "Driveway" }, { value: "pool", label: "Pool / terrace area" }]
      },
      { id: "control", label: "Control type?", type: "radio", required: true,
        options: [{ value: "switch", label: "Manual switch" }, { value: "sensor", label: "Motion sensor" }, { value: "timer", label: "Timer / dusk-to-dawn" }, { value: "smart", label: "Smart control" }]
      },
      { id: "photos", label: "Upload: installation location, power source if known", type: "file", required: true, accept: "image/*" }
    ]
  }
];

// Combine all packs
const allPacks = [...goldStandardsWithRules, ...litePacks];

async function seedPacks() {
  console.log(`\n🔌 ELECTRICAL COMPLETE SEEDER`);
  console.log(`   Gold Standards with rules: ${goldStandardsWithRules.length}`);
  console.log(`   Lite packs for missing micros: ${litePacks.length}`);
  console.log(`   Total: ${allPacks.length}\n`);

  const payload = allPacks.map(p => ({
    microSlug: p.microSlug,
    title: p.title,
    questions: p.questions,
    metadata: p.metadata
  }));

  // Dry run first
  console.log("📋 Dry run...");
  const dryRes = await fetch(`${SUPABASE_URL}/functions/v1/seedpacks?dry_run=1`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify(payload)
  });

  const dryData = await dryRes.json();
  console.log("   Valid:", dryData.validCount, "/ Missing slugs:", dryData.missingCount);
  
  if (dryData.missingSlugs?.length > 0) {
    console.log("   ⚠️  Missing:", dryData.missingSlugs.join(", "));
  }
  
  if (dryData.qualitySummary) {
    console.log("   Quality:", JSON.stringify(dryData.qualitySummary));
  }

  // Live seed
  console.log("\n🚀 Live seeding...");
  const liveRes = await fetch(`${SUPABASE_URL}/functions/v1/seedpacks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify(payload)
  });

  const liveData = await liveRes.json();
  
  if (liveData.success) {
    console.log(`\n✅ SUCCESS: ${liveData.inserted} packs upserted`);
    console.log("   Skipped (missing slugs):", liveData.skipped);
    if (liveData.packs) {
      console.log("   Packs:", liveData.packs.map((p: any) => p.micro_slug).join(", "));
    }
  } else {
    console.error("❌ ERROR:", liveData.error || liveData);
  }
}

seedPacks().catch(console.error);
