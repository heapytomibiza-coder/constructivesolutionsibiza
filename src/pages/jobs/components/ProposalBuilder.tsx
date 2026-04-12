/**
 * ProposalBuilder — Bookipi-style line-item proposal builder.
 * Mobile-first, minimal fields, sticky total footer.
 * Revision-aware: prefills from existing quote when revising.
 * Includes Agent 4: Quote Quality Coach — advisory, non-blocking.
 */

import { useState, useCallback, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Loader2, Send, Plus, Trash2, GripVertical, RotateCcw, Sparkles, AlertTriangle, CheckCircle2, Lightbulb, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { submitQuote } from "../actions/submitQuote.action";
import { quoteKeys } from "../queries/quotes.query";
import type { Quote } from "../types";

// --- Types ---

interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
}

interface QuoteQualityResult {
  quality_score: number;
  issues: string[];
  missing_elements: string[];
  suggestions: string[];
  strengths: string[];
  should_warn: boolean;
}

interface ProposalBuilderProps {
  jobId: string;
  existingQuote?: Quote | null;
  onSuccess?: (quoteId?: string) => void;
}

// --- Helpers ---

function createItem(): LineItem {
  return { id: crypto.randomUUID(), description: "", quantity: 1, unitPrice: 0 };
}

function hydrateItemsFromQuote(quote: Quote): LineItem[] {
  if (quote.line_items && quote.line_items.length > 0) {
    return quote.line_items
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(li => ({
        id: crypto.randomUUID(),
        description: li.description,
        quantity: li.quantity,
        unitPrice: li.unit_price,
      }));
  }
  if (quote.price_fixed != null) {
    return [{
      id: crypto.randomUUID(),
      description: quote.scope_text || "",
      quantity: 1,
      unitPrice: quote.price_fixed,
    }];
  }
  return [createItem()];
}

// --- Review Panel ---

