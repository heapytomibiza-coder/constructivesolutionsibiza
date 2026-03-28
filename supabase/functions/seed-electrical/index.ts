/**
 * Edge function to seed Electrical Gold Standard question packs
 * POST /seed-electrical
 */

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

// Canonical question format
interface QuestionOption {
  value: string;
  label: string;
}

interface QuestionDef {
  id: string;
  label: string;
  type: "radio" | "checkbox" | "select" | "text" | "textarea" | "file" | "number";
  options?: QuestionOption[];
  required?: boolean;
  help?: string;
  accept?: string;
  show_if?: {
    questionId: string;
    value: string | string[];
  };
}

// Helper to normalize options to { value, label } format
function normalizeOptions(options: string[]): QuestionOption[] {
  return options.map((opt) => ({
    value: opt.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/_+$/, ""),
    label: opt,
  }));
}

// ============================================================================
// GOLD STANDARD PACKS - Electrical Category
// ============================================================================

const electricalPacks = [
  // 1. Install Extra Sockets
  {
    micro_slug: "extra-sockets-power-points",
    title: "Install Extra Sockets",
    version: 1,
    is_active: true,
    metadata: {
      category_contract: "electrical",
      inspection_bias: "medium",
      scope_unit: "points",
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
        help: "Choose the closest match. If unsure, select 'Not sure'.",
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
        label: "Do you know the condition/type of your fuse box / consumer unit?",
        type: "radio",
        required: true,
        options: normalizeOptions(["Modern with RCD/RCBO", "Old / ceramic fuses", "Not sure"]),
      },
      {
        id: "el_sock_06_wall_chasing",
        label: "Will walls need chasing (concealed cabling), or surface-mounted?",
        type: "radio",
        required: true,
        options: normalizeOptions(["Chasing (concealed)", "Surface-mounted", "Not sure"]),
      },
      {
        id: "el_sock_07_occupied",
        label: "Is the property occupied during works?",
        type: "radio",
        required: true,
        options: normalizeOptions(["Yes", "No"]),
      },
      {
        id: "el_sock_08_urgency",
        label: "Urgency",
        type: "radio",
        required: true,
        options: normalizeOptions(["Flexible", "Within a week", "Urgent"]),
      },
    ],
  },

  // 2. No Power / Tripping Circuits
  {
    micro_slug: "no-power-tripping-circuits",
    title: "No Power / Tripping Circuits",
    version: 1,
    is_active: true,
    metadata: {
      category_contract: "electrical",
      inspection_bias: "high",
      scope_unit: "circuits",
      emergency_capable: true,
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
        id: "el_fault_05_recent_changes",
        label: "Recent changes",
        type: "checkbox",
        required: true,
        options: normalizeOptions([
          "New appliance installed",
          "Recent electrical work",
          "Building work nearby",
          "Nothing / not sure",
        ]),
      },
      {
        id: "el_fault_06_cu_type",
        label: "Type of fuse box / consumer unit",
        type: "radio",
        required: true,
        options: normalizeOptions([
          "Modern (switches / RCDs)",
          "Old (ceramic fuses / rewirable)",
          "Not sure",
        ]),
      },
      {
        id: "el_fault_07_property_type",
        label: "Property type",
        type: "radio",
        required: true,
        options: normalizeOptions(["Apartment", "House", "Commercial"]),
      },
      {
        id: "el_fault_08_occupied",
        label: "Is the property occupied?",
        type: "radio",
        required: true,
        options: normalizeOptions(["Yes", "No"]),
      },
      {
        id: "el_fault_09_urgency",
        label: "Urgency",
        type: "radio",
        required: true,
        options: normalizeOptions([
          "Emergency (no power / safety risk)",
          "Urgent (24–48 hours)",
          "Flexible",
        ]),
      },
    ],
  },

  // 3. Electrical Safety Check (EICR)
  {
    micro_slug: "electrical-safety-checks-reports",
    title: "Electrical Safety Check (EICR)",
    version: 1,
    is_active: true,
    metadata: {
      category_contract: "electrical",
      inspection_bias: "mandatory",
      scope_unit: "property",
      compliance_required: true,
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
        options: normalizeOptions([
          "Apartment",
          "Terraced",
          "Semi-detached",
          "Detached",
          "Commercial",
          "HMO",
        ]),
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
        label: "When was the last inspection/EICR?",
        type: "radio",
        required: true,
        options: normalizeOptions([
          "Never / don't know",
          "More than 10 years ago",
          "5–10 years ago",
          "Within last 5 years",
        ]),
      },
      {
        id: "el_eicr_06_known_issues",
        label: "Any known issues?",
        type: "radio",
        required: true,
        options: normalizeOptions(["Yes (describe)", "No", "Not sure"]),
      },
      {
        id: "el_eicr_08_cu_type",
        label: "Consumer unit type",
        type: "radio",
        required: true,
        options: normalizeOptions(["Modern (MCBs/RCDs)", "Old (ceramic fuses)", "Mixed", "Not sure"]),
      },
      {
        id: "el_eicr_09_cu_count",
        label: "How many consumer units?",
        type: "radio",
        required: true,
        options: normalizeOptions(["1", "2", "3+", "Not sure"]),
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
        id: "el_eicr_12_deadline",
        label: "Urgency / deadline",
        type: "radio",
        required: true,
        options: normalizeOptions(["ASAP (urgent deadline)", "Within 2 weeks", "Flexible"]),
      },
    ],
  },

  // 4. Fuse Box / Consumer Unit Replacement
  {
    micro_slug: "fuse-box-consumer-unit-replacement",
    title: "Fuse Box / Consumer Unit Replacement",
    version: 1,
    is_active: true,
    metadata: {
      category_contract: "electrical",
      inspection_bias: "mandatory",
      scope_unit: "circuits",
      compliance_required: true,
      part_p_notifiable: true,
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
        options: normalizeOptions([
          "Old (ceramic fuses)",
          "Modern but outdated",
          "Modern with RCD",
          "Not sure",
        ]),
      },
      {
        id: "el_cu_03_location",
        label: "Consumer unit location",
        type: "radio",
        required: true,
        options: normalizeOptions([
          "Under stairs",
          "Utility",
          "Kitchen",
          "Garage",
          "External meter box",
          "Other / not sure",
        ]),
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
        label: "Earthing & bonding checked or upgraded recently?",
        type: "radio",
        required: true,
        options: normalizeOptions(["Yes", "No", "Don't know"]),
      },
      {
        id: "el_cu_08_extras",
        label: "Additional requirements (optional)",
        type: "checkbox",
        required: false,
        options: normalizeOptions([
          "Surge protection",
          "Arc fault detection (AFDD)",
          "EV charger circuit preparation",
          "None / not sure",
        ]),
      },
      {
        id: "el_cu_09_power_off_tolerance",
        label: "Can power be off for several hours?",
        type: "radio",
        required: true,
        options: normalizeOptions([
          "Yes",
          "Yes, minimal disruption needed",
          "No (critical equipment)",
        ]),
      },
      {
        id: "el_cu_10_urgency",
        label: "Urgency",
        type: "radio",
        required: true,
        options: normalizeOptions(["ASAP", "Within 2 weeks", "Flexible"]),
      },
    ],
  },
];

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Auth: internal only (seed task)
  const internalSecret = Deno.env.get("INTERNAL_FUNCTION_SECRET");
  const providedSecret = req.headers.get("x-internal-secret");
  if (!internalSecret || providedSecret !== internalSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const results: { slug: string; status: string; questions: number }[] = [];

    for (const pack of electricalPacks) {
      const { error } = await supabase
        .from("question_packs")
        .upsert(
          {
            micro_slug: pack.micro_slug,
            title: pack.title,
            questions: pack.questions,
            version: pack.version,
            is_active: pack.is_active,
            metadata: pack.metadata,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "micro_slug" }
        );

      results.push({
        slug: pack.micro_slug,
        status: error ? `error: ${error.message}` : "ok",
        questions: pack.questions.length,
      });
    }

    return new Response(
      JSON.stringify({
        message: `Seeded ${electricalPacks.length} Electrical Gold Standard packs`,
        results,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
