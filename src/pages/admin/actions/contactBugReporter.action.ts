/**
 * Create or open a conversation with a bug reporter
 */
import { supabase } from "@/integrations/supabase/client";

interface ContactResult {
  success: boolean;
  conversationId?: string;
  error?: string;
}

export async function contactBugReporter(reportId: string): Promise<ContactResult> {
  try {
    const { data, error } = await supabase.rpc("rpc_create_bug_report_conversation", {
      p_report_id: reportId,
    });

    if (error) throw error;

    return { success: true, conversationId: data as string };
  } catch (err) {
    console.error("[contactBugReporter] Failed:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "Failed to create conversation",
    };
  }
}
