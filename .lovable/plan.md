

# Electrical Small Works — Full JSON Templates + Implementation Plan

## Two things are needed

### A. Pricing rules (what drives the calculator)
Each service needs a row in `pricing_rules` with base rates and `adjustment_factors` fields.

### B. Guide content (what drives the content page)
The `guide_content` JSONB column doesn't exist yet on `pricing_rules`. It needs adding via migration first, then each rule gets guide content seeded.

---

## The JSON templates

Below are all 5 services — each showing both the **pricing rule data** and the **guide_content JSON**.

### Shared family logic

All 5 use `base_labour_unit: "unit"` (per light/socket/switch). The `adjustment_factors` fields follow the same pattern: quantity, installation type, access difficulty, wiring complexity.

---

### 1. install-ceiling-lights

**Pricing rule:**
```json
{
  "category": "Electrical",
  "subcategory": "Lighting",
  "micro_slug": "install-ceiling-lights",
  "micro_name": "Install Ceiling Lights",
  "base_labour_unit": "unit",
  "base_labour_min": 50,
  "base_labour_max": 200,
  "base_material_min": 10,
  "base_material_max": 50,
  "location_modifier": 1,
  "difficulty_modifier": 1,
  "urgency_modifier": 1,
  "adjustment_factors": {
    "fields": [
      {
        "key": "quantity",
        "label": "Number of lights",
        "type": "number",
        "min": 1,
        "max": 20,
        "default": 1
      },
      {
        "key": "install_type",
        "label": "Installation type",
        "type": "select",
        "options": [
          { "label": "Simple replacement", "value": "replacement", "modifier": 1 },
          { "label": "Standard new install", "value": "standard", "modifier": 1.4 },
          { "label": "New wiring required", "value": "new_wiring", "modifier": 2 },
          { "label": "Feature / designer fitting", "value": "feature", "modifier": 2.5 }
        ]
      },
      {
        "key": "ceiling_type",
        "label": "Ceiling type",
        "type": "select",
        "options": [
          { "label": "Plasterboard", "value": "plasterboard", "modifier": 1 },
          { "label": "Concrete", "value": "concrete", "modifier": 1.3 }
        ]
      },
      {
        "key": "high_ceiling",
        "label": "High ceiling (above 3m)?",
        "type": "boolean",
        "default": false,
        "modifier_true": 1.25,
        "modifier_false": 1
      }
    ]
  }
}
```

