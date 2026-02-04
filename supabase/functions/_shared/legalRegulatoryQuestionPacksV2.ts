/**
 * Legal & Regulatory Question Packs V2
 * 12 micro-services covering permits, inspections, compliance, and regulatory support
 * Context: Ibiza/Spain regulatory environment
 */

export const legalRegulatoryQuestionPacksV2 = [
  // ─────────────────────────────────────────────────────────────────────────
  // PERMITS & APPLICATIONS
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "permit-application",
    title: "Permit Application",
    metadata: { category_contract: "legal-regulatory", inspection_bias: "low" },
    questions: [
      {
        id: "permit_application_01_type",
        label: "Permit type",
        type: "radio",
        required: true,
        options: [
          { value: "building_permit", label: "Building permit (Licencia de obra)" },
          { value: "minor_works", label: "Minor works permit (Obra menor)" },
          { value: "activity_license", label: "Activity license" },
          { value: "not_sure", label: "Not sure which I need" },
        ],
      },
      {
        id: "permit_application_02_project",
        label: "Project type",
        type: "radio",
        required: true,
        options: [
          { value: "new_build", label: "New construction" },
          { value: "renovation", label: "Renovation" },
          { value: "extension", label: "Extension" },
          { value: "change_of_use", label: "Change of use" },
        ],
      },
      {
        id: "permit_application_03_scope",
        label: "Services needed",
        type: "checkbox",
        required: true,
        options: [
          { value: "documentation", label: "Documentation preparation" },
          { value: "submission", label: "Application submission" },
          { value: "follow_up", label: "Follow-up with authorities" },
          { value: "full_service", label: "Full permit management" },
        ],
      },
      {
        id: "permit_application_04_location",
        label: "Municipality",
        type: "radio",
        required: true,
        options: [
          { value: "ibiza_town", label: "Ibiza Town" },
          { value: "sant_antoni", label: "Sant Antoni" },
          { value: "santa_eularia", label: "Santa Eulària" },
          { value: "sant_joan", label: "Sant Joan" },
          { value: "sant_josep", label: "Sant Josep" },
        ],
      },
      {
        id: "permit_application_05_urgency",
        label: "Urgency",
        type: "radio",
        required: true,
        options: [
          { value: "urgent", label: "Urgent (construction waiting)" },
          { value: "standard", label: "Standard timeline" },
          { value: "planning", label: "Early planning stage" },
        ],
      },
      {
        id: "permit_application_06_files",
        label: "Upload project documents",
        type: "file",
        required: false,
        accept: ["image/*", "application/pdf"],
      },
    ],
  },

  {
    microSlug: "planning-submission",
    title: "Planning Submission",
    metadata: { category_contract: "legal-regulatory", inspection_bias: "low" },
    questions: [
      {
        id: "planning_submission_01_type",
        label: "Application type",
        type: "radio",
        required: true,
        options: [
          { value: "full_planning", label: "Full planning application" },
          { value: "outline", label: "Outline planning" },
          { value: "variation", label: "Variation / amendment" },
          { value: "retrospective", label: "Retrospective application" },
        ],
      },
      {
        id: "planning_submission_02_project",
        label: "Project",
        type: "radio",
        required: true,
        options: [
          { value: "new_build", label: "New build" },
          { value: "extension", label: "Extension" },
          { value: "renovation", label: "Major renovation" },
          { value: "change_of_use", label: "Change of use" },
        ],
      },
      {
        id: "planning_submission_03_scope",
        label: "Support needed",
        type: "checkbox",
        required: true,
        options: [
          { value: "drawings", label: "Planning drawings" },
          { value: "statement", label: "Planning statement" },
          { value: "submission", label: "Submission to council" },
          { value: "negotiation", label: "Negotiation with planners" },
        ],
      },
      {
        id: "planning_submission_04_status",
        label: "Current status",
        type: "radio",
        required: true,
        options: [
          { value: "not_started", label: "Not yet started" },
          { value: "in_progress", label: "Drawings in progress" },
          { value: "ready_to_submit", label: "Ready to submit" },
          { value: "rejected", label: "Previously rejected" },
        ],
      },
      {
        id: "planning_submission_05_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "asap", label: "ASAP" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "flexible", label: "Flexible" },
        ],
      },
    ],
  },

  {
    microSlug: "pre-application-advice",
    title: "Pre-Application Advice",
    metadata: { category_contract: "legal-regulatory", inspection_bias: "low" },
    questions: [
      {
        id: "pre_application_01_project",
        label: "Project type",
        type: "radio",
        required: true,
        options: [
          { value: "new_build", label: "New build" },
          { value: "extension", label: "Extension" },
          { value: "renovation", label: "Major renovation" },
          { value: "commercial", label: "Commercial development" },
        ],
      },
      {
        id: "pre_application_02_stage",
        label: "Project stage",
        type: "radio",
        required: true,
        options: [
          { value: "concept", label: "Concept / idea stage" },
          { value: "sketches", label: "Have initial sketches" },
          { value: "drawings", label: "Have architectural drawings" },
        ],
      },
      {
        id: "pre_application_03_concerns",
        label: "Areas of concern",
        type: "checkbox",
        required: true,
        options: [
          { value: "zoning", label: "Zoning compliance" },
          { value: "protected_area", label: "Protected area restrictions" },
          { value: "height_density", label: "Height / density limits" },
          { value: "access", label: "Access / parking" },
          { value: "neighbors", label: "Neighbor impact" },
        ],
      },
      {
        id: "pre_application_04_property",
        label: "Property status",
        type: "radio",
        required: true,
        options: [
          { value: "owned", label: "Already own the property" },
          { value: "purchasing", label: "In purchasing process" },
          { value: "searching", label: "Searching for property" },
        ],
      },
      {
        id: "pre_application_05_timeline",
        label: "When do you need advice",
        type: "radio",
        required: true,
        options: [
          { value: "asap", label: "ASAP" },
          { value: "within_2_weeks", label: "Within 2 weeks" },
          { value: "flexible", label: "Flexible" },
        ],
      },
    ],
  },

  {
    microSlug: "appeal-support",
    title: "Appeal Support",
    metadata: { category_contract: "legal-regulatory", inspection_bias: "low" },
    questions: [
      {
        id: "appeal_support_01_type",
        label: "Appeal type",
        type: "radio",
        required: true,
        options: [
          { value: "planning_refusal", label: "Planning refusal" },
          { value: "permit_denial", label: "Permit denial" },
          { value: "enforcement", label: "Enforcement notice" },
          { value: "conditions", label: "Planning conditions" },
        ],
      },
      {
        id: "appeal_support_02_status",
        label: "Current status",
        type: "radio",
        required: true,
        options: [
          { value: "just_received", label: "Just received refusal" },
          { value: "within_deadline", label: "Within appeal deadline" },
          { value: "deadline_approaching", label: "Deadline approaching" },
          { value: "missed_deadline", label: "Missed deadline" },
        ],
      },
      {
        id: "appeal_support_03_scope",
        label: "Support needed",
        type: "checkbox",
        required: true,
        options: [
          { value: "review", label: "Review of decision" },
          { value: "strategy", label: "Appeal strategy" },
          { value: "documentation", label: "Documentation preparation" },
          { value: "representation", label: "Representation" },
        ],
      },
      {
        id: "appeal_support_04_previous",
        label: "Previous attempts",
        type: "radio",
        required: true,
        options: [
          { value: "first_application", label: "First application" },
          { value: "resubmission", label: "Already resubmitted" },
          { value: "multiple_attempts", label: "Multiple attempts" },
        ],
      },
      {
        id: "appeal_support_05_timeline",
        label: "Urgency",
        type: "radio",
        required: true,
        options: [
          { value: "urgent", label: "Urgent (deadline soon)" },
          { value: "standard", label: "Standard" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // INSPECTIONS & SURVEYS
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "building-inspection",
    title: "Building Inspection",
    metadata: { category_contract: "legal-regulatory", inspection_bias: "medium" },
    questions: [
      {
        id: "building_inspection_01_type",
        label: "Inspection type",
        type: "radio",
        required: true,
        options: [
          { value: "general", label: "General condition survey" },
          { value: "structural", label: "Structural inspection" },
          { value: "compliance", label: "Building compliance check" },
          { value: "handover", label: "New build handover" },
        ],
      },
      {
        id: "building_inspection_02_property",
        label: "Property type",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "apartment", label: "Apartment" },
          { value: "commercial", label: "Commercial property" },
          { value: "finca", label: "Finca / rural" },
        ],
      },
      {
        id: "building_inspection_03_purpose",
        label: "Purpose",
        type: "radio",
        required: true,
        options: [
          { value: "purchase", label: "Pre-purchase survey" },
          { value: "renovation", label: "Pre-renovation assessment" },
          { value: "certification", label: "Certification required" },
          { value: "dispute", label: "Dispute / legal matter" },
        ],
      },
      {
        id: "building_inspection_04_age",
        label: "Property age",
        type: "radio",
        required: true,
        options: [
          { value: "new", label: "New build (< 5 years)" },
          { value: "modern", label: "Modern (5–20 years)" },
          { value: "older", label: "Older (20–50 years)" },
          { value: "historic", label: "Historic (50+ years)" },
        ],
      },
      {
        id: "building_inspection_05_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "urgent", label: "Urgent (purchase deadline)" },
          { value: "within_1_week", label: "Within 1 week" },
          { value: "within_1_month", label: "Within 1 month" },
        ],
      },
    ],
  },

  {
    microSlug: "safety-inspection",
    title: "Safety Inspection",
    metadata: { category_contract: "legal-regulatory", inspection_bias: "medium" },
    questions: [
      {
        id: "safety_inspection_01_type",
        label: "Inspection type",
        type: "checkbox",
        required: true,
        options: [
          { value: "electrical", label: "Electrical safety" },
          { value: "gas", label: "Gas safety" },
          { value: "fire", label: "Fire safety" },
          { value: "general", label: "General safety audit" },
        ],
      },
      {
        id: "safety_inspection_02_property",
        label: "Property type",
        type: "radio",
        required: true,
        options: [
          { value: "residential", label: "Residential" },
          { value: "rental", label: "Rental property" },
          { value: "commercial", label: "Commercial" },
          { value: "hospitality", label: "Hotel / hospitality" },
        ],
      },
      {
        id: "safety_inspection_03_purpose",
        label: "Purpose",
        type: "radio",
        required: true,
        options: [
          { value: "certification", label: "Certification required" },
          { value: "license", label: "License application" },
          { value: "insurance", label: "Insurance requirement" },
          { value: "routine", label: "Routine check" },
        ],
      },
      {
        id: "safety_inspection_04_last_check",
        label: "Last inspection",
        type: "radio",
        required: true,
        options: [
          { value: "never", label: "Never inspected" },
          { value: "over_5_years", label: "Over 5 years ago" },
          { value: "1_5_years", label: "1–5 years ago" },
          { value: "recent", label: "Within last year" },
        ],
      },
      {
        id: "safety_inspection_05_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "urgent", label: "Urgent" },
          { value: "within_1_week", label: "Within 1 week" },
          { value: "flexible", label: "Flexible" },
        ],
      },
    ],
  },

  {
    microSlug: "pre-purchase-survey",
    title: "Pre-Purchase Survey",
    metadata: { category_contract: "legal-regulatory", inspection_bias: "medium" },
    questions: [
      {
        id: "pre_purchase_survey_01_property",
        label: "Property type",
        type: "radio",
        required: true,
        options: [
          { value: "villa_house", label: "Villa / House" },
          { value: "apartment", label: "Apartment" },
          { value: "finca", label: "Finca / rural property" },
          { value: "commercial", label: "Commercial property" },
        ],
      },
      {
        id: "pre_purchase_survey_02_level",
        label: "Survey level",
        type: "radio",
        required: true,
        options: [
          { value: "condition", label: "Condition report" },
          { value: "homebuyer", label: "Homebuyer survey" },
          { value: "full_structural", label: "Full structural survey" },
        ],
      },
      {
        id: "pre_purchase_survey_03_concerns",
        label: "Specific concerns",
        type: "checkbox",
        required: false,
        options: [
          { value: "damp", label: "Damp / moisture" },
          { value: "structural", label: "Structural issues" },
          { value: "roof", label: "Roof condition" },
          { value: "pool", label: "Pool / outdoor areas" },
          { value: "legal", label: "Legal / planning status" },
        ],
      },
      {
        id: "pre_purchase_survey_04_status",
        label: "Purchase status",
        type: "radio",
        required: true,
        options: [
          { value: "viewing", label: "Viewing stage" },
          { value: "offer_made", label: "Offer made" },
          { value: "under_contract", label: "Under contract" },
        ],
      },
      {
        id: "pre_purchase_survey_05_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "urgent", label: "Urgent (deadline)" },
          { value: "within_1_week", label: "Within 1 week" },
          { value: "within_2_weeks", label: "Within 2 weeks" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // COMPLIANCE & REGULATIONS
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "building-regulations",
    title: "Building Regulations",
    metadata: { category_contract: "legal-regulatory", inspection_bias: "medium" },
    questions: [
      {
        id: "building_regulations_01_project",
        label: "Project type",
        type: "radio",
        required: true,
        options: [
          { value: "new_build", label: "New construction" },
          { value: "extension", label: "Extension" },
          { value: "renovation", label: "Renovation" },
          { value: "conversion", label: "Conversion" },
        ],
      },
      {
        id: "building_regulations_02_scope",
        label: "Support needed",
        type: "checkbox",
        required: true,
        options: [
          { value: "compliance_check", label: "Compliance check" },
          { value: "documentation", label: "Documentation preparation" },
          { value: "certification", label: "Certification" },
          { value: "sign_off", label: "Building control sign-off" },
        ],
      },
      {
        id: "building_regulations_03_stage",
        label: "Project stage",
        type: "radio",
        required: true,
        options: [
          { value: "planning", label: "Design / planning" },
          { value: "construction", label: "Under construction" },
          { value: "completion", label: "Near completion" },
          { value: "completed", label: "Completed (need sign-off)" },
        ],
      },
      {
        id: "building_regulations_04_areas",
        label: "Key areas",
        type: "checkbox",
        required: true,
        options: [
          { value: "structural", label: "Structural" },
          { value: "fire_safety", label: "Fire safety" },
          { value: "energy", label: "Energy efficiency" },
          { value: "accessibility", label: "Accessibility" },
          { value: "drainage", label: "Drainage" },
        ],
      },
      {
        id: "building_regulations_05_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "urgent", label: "Urgent (blocking project)" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "flexible", label: "Flexible" },
        ],
      },
    ],
  },

  {
    microSlug: "environmental-compliance",
    title: "Environmental Compliance",
    metadata: { category_contract: "legal-regulatory", inspection_bias: "medium" },
    questions: [
      {
        id: "environmental_compliance_01_project",
        label: "Project type",
        type: "radio",
        required: true,
        options: [
          { value: "new_build", label: "New construction" },
          { value: "renovation", label: "Major renovation" },
          { value: "commercial", label: "Commercial development" },
          { value: "pool", label: "Pool / water features" },
        ],
      },
      {
        id: "environmental_compliance_02_concern",
        label: "Main concerns",
        type: "checkbox",
        required: true,
        options: [
          { value: "protected_land", label: "Protected land status" },
          { value: "water", label: "Water / drainage" },
          { value: "waste", label: "Waste management" },
          { value: "trees", label: "Protected trees" },
          { value: "noise", label: "Noise / disturbance" },
        ],
      },
      {
        id: "environmental_compliance_03_assessment",
        label: "Assessment needed",
        type: "radio",
        required: true,
        options: [
          { value: "initial", label: "Initial assessment" },
          { value: "full_eia", label: "Full environmental impact" },
          { value: "specific", label: "Specific area review" },
        ],
      },
      {
        id: "environmental_compliance_04_status",
        label: "Project status",
        type: "radio",
        required: true,
        options: [
          { value: "pre_planning", label: "Pre-planning stage" },
          { value: "planning_required", label: "Required for planning" },
          { value: "condition", label: "Planning condition" },
        ],
      },
      {
        id: "environmental_compliance_05_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "urgent", label: "Urgent" },
          { value: "within_1_month", label: "Within 1 month" },
          { value: "flexible", label: "Flexible" },
        ],
      },
    ],
  },

  {
    microSlug: "health-safety",
    title: "Health & Safety",
    metadata: { category_contract: "legal-regulatory", inspection_bias: "medium" },
    questions: [
      {
        id: "health_safety_01_type",
        label: "Service type",
        type: "radio",
        required: true,
        options: [
          { value: "construction", label: "Construction site H&S" },
          { value: "business", label: "Business premises" },
          { value: "rental", label: "Rental property compliance" },
          { value: "event", label: "Event / temporary structure" },
        ],
      },
      {
        id: "health_safety_02_scope",
        label: "Services needed",
        type: "checkbox",
        required: true,
        options: [
          { value: "assessment", label: "Risk assessment" },
          { value: "plan", label: "H&S plan" },
          { value: "documentation", label: "Documentation" },
          { value: "training", label: "Staff training" },
          { value: "audit", label: "Compliance audit" },
        ],
      },
      {
        id: "health_safety_03_industry",
        label: "Industry",
        type: "radio",
        required: true,
        options: [
          { value: "construction", label: "Construction" },
          { value: "hospitality", label: "Hospitality" },
          { value: "retail", label: "Retail" },
          { value: "residential", label: "Residential rental" },
          { value: "other", label: "Other" },
        ],
      },
      {
        id: "health_safety_04_reason",
        label: "Reason",
        type: "radio",
        required: true,
        options: [
          { value: "new_business", label: "New business / project" },
          { value: "license", label: "License requirement" },
          { value: "update", label: "Update existing" },
          { value: "incident", label: "Following incident" },
        ],
      },
      {
        id: "health_safety_05_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "urgent", label: "Urgent" },
          { value: "within_2_weeks", label: "Within 2 weeks" },
          { value: "flexible", label: "Flexible" },
        ],
      },
    ],
  },

  // ─────────────────────────────────────────────────────────────────────────
  // DOCUMENTATION & LIAISON
  // ─────────────────────────────────────────────────────────────────────────
  {
    microSlug: "document-preparation",
    title: "Document Preparation",
    metadata: { category_contract: "legal-regulatory", inspection_bias: "low" },
    questions: [
      {
        id: "document_preparation_01_type",
        label: "Document type",
        type: "checkbox",
        required: true,
        options: [
          { value: "planning", label: "Planning documents" },
          { value: "permit", label: "Permit applications" },
          { value: "technical", label: "Technical reports" },
          { value: "compliance", label: "Compliance certificates" },
          { value: "contracts", label: "Construction contracts" },
        ],
      },
      {
        id: "document_preparation_02_purpose",
        label: "Purpose",
        type: "radio",
        required: true,
        options: [
          { value: "application", label: "Permit / planning application" },
          { value: "sale", label: "Property sale" },
          { value: "legal", label: "Legal requirement" },
          { value: "financing", label: "Bank / financing" },
        ],
      },
      {
        id: "document_preparation_03_language",
        label: "Language required",
        type: "radio",
        required: true,
        options: [
          { value: "spanish", label: "Spanish only" },
          { value: "english", label: "English only" },
          { value: "both", label: "Both languages" },
        ],
      },
      {
        id: "document_preparation_04_existing",
        label: "Existing documentation",
        type: "radio",
        required: true,
        options: [
          { value: "complete", label: "Have all source documents" },
          { value: "partial", label: "Have some documents" },
          { value: "none", label: "Need to gather everything" },
        ],
      },
      {
        id: "document_preparation_05_timeline",
        label: "Timeline",
        type: "radio",
        required: true,
        options: [
          { value: "urgent", label: "Urgent" },
          { value: "within_2_weeks", label: "Within 2 weeks" },
          { value: "flexible", label: "Flexible" },
        ],
      },
    ],
  },

  {
    microSlug: "council-liaison",
    title: "Council Liaison",
    metadata: { category_contract: "legal-regulatory", inspection_bias: "low" },
    questions: [
      {
        id: "council_liaison_01_purpose",
        label: "Purpose",
        type: "radio",
        required: true,
        options: [
          { value: "permit_query", label: "Permit / application query" },
          { value: "compliance", label: "Compliance matter" },
          { value: "enforcement", label: "Enforcement issue" },
          { value: "general", label: "General enquiry" },
        ],
      },
      {
        id: "council_liaison_02_municipality",
        label: "Municipality",
        type: "radio",
        required: true,
        options: [
          { value: "ibiza_town", label: "Ibiza Town (Eivissa)" },
          { value: "sant_antoni", label: "Sant Antoni" },
          { value: "santa_eularia", label: "Santa Eulària" },
          { value: "sant_joan", label: "Sant Joan" },
          { value: "sant_josep", label: "Sant Josep" },
        ],
      },
      {
        id: "council_liaison_03_scope",
        label: "Support needed",
        type: "checkbox",
        required: true,
        options: [
          { value: "communication", label: "Communication with council" },
          { value: "meetings", label: "Meeting attendance" },
          { value: "translation", label: "Translation services" },
          { value: "documentation", label: "Documentation" },
        ],
      },
      {
        id: "council_liaison_04_history",
        label: "Previous contact",
        type: "radio",
        required: true,
        options: [
          { value: "new_matter", label: "New matter" },
          { value: "ongoing", label: "Ongoing case" },
          { value: "stalled", label: "Stalled / no response" },
        ],
      },
      {
        id: "council_liaison_05_timeline",
        label: "Urgency",
        type: "radio",
        required: true,
        options: [
          { value: "urgent", label: "Urgent" },
          { value: "standard", label: "Standard" },
          { value: "flexible", label: "Flexible" },
        ],
      },
    ],
  },
];
