import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Lock, Unlock, CheckCircle2 } from "lucide-react";

interface AchievementBadgeProps {
  title: string;
  description: string;
  status: "locked" | "unlocked" | "verified";
  icon?: React.ReactNode;
}

export const AchievementBadge = ({ title, description, status, icon }: AchievementBadgeProps) => {
  const getStatusIcon = () => {
    switch (status) {
      case "locked":
        return <Lock className="h-8 w-8 text-locked" />;
      case "unlocked":
        return <Unlock className="h-8 w-8 text-achievement" />;
      case "verified":
        return <CheckCircle2 className="h-8 w-8 text-accent" />;
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case "locked":
        return <Badge variant="locked">Encrypted</Badge>;
      case "unlocked":
        return <Badge variant="achievement">Unlocked</Badge>;
      case "verified":
        return <Badge variant="verified">Verified</Badge>;
    }
  };

  return (
    <Card className={`transition-all hover:shadow-lg ${status === "unlocked" ? "ring-2 ring-achievement/20" : ""} ${status === "verified" ? "ring-2 ring-accent/20" : ""}`}>
      <CardContent className="p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            {icon || getStatusIcon()}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-foreground">{title}</h3>
              {getStatusBadge()}
            </div>
            <p className="text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