**Guide content:**
```json
{
  "summary": "Installing ceiling lights can range from a simple swap of an existing fitting to a full new installation requiring wiring, positioning, and ceiling work.\n\nThis guide gives ballpark pricing for Ibiza. Final costs depend on access, wiring complexity, and the type of light being installed.",
  "at_a_glance": {
    "average_cost": "€60 – €250 per light",
    "typical_duration": "30 min – 2 hours per light",
    "confidence_level": "high",
    "usually_includes": [
      "Basic installation",
      "Connection to existing wiring",
      "Standard fixing"
    ],
    "may_not_include": [
      "New wiring runs",
      "Ceiling modification",
      "Heavy fixture structural support"
    ]
  },
  "price_table": [
    { "description": "Simple replacement (existing wiring)", "low": 60, "high": 100, "note": "Swap fitting only" },
    { "description": "Standard new install", "low": 100, "high": 150, "note": "Minor adjustments" },
    { "description": "New wiring required", "low": 150, "high": 250, "note": "Cable routing adds labour" },
    { "description": "Feature / designer lighting", "low": 200, "high": 400, "note": "Complex fittings, multiple points" }
  ],
  "sections": [
    {
      "heading": "What affects the cost",
      "body": "**Existing vs new wiring** — Replacing a light on existing wiring is quick. Running new cable from the consumer unit or nearest junction adds significant labour.\n\n**Ceiling type** — Concrete ceilings are harder to drill and route cable through than plasterboard. Expect 20–30% more labour on concrete.\n\n**Fixture weight and complexity** — Heavy chandeliers or designer fittings need secure mounting points. If the ceiling can't support the weight, reinforcement is needed.\n\n**Access** — High ceilings, staircases, or vaulted roofs require scaffolding or tower access, adding time and cost."
    },
    {
      "heading": "What is usually included",
      "body": "- Installation labour\n- Basic connection to existing wiring\n- Standard ceiling rose or bracket fixing\n- Testing the circuit after install"
    },
    {
      "heading": "What is often not included",
      "body": "- Rewiring circuits or running new cable\n- Ceiling repair or repainting after install\n- Smart lighting system setup\n- Supply of the light fitting itself (unless agreed)"
    },
    {
      "heading": "Common hidden extras",
      "body": "- Weak ceiling support requiring reinforcement\n- Old wiring that doesn't meet current standards\n- Incompatible fittings needing adapters or returns\n- Access equipment hire for high ceilings"
    },
    {
      "heading": "Questions to answer before requesting quotes",
      "body": "- Is there existing wiring at the install point?\n- What type of ceiling (plasterboard, concrete, beamed)?\n- What is the ceiling height?\n- What type of light fitting (pendant, flush, recessed, feature)?\n- How many lights need installing?\n- Do you have the fittings or does the electrician need to supply them?"
    }
  ],
  "faqs": [
    { "question": "How long does it take to install a ceiling light?", "answer": "A simple swap takes 30–45 minutes. A new install with wiring can take 1–2 hours per light." },
    { "question": "Can I supply my own light fittings?", "answer": "Yes, most electricians are happy to install fittings you supply. Just confirm compatibility beforehand." },
    { "question": "Do I need to upgrade my wiring?", "answer": "If your existing wiring is old or aluminium, the electrician may recommend an upgrade for safety. This adds cost but is essential." }
  ],
  "related_guides": ["install-sockets", "replace-switch", "indoor-lighting-installation"],
  "tips": [
    "Batch multiple lights in one visit to reduce call-out costs",
    "Check fitting dimensions against your ceiling space before purchasing",
    "Ask whether the price includes testing and certification"
  ],
  "cta": {
    "label": "Post a Job",
    "note": "Use the calculator for a ballpark, then post your job to get real quotes from vetted electricians."
  }
}
```

---

### 2. install-sockets

**Pricing rule:**
```json
{
  "category": "Electrical",
  "subcategory": "Sockets & Switches",
  "micro_slug": "install-sockets",
  "micro_name": "Install Sockets",
  "base_labour_unit": "unit",
  "base_labour_min": 70,
  "base_labour_max": 200,
  "base_material_min": 10,
  "base_material_max": 50,
  "location_modifier": 1,
  "difficulty_modifier": 1,
  "urgency_modifier": 1,
  "adjustment_factors": {
    "fields": [
      { "key": "quantity", "label": "Number of sockets", "type": "number", "min": 1, "max": 20, "default": 1 },
      {
        "key": "install_type",
        "label": "Installation type",
        "type": "select",
        "options": [
          { "label": "Replace existing socket", "value": "replacement", "modifier": 1 },
          { "label": "Add to existing circuit", "value": "add_existing", "modifier": 1.5 },
          { "label": "New socket + new wiring", "value": "new_wiring", "modifier": 2 }
        ]
      },
      {
        "key": "wall_type",
        "label": "Wall type",
        "type": "select",
        "options": [
          { "label": "Plasterboard / stud", "value": "plasterboard", "modifier": 1 },
          { "label": "Brick / block", "value": "brick", "modifier": 1.2 },
          { "label": "Concrete / stone", "value": "concrete", "modifier": 1.4 }
        ]
      },
      {
        "key": "flush_mount",
        "label": "Flush (recessed) mounting?",
        "type": "boolean",
        "default": true,
        "modifier_true": 1.15,
        "modifier_false": 1
      }
    ]
  }
}
```

