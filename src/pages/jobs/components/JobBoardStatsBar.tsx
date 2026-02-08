import { StatTile } from "@/shared/components/StatTile";
import { Briefcase, Clock, Euro } from "lucide-react";

interface JobBoardStatsBarProps {
  activeJobs: number;
  todayJobs: number;
  totalBudget: number;
}

export function JobBoardStatsBar({
  activeJobs,
  todayJobs,
  totalBudget,
}: JobBoardStatsBarProps) {
  return (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <StatTile
        icon={<Briefcase className="h-5 w-5 text-primary" />}
        iconClassName="bg-primary/10"
        label="Active jobs"
        value={activeJobs}
      />
      <StatTile
        icon={<Clock className="h-5 w-5 text-amber-500" />}
        iconClassName="bg-amber-500/10"
        label="Posted today"
        value={todayJobs}
        isNew={todayJobs > 0}
      />
      <StatTile
        icon={<Euro className="h-5 w-5 text-green-500" />}
        iconClassName="bg-green-500/10"
        label="Total budget"
        value={`€${Math.round(totalBudget).toLocaleString()}`}
      />
    </div>
  );
}
