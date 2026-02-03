/**
 * Plumbing Complete Seeder
 * - 4 Gold Standard packs with metadata.rules for inspection flags
 * - 3 Lite packs for missing micro-services
 * 
 * Run: SUPABASE_PROJECT_REF="ngwbpuxltyfweikdupoj" npx tsx scripts/seed-plumbing-complete.ts
 * Live: SUPABASE_PROJECT_REF="ngwbpuxltyfweikdupoj" DRY_RUN=0 npx tsx scripts/seed-plumbing-complete.ts
 */

interface QuestionOption {
  value: string;
  label: string;
}

interface PackRule {
  id: string;
  when: { questionId: string; op: "eq" | "in" | "contains"; value: string | string[] };
  add_flags?: string[];
  set?: { inspection_bias?: "low" | "medium" | "high" | "mandatory"; safety?: "green" | "amber" | "red" };
}

interface QuestionDef {
  id: string;
  label: string;
  type: "radio" | "checkbox" | "select" | "file" | "text" | "textarea";
  required: boolean;
  placeholder?: string;
  help?: string;
  accept?: string;
  options?: QuestionOption[];
  show_if?: { questionId: string; value: string | string[] };
}

interface PlumbingPack {
  microSlug: string;
  subcategorySlug: string;
  categorySlug: string;
  version: number;
  name: string;
  questions: QuestionDef[];
  metadata: {
    pattern: string;
    inspection_bias: "low" | "medium" | "high" | "mandatory";
    category_contract: string;
    rules: PackRule[];
  };
}

