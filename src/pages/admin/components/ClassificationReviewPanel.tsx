/**
 * ClassificationReviewPanel
 * Admin component shown in JobDetailDrawer for custom requests with AI classification suggestions.
 * Allows accept, reject, or edit-before-apply actions.
 */

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, Check, X, Edit2, ChevronDown, ChevronUp } from "lucide-react";
import {
  useClassificationSuggestion,
  useReviewClassification,
} from "../hooks/useClassificationSuggestions";

interface Props {
  jobId: string;
  isCustomRequest?: boolean;
}

function ConfidenceBadge({ confidence }: { confidence: number | null }) {
  if (confidence == null) return null;
  const pct = Math.round(confidence * 100);
  if (pct >= 70)
    return <Badge className="bg-accent text-accent-foreground text-xs">{pct}%</Badge>;
  if (pct >= 40)
    return <Badge className="bg-secondary text-secondary-foreground text-xs">{pct}%</Badge>;
  return <Badge variant="destructive" className="text-xs">{pct}%</Badge>;
}

export function ClassificationReviewPanel({ jobId, isCustomRequest }: Props) {
  const { data: suggestion, isLoading } = useClassificationSuggestion(jobId);
  const reviewMutation = useReviewClassification();
  const [isEditing, setIsEditing] = useState(false);
  const [showRaw, setShowRaw] = useState(false);
  const [editCategory, setEditCategory] = useState("");
  const [editSubcategory, setEditSubcategory] = useState("");
  const [editMicros, setEditMicros] = useState("");

  // Don't render for non-custom jobs or if no suggestion exists
  if (!isCustomRequest) return null;
  if (isLoading) return <Skeleton className="h-20 w-full" />;
  if (!suggestion) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg border border-dashed">
        <Brain className="h-4 w-4" />
        <span>No AI classification yet</span>
      </div>
    );
  }

  const isPending = suggestion.status === "pending";

  const startEditing = () => {
    setEditCategory(suggestion.suggested_category_slug ?? "");
    setEditSubcategory(suggestion.suggested_subcategory_slug ?? "");
    setEditMicros((suggestion.suggested_micro_slugs ?? []).join(", "));
    setIsEditing(true);
  };

  const handleAccept = () => {
    if (isEditing) {
      reviewMutation.mutate({
        suggestionId: suggestion.id,
        jobId,
        action: "accepted",
        overrides: {
          category: editCategory || undefined,
          subcategory: editSubcategory || undefined,
          micro_slugs: editMicros
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
        },
      });
      setIsEditing(false);
    } else {
      reviewMutation.mutate({
        suggestionId: suggestion.id,
        jobId,
        action: "accepted",
      });
    }
  };

  const handleReject = () => {
    reviewMutation.mutate({
      suggestionId: suggestion.id,
      jobId,
      action: "rejected",
    });
    setIsEditing(false);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Brain className="h-4 w-4 text-primary" />
        <span className="text-sm font-medium">AI Classification</span>
        <ConfidenceBadge confidence={suggestion.confidence} />
        {!isPending && (
          <Badge
            variant={suggestion.status === "accepted" ? "default" : "outline"}
            className="text-xs capitalize"
          >
            {suggestion.status}
          </Badge>
        )}
      </div>

      {isEditing ? (
        <div className="space-y-2 p-3 rounded-lg border bg-muted/30">
          <div>
            <label className="text-xs text-muted-foreground">Category</label>
            <Input
              value={editCategory}
              onChange={(e) => setEditCategory(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Subcategory</label>
            <Input
              value={editSubcategory}
              onChange={(e) => setEditSubcategory(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div>
            <label className="text-xs text-muted-foreground">Micro slugs (comma-separated)</label>
            <Input
              value={editMicros}
              onChange={(e) => setEditMicros(e.target.value)}
              className="h-8 text-sm"
              placeholder="e.g. build-shelving, install-cabinets"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 text-sm p-3 rounded-lg border bg-muted/30">
          <div>
            <span className="text-xs text-muted-foreground">Category</span>
            <p className="font-medium capitalize">
              {suggestion.suggested_category_slug?.replace(/-/g, " ") ?? "—"}
            </p>
          </div>
          <div>
            <span className="text-xs text-muted-foreground">Subcategory</span>
            <p className="font-medium capitalize">
              {suggestion.suggested_subcategory_slug?.replace(/-/g, " ") ?? "—"}
            </p>
          </div>
          {(suggestion.suggested_micro_slugs ?? []).length > 0 && (
            <div className="col-span-2">
              <span className="text-xs text-muted-foreground">Micro-services</span>
              <div className="flex flex-wrap gap-1 mt-1">
                {suggestion.suggested_micro_slugs.map((slug) => (
                  <Badge key={slug} variant="outline" className="text-xs capitalize">
                    {slug.replace(/-/g, " ")}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {suggestion.reasoning_summary && (
        <p className="text-xs text-muted-foreground italic">
          {suggestion.reasoning_summary}
        </p>
      )}

      {isPending && (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            onClick={handleAccept}
            disabled={reviewMutation.isPending}
          >
            <Check className="h-3 w-3 mr-1" />
            {isEditing ? "Apply Edited" : "Accept"}
          </Button>
          {!isEditing && (
            <Button
              size="sm"
              variant="outline"
              onClick={startEditing}
              disabled={reviewMutation.isPending}
            >
              <Edit2 className="h-3 w-3 mr-1" />
              Edit
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={handleReject}
            disabled={reviewMutation.isPending}
          >
            <X className="h-3 w-3 mr-1" />
            Reject
          </Button>
        </div>
      )}

      <button
        type="button"
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
        onClick={() => setShowRaw(!showRaw)}
      >
        {showRaw ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        Model: {suggestion.model_name}
      </button>

      {showRaw && (
        <pre className="text-[10px] bg-muted p-2 rounded overflow-x-auto max-h-32">
          {JSON.stringify(suggestion, null, 2)}
        </pre>
      )}
    </div>
  );
}