**Guide content:**
```json
{
  "summary": "Installing new sockets or replacing old ones is one of the most common electrical jobs. Costs depend on whether you're swapping an existing unit or running new wiring to a fresh location.\n\nThis guide covers Ibiza ballpark pricing. Actual costs depend on wall type, wiring distance, and the number of sockets needed.",
  "at_a_glance": {
    "average_cost": "€80 – €250 per socket",
    "typical_duration": "1 – 3 hours per unit",
    "confidence_level": "high",
    "usually_includes": ["Installation labour", "Basic connection", "Standard socket plate"],
    "may_not_include": ["Wall chasing and repair", "Circuit upgrades", "Decorative plates"]
  },
  "price_table": [
    { "description": "Replace existing socket", "low": 80, "high": 120, "note": "Direct swap" },
    { "description": "Add socket to existing circuit", "low": 120, "high": 180, "note": "Short cable run" },
    { "description": "New socket with new wiring", "low": 150, "high": 250, "note": "Full install" }
  ],
  "sections": [
    {
      "heading": "What affects the cost",
      "body": "**Distance from existing circuit** — The further the new socket from the nearest junction or consumer unit, the more cable and labour.\n\n**Wall type** — Chasing cable channels into brick or concrete takes longer than running through stud walls.\n\n**Quantity** — Installing several sockets in one visit is more efficient. Per-unit cost drops with volume.\n\n**Surface vs flush mounting** — Flush (recessed) sockets require cutting into the wall and fitting a back box. Surface mounting is faster but less neat."
    },
    {
      "heading": "What is usually included",
      "body": "- Installation labour\n- Standard socket plate\n- Connection and testing"
    },
    {
      "heading": "What is often not included",
      "body": "- Wall chasing and making good\n- Painting or plastering after install\n- Circuit board upgrades\n- USB or smart sockets (higher material cost)"
    },
    {
      "heading": "Common hidden extras",
      "body": "- Wall repair after cable chasing\n- Circuit overload requiring consumer unit upgrade\n- Difficult cable routing through floors or ceilings\n- Old wiring not meeting current safety standards"
    },
    {
      "heading": "Questions to answer before requesting quotes",
      "body": "- Where do you want the sockets?\n- Is there existing wiring nearby?\n- What wall type (plasterboard, brick, concrete)?\n- How many sockets do you need?\n- Do you want flush or surface mounted?"
    }
  ],
  "faqs": [
    { "question": "Can I add a socket to an existing circuit?", "answer": "Usually yes, if the circuit has spare capacity. The electrician will check before proceeding." },
    { "question": "Is it cheaper to install multiple sockets at once?", "answer": "Yes. Call-out time is fixed, so the per-unit cost drops when batching." },
    { "question": "Do I need to repair the wall after?", "answer": "If cable chasing is needed, you'll need to fill and paint. Some electricians include basic making good; most don't include decoration." }
  ],
  "related_guides": ["replace-switch", "fix-faulty-outlet", "install-ceiling-lights"],
  "tips": [
    "Plan socket positions before the electrician arrives",
    "Consider USB sockets where you'll charge devices",
    "Ask if the circuit can handle additional load"
  ],
  "cta": {
    "label": "Post a Job",
    "note": "Use the calculator for a ballpark, then post your job to get accurate quotes."
  }
}
```

---

### 3. replace-switch

**Pricing rule:**
```json
{
  "category": "Electrical",
  "subcategory": "Sockets & Switches",
  "micro_slug": "replace-switch",
  "micro_name": "Replace Switch",
  "base_labour_unit": "unit",
  "base_labour_min": 30,
  "base_labour_max": 90,
  "base_material_min": 5,
  "base_material_max": 30,
  "location_modifier": 1,
  "difficulty_modifier": 1,
  "urgency_modifier": 1,
  "adjustment_factors": {
    "fields": [
      { "key": "quantity", "label": "Number of switches", "type": "number", "min": 1, "max": 20, "default": 1 },
      {
        "key": "switch_type",
        "label": "Switch type",
        "type": "select",
        "options": [
          { "label": "Standard switch", "value": "standard", "modifier": 1 },
          { "label": "Dimmer switch", "value": "dimmer", "modifier": 1.4 },
          { "label": "Smart switch", "value": "smart", "modifier": 1.8 }
        ]
      },
      {
        "key": "wiring_issue",
        "label": "Existing wiring in good condition?",
        "type": "boolean",
        "default": true,
        "modifier_true": 1,
        "modifier_false": 1.3
      }
    ]
  }
}
```

