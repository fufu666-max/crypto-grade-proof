import { Progress } from "@/components/ui/progress";
import { Award } from "lucide-react";

interface AchievementMeterProps {
  current: number;
  total: number;
}

export const AchievementMeter = ({ current, total }: AchievementMeterProps) => {
  const percentage = (current / total) * 100;
  
  return (
    <footer className="border-t bg-card mt-auto">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center gap-4">
          <Award className="h-6 w-6 text-achievement flex-shrink-0" />
          <div className="flex-1">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-foreground">Achievement Progress</span>
              <span className="text-sm font-bold text-achievement">{current}/{total}</span>
            </div>
            <Progress value={percentage} className="h-3 bg-muted [&>div]:bg-gradient-achievement" />
          </div>
        </div>
      </div>
    </footer>
  );
};
