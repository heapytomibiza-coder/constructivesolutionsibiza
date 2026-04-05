

# Rules Engine Trigger + Backfill

## What This Does

Activates the three unused columns on jobs (`flags`, `computed_inspection_bias`, `computed_safety`) by creating a database trigger that evaluates question pack rules whenever a job is inserted or its answers change. Then backfills all existing jobs. No frontend or user flow changes.

---

## Flag Vocabulary Audit (51 unique flags across 21 packs)

All flags follow `UPPER_SNAKE_CASE` and fall into clear categories:

| Category | Flags | Notes |
|----------|-------|-------|
| **Emergency** | `EMERGENCY`, `ISOLATE`, `ISOLATE_SUPPLY_NOW`, `OUTDOOR_EMERGENCY`, `ACTIVE_WATER_FLOW` | All paired with `safety: red` ✓ |
| **Inspection** | `INSPECTION_MANDATORY`, `INSPECTION_RECOMMENDED`, `QUOTE_SUBJECT_TO_INSPECTION`, `SITE_VISIT_MANDATORY` | Consistent with frontend badge logic ✓ |
| **Multi-trade** | `MULTI_TRADE`, `ELECTRICIAN_NEEDED` | Clean ✓ |
| **Scope signals** | `NEW_CIRCUIT_LIKELY`, `NEW_CIRCUIT_REQUIRED`, `NEW_PIPEWORK_NEEDED`, `NEW_WASTE_RUN`, `NEW_CABLING_REQUIRED`, `NEW_OUTDOOR_CIRCUIT` | Two near-duplicates: `LIKELY` vs `REQUIRED` — both are intentional (certainty levels) ✓ |
| **Safety/health** | `SCALD_RISK`, `HEALTH_ADVISORY`, `LEAD_PIPE_DETECTED`, `IP_RATING_REQUIRED`, `IP_RATING_CRITICAL`, `RCD_MANDATORY`, `RCD_PROTECTION_REQUIRED` | Clean ✓ |
| **Compliance** | `HMO_COMPLIANCE`, `LOCAL_REGS_CHECK`, `PLANS_REQUIRED`, `CHECK_DNO` | Clean ✓ |
| **Complexity** | `LARGE_BOARD_COMPLEXITY`, `PHASED_WORK_REQUIRED`, `OUT_OF_HOURS_REQUIRED`, `PLANNED_SHUTDOWN` | Clean ✓ |
| **Assessment** | `CAPACITY_ASSESSMENT`, `LOAD_ASSESSMENT_REQUIRED`, `LOAD_COMPATIBILITY_CHECK`, `EARTHING_CHECK_REQUIRED`, `EARTHING_BONDING_UPGRADE_LIKELY`, `NEUTRAL_WIRE_CHECK`, `WALL_STRENGTH_CHECK` | Clean ✓ |
| **Pre-existing** | `PRE_EXISTING_ISSUES`, `REMEDIALS_LIKELY`, `REMEDIAL_SCOPE_DEPENDENCY`, `CONCEALED_LEAK`, `POSSIBLE_SUPPLY_ISSUE`, `URGENT_DIAGNOSIS` | Clean ✓ |

**Severity values in use:** `inspection_bias`: high, medium, mandatory. `safety`: red, amber. No inconsistencies found — all emergency rules correctly pair `safety: red`, all concealed/complex rules correctly use `inspection_bias: high` or `mandatory`.

**Verdict:** Flag vocabulary is clean and consistent. No normalization needed before rollout.

---

## Live Data Findings

- **Answer format:** All 59 jobs store answers as plain strings (e.g., `"yes_active"`). No `{ value: x }` wrapper objects found in production data. The trigger will include normalization logic for safety but it won't fire on current data.
- **microAnswers structure:** Contains `_pack_slug`, `_pack_source`, `_pack_missing` as top-level non-object keys — trigger must skip these.
- **Backfill impact:** 7 jobs have micros matching rule packs and will receive flags/bias/safety values. The remaining ~52 jobs will stay NULL (correct — no false signals).
- **Operators in use:** 100% `eq`, with 3 uses of `in`. Zero `contains` in production.

---

## Implementation

### Migration 1: Rules evaluation trigger

**Create function** `evaluate_pack_rules_on_job()` — a `BEFORE INSERT OR UPDATE` trigger function:

```sql
CREATE OR REPLACE FUNCTION public.evaluate_pack_rules_on_job()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_micro_key text;
  v_micro_answers jsonb;
  v_rules jsonb;
  v_rule jsonb;
  v_answer_raw jsonb;
  v_answer_val text;
  v_when_op text;
  v_when_val jsonb;
  v_match boolean;
  v_flags text[] := '{}';
  v_inspection_bias text;
  v_safety text;
  -- Priority maps
  v_insp_priority int := 0;
  v_safe_priority int := 0;
  v_cur_insp int;
  v_cur_safe int;
BEGIN
  -- Only evaluate when answers change
  IF TG_OP = 'UPDATE' AND NEW.answers IS NOT DISTINCT FROM OLD.answers THEN
    RETURN NEW;
  END IF;

  -- Skip if no microAnswers
  IF NEW.answers IS NULL OR NEW.answers->'microAnswers' IS NULL THEN
    RETURN NEW;
  END IF;

  -- Iterate each micro in answers
  FOR v_micro_key IN SELECT jsonb_object_keys(NEW.answers->'microAnswers')
  LOOP
    -- Skip metadata keys (not micro slugs)
    IF v_micro_key LIKE '\_%' THEN CONTINUE; END IF;
    
    v_micro_answers := NEW.answers->'microAnswers'->v_micro_key;
    IF jsonb_typeof(v_micro_answers) != 'object' THEN CONTINUE; END IF;

    -- Fetch rules for this micro
    SELECT qp.metadata->'rules' INTO v_rules
    FROM question_packs qp
    WHERE qp.micro_slug = v_micro_key
      AND qp.metadata->'rules' IS NOT NULL
      AND jsonb_array_length(qp.metadata->'rules') > 0
    LIMIT 1;

    IF v_rules IS NULL THEN CONTINUE; END IF;

    -- Evaluate each rule
    FOR v_rule IN SELECT jsonb_array_elements(v_rules)
    LOOP
      v_when_op := v_rule->'when'->>'op';
      v_answer_raw := v_micro_answers->(v_rule->'when'->>'questionId');

      IF v_answer_raw IS NULL THEN CONTINUE; END IF;

      -- Normalize: handle { "value": "x" } wrapper
      IF jsonb_typeof(v_answer_raw) = 'object' AND v_answer_raw ? 'value' THEN
        v_answer_raw := v_answer_raw->'value';
      END IF;

      v_match := false;

      CASE v_when_op
        WHEN 'eq' THEN
          -- Compare as text
          v_match := v_answer_raw #>> '{}' = v_rule->'when'->'value' #>> '{}';

        WHEN 'in' THEN
          -- rule value is array, check if answer is in it
          IF jsonb_typeof(v_answer_raw) = 'array' THEN
            -- Multi-select: any answer in rule values
            v_match := EXISTS (
              SELECT 1 FROM jsonb_array_elements(v_answer_raw) a, 
                            jsonb_array_elements(v_rule->'when'->'value') r
              WHERE a = r
            );
          ELSE
            -- Single value: check membership
            v_match := v_answer_raw IN (
              SELECT jsonb_array_elements(v_rule->'when'->'value')
            );
          END IF;

        WHEN 'contains' THEN
          -- Array answer contains rule value(s)
          IF jsonb_typeof(v_answer_raw) = 'array' THEN
            IF jsonb_typeof(v_rule->'when'->'value') = 'array' THEN
              v_match := EXISTS (
                SELECT 1 FROM jsonb_array_elements(v_answer_raw) a, 
                              jsonb_array_elements(v_rule->'when'->'value') r
                WHERE a = r
              );
            ELSE
              v_match := v_answer_raw @> jsonb_build_array(v_rule->'when'->'value');
            END IF;
          END IF;

        ELSE
          CONTINUE;
      END CASE;

      IF v_match THEN
        -- Accumulate flags
        IF v_rule->'add_flags' IS NOT NULL THEN
          SELECT array_agg(DISTINCT f) INTO v_flags
          FROM (
            SELECT unnest(v_flags) AS f
            UNION
            SELECT jsonb_array_elements_text(v_rule->'add_flags')
          ) sub;
          v_flags := COALESCE(v_flags, '{}');
        END IF;

        -- Track highest inspection_bias
        IF v_rule->'set'->>'inspection_bias' IS NOT NULL THEN
          v_cur_insp := CASE v_rule->'set'->>'inspection_bias'
            WHEN 'mandatory' THEN 4
            WHEN 'high' THEN 3
            WHEN 'medium' THEN 2
            WHEN 'low' THEN 1
            ELSE 0
          END;
          IF v_cur_insp > v_insp_priority THEN
            v_insp_priority := v_cur_insp;
            v_inspection_bias := v_rule->'set'->>'inspection_bias';
          END IF;
        END IF;

        -- Track highest safety
        IF v_rule->'set'->>'safety' IS NOT NULL THEN
          v_cur_safe := CASE v_rule->'set'->>'safety'
            WHEN 'red' THEN 3
            WHEN 'amber' THEN 2
            WHEN 'green' THEN 1
            ELSE 0
          END;
          IF v_cur_safe > v_safe_priority THEN
            v_safe_priority := v_cur_safe;
            v_safety := v_rule->'set'->>'safety';
          END IF;
        END IF;
      END IF;
    END LOOP;
  END LOOP;

  -- Write results (NULL if no rules matched — no false signals)
  NEW.flags := NULLIF(v_flags, '{}');
  NEW.computed_inspection_bias := v_inspection_bias;
  NEW.computed_safety := v_safety;

  RETURN NEW;
END;
$$;
```

**Create trigger** (alphabetically after `trg_calculate_job_score`, before `trg_enqueue_*`):

```sql
CREATE TRIGGER trg_evaluate_pack_rules
  BEFORE INSERT OR UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.evaluate_pack_rules_on_job();
```

**Backfill** existing jobs (fires the trigger via no-op update):

```sql
UPDATE public.jobs SET answers = answers WHERE answers IS NOT NULL;
```

---

## What Changes

| Layer | Change |
|-------|--------|
| Database | New trigger function + trigger on `jobs` |
| Frontend | None — `JobFlagBadges` already reads these columns and will start rendering |
| User flow | None — trigger fires transparently on insert/update |
| Matching | None — flags are interpretation signals only, no filtering yet |

## What Does NOT Change

- `job_score` trigger and logic — untouched
- Matching/ranking queries — untouched
- Wizard flow — untouched
- Any frontend code — untouched

## Risk Assessment

- **Trigger performance:** Each rule evaluation does 1 query to `question_packs` per micro key. Most jobs have 1-3 micros. Most packs have 0-5 rules. Negligible latency.
- **Backfill safety:** The `UPDATE ... SET answers = answers` fires all BEFORE triggers (including `trg_calculate_job_score`). Both are idempotent — safe.
- **NULL semantics:** Jobs with no matching rules keep all three columns NULL. Frontend `JobFlagBadges` already handles this correctly (returns null when no badges).