**Guide content:**
```json
{
  "summary": "Replacing a light switch is one of the quickest and cheapest electrical jobs. Costs increase if you're upgrading to a dimmer or smart switch, or if the existing wiring needs attention.\n\nThis guide covers Ibiza ballpark pricing for standard switch replacements and upgrades.",
  "at_a_glance": {
    "average_cost": "€40 – €120 per switch",
    "typical_duration": "15 – 60 minutes",
    "confidence_level": "high",
    "usually_includes": ["Switch replacement", "Basic testing"],
    "may_not_include": ["Smart hub setup", "Wiring repairs", "Back box replacement"]
  },
  "price_table": [
    { "description": "Basic switch replacement", "low": 40, "high": 70, "note": "Like-for-like swap" },
    { "description": "Dimmer or smart switch", "low": 70, "high": 120, "note": "May need neutral wire" }
  ],
  "sections": [
    {
      "heading": "What affects the cost",
      "body": "**Switch type** — A standard toggle swap is quick. Dimmer switches may need compatible wiring. Smart switches often require a neutral wire that older properties may not have at the switch point.\n\n**Wiring condition** — If the existing wiring is damaged, corroded, or non-standard, additional work is needed.\n\n**Compatibility** — Some smart switches need a hub or specific app setup, which adds time."
    },
    {
      "heading": "What is usually included",
      "body": "- Removal of old switch\n- Fitting new switch\n- Basic circuit testing"
    },
    {
      "heading": "What is often not included",
      "body": "- Smart home hub configuration\n- Running a neutral wire\n- Replacing the back box\n- Wall repair or repainting"
    },
    {
      "heading": "Common hidden extras",
      "body": "- Faulty wiring discovered during replacement\n- Back box too small for new switch\n- No neutral wire for smart switch (requires rewiring)"
    },
    {
      "heading": "Questions to answer before requesting quotes",
      "body": "- What type of switch do you want (standard, dimmer, smart)?\n- Is the current switch working or faulty?\n- How many switches need replacing?\n- Do you know if there's a neutral wire at the switch?"
    }
  ],
  "faqs": [
    { "question": "Can I upgrade to a smart switch easily?", "answer": "It depends on your wiring. Many older properties lack a neutral wire at the switch, which some smart switches require. Your electrician can check." },
    { "question": "Is it worth batching switch replacements?", "answer": "Yes. The call-out cost is fixed, so doing several switches in one visit is much more cost-effective." }
  ],
  "related_guides": ["install-ceiling-lights", "install-sockets", "fix-faulty-outlet"],
  "tips": [
    "Check if your dimmer is compatible with LED bulbs",
    "Batch multiple switches to save on call-out costs"
  ],
  "cta": {
    "label": "Post a Job",
    "note": "Use the calculator for a ballpark, then post your job to get real quotes."
  }
}
```

---

### 4. fix-faulty-outlet

**Pricing rule:**
```json
{
  "category": "Electrical",
  "subcategory": "Sockets & Switches",
  "micro_slug": "fix-faulty-outlet",
  "micro_name": "Fix Faulty Outlet",
  "base_labour_unit": "unit",
  "base_labour_min": 50,
  "base_labour_max": 140,
  "base_material_min": 5,
  "base_material_max": 40,
  "location_modifier": 1,
  "difficulty_modifier": 1,
  "urgency_modifier": 1,
  "adjustment_factors": {
    "fields": [
      { "key": "quantity", "label": "Number of outlets", "type": "number", "min": 1, "max": 10, "default": 1 },
      {
        "key": "fault_type",
        "label": "Type of fault",
        "type": "select",
        "options": [
          { "label": "Simple fix (loose / dead)", "value": "simple", "modifier": 1 },
          { "label": "Needs replacement", "value": "replacement", "modifier": 1.4 },
          { "label": "Fault tracing required", "value": "tracing", "modifier": 1.8 }
        ]
      }
    ]
  }
}
```

