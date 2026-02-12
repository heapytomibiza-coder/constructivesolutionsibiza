/**
 * Format a job as a WhatsApp-ready message for group posting.
 */

interface WhatsAppJobInput {
  title: string;
  category?: string | null;
  subcategory?: string | null;
  area?: string | null;
  budget_type?: string | null;
  budget_value?: number | null;
  budget_min?: number | null;
  budget_max?: number | null;
  start_timing?: string | null;
  id: string;
}

function formatBudget(job: WhatsAppJobInput): string {
  if (job.budget_type === "fixed" && job.budget_value) {
    return `€${job.budget_value}`;
  }
  if (job.budget_type === "range" && job.budget_min && job.budget_max) {
    return `€${job.budget_min} – €${job.budget_max}`;
  }
  if (job.budget_type === "hourly" && job.budget_value) {
    return `€${job.budget_value}/hr`;
  }
  return "Quote required";
}

const TIMING_LABELS: Record<string, string> = {
  asap: "ASAP",
  this_week: "This week",
  next_week: "Next week",
  flexible: "Flexible",
  specific_date: "Specific date",
};

export function formatWhatsAppPost(job: WhatsAppJobInput, baseUrl: string): string {
  const trade = [job.category, job.subcategory].filter(Boolean).join(" › ");
  const timing = job.start_timing ? TIMING_LABELS[job.start_timing] ?? job.start_timing : "Flexible";
  const link = `${baseUrl}/jobs/${job.id}`;

  return [
    `🛠️ *NEW JOB (CS Ibiza)*`,
    `*Title:* ${job.title}`,
    trade && `*Trade:* ${trade}`,
    `*Area:* ${job.area || "TBC"}`,
    `*Budget:* ${formatBudget(job)}`,
    `*When:* ${timing}`,
    `*Link:* ${link}`,
    ``,
    `👉 To take it: message in-app via the link (preferred) or reply "TAKE + name".`,
  ]
    .filter(Boolean)
    .join("\n");
}

/**
 * Copy text to clipboard with toast feedback.
 * Returns true if successful.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback: create a textarea and select
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand("copy");
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}
