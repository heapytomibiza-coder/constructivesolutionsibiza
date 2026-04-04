import { useState, useEffect } from "react";
import { Sparkles, Loader2, ArrowRight, SkipForward, RotateCcw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { VoiceInput } from "./VoiceInput";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/contexts/SessionContext";
import { cn } from "@/lib/utils";

interface BioBuilderProps {
  onBioGenerated: (bio: string) => void;
  onClose: () => void;
  businessName?: string;
}

const QUESTIONS = [
  {
    key: "strengths",
    label: "What are you best known for on site?",
    placeholder: "e.g. clean finishes, reliability, solving problems quickly",
  },
  {
    key: "pride",
    label: "What do you take most pride in?",
    placeholder: "e.g. attention to detail, doing things properly",
  },
  {
    key: "projects",
    label: "What kind of projects do you usually work on?",
    placeholder: "e.g. villas, residential renovations, commercial sites",
  },
  {
    key: "workStyle",
    label: "How do you usually work day-to-day?",
    placeholder: "e.g. always on time, communicate clearly, keep site tidy",
  },
  {
    key: "extra",
    label: "Anything else clients should know?",
    placeholder: "e.g. 15 years experience, fully insured",
  },
] as const;

type AnswerKey = (typeof QUESTIONS)[number]["key"];

export function BioBuilder({ onBioGenerated, onClose, businessName }: BioBuilderProps) {
  const { user } = useSession();
  const [services, setServices] = useState<string[]>([]);
  const [loadingServices, setLoadingServices] = useState(true);
  const [currentStep, setCurrentStep] = useState(-1); // -1 = intro
  const [answers, setAnswers] = useState<Record<AnswerKey, string>>({
    strengths: "",
    pride: "",
    projects: "",
    workStyle: "",
    extra: "",
  });
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch services on mount
  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const { data } = await supabase
          .from("professional_services")
          .select("micro_id, service_micro_categories!inner(name)")
          .eq("user_id", user.id)
          .eq("status", "offered");

        const names = (data ?? []).map(
          (r: any) => r.service_micro_categories?.name ?? ""
        ).filter(Boolean);
        setServices(names);
      } catch {
        // silent — services are context, not required
      } finally {
        setLoadingServices(false);
      }
    })();
  }, [user]);

  const hasAnyAnswer = Object.values(answers).some((v) => v.trim().length > 0);
  const canGenerate = services.length > 0 || hasAnyAnswer;

  const handleNext = () => {
    if (currentStep < QUESTIONS.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleSkip = () => handleNext();

  const handleGenerate = async () => {
    if (!canGenerate) {
      toast.error("Add at least one answer or select some services first.");
      return;
    }

    setIsGenerating(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-bio`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            services,
            businessName: businessName || null,
            strengths: answers.strengths || null,
            pride: answers.pride || null,
            projects: answers.projects || null,
            workStyle: answers.workStyle || null,
            extra: answers.extra || null,
          }),
        }
      );

      if (res.status === 429) {
        toast.error("Too many requests — try again shortly.");
        return;
      }
      if (res.status === 402) {
        toast.error("AI credits exhausted.");
        return;
      }
      if (!res.ok) {
        throw new Error("Failed to generate bio");
      }

      const data = await res.json();
      if (data.bio) {
        onBioGenerated(data.bio);
        toast.success("Bio generated! Review and edit before saving.");
      } else {
        throw new Error("No bio returned");
      }
    } catch (err) {
      console.error("Bio generation error:", err);
      toast.error("Failed to generate bio — try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const updateAnswer = (key: AnswerKey, value: string) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  // Intro step
  if (currentStep === -1) {
    return (
      <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-foreground">Help me write my bio</h3>
        </div>

        {loadingServices ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading your services…
          </div>
        ) : services.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              We'll use your selected services to help write this:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {services.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                >
                  {name}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Answer a few quick questions and we'll write a professional bio for you.
          </p>
        )}

        <p className="text-sm text-muted-foreground">
          We'll ask 4–5 short questions. Skip any you like — we'll work with what you give us.
        </p>

        <div className="flex gap-2">
          <Button
            type="button"
            onClick={() => setCurrentStep(0)}
            className="gap-2"
          >
            Let's go <ArrowRight className="h-4 w-4" />
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  const question = QUESTIONS[currentStep];
  const isLastQuestion = currentStep === QUESTIONS.length - 1;

  return (
    <div className="rounded-xl border-2 border-primary/20 bg-primary/5 p-5 space-y-4">
      {/* Progress */}
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="text-xs font-medium text-muted-foreground">
          Question {currentStep + 1} of {QUESTIONS.length}
        </span>
        <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <label className="block text-sm font-medium text-foreground">
        {question.label}
      </label>

      <div className="flex gap-2">
        <Input
          value={answers[question.key]}
          onChange={(e) => updateAnswer(question.key, e.target.value)}
          placeholder={question.placeholder}
          className="h-12 text-base flex-1"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              isLastQuestion ? handleGenerate() : handleNext();
            }
          }}
        />
        <VoiceInput
          onTranscript={(text) =>
            updateAnswer(question.key, (answers[question.key] + " " + text).trim())
          }
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {!isLastQuestion ? (
          <>
            <Button
              type="button"
              size="sm"
              onClick={handleNext}
              className="gap-1"
            >
              Next <ArrowRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              className="gap-1 text-muted-foreground"
            >
              Skip <SkipForward className="h-3.5 w-3.5" />
            </Button>
          </>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating || !canGenerate}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Generating…
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" /> Generate my bio
              </>
            )}
          </Button>
        )}

        {/* Can also generate early if they have enough context */}
        {!isLastQuestion && canGenerate && currentStep >= 1 && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="gap-1 ml-auto text-xs"
          >
            {isGenerating ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            Generate now
          </Button>
        )}
      </div>

      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onClose}
        className="text-xs text-muted-foreground"
      >
        Cancel
      </Button>
    </div>
  );
}