**Guide content:**
```json
{
  "summary": "A faulty outlet might be a loose connection, a dead socket, or a sign of a bigger wiring issue. Costs depend on whether the fix is straightforward or requires fault tracing.\n\nThis guide covers Ibiza ballpark pricing. Diagnostic time is the biggest variable.",
  "at_a_glance": {
    "average_cost": "€60 – €180",
    "typical_duration": "30 min – 2 hours",
    "confidence_level": "medium",
    "usually_includes": ["Diagnosis", "Basic repair or replacement"],
    "may_not_include": ["Extensive fault tracing", "Circuit repairs", "Consumer unit work"]
  },
  "price_table": [
    { "description": "Simple fix (loose connection)", "low": 60, "high": 100, "note": "Quick repair" },
    { "description": "Socket replacement", "low": 100, "high": 150, "note": "New unit fitted" },
    { "description": "Fault tracing required", "low": 120, "high": 180, "note": "Diagnostic time adds cost" }
  ],
  "sections": [
    {
      "heading": "What affects the cost",
      "body": "**Nature of the fault** — A loose wire is a 15-minute fix. Tracing a fault through a circuit can take much longer.\n\n**Wiring age and condition** — Older properties with non-standard wiring take more diagnostic time.\n\n**Extent of the problem** — A single dead socket may indicate a larger circuit issue that needs investigation."
    },
    {
      "heading": "What is usually included",
      "body": "- Initial diagnosis\n- Basic repair or socket replacement\n- Circuit testing after fix"
    },
    {
      "heading": "What is often not included",
      "body": "- Full circuit rewiring\n- Consumer unit upgrades\n- Repairs to other affected outlets\n- Wall repair if access was needed"
    },
    {
      "heading": "Common hidden extras",
      "body": "- Fault turns out to be a broader circuit problem\n- Old wiring that doesn't meet current standards\n- Multiple outlets affected by the same issue"
    },
    {
      "heading": "Questions to answer before requesting quotes",
      "body": "- What is happening (no power, sparking, loose, intermittent)?\n- When did the problem start?\n- Is it one outlet or multiple?\n- Have you checked the consumer unit / trip switch?\n- How old is the property's wiring?"
    }
  ],
  "faqs": [
    { "question": "Why is fault tracing more expensive?", "answer": "The electrician needs to systematically test the circuit to find the source. This diagnostic time is the main cost driver." },
    { "question": "Should I worry about one dead socket?", "answer": "Not always, but it can indicate a tripped circuit or damaged wire. Best to get it checked sooner rather than later." }
  ],
  "related_guides": ["install-sockets", "replace-switch"],
  "tips": [
    "Check your trip switches before calling an electrician",
    "Note exactly which outlets are affected to save diagnostic time",
    "Mention any recent work done on the property"
  ],
  "cta": {
    "label": "Post a Job",
    "note": "Describe the fault clearly and post your job to get quotes from qualified electricians."
  }
}
```

---

### 5. outdoor-sockets-power-supplies

**Pricing rule:**
```json
{
  "category": "Electrical",
  "subcategory": "Outdoor Electrical",
  "micro_slug": "outdoor-sockets-power-supplies",
  "micro_name": "Outdoor Sockets & Power Supplies",
  "base_labour_unit": "unit",
  "base_labour_min": 120,
  "base_labour_max": 350,
  "base_material_min": 30,
  "base_material_max": 150,
  "location_modifier": 1,
  "difficulty_modifier": 1,
  "urgency_modifier": 1,
  "adjustment_factors": {
    "fields": [
      { "key": "quantity", "label": "Number of outlets", "type": "number", "min": 1, "max": 10, "default": 1 },
      {
        "key": "install_type",
        "label": "Installation type",
        "type": "select",
        "options": [
          { "label": "Simple external socket", "value": "simple", "modifier": 1 },
          { "label": "Weatherproof install", "value": "weatherproof", "modifier": 1.4 },
          { "label": "Full outdoor supply run", "value": "full_supply", "modifier": 2.2 }
        ]
      },
      {
        "key": "distance",
        "label": "Distance from power source",
        "type": "select",
        "options": [
          { "label": "Under 5m", "value": "short", "modifier": 1 },
          { "label": "5 – 15m", "value": "medium", "modifier": 1.3 },
          { "label": "Over 15m", "value": "long", "modifier": 1.6 }
        ]
      },
      {
        "key": "trenching",
        "label": "Ground trenching needed?",
        "type": "boolean",
        "default": false,
        "modifier_true": 1.4,
        "modifier_false": 1
      }
    ]
  }
}
```

