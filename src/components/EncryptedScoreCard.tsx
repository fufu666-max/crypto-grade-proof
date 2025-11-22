import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Lock, Eye } from "lucide-react";
import { Button } from "./ui/button";

interface EncryptedScoreCardProps {
  subject: string;
  encryptedScore: string;
  progress: number;
  isDecrypted?: boolean;
}

export const EncryptedScoreCard = ({ subject, encryptedScore, progress, isDecrypted = false }: EncryptedScoreCardProps) => {
  return (
    <Card className="border-l-4 border-l-accent">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{subject}</CardTitle>
          <Badge variant={isDecrypted ? "verified" : "locked"}>
            {isDecrypted ? <Eye className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
            {isDecrypted ? "Decrypted" : "Encrypted"}
          </Badge>
        </div>
        <CardDescription className="font-mono text-xs break-all">
          {isDecrypted ? "Score: 95/100" : encryptedScore}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
        {!isDecrypted && (
          <Button variant="ghost" size="sm" className="w-full text-xs">
            Request Decryption
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
