import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";

export type HeroToggles = {
  newToday: boolean;
  highBudget: boolean;
  hasPhotos: boolean;
  asapOnly: boolean;
};

interface JobBoardHeroSectionProps {
  search: string;
  onSearchChange: (v: string) => void;
  toggles: HeroToggles;
  onToggle: (key: keyof HeroToggles) => void;
}

export function JobBoardHeroSection({
  search,
  onSearchChange,
  toggles,
  onToggle,
}: JobBoardHeroSectionProps) {
  return (
    <div className="rounded-xl bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-6 mb-6">
      <div className="mb-4">
        <h1 className="text-2xl font-display font-bold tracking-tight">
          Find work fast
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Real scope, real answers, less back-and-forth.
        </p>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search jobs (e.g. plumbing, shelves, leak)…"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 h-12"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant={toggles.asapOnly ? "default" : "outline"}
          onClick={() => onToggle("asapOnly")}
        >
          ⚡ ASAP
        </Button>
        <Button
          size="sm"
          variant={toggles.highBudget ? "default" : "outline"}
          onClick={() => onToggle("highBudget")}
        >
          💰 High budget
        </Button>
        <Button
          size="sm"
          variant={toggles.hasPhotos ? "default" : "outline"}
          onClick={() => onToggle("hasPhotos")}
        >
          📸 Photos
        </Button>
        <Button
          size="sm"
          variant={toggles.newToday ? "default" : "outline"}
          onClick={() => onToggle("newToday")}
        >
          🆕 New today
        </Button>
      </div>
    </div>
  );
}
