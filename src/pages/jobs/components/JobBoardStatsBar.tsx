import { Card, CardContent } from "@/components/ui/card";
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
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Active jobs</p>
            <p className="text-xl font-bold">{activeJobs}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-amber-500/10 flex items-center justify-center">
            <Clock className="h-5 w-5 text-amber-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Posted today</p>
            <p className="text-xl font-bold">{todayJobs}</p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
            <Euro className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Total budget</p>
            <p className="text-xl font-bold">€{Math.round(totalBudget).toLocaleString()}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
