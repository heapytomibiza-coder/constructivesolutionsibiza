
# JobDetailsModal "Construction Spec Sheet" Upgrade

## Summary

Transform the Job Details Modal from a basic content display into a professional construction spec sheet that matches the upgraded job cards. This adds visual consistency, improves builder trust, and increases messaging conversion.

---

## Current State

| Feature | Status |
|---------|--------|
| Status badge with semantic colors | Missing (uses default variant) |
| ASAP badge | Missing |
| Spec quality badge | Missing |
| "Your job" owner indicator | Missing |
| Accent rail on Area card | Missing |
| Services as bulleted list | Using basic list-disc |
| Scope section with visual container | Missing |
| Sticky action bar | Missing |
| FormattedAnswers styling | Basic cards |

---

## Implementation Plan

### 1. Add Helper Functions

Add three helper functions to match the job card pattern:

```tsx
// Format status text (snake_case → Title Case)
function prettyStatus(s: string | null | undefined): string

// Map status to badge variant
function statusVariant(status?: string | null): BadgeVariant

// Compute spec quality score from JobPack
function getSpecBadge(jobPack: JobPack): { label: string; variant: "success" | "secondary" | "outline" }
```

### 2. Upgrade Header Section

Add missing badges in the correct order:
1. Category (secondary)
2. Subcategory (outline)
3. Status (semantic variant + formatted text)
4. "Your job" for owner (outline)
5. ASAP (accent, when timing includes "asap")
6. Spec quality (success/secondary/outline)
7. JobFlagBadges
8. Photos (outline)

Improve title typography:
- Larger font size (`text-xl`)
- Better leading (`leading-snug`)

### 3. Enhance Summary Strip

Add accent rail to the Area card for visual consistency with job cards:
- Absolute positioned 1px rail on left edge
- `bg-accent/40` for subtle presence

### 4. Improve Services List

Replace `list-disc pl-5` with styled bullets matching job cards:
```tsx
<li className="flex items-start gap-2">
  <span className="mt-1 text-primary/60">•</span>
  <span>{s.title}</span>
</li>
```

### 5. Wrap Scope Section in Visual Container

Add a bordered container around FormattedAnswers:
```tsx
<div className="rounded-lg border border-border/70 bg-card">
  <div className="p-4">
    <FormattedAnswers services={jobPack.services} />
  </div>
</div>
```

### 6. Create Sticky Action Bar

Move actions to a sticky footer that stays visible during scroll:
```tsx
<div className="sticky bottom-0 -mx-6 mt-2 border-t border-border/70 bg-background/90 px-6 py-4 backdrop-blur">
  {/* Action buttons */}
</div>
```

### 7. Polish FormattedAnswers Component

Update the component to read like a contractor checklist:
- Remove Card wrapper in favor of lighter styling
- Use consistent bullet points for question/answer pairs
- Improve visual hierarchy between service titles and answers

### 8. Use Muted Separators

Change separators from default to muted:
```tsx
<Separator className="bg-border/60" />
```

---

## Files to Modify

| File | Change |
|------|--------|
| `src/pages/jobs/JobDetailsModal.tsx` | All modal body upgrades |
| `src/pages/jobs/components/FormattedAnswers.tsx` | Styling improvements |

---

## Technical Details

### Helper Functions (add before `JobDetailsBody`)

```tsx
function prettyStatus(s: string | null | undefined): string {
  if (!s) return "";
  return s.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

function statusVariant(
  status?: string | null
): "default" | "warning" | "success" | "secondary" | "outline" {
  switch (status) {
    case "open":
      return "default";
    case "in_progress":
      return "warning";
    case "completed":
      return "success";
    case "draft":
      return "secondary";
    default:
      return "outline";
  }
}

function getSpecBadge(jobPack: JobPack): {
  label: string;
  variant: "success" | "secondary" | "outline";
} {
  const score =
    (jobPack.services?.length ?? 0) +
    (jobPack.hasPhotos ? 2 : 0) +
    (jobPack.budget?.display && jobPack.budget.display !== "To be discussed" ? 1 : 0);

  if (score >= 4) return { label: "Good spec", variant: "success" };
  if (score >= 2) return { label: "Basic spec", variant: "secondary" };
  return { label: "Needs detail", variant: "outline" };
}
```

