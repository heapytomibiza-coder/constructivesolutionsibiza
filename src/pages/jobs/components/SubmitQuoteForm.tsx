/**
 * SubmitQuoteForm — Professional submits a structured quote for a job.
 */

import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { submitQuote } from "../actions/submitQuote.action";
import { quoteKeys } from "../queries/quotes.query";
import type { QuotePriceType } from "../types";

interface SubmitQuoteFormProps {
  jobId: string;
  onSuccess?: () => void;
}

export function SubmitQuoteForm({ jobId, onSuccess }: SubmitQuoteFormProps) {
  const { t } = useTranslation("jobs");
  const queryClient = useQueryClient();

  const [priceType, setPriceType] = useState<QuotePriceType>("fixed");
  const [priceFixed, setPriceFixed] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [timeEstimateDays, setTimeEstimateDays] = useState("");
  const [startDateEstimate, setStartDateEstimate] = useState("");
  const [scopeText, setScopeText] = useState("");
  const [exclusionsText, setExclusionsText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const isPriceValid =
    (priceType === "fixed" && Number(priceFixed) > 0) ||
    (priceType === "estimate" && Number(priceMin) > 0 && Number(priceMax) > Number(priceMin)) ||
    (priceType === "hourly" && Number(hourlyRate) > 0);

  const handleSubmit = async () => {
    if (!isPriceValid) {
      toast.error(t("quotes.priceRequired", "Please enter a valid price."));
      return;
    }
    if (!scopeText.trim()) {
      toast.error(t("quotes.scopeRequired"));
      return;
    }

    setSubmitting(true);
    const result = await submitQuote({
      jobId,
      priceType,
      priceFixed: priceType === "fixed" && priceFixed ? Number(priceFixed) : null,
      priceMin: priceType === "estimate" && priceMin ? Number(priceMin) : null,
      priceMax: priceType === "estimate" && priceMax ? Number(priceMax) : null,
      hourlyRate: priceType === "hourly" && hourlyRate ? Number(hourlyRate) : null,
      timeEstimateDays: timeEstimateDays ? Number(timeEstimateDays) : null,
      startDateEstimate: startDateEstimate || null,
      scopeText: scopeText.trim(),
      exclusionsText: exclusionsText.trim() || null,
    });

    setSubmitting(false);

    if (result.success) {
      toast.success(t("quotes.submitted"));
      queryClient.invalidateQueries({ queryKey: quoteKeys.myQuote(jobId) });
      queryClient.invalidateQueries({ queryKey: quoteKeys.forJob(jobId) });
      onSuccess?.();
    } else {
      toast.error(result.error ?? t("quotes.submitFailed"));
    }
  };

  return (
    <div className="space-y-4 rounded-lg border border-border/70 bg-card p-4">
      <div className="text-sm font-semibold">{t("quotes.submitTitle")}</div>

      {/* Price type */}
      <div className="space-y-1.5">
        <Label>{t("quotes.priceType")}</Label>
        <Select value={priceType} onValueChange={(v) => setPriceType(v as QuotePriceType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="fixed">{t("quotes.fixed")}</SelectItem>
            <SelectItem value="estimate">{t("quotes.estimate")}</SelectItem>
            <SelectItem value="hourly">{t("quotes.hourly")}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Conditional price fields */}
      {priceType === "fixed" && (
        <div className="space-y-1.5">
          <Label>{t("quotes.priceFixed")} (€)</Label>
          <Input type="number" min={0} value={priceFixed} onChange={(e) => setPriceFixed(e.target.value)} placeholder="0" />
        </div>
      )}
      {priceType === "estimate" && (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>{t("quotes.priceMin")} (€)</Label>
            <Input type="number" min={0} value={priceMin} onChange={(e) => setPriceMin(e.target.value)} placeholder="0" />
          </div>
          <div className="space-y-1.5">
            <Label>{t("quotes.priceMax")} (€)</Label>
            <Input type="number" min={0} value={priceMax} onChange={(e) => setPriceMax(e.target.value)} placeholder="0" />
          </div>
        </div>
      )}
      {priceType === "hourly" && (
        <div className="space-y-1.5">
          <Label>{t("quotes.hourlyRate")} (€/h)</Label>
          <Input type="number" min={0} value={hourlyRate} onChange={(e) => setHourlyRate(e.target.value)} placeholder="0" />
        </div>
      )}

      {/* Time estimate */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>{t("quotes.timeEstimate")}</Label>
          <Input type="number" min={1} value={timeEstimateDays} onChange={(e) => setTimeEstimateDays(e.target.value)} placeholder={t("quotes.days")} />
        </div>
        <div className="space-y-1.5">
          <Label>{t("quotes.startDate")}</Label>
          <Input type="date" value={startDateEstimate} onChange={(e) => setStartDateEstimate(e.target.value)} />
        </div>
      </div>

      {/* Scope */}
      <div className="space-y-1.5">
        <Label>{t("quotes.scope")}</Label>
        <Textarea value={scopeText} onChange={(e) => setScopeText(e.target.value)} placeholder={t("quotes.scopePlaceholder")} rows={3} />
      </div>

      {/* Exclusions */}
      <div className="space-y-1.5">
        <Label>{t("quotes.exclusions")}</Label>
        <Textarea value={exclusionsText} onChange={(e) => setExclusionsText(e.target.value)} placeholder={t("quotes.exclusionsPlaceholder")} rows={2} />
      </div>

      <Button onClick={handleSubmit} disabled={submitting || !isPriceValid || !scopeText.trim()} className="w-full gap-2">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
        {t("quotes.submit")}
      </Button>
    </div>
  );
}
