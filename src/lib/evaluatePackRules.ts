/**
 * Rules Engine Evaluator
 * 
 * Evaluates metadata.rules from question packs to compute:
 * - flags: Array of string flags (e.g., "EMERGENCY", "INSPECTION_MANDATORY")
 * - inspection_bias: "low" | "medium" | "high" | "mandatory"
 * - safety: "green" | "amber" | "red"
 */

export type PackRule = {
  id: string;
  when: { 
    questionId: string; 
    op: "eq" | "in" | "contains"; 
    value: unknown;
  };
  add_flags?: string[];
  set?: { 
    inspection_bias?: "low" | "medium" | "high" | "mandatory"; 
    safety?: "green" | "amber" | "red";
  };
};

export type RuleEvaluation = {
  flags: string[];
  inspection_bias?: string;
  safety?: string;
};

/**
 * Evaluate rules against a set of answers.
 * Rules are evaluated in order; later rules override earlier ones for set properties.
 * 
 * @param answers - The answers object (flat key-value pairs from a micro's answers)
 * @param rules - Array of rules from question pack metadata
 * @returns Computed flags and set properties
 */
export function evaluateRules(
  answers: Record<string, unknown>, 
  rules: PackRule[] | null | undefined
): RuleEvaluation {
  const flags = new Set<string>();
  let inspection_bias: string | undefined;
  let safety: string | undefined;

  if (!rules || !Array.isArray(rules)) {
    return { flags: [] };
  }

  for (const rule of rules) {
    if (!rule.when || !rule.when.questionId) continue;
    
    const value = answers[rule.when.questionId];
    let match = false;

    switch (rule.when.op) {
      case "eq":
        match = value === rule.when.value;
        break;
      case "in":
        if (Array.isArray(rule.when.value)) {
          match = rule.when.value.includes(value);
        }
        break;
      case "contains":
        // For array answers (multi-select), check if any value matches
        if (Array.isArray(value)) {
          if (Array.isArray(rule.when.value)) {
            match = rule.when.value.some(v => value.includes(v));
          } else {
            match = value.includes(rule.when.value);
          }
        }
        break;
    }

    if (match) {
      // Add flags
      if (rule.add_flags && Array.isArray(rule.add_flags)) {
        rule.add_flags.forEach(f => flags.add(f));
      }
      
      // Set properties (later rules override)
      if (rule.set?.inspection_bias) {
        inspection_bias = rule.set.inspection_bias;
      }
      if (rule.set?.safety) {
        safety = rule.set.safety;
      }
    }
  }

  return { 
    flags: Array.from(flags), 
    inspection_bias, 
    safety,
  };
}

/**
 * Merge multiple rule evaluations into one.
 * Useful when a job has multiple micro-services with their own rules.
 * 
 * Priority for set values: mandatory > high > medium > low, red > amber > green
 */
export function mergeRuleEvaluations(evaluations: RuleEvaluation[]): RuleEvaluation {
  const flags = new Set<string>();
  
  const inspectionPriority: Record<string, number> = {
    mandatory: 4,
    high: 3,
    medium: 2,
    low: 1,
  };
  
  const safetyPriority: Record<string, number> = {
    red: 3,
    amber: 2,
    green: 1,
  };
  
  let inspection_bias: string | undefined;
  let safety: string | undefined;
  let maxInspection = 0;
  let maxSafety = 0;
  
  for (const evaluation of evaluations) {
    // Merge flags
    evaluation.flags.forEach(f => flags.add(f));
    
    // Keep highest priority inspection bias
    if (evaluation.inspection_bias) {
      const priority = inspectionPriority[evaluation.inspection_bias] ?? 0;
      if (priority > maxInspection) {
        maxInspection = priority;
        inspection_bias = evaluation.inspection_bias;
      }
    }
    
    // Keep highest priority safety
    if (evaluation.safety) {
      const priority = safetyPriority[evaluation.safety] ?? 0;
      if (priority > maxSafety) {
        maxSafety = priority;
        safety = evaluation.safety;
      }
    }
  }
  
  return {
    flags: Array.from(flags),
    inspection_bias,
    safety,
  };
}

/**
 * Check if the evaluation indicates the job requires inspection.
 */
export function requiresInspection(evaluation: RuleEvaluation): boolean {
  return (
    evaluation.inspection_bias === "mandatory" ||
    evaluation.inspection_bias === "high" ||
    evaluation.flags.includes("INSPECTION_MANDATORY") ||
    evaluation.flags.includes("INSPECTION_REQUIRED")
  );
}

/**
 * Check if the evaluation indicates an emergency.
 */
export function isEmergency(evaluation: RuleEvaluation): boolean {
  return (
    evaluation.safety === "red" ||
    evaluation.flags.includes("EMERGENCY") ||
    evaluation.flags.includes("URGENT")
  );
}