### Updated Header Badge Row

```tsx
<div className="flex flex-wrap items-center gap-2">
  {jobPack.category && <Badge variant="secondary">{jobPack.category}</Badge>}
  {jobPack.subcategory && <Badge variant="outline">{jobPack.subcategory}</Badge>}

  {jobPack.status && (
    <Badge variant={statusVariant(jobPack.status)}>
      {prettyStatus(jobPack.status)}
    </Badge>
  )}

  {jobPack.isOwner && <Badge variant="outline">Your job</Badge>}

  {isAsap && <Badge variant="accent">ASAP</Badge>}

  <Badge variant={specBadge.variant}>{specBadge.label}</Badge>

  <JobFlagBadges
    flags={jobPack.flags}
    inspectionBias={jobPack.inspectionBias}
    safety={jobPack.safety}
  />

  {jobPack.hasPhotos && (
    <Badge variant="outline" className="gap-1">
      <Camera className="h-3 w-3" /> Photos
    </Badge>
  )}
</div>
```

### Area Card with Accent Rail

```tsx
<Card className="relative overflow-hidden">
  <span
    aria-hidden="true"
    className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-accent/40"
  />
  <CardContent className="p-4 pl-6">
    <div className="text-xs text-muted-foreground">Area</div>
    <div className="text-sm font-semibold">{jobPack.location.display}</div>
    {jobPack.location.town && (
      <div className="text-xs text-muted-foreground">{jobPack.location.town}</div>
    )}
  </CardContent>
</Card>
```

### Sticky Action Bar

```tsx
<div className="sticky bottom-0 -mx-6 mt-2 border-t border-border/70 bg-background/90 px-6 py-4 backdrop-blur">
  <div className="flex flex-wrap gap-2">
    {!user ? (
      <Button onClick={handleMessage} className="gap-2">
        <LogIn className="h-4 w-4" />
        Sign in to message
      </Button>
    ) : jobPack.isOwner ? null : (
      <Button
        onClick={handleMessage}
        disabled={isMessaging || sessionLoading}
        className="gap-2"
      >
        {isMessaging ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <MessageSquare className="h-4 w-4" />
        )}
        {isMessaging ? "Starting chat..." : "Message"}
      </Button>
    )}

    <Button variant="outline" disabled className="gap-2">
      <Share2 className="h-4 w-4" />
      Share
    </Button>
  </div>
</div>
```

### FormattedAnswers Update

```tsx
export function FormattedAnswers({ services }: FormattedAnswersProps) {
  if (!services.length) {
    return (
      <div className="text-sm text-muted-foreground">
        No specific answers provided.
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {services.map((service) => (
        <div key={service.slug} className="space-y-3">
          <div className="text-sm font-semibold text-foreground">
            {service.title}
            {service.isFallback && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                (loading labels…)
              </span>
            )}
          </div>
          <ul className="grid gap-2">
            {service.answers.map((answer) => (
              <li key={answer.questionId} className="flex items-start gap-3 text-sm">
                <span className="mt-0.5 text-primary/60">•</span>
                <div className="flex-1">
                  <span className="text-muted-foreground">{answer.questionLabel}:</span>{" "}
                  <span className="font-medium">{answer.displayValue}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
```

---

## Expected Outcome

After implementation:
- Modal header matches job card badge language (ASAP, Spec quality, semantic status)
- Summary strip has visual emphasis on Area card
- Services and Scope sections read like a contractor brief
- Action bar is always visible during scroll (improves conversion)
- Consistent styling with job cards

---

## Verification Checklist

1. Status badge shows semantic colors (open=default, in_progress=warning, etc.)
2. ASAP badge appears with accent color for urgent jobs
3. Spec quality badge matches job card logic
4. "Your job" badge appears for job owners
5. Area card has accent rail
6. Services list uses styled bullets
7. Scope section has bordered container
8. Action bar stays visible when scrolling
9. Separators use muted color
10. FormattedAnswers shows inline question: answer format