// ============================================================
// GOLD STANDARD #1: Burst Pipe (Emergency)
// ============================================================
const burstPipePack: PlumbingPack = {
  microSlug: "burst-pipe",
  subcategorySlug: "emergency-plumbing",
  categorySlug: "plumbing",
  version: 2,
  name: "Burst Pipe Repair",
  questions: [
    {
      id: "pl_burst_01_water_status",
      label: "Is water still flowing?",
      type: "radio",
      required: true,
      options: [
        { value: "yes_active", label: "Yes, actively leaking/spraying" },
        { value: "yes_dripping", label: "Yes, dripping/slow" },
        { value: "stopped", label: "No, stopped but pipe damaged" },
        { value: "isolated", label: "No, I've turned off the water" }
      ]
    },
    {
      id: "pl_burst_02_isolation",
      label: "Have you isolated the water supply?",
      type: "radio",
      required: true,
      options: [
        { value: "yes_main", label: "Yes, main stopcock off" },
        { value: "yes_local", label: "Yes, local valve only" },
        { value: "no_cant_find", label: "No, can't find stopcock" },
        { value: "no_stuck", label: "No, valve won't turn" },
        { value: "not_tried", label: "Haven't tried yet" }
      ]
    },
    {
      id: "pl_burst_03_location",
      label: "Where is the burst pipe?",
      type: "radio",
      required: true,
      options: [
        { value: "kitchen", label: "Kitchen" },
        { value: "bathroom", label: "Bathroom" },
        { value: "utility", label: "Utility room" },
        { value: "under_floor", label: "Under floor/concealed" },
        { value: "outside", label: "Outside/garden" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "pl_burst_04_pipe_type",
      label: "What type of pipe (if visible)?",
      type: "radio",
      required: true,
      options: [
        { value: "copper", label: "Copper" },
        { value: "plastic", label: "Plastic (PEX/CPVC)" },
        { value: "lead", label: "Lead (old grey)" },
        { value: "heating", label: "Heating pipe" },
        { value: "not_sure", label: "Not sure/not visible" }
      ]
    },
    {
      id: "pl_burst_05_damage",
      label: "Any visible water damage?",
      type: "radio",
      required: true,
      options: [
        { value: "ceiling", label: "Ceiling damage/bulging" },
        { value: "wall", label: "Wall damage/damp" },
        { value: "floor", label: "Floor flooding/damage" },
        { value: "none", label: "No visible damage yet" }
      ]
    },
    {
      id: "pl_burst_06_property",
      label: "Property type",
      type: "radio",
      required: true,
      options: [
        { value: "apartment", label: "Apartment/flat" },
        { value: "house", label: "House" },
        { value: "commercial", label: "Commercial" }
      ]
    },
    {
      id: "pl_burst_07_uploads",
      label: "Upload photos of the leak/damage",
      type: "file",
      required: true,
      accept: "image/*",
      help: "Photo of: (1) the leak if visible, (2) any water damage, (3) stopcock location if found"
    }
  ],
  metadata: {
    pattern: "emergency",
    inspection_bias: "high",
    category_contract: "plumbing_v1",
    rules: [
      {
        id: "burst_active_emergency",
        when: { questionId: "pl_burst_01_water_status", op: "eq", value: "yes_active" },
        add_flags: ["EMERGENCY", "ACTIVE_WATER_FLOW"],
        set: { safety: "red", inspection_bias: "mandatory" }
      },
      {
        id: "burst_cant_isolate",
        when: { questionId: "pl_burst_02_isolation", op: "in", value: ["no_cant_find", "no_stuck"] },
        add_flags: ["ISOLATION_ASSISTANCE_NEEDED", "PRIORITY_CALLOUT"],
        set: { safety: "amber" }
      },
      {
        id: "burst_lead_pipe",
        when: { questionId: "pl_burst_04_pipe_type", op: "eq", value: "lead" },
        add_flags: ["LEAD_PIPE_DETECTED", "HEALTH_ADVISORY"],
        set: { inspection_bias: "mandatory" }
      },
      {
        id: "burst_ceiling_damage",
        when: { questionId: "pl_burst_05_damage", op: "eq", value: "ceiling" },
        add_flags: ["STRUCTURAL_RISK", "CEILING_COLLAPSE_RISK"],
        set: { safety: "amber" }
      },
      {
        id: "burst_concealed",
        when: { questionId: "pl_burst_03_location", op: "in", value: ["under_floor", "not_sure"] },
        add_flags: ["CONCEALED_PIPEWORK", "ACCESS_INVESTIGATION_NEEDED"]
      }
    ]
  }
};

// ============================================================
// GOLD STANDARD #2: Sewer Backup (Drainage Emergency)
// ============================================================
const sewerBackupPack: PlumbingPack = {
  microSlug: "sewer-backup",
  subcategorySlug: "drainage",
  categorySlug: "plumbing",
  version: 2,
  name: "Sewer Backup / Blocked Drain",
  questions: [
    {
      id: "pl_sewer_01_symptoms",
      label: "What's happening?",
      type: "radio",
      required: true,
      options: [
        { value: "toilet_wont_flush", label: "Toilet won't flush" },
        { value: "multiple_drains", label: "Multiple drains backing up" },
        { value: "water_coming_up", label: "Water coming up in shower/bath" },
        { value: "bad_smell", label: "Bad smell from drains" },
        { value: "manhole_overflow", label: "Manhole/outside drain overflowing" }
      ]
    },
    {
      id: "pl_sewer_02_scope",
      label: "How widespread?",
      type: "radio",
      required: true,
      options: [
        { value: "single_fixture", label: "Single fixture (one toilet/sink)" },
        { value: "single_bathroom", label: "One bathroom only" },
        { value: "multiple_areas", label: "Multiple areas affected" },
        { value: "whole_property", label: "Whole property" },
        { value: "outdoor_only", label: "Outdoor drains only" }
      ]
    },
    {
      id: "pl_sewer_03_previous",
      label: "Has this happened before?",
      type: "radio",
      required: true,
      options: [
        { value: "first_time", label: "First time" },
        { value: "happened_before", label: "Yes, happened before" },
        { value: "recurring", label: "Recurring problem" }
      ]
    },
    {
      id: "pl_sewer_04_access",
      label: "Access to manholes/inspection points?",
      type: "radio",
      required: true,
      options: [
        { value: "yes_easy", label: "Yes, easy access" },
        { value: "yes_heavy", label: "Yes, but covers are heavy/sealed" },
        { value: "unsure", label: "Not sure where they are" },
        { value: "none_visible", label: "No visible access points" }
      ]
    },
    {
      id: "pl_sewer_05_shared",
      label: "Is this a shared drainage system?",
      type: "radio",
      required: true,
      options: [
        { value: "private", label: "Private property only" },
        { value: "shared_neighbours", label: "Shared with neighbours" },
        { value: "apartment_block", label: "Apartment block/shared stack" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "pl_sewer_06_property",
      label: "Property type",
      type: "radio",
      required: true,
      options: [
        { value: "apartment", label: "Apartment/flat" },
        { value: "house", label: "House" },
        { value: "commercial", label: "Commercial" }
      ]
    },
    {
      id: "pl_sewer_07_uploads",
      label: "Upload photos",
      type: "file",
      required: false,
      accept: "image/*",
      help: "Photo of: (1) affected drain/toilet, (2) manhole if accessible, (3) any visible blockage"
    }
  ],
  metadata: {
    pattern: "emergency",
    inspection_bias: "medium",
    category_contract: "plumbing_v1",
    rules: [
      {
        id: "sewer_manhole_overflow",
        when: { questionId: "pl_sewer_01_symptoms", op: "eq", value: "manhole_overflow" },
        add_flags: ["OUTDOOR_EMERGENCY", "JETTING_LIKELY"],
        set: { safety: "amber", inspection_bias: "high" }
      },
      {
        id: "sewer_recurring",
        when: { questionId: "pl_sewer_03_previous", op: "eq", value: "recurring" },
        add_flags: ["CCTV_SURVEY_RECOMMENDED", "ROOT_CAUSE_INVESTIGATION"]
      },
      {
        id: "sewer_whole_property",
        when: { questionId: "pl_sewer_02_scope", op: "eq", value: "whole_property" },
        add_flags: ["MAIN_DRAIN_BLOCKED", "PRIORITY_CALLOUT"],
        set: { inspection_bias: "high" }
      },
      {
        id: "sewer_shared_system",
        when: { questionId: "pl_sewer_05_shared", op: "in", value: ["shared_neighbours", "apartment_block"] },
        add_flags: ["SHARED_RESPONSIBILITY", "NOTIFY_NEIGHBOURS_ADVISED"]
      },
      {
        id: "sewer_no_access",
        when: { questionId: "pl_sewer_04_access", op: "in", value: ["unsure", "none_visible"] },
        add_flags: ["ACCESS_INVESTIGATION_NEEDED"]
      }
    ]
  }
};

// ============================================================
// GOLD STANDARD #3: Water Heater Emergency
// ============================================================
const waterHeaterEmergencyPack: PlumbingPack = {
  microSlug: "water-heater-emergency",
  subcategorySlug: "hot-water-systems",
  categorySlug: "plumbing",
  version: 2,
  name: "Water Heater Emergency",
  questions: [
    {
      id: "pl_wh_01_issue",
      label: "What's the main issue?",
      type: "radio",
      required: true,
      options: [
        { value: "no_hot_water", label: "No hot water" },
        { value: "leaking", label: "Leaking from tank/pipes" },
        { value: "too_hot", label: "Water dangerously hot" },
        { value: "strange_noises", label: "Strange noises (banging/rumbling)" },
        { value: "error_code", label: "Error light/code showing" },
        { value: "pilot_out", label: "Pilot light won't stay on" }
      ]
    },
    {
      id: "pl_wh_02_system_type",
      label: "Type of system",
      type: "radio",
      required: true,
      options: [
        { value: "tank_gas", label: "Gas water heater (tank)" },
        { value: "tank_electric", label: "Electric water heater (tank)" },
        { value: "tankless_gas", label: "Tankless/instant (gas)" },
        { value: "tankless_electric", label: "Tankless/instant (electric)" },
        { value: "solar", label: "Solar thermal" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "pl_wh_03_isolation",
      label: "Have you turned anything off?",
      type: "radio",
      required: true,
      options: [
        { value: "gas_off", label: "Gas supply off" },
        { value: "electric_off", label: "Electric supply off" },
        { value: "water_off", label: "Water supply off" },
        { value: "all_off", label: "All supplies off" },
        { value: "nothing", label: "Nothing turned off" },
        { value: "not_sure_how", label: "Don't know how" }
      ]
    },
    {
      id: "pl_wh_04_leak_severity",
      label: "If leaking, how severe?",
      type: "radio",
      required: true,
      options: [
        { value: "no_leak", label: "No leak" },
        { value: "slow_drip", label: "Slow drip" },
        { value: "steady", label: "Steady leak" },
        { value: "fast", label: "Fast/flooding" }
      ]
    },
    {
      id: "pl_wh_05_age",
      label: "Approximate age of system",
      type: "radio",
      required: true,
      options: [
        { value: "0_5", label: "0-5 years" },
        { value: "5_10", label: "5-10 years" },
        { value: "10_15", label: "10-15 years" },
        { value: "15_plus", label: "15+ years" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "pl_wh_06_location",
      label: "Where is the water heater?",
      type: "radio",
      required: true,
      options: [
        { value: "kitchen", label: "Kitchen" },
        { value: "utility", label: "Utility room" },
        { value: "garage", label: "Garage" },
        { value: "loft", label: "Loft/attic" },
        { value: "outside", label: "Outside/plant room" },
        { value: "other", label: "Other" }
      ]
    },
    {
      id: "pl_wh_07_uploads",
      label: "Upload photos",
      type: "file",
      required: true,
      accept: "image/*",
      help: "Photo of: (1) the water heater/boiler, (2) any error codes/lights, (3) visible leak if present"
    }
  ],
  metadata: {
    pattern: "emergency",
    inspection_bias: "high",
    category_contract: "plumbing_v1",
    rules: [
      {
        id: "wh_too_hot",
        when: { questionId: "pl_wh_01_issue", op: "eq", value: "too_hot" },
        add_flags: ["SCALD_RISK", "THERMOSTAT_FAILURE", "EMERGENCY"],
        set: { safety: "red", inspection_bias: "mandatory" }
      },
      {
        id: "wh_fast_leak",
        when: { questionId: "pl_wh_04_leak_severity", op: "eq", value: "fast" },
        add_flags: ["EMERGENCY", "TANK_FAILURE_LIKELY"],
        set: { safety: "red" }
      },
      {
        id: "wh_gas_not_isolated",
        when: { questionId: "pl_wh_03_isolation", op: "in", value: ["nothing", "not_sure_how"] },
        add_flags: ["ISOLATION_GUIDANCE_NEEDED"],
        set: { safety: "amber" }
      },
      {
        id: "wh_old_system",
        when: { questionId: "pl_wh_05_age", op: "eq", value: "15_plus" },
        add_flags: ["REPLACEMENT_LIKELY", "END_OF_LIFE"]
      },
      {
        id: "wh_pilot_out_gas",
        when: { questionId: "pl_wh_01_issue", op: "eq", value: "pilot_out" },
        add_flags: ["GAS_SAFETY_CHECK", "THERMOCOUPLE_LIKELY"]
      }
    ]
  }
};

// ============================================================
// GOLD STANDARD #4: Fix Leak (General Leak Repair)
// ============================================================
const fixLeakPack: PlumbingPack = {
  microSlug: "fix-leak",
  subcategorySlug: "leak-repairs",
  categorySlug: "plumbing",
  version: 2,
  name: "Fix Leak",
  questions: [
    {
      id: "pl_leak_01_source",
      label: "Where is the leak coming from?",
      type: "radio",
      required: true,
      options: [
        { value: "under_sink", label: "Under sink" },
        { value: "toilet_base", label: "Around toilet base" },
        { value: "shower_bath", label: "Shower/bath area" },
        { value: "radiator", label: "Radiator/heating pipe" },
        { value: "ceiling", label: "Ceiling (from above)" },
        { value: "wall", label: "Inside wall" },
        { value: "outside_tap", label: "Outside tap/pipe" },
        { value: "not_sure", label: "Can't locate source" }
      ]
    },
    {
      id: "pl_leak_02_severity",
      label: "How severe is the leak?",
      type: "radio",
      required: true,
      options: [
        { value: "occasional_drip", label: "Occasional drip" },
        { value: "constant_drip", label: "Constant drip" },
        { value: "steady_flow", label: "Steady flow" },
        { value: "pooling_water", label: "Water pooling on floor" }
      ]
    },
    {
      id: "pl_leak_03_duration",
      label: "How long has it been leaking?",
      type: "radio",
      required: true,
      options: [
        { value: "just_started", label: "Just started today" },
        { value: "few_days", label: "A few days" },
        { value: "weeks", label: "Weeks" },
        { value: "ongoing", label: "Ongoing/getting worse" }
      ]
    },
    {
      id: "pl_leak_04_isolation",
      label: "Can you turn off water to the leak?",
      type: "radio",
      required: true,
      options: [
        { value: "yes_done", label: "Yes, already done" },
        { value: "yes_can", label: "Yes, I know how" },
        { value: "no_cant", label: "No, can't find valve" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "pl_leak_05_property",
      label: "Property type",
      type: "radio",
      required: true,
      options: [
        { value: "apartment", label: "Apartment/flat" },
        { value: "house", label: "House" },
        { value: "commercial", label: "Commercial" }
      ]
    },
    {
      id: "pl_leak_06_uploads",
      label: "Upload photos of the leak",
      type: "file",
      required: true,
      accept: "image/*",
      help: "Photo of: (1) the leak location, (2) any water damage, (3) pipes/fittings if visible"
    }
  ],
  metadata: {
    pattern: "fault_repair",
    inspection_bias: "medium",
    category_contract: "plumbing_v1",
    rules: [
      {
        id: "leak_pooling",
        when: { questionId: "pl_leak_02_severity", op: "eq", value: "pooling_water" },
        add_flags: ["URGENT", "WATER_DAMAGE_RISK"],
        set: { safety: "amber", inspection_bias: "high" }
      },
      {
        id: "leak_ceiling",
        when: { questionId: "pl_leak_01_source", op: "eq", value: "ceiling" },
        add_flags: ["UPSTAIRS_SOURCE", "ACCESS_INVESTIGATION_NEEDED"],
        set: { inspection_bias: "high" }
      },
      {
        id: "leak_in_wall",
        when: { questionId: "pl_leak_01_source", op: "eq", value: "wall" },
        add_flags: ["CONCEALED_LEAK", "LEAK_DETECTION_NEEDED"],
        set: { inspection_bias: "mandatory" }
      },
      {
        id: "leak_cant_isolate",
        when: { questionId: "pl_leak_04_isolation", op: "eq", value: "no_cant" },
        add_flags: ["ISOLATION_ASSISTANCE_NEEDED"]
      },
      {
        id: "leak_ongoing",
        when: { questionId: "pl_leak_03_duration", op: "eq", value: "ongoing" },
        add_flags: ["WATER_DAMAGE_LIKELY", "DRYING_MAY_BE_NEEDED"]
      }
    ]
  }
};

// ============================================================
// LITE PACK: Pipe Repair
// ============================================================
const pipeRepairPack: PlumbingPack = {
  microSlug: "pipe-repair",
  subcategorySlug: "leak-repairs",
  categorySlug: "plumbing",
  version: 2,
  name: "Pipe Repair",
  questions: [
    {
      id: "pl_pipe_01_issue",
      label: "What's wrong with the pipe?",
      type: "radio",
      required: true,
      options: [
        { value: "leaking_joint", label: "Leaking at joint/fitting" },
        { value: "cracked", label: "Cracked/split pipe" },
        { value: "frozen", label: "Frozen pipe" },
        { value: "corroded", label: "Corroded/rusty" },
        { value: "noisy", label: "Noisy (banging/rattling)" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "pl_pipe_02_type",
      label: "Pipe type (if known)",
      type: "radio",
      required: true,
      options: [
        { value: "copper", label: "Copper" },
        { value: "plastic", label: "Plastic" },
        { value: "lead", label: "Lead (old grey)" },
        { value: "galvanized", label: "Galvanized steel" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "pl_pipe_03_location",
      label: "Where is the pipe?",
      type: "radio",
      required: true,
      options: [
        { value: "exposed", label: "Exposed/visible" },
        { value: "under_floor", label: "Under floor" },
        { value: "in_wall", label: "In wall" },
        { value: "outside", label: "Outside/underground" },
        { value: "loft", label: "Loft/attic" }
      ]
    },
    {
      id: "pl_pipe_04_water_type",
      label: "What does this pipe carry?",
      type: "radio",
      required: true,
      options: [
        { value: "mains_cold", label: "Mains cold water" },
        { value: "hot_water", label: "Hot water" },
        { value: "heating", label: "Central heating" },
        { value: "waste", label: "Waste/drainage" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "pl_pipe_05_property",
      label: "Property type",
      type: "radio",
      required: true,
      options: [
        { value: "apartment", label: "Apartment/flat" },
        { value: "house", label: "House" },
        { value: "commercial", label: "Commercial" }
      ]
    },
    {
      id: "pl_pipe_06_uploads",
      label: "Upload photos",
      type: "file",
      required: true,
      accept: "image/*",
      help: "Photo of the damaged pipe and surrounding area"
    }
  ],
  metadata: {
    pattern: "fault_repair",
    inspection_bias: "medium",
    category_contract: "plumbing_v1",
    rules: [
      {
        id: "pipe_frozen",
        when: { questionId: "pl_pipe_01_issue", op: "eq", value: "frozen" },
        add_flags: ["FROZEN_PIPE", "BURST_RISK", "URGENT"],
        set: { safety: "amber", inspection_bias: "high" }
      },
      {
        id: "pipe_lead",
        when: { questionId: "pl_pipe_02_type", op: "eq", value: "lead" },
        add_flags: ["LEAD_PIPE_DETECTED", "REPLACEMENT_RECOMMENDED", "HEALTH_ADVISORY"],
        set: { inspection_bias: "mandatory" }
      },
      {
        id: "pipe_concealed",
        when: { questionId: "pl_pipe_03_location", op: "in", value: ["under_floor", "in_wall"] },
        add_flags: ["CONCEALED_PIPEWORK", "ACCESS_WORK_NEEDED"]
      }
    ]
  }
};

// ============================================================
// LITE PACK: Install Sink (Bathroom)
// ============================================================
const installSinkPack: PlumbingPack = {
  microSlug: "install-sink",
  subcategorySlug: "bathroom",
  categorySlug: "plumbing",
  version: 1,
  name: "Install Bathroom Sink",
  questions: [
    {
      id: "pl_sink_01_type",
      label: "What type of installation?",
      type: "radio",
      required: true,
      options: [
        { value: "replace_existing", label: "Replace existing sink" },
        { value: "new_location", label: "New sink in new location" },
        { value: "add_second", label: "Add second sink" },
        { value: "upgrade", label: "Upgrade style (same location)" }
      ]
    },
    {
      id: "pl_sink_02_sink_type",
      label: "Sink type",
      type: "radio",
      required: true,
      options: [
        { value: "pedestal", label: "Pedestal basin" },
        { value: "wall_hung", label: "Wall-hung" },
        { value: "countertop", label: "Countertop/vessel" },
        { value: "vanity", label: "Vanity unit with sink" },
        { value: "not_decided", label: "Not decided yet" }
      ]
    },
    {
      id: "pl_sink_03_taps",
      label: "Tap arrangement",
      type: "radio",
      required: true,
      options: [
        { value: "mixer", label: "Single mixer tap" },
        { value: "separate", label: "Separate hot/cold taps" },
        { value: "wall_mounted", label: "Wall-mounted taps" },
        { value: "not_sure", label: "Not sure yet" }
      ]
    },
    {
      id: "pl_sink_04_supply",
      label: "Who is supplying the sink?",
      type: "radio",
      required: true,
      options: [
        { value: "i_have", label: "I have it already" },
        { value: "i_will_buy", label: "I'll buy it" },
        { value: "plumber_supply", label: "Plumber to supply" },
        { value: "need_advice", label: "Need advice first" }
      ]
    },
    {
      id: "pl_sink_05_property",
      label: "Property type",
      type: "radio",
      required: true,
      options: [
        { value: "apartment", label: "Apartment/flat" },
        { value: "house", label: "House" },
        { value: "commercial", label: "Commercial" }
      ]
    },
    {
      id: "pl_sink_06_uploads",
      label: "Upload photos",
      type: "file",
      required: true,
      accept: "image/*",
      help: "Photo of: (1) current sink or installation area, (2) under-sink pipework if visible"
    }
  ],
  metadata: {
    pattern: "install_fixture",
    inspection_bias: "low",
    category_contract: "plumbing_v1",
    rules: [
      {
        id: "sink_new_location",
        when: { questionId: "pl_sink_01_type", op: "eq", value: "new_location" },
        add_flags: ["NEW_PIPEWORK_NEEDED", "WASTE_RUN_NEEDED"],
        set: { inspection_bias: "high" }
      },
      {
        id: "sink_wall_hung",
        when: { questionId: "pl_sink_02_sink_type", op: "eq", value: "wall_hung" },
        add_flags: ["WALL_STRENGTH_CHECK"]
      }
    ]
  }
};

// ============================================================
// LITE PACK: Install Dishwasher
// ============================================================
const installDishwasherPack: PlumbingPack = {
  microSlug: "install-dishwasher",
  subcategorySlug: "kitchen-plumbing",
  categorySlug: "plumbing",
  version: 1,
  name: "Install Dishwasher",
  questions: [
    {
      id: "pl_dw_01_type",
      label: "What type of installation?",
      type: "radio",
      required: true,
      options: [
        { value: "replace_existing", label: "Replace existing dishwasher" },
        { value: "new_install", label: "First-time installation" },
        { value: "relocate", label: "Move to different location" }
      ]
    },
    {
      id: "pl_dw_02_connections",
      label: "Are water connections already in place?",
      type: "radio",
      required: true,
      options: [
        { value: "yes", label: "Yes, ready to connect" },
        { value: "partial", label: "Some connections exist" },
        { value: "no", label: "No, need new connections" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "pl_dw_03_waste",
      label: "Waste drainage situation",
      type: "radio",
      required: true,
      options: [
        { value: "existing", label: "Existing waste connection" },
        { value: "spigot_available", label: "Sink trap has spigot" },
        { value: "needs_new", label: "Needs new waste connection" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "pl_dw_04_electric",
      label: "Electrical connection",
      type: "radio",
      required: true,
      options: [
        { value: "socket_nearby", label: "Socket nearby" },
        { value: "fused_spur", label: "Fused spur in place" },
        { value: "needs_socket", label: "No socket—needs adding" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "pl_dw_05_supply",
      label: "Who is supplying the dishwasher?",
      type: "radio",
      required: true,
      options: [
        { value: "i_have", label: "I have it already" },
        { value: "being_delivered", label: "Being delivered" },
        { value: "need_advice", label: "Need advice on model" }
      ]
    },
    {
      id: "pl_dw_06_uploads",
      label: "Upload photos",
      type: "file",
      required: false,
      accept: "image/*",
      help: "Photo of: (1) installation space, (2) under-sink area showing connections"
    }
  ],
  metadata: {
    pattern: "appliance_install",
    inspection_bias: "low",
    category_contract: "plumbing_v1",
    rules: [
      {
        id: "dw_new_install",
        when: { questionId: "pl_dw_01_type", op: "eq", value: "new_install" },
        add_flags: ["NEW_CONNECTIONS_NEEDED"],
        set: { inspection_bias: "medium" }
      },
      {
        id: "dw_needs_socket",
        when: { questionId: "pl_dw_04_electric", op: "eq", value: "needs_socket" },
        add_flags: ["ELECTRICIAN_NEEDED", "MULTI_TRADE"]
      },
      {
        id: "dw_needs_waste",
        when: { questionId: "pl_dw_03_waste", op: "eq", value: "needs_new" },
        add_flags: ["WASTE_MODIFICATION_NEEDED"]
      }
    ]
  }
};

// ============================================================
// LITE PACK: Install Kitchen Sink
// ============================================================
const installKitchenSinkPack: PlumbingPack = {
  microSlug: "install-kitchen-sink",
  subcategorySlug: "kitchen-plumbing",
  categorySlug: "plumbing",
  version: 1,
  name: "Install Kitchen Sink",
  questions: [
    {
      id: "pl_ks_01_type",
      label: "What type of installation?",
      type: "radio",
      required: true,
      options: [
        { value: "replace_existing", label: "Replace existing sink" },
        { value: "new_location", label: "New sink in new location" },
        { value: "upgrade_style", label: "Upgrade style (same location)" }
      ]
    },
    {
      id: "pl_ks_02_sink_type",
      label: "Sink type",
      type: "radio",
      required: true,
      options: [
        { value: "single_bowl", label: "Single bowl" },
        { value: "double_bowl", label: "Double bowl" },
        { value: "one_half", label: "1.5 bowl" },
        { value: "belfast", label: "Belfast/butler sink" },
        { value: "not_decided", label: "Not decided yet" }
      ]
    },
    {
      id: "pl_ks_03_taps",
      label: "Tap type",
      type: "radio",
      required: true,
      options: [
        { value: "mixer", label: "Mixer tap" },
        { value: "separate", label: "Separate hot/cold" },
        { value: "boiling_water", label: "Boiling water tap" },
        { value: "not_sure", label: "Not sure yet" }
      ]
    },
    {
      id: "pl_ks_04_waste_disposal",
      label: "Waste disposal unit needed?",
      type: "radio",
      required: true,
      options: [
        { value: "yes", label: "Yes, install disposal unit" },
        { value: "existing", label: "Keep existing unit" },
        { value: "no", label: "No disposal needed" }
      ]
    },
    {
      id: "pl_ks_05_supply",
      label: "Who is supplying the sink?",
      type: "radio",
      required: true,
      options: [
        { value: "i_have", label: "I have it already" },
        { value: "i_will_buy", label: "I'll buy it" },
        { value: "plumber_supply", label: "Plumber to supply" }
      ]
    },
    {
      id: "pl_ks_06_uploads",
      label: "Upload photos",
      type: "file",
      required: true,
      accept: "image/*",
      help: "Photo of: (1) current sink area, (2) under-sink plumbing"
    }
  ],
  metadata: {
    pattern: "install_fixture",
    inspection_bias: "low",
    category_contract: "plumbing_v1",
    rules: [
      {
        id: "ks_new_location",
        when: { questionId: "pl_ks_01_type", op: "eq", value: "new_location" },
        add_flags: ["NEW_PIPEWORK_NEEDED", "WASTE_RUN_NEEDED"],
        set: { inspection_bias: "high" }
      },
      {
        id: "ks_boiling_tap",
        when: { questionId: "pl_ks_03_taps", op: "eq", value: "boiling_water" },
        add_flags: ["ELECTRICAL_CHECK", "SPECIALIST_TAP"]
      },
      {
        id: "ks_disposal_install",
        when: { questionId: "pl_ks_04_waste_disposal", op: "eq", value: "yes" },
        add_flags: ["DISPOSAL_UNIT", "ELECTRICAL_SOCKET_NEEDED"]
      }
    ]
  }
};

// ============================================================
// LITE PACK: Install Shower (update existing)
// ============================================================
const installShowerPack: PlumbingPack = {
  microSlug: "install-shower",
  subcategorySlug: "bathroom",
  categorySlug: "plumbing",
  version: 2,
  name: "Install Shower",
  questions: [
    {
      id: "pl_shower_01_type",
      label: "What type of installation?",
      type: "radio",
      required: true,
      options: [
        { value: "replace_existing", label: "Replace existing shower" },
        { value: "new_enclosure", label: "New shower enclosure" },
        { value: "over_bath", label: "Shower over bath" },
        { value: "wet_room", label: "Wet room conversion" }
      ]
    },
    {
      id: "pl_shower_02_shower_type",
      label: "Shower type",
      type: "radio",
      required: true,
      options: [
        { value: "electric", label: "Electric shower" },
        { value: "mixer_bar", label: "Mixer bar (exposed)" },
        { value: "thermostatic", label: "Thermostatic mixer" },
        { value: "digital", label: "Digital/smart shower" },
        { value: "not_sure", label: "Not sure/need advice" }
      ]
    },
    {
      id: "pl_shower_03_tray",
      label: "Shower tray situation",
      type: "radio",
      required: true,
      options: [
        { value: "keep_existing", label: "Keep existing tray" },
        { value: "new_tray", label: "New tray needed" },
        { value: "level_access", label: "Level access/wet room" },
        { value: "over_bath", label: "N/A—over bath" }
      ]
    },
    {
      id: "pl_shower_04_supply",
      label: "Who is supplying the shower?",
      type: "radio",
      required: true,
      options: [
        { value: "i_have", label: "I have it already" },
        { value: "i_will_buy", label: "I'll buy it" },
        { value: "plumber_supply", label: "Plumber to supply" }
      ]
    },
    {
      id: "pl_shower_05_property",
      label: "Property type",
      type: "radio",
      required: true,
      options: [
        { value: "apartment", label: "Apartment/flat" },
        { value: "house", label: "House" }
      ]
    },
    {
      id: "pl_shower_06_uploads",
      label: "Upload photos",
      type: "file",
      required: true,
      accept: "image/*",
      help: "Photo of: (1) current shower/bath area, (2) existing pipework if visible"
    }
  ],
  metadata: {
    pattern: "install_fixture",
    inspection_bias: "medium",
    category_contract: "plumbing_v1",
    rules: [
      {
        id: "shower_wet_room",
        when: { questionId: "pl_shower_01_type", op: "eq", value: "wet_room" },
        add_flags: ["TANKING_NEEDED", "FLOOR_WORK", "MULTI_TRADE"],
        set: { inspection_bias: "high" }
      },
      {
        id: "shower_electric",
        when: { questionId: "pl_shower_02_shower_type", op: "eq", value: "electric" },
        add_flags: ["ELECTRICIAN_NEEDED", "MULTI_TRADE"]
      },
      {
        id: "shower_new_enclosure",
        when: { questionId: "pl_shower_01_type", op: "eq", value: "new_enclosure" },
        add_flags: ["WASTE_POSITION_CHECK", "FLOOR_LEVEL_CHECK"]
      }
    ]
  }
};

// ============================================================
// LITE PACK: Install Toilet (update existing)
// ============================================================
const installToiletPack: PlumbingPack = {
  microSlug: "install-toilet",
  subcategorySlug: "bathroom",
  categorySlug: "plumbing",
  version: 2,
  name: "Install Toilet",
  questions: [
    {
      id: "pl_toilet_01_type",
      label: "What type of installation?",
      type: "radio",
      required: true,
      options: [
        { value: "replace_existing", label: "Replace existing toilet" },
        { value: "new_location", label: "New toilet in new location" },
        { value: "add_cloakroom", label: "Add cloakroom toilet" }
      ]
    },
    {
      id: "pl_toilet_02_toilet_type",
      label: "Toilet type",
      type: "radio",
      required: true,
      options: [
        { value: "close_coupled", label: "Close-coupled (standard)" },
        { value: "back_to_wall", label: "Back-to-wall" },
        { value: "wall_hung", label: "Wall-hung" },
        { value: "concealed_cistern", label: "Concealed cistern" },
        { value: "not_decided", label: "Not decided yet" }
      ]
    },
    {
      id: "pl_toilet_03_waste_position",
      label: "Waste outlet position",
      type: "radio",
      required: true,
      options: [
        { value: "same_position", label: "Same as current" },
        { value: "needs_moving", label: "Needs moving" },
        { value: "new_install", label: "New installation" },
        { value: "not_sure", label: "Not sure" }
      ]
    },
    {
      id: "pl_toilet_04_supply",
      label: "Who is supplying the toilet?",
      type: "radio",
      required: true,
      options: [
        { value: "i_have", label: "I have it already" },
        { value: "i_will_buy", label: "I'll buy it" },
        { value: "plumber_supply", label: "Plumber to supply" }
      ]
    },
    {
      id: "pl_toilet_05_property",
      label: "Property type",
      type: "radio",
      required: true,
      options: [
        { value: "apartment", label: "Apartment/flat" },
        { value: "house", label: "House" }
      ]
    },
    {
      id: "pl_toilet_06_uploads",
      label: "Upload photos",
      type: "file",
      required: true,
      accept: "image/*",
      help: "Photo of: (1) current toilet or installation area, (2) waste pipe outlet"
    }
  ],
  metadata: {
    pattern: "install_fixture",
    inspection_bias: "low",
    category_contract: "plumbing_v1",
    rules: [
      {
        id: "toilet_new_location",
        when: { questionId: "pl_toilet_01_type", op: "in", value: ["new_location", "add_cloakroom"] },
        add_flags: ["NEW_WASTE_RUN", "SOIL_PIPE_CONNECTION"],
        set: { inspection_bias: "high" }
      },
      {
        id: "toilet_wall_hung",
        when: { questionId: "pl_toilet_02_toilet_type", op: "eq", value: "wall_hung" },
        add_flags: ["FRAME_INSTALLATION", "WALL_STRENGTH_CHECK"]
      },
      {
        id: "toilet_waste_moving",
        when: { questionId: "pl_toilet_03_waste_position", op: "eq", value: "needs_moving" },
        add_flags: ["WASTE_MODIFICATION", "FLOOR_WORK_LIKELY"]
      }
    ]
  }
};

// ============================================================
// EXPORT ALL PACKS
// ============================================================
const plumbingCompletePacks: PlumbingPack[] = [
  // Gold Standards
  burstPipePack,
  sewerBackupPack,
  waterHeaterEmergencyPack,
  fixLeakPack,
  // Lite packs (missing)
  installSinkPack,
  installDishwasherPack,
  installKitchenSinkPack,
  // Lite packs (updated with rules)
  pipeRepairPack,
  installShowerPack,
  installToiletPack
];

// ============================================================
// SEEDER EXECUTION
// ============================================================
const PROJECT_REF = process.env.SUPABASE_PROJECT_REF;
const SEEDER_SECRET = process.env.SEEDER_SECRET;
const DRY_RUN = process.env.DRY_RUN !== "0";

if (!PROJECT_REF) {
  console.error("Missing SUPABASE_PROJECT_REF env var");
  process.exit(1);
}

const url = `https://${PROJECT_REF}.supabase.co/functions/v1/seedpacks${DRY_RUN ? "?dry_run=1" : ""}`;

console.log(`\n========================================`);
console.log(`PLUMBING COMPLETE SEEDER`);
console.log(`========================================\n`);

console.log(`Gold Standards (4):`);
console.log(`  - burst-pipe (emergency)`);
console.log(`  - sewer-backup (drainage emergency)`);
console.log(`  - water-heater-emergency (hot water emergency)`);
console.log(`  - fix-leak (general leak repair)`);

console.log(`\nLite Packs (6):`);
console.log(`  - install-sink (new)`);
console.log(`  - install-dishwasher (new)`);
console.log(`  - install-kitchen-sink (new)`);
console.log(`  - pipe-repair (updated with rules)`);
console.log(`  - install-shower (updated with rules)`);
console.log(`  - install-toilet (updated with rules)`);

console.log(`\nTotal: ${plumbingCompletePacks.length} packs`);
console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "LIVE"}`);
console.log(`URL: ${url}\n`);

const res = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    ...(SEEDER_SECRET ? { Authorization: `Bearer ${SEEDER_SECRET}` } : {}),
  },
  body: JSON.stringify({ packs: plumbingCompletePacks }),
});

const json = await res.json().catch(() => ({}));
console.log("STATUS:", res.status);
console.log(JSON.stringify(json, null, 2));

if (res.ok && !DRY_RUN) {
  console.log("\n✅ Plumbing complete packs seeded successfully!");
}

process.exit(res.ok ? 0 : 1);