**Guide content:**
```json
{
  "summary": "Outdoor sockets and power supplies are essential for garden lighting, pool equipment, workshops, and general outdoor use. Costs vary significantly based on distance from the main supply and weatherproofing requirements.\n\nThis guide covers Ibiza ballpark pricing. Outdoor electrical work often involves compliance requirements that affect the final cost.",
  "at_a_glance": {
    "average_cost": "€150 – €500+",
    "typical_duration": "2 – 6 hours",
    "confidence_level": "medium",
    "usually_includes": ["Weatherproof socket", "Connection to supply", "Basic cable run"],
    "may_not_include": ["Trenching", "Long cable runs", "RCD upgrades", "Permit compliance"]
  },
  "price_table": [
    { "description": "Simple external socket (close to supply)", "low": 150, "high": 250, "note": "Short cable run" },
    { "description": "Weatherproof install", "low": 200, "high": 350, "note": "IP-rated enclosure" },
    { "description": "Full outdoor supply run", "low": 300, "high": 500, "note": "Long distance, trenching possible" }
  ],
  "sections": [
    {
      "heading": "What affects the cost",
      "body": "**Distance from power source** — The further the outdoor socket from the consumer unit or nearest supply point, the more cable and labour required.\n\n**Weatherproofing** — Outdoor installations need IP-rated enclosures and waterproof cable routing. This adds material cost.\n\n**Ground work** — If cable needs to run underground, trenching and armoured cable are required.\n\n**Safety compliance** — Outdoor circuits typically need RCD protection. Older properties may require a consumer unit upgrade.\n\n**Ibiza-specific: sun and salt exposure** — Outdoor fittings in coastal Ibiza properties degrade faster. Higher-rated enclosures (IP65+) are recommended."
    },
    {
      "heading": "What is usually included",
      "body": "- Weatherproof socket and back box\n- Cable from nearest supply point\n- RCD protection (if circuit has capacity)\n- Testing and certification"
    },
    {
      "heading": "What is often not included",
      "body": "- Trenching or ground work\n- Armoured cable for long runs\n- Consumer unit upgrades\n- Landscaping repair after trenching\n- Permits or inspections"
    },
    {
      "heading": "Common hidden extras",
      "body": "- Trenching through hard ground or paving\n- Waterproof junction boxes for split runs\n- RCD consumer unit upgrade\n- Reinstating surfaces after cable routing\n- Higher-spec materials for coastal salt exposure"
    },
    {
      "heading": "Questions to answer before requesting quotes",
      "body": "- Where is power coming from (nearest indoor socket, consumer unit)?\n- How far is the install point from the supply?\n- What will the outdoor socket power (lights, tools, pool pump)?\n- Is the area exposed to rain, sun, or salt spray?\n- Is underground routing needed?"
    }
  ],
  "faqs": [
    { "question": "Do I need a special socket for outdoors?", "answer": "Yes. Outdoor sockets must be IP-rated (weatherproof). IP44 is minimum; IP65 or higher is recommended for exposed Ibiza locations." },
    { "question": "Can I extend an indoor circuit outside?", "answer": "Sometimes, if the circuit has spare capacity and RCD protection. The electrician will assess." },
    { "question": "Is trenching always needed?", "answer": "Only for longer runs or where cable can't be surface-routed. Surface-mounted armoured cable is an alternative in some situations." }
  ],
  "related_guides": ["install-ceiling-lights", "install-sockets"],
  "tips": [
    "Specify what you'll plug in — it affects the circuit size needed",
    "Choose IP65+ rated sockets for exposed positions in Ibiza",
    "Plan cable routes before the electrician arrives to save time"
  ],
  "extensions": [
    {
      "type": "compliance_permits",
      "heading": "Safety and compliance",
      "body": "Outdoor electrical work in Spain typically requires circuits to have RCD protection (differential switch). If your consumer unit doesn't have one on the relevant circuit, this will be added as part of the job. For larger outdoor supply runs, a boletín (electrical certificate) may be required."
    }
  ],
  "cta": {
    "label": "Post a Job",
    "note": "Describe your outdoor power needs and post your job to get quotes from qualified electricians."
  }
}
```

---

## Implementation steps

1. **Migration**: Add `guide_content jsonb DEFAULT NULL` column to `pricing_rules`
2. **Insert 5 pricing rules**: One row per service with the pricing rule data above
3. **Update each row**: Set `guide_content` with the guide JSON above
4. **Update `calculateEstimate.ts`**: The engine already supports `quantity` as a multiplier via the existing `inputs.quantity` fallback — the electrical family works out of the box with no engine changes needed
5. **Build `CostGuideDetailPage`** + sub-components (already planned and approved previously) to render the guide content
6. **Update `CostGuidesPage`** to link to guide detail pages for rules with guide content

Steps 1–3 are data work. Steps 4–6 are the already-approved component build.