function ReviewPanel({
  result,
  onDismiss,
}: {
  result: QuoteQualityResult;
  onDismiss: () => void;
}) {
  const { t } = useTranslation("jobs");
  const hasIssues = result.issues.length > 0 || result.missing_elements.length > 0;
  const hasSuggestions = result.suggestions.length > 0;
  const hasStrengths = result.strengths.length > 0;

  return (
    <div className="rounded-md border border-border/60 bg-muted/20 p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Sparkles className="h-3.5 w-3.5" />
          <span>Quote Coach</span>
        </div>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDismiss}>
          <X className="h-3.5 w-3.5" />
        </Button>
      </div>

      {hasIssues && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center gap-1.5 text-xs font-medium text-destructive w-full">
            <AlertTriangle className="h-3.5 w-3.5" />
            {t("proposal.reviewIssues")} ({result.issues.length + result.missing_elements.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1.5 space-y-1 pl-5">
            {result.issues.map((issue, i) => (
              <p key={`i-${i}`} className="text-xs text-muted-foreground">• {issue}</p>
            ))}
            {result.missing_elements.map((el, i) => (
              <p key={`m-${i}`} className="text-xs text-muted-foreground">• {el}</p>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {hasSuggestions && (
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center gap-1.5 text-xs font-medium text-foreground/80 w-full">
            <Lightbulb className="h-3.5 w-3.5" />
            {t("proposal.reviewSuggestions")} ({result.suggestions.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1.5 space-y-1 pl-5">
            {result.suggestions.map((s, i) => (
              <p key={i} className="text-xs text-muted-foreground">• {s}</p>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}

      {hasStrengths && (
        <Collapsible defaultOpen={!hasIssues}>
          <CollapsibleTrigger className="flex items-center gap-1.5 text-xs font-medium text-primary w-full">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {t("proposal.reviewStrengths")} ({result.strengths.length})
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-1.5 space-y-1 pl-5">
            {result.strengths.map((s, i) => (
              <p key={i} className="text-xs text-muted-foreground">• {s}</p>
            ))}
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}

// --- Main Component ---

export function ProposalBuilder({ jobId, existingQuote, onSuccess }: ProposalBuilderProps) {
  const { t } = useTranslation("jobs");
  const queryClient = useQueryClient();
  const isRevision = !!existingQuote;

  const [items, setItems] = useState<LineItem[]>(() =>
    existingQuote ? hydrateItemsFromQuote(existingQuote) : [createItem()]
  );
  const [vatEnabled, setVatEnabled] = useState(() =>
    existingQuote ? (existingQuote.vat_percent ?? 0) > 0 : false
  );
  const [vatPercent, setVatPercent] = useState(() =>
    existingQuote?.vat_percent && existingQuote.vat_percent > 0
      ? existingQuote.vat_percent
      : 21
  );
  const [timeEstimateDays, setTimeEstimateDays] = useState(() =>
    existingQuote?.time_estimate_days?.toString() ?? ""
  );
  const [startDateEstimate, setStartDateEstimate] = useState(() =>
    existingQuote?.start_date_estimate ?? ""
  );
  const [notes, setNotes] = useState(() =>
    (existingQuote as any)?.notes ?? ""
  );
  const [exclusions, setExclusions] = useState(() =>
    existingQuote?.exclusions_text ?? ""
  );
  const [submitting, setSubmitting] = useState(false);

  // Quote Coach state
  const [reviewing, setReviewing] = useState(false);
  const [reviewResult, setReviewResult] = useState<QuoteQualityResult | null>(null);

  const updateItem = useCallback((id: string, field: keyof LineItem, value: string | number) => {
    setItems(prev => prev.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    ));
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.length > 1 ? prev.filter(i => i.id !== id) : prev);
  }, []);

  const addItem = useCallback(() => {
    setItems(prev => [...prev, createItem()]);
  }, []);

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
    [items]
  );
  const vatAmount = vatEnabled ? subtotal * (vatPercent / 100) : 0;
  const total = subtotal + vatAmount;

  const hasValidItems = items.some(i => i.description.trim() && i.unitPrice > 0);

  // Quote Coach handler
  const handleReview = useCallback(async () => {
    setReviewing(true);
    setReviewResult(null);

    const quoteText = items
      .filter(i => i.description.trim())
      .map(i => `${i.description} (×${i.quantity} @ €${i.unitPrice})`)
      .join("\n");

    const lineItemsPayload = items
      .filter(i => i.description.trim())
      .map(i => ({
        description: i.description.trim(),
        quantity: i.quantity,
        unit_price: i.unitPrice,
      }));

    try {
      const { data, error } = await supabase.functions.invoke("analyze-quote-quality", {
        body: {
          job_id: jobId,
          quote_text: quoteText,
          line_items: lineItemsPayload,
          exclusions: exclusions.trim(),
          notes: notes.trim(),
        },
      });

      if (error || !data) {
        toast.error(t("proposal.reviewFailed"));
      } else {
        setReviewResult(data as QuoteQualityResult);
      }
    } catch {
      toast.error(t("proposal.reviewFailed"));
    } finally {
      setReviewing(false);
    }
  }, [items, exclusions, notes, jobId, t]);

  const handleSubmit = async () => {
    if (!hasValidItems) {
      toast.error(t("proposal.itemRequired"));
      return;
    }

    setSubmitting(true);

    const scopeText = items
      .filter(i => i.description.trim())
      .map(i => `${i.description} (×${i.quantity} @ €${i.unitPrice})`)
      .join("\n");

    const validItems = items.filter(i => i.description.trim());

    const result = await submitQuote({
      jobId,
      priceType: "fixed",
      priceFixed: total,
      scopeText,
      exclusionsText: exclusions.trim() || null,
      notes: notes.trim() || null,
      timeEstimateDays: timeEstimateDays ? Number(timeEstimateDays) : null,
      startDateEstimate: startDateEstimate || null,
      vatPercent: vatEnabled ? vatPercent : 0,
      subtotal,
      total,
      revisionNumber: isRevision && existingQuote
        ? existingQuote.revision_number + 1
        : 1,
      previousQuoteId: isRevision && existingQuote ? existingQuote.id : null,
      lineItems: validItems.map(item => ({
        description: item.description.trim(),
        quantity: item.quantity,
        unit_price: item.unitPrice,
      })),
    });

    setSubmitting(false);

    if (!result.success) {
      toast.error(result.error || t("quotes.submitFailed"));
      return;
    }

    toast.success(t("quotes.submitted"));
    queryClient.invalidateQueries({ queryKey: quoteKeys.myQuote(jobId) });
    queryClient.invalidateQueries({ queryKey: quoteKeys.forJob(jobId) });
    onSuccess?.(result.quoteId);
  };

  return (
    <div className="space-y-4 rounded-lg border border-border/70 bg-card">
      {/* Header */}
      <div className="px-4 pt-4">
        <div className="flex items-center gap-2">
          {isRevision && <RotateCcw className="h-4 w-4 text-muted-foreground" />}
          <div className="text-sm font-semibold">
            {isRevision ? t("proposal.reviseTitle") : t("proposal.title")}
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">{t("proposal.subtitle")}</p>
      </div>

      <Separator className="bg-border/40" />

      {/* Line Items */}
      <div className="px-4 space-y-3">
        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          {t("proposal.items")}
        </Label>

        {items.map((item) => (
          <div key={item.id} className="rounded-md border border-border/60 bg-muted/30 p-3 space-y-2">
            <div className="flex items-start gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground/40 mt-2.5 shrink-0" />
              <div className="flex-1 space-y-2">
                <Input
                  placeholder={t("proposal.itemDescription")}
                  value={item.description}
                  onChange={e => updateItem(item.id, "description", e.target.value)}
                  className="text-sm"
                  maxLength={200}
                />
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs text-muted-foreground">{t("proposal.qty")}</Label>
                    <Input
                      type="number"
                      inputMode="numeric"
                      min={1}
                      value={item.quantity || ""}
                      onChange={e => updateItem(item.id, "quantity", Number(e.target.value) || 1)}
                      className="text-sm"
                    />
                  </div>
                  <div>
                    <Label className="text-xs text-muted-foreground">{t("proposal.unitPrice")}</Label>
                    <Input
                      type="number"
                      inputMode="decimal"
                      min={0}
                      step={0.01}
                      value={item.unitPrice || ""}
                      onChange={e => updateItem(item.id, "unitPrice", Number(e.target.value) || 0)}
                      className="text-sm"
                      placeholder="€0"
                    />
                  </div>
                </div>
              </div>
              {items.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0 mt-1"
                  onClick={() => removeItem(item.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
            {/* Line total */}
            <div className="text-right text-xs font-medium text-muted-foreground">
              €{(item.quantity * item.unitPrice).toFixed(2)}
            </div>
          </div>
        ))}

        <Button variant="outline" size="sm" onClick={addItem} className="w-full gap-1.5 text-xs">
          <Plus className="h-3.5 w-3.5" />
          {t("proposal.addItem")}
        </Button>
      </div>

      <Separator className="bg-border/40" />

      {/* VAT Toggle */}
      <div className="px-4 space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-sm">{t("proposal.includeVat")}</Label>
          <Switch checked={vatEnabled} onCheckedChange={setVatEnabled} />
        </div>
        {vatEnabled && (
          <div className="flex items-center gap-2">
            <Input
              type="number"
              inputMode="numeric"
              min={0}
              max={100}
              value={vatPercent}
              onChange={e => setVatPercent(Number(e.target.value) || 0)}
              className="w-20 text-sm"
            />
            <span className="text-sm text-muted-foreground">%</span>
          </div>
        )}
      </div>

      <Separator className="bg-border/40" />

      {/* Timeline */}
      <div className="px-4 grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("quotes.timeEstimate")}</Label>
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            value={timeEstimateDays}
            onChange={e => setTimeEstimateDays(e.target.value)}
            placeholder={t("quotes.days")}
            className="text-sm"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("quotes.startDate")}</Label>
          <Input
            type="date"
            value={startDateEstimate}
            onChange={e => setStartDateEstimate(e.target.value)}
            className="text-sm"
          />
        </div>
      </div>

      {/* Notes & Exclusions */}
      <div className="px-4 space-y-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("proposal.notes")}</Label>
          <Textarea
            value={notes}
            onChange={e => setNotes(e.target.value)}
            placeholder={t("proposal.notesPlaceholder")}
            rows={2}
            className="text-sm"
            maxLength={1000}
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">{t("quotes.exclusions")}</Label>
          <Textarea
            value={exclusions}
            onChange={e => setExclusions(e.target.value)}
            placeholder={t("quotes.exclusionsPlaceholder")}
            rows={2}
            className="text-sm"
            maxLength={500}
          />
        </div>
      </div>

      {/* Quote Quality Coach */}
      <div className="px-4 space-y-2">
        {!reviewResult && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleReview}
            disabled={reviewing || !hasValidItems}
            className="w-full gap-1.5 text-xs"
          >
            {reviewing ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            {reviewing ? t("proposal.reviewing") : t("proposal.reviewQuote")}
          </Button>
        )}

        {reviewResult && (
          <ReviewPanel
            result={reviewResult}
            onDismiss={() => setReviewResult(null)}
          />
        )}
      </div>

      {/* Sticky Total Footer */}
      <div className="sticky bottom-0 rounded-b-lg border-t border-border/70 bg-card/95 backdrop-blur-sm px-4 py-3 space-y-2">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{t("proposal.subtotal")}</span>
          <span>€{subtotal.toFixed(2)}</span>
        </div>
        {vatEnabled && (
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>{t("proposal.vat")} ({vatPercent}%)</span>
            <span>€{vatAmount.toFixed(2)}</span>
          </div>
        )}
        <div className="flex justify-between text-base font-bold">
          <span>{t("proposal.total")}</span>
          <span>€{total.toFixed(2)}</span>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={submitting || !hasValidItems}
          className="w-full gap-2 mt-1"
          size="lg"
        >
          {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          {isRevision ? t("proposal.sendRevision") : t("proposal.send")}
        </Button>
      </div>
    </div>
  );
}
