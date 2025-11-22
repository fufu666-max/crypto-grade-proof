import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Lock, Eye, Loader2 } from "lucide-react";
import { Button } from "./ui/button";

interface EncryptedScoreCardProps {
  entryId: bigint;
  subject: string;
  encryptedScore: string;
  progress: number;
  isDecrypted?: boolean;
  isDecrypting?: boolean;
  onDecrypt: (entryId: bigint) => Promise<void>;
}

export const EncryptedScoreCard = ({ 
  entryId, 
  subject, 
  encryptedScore, 
  progress, 
  isDecrypted = false,
  isDecrypting = false,
  onDecrypt
}: EncryptedScoreCardProps) => {

  // Debug: Log props changes
  console.log("[EncryptedScoreCard] Render:", JSON.stringify({
    entryId: entryId.toString(),
    subject,
    progress,
    isDecrypted,
    isDecrypting,
    encryptedScore: encryptedScore?.substring(0, 20),
  }, null, 2));

  const handleDecrypt = async () => {
    try {
      console.log("[EncryptedScoreCard] Starting decryption for entryId:", entryId.toString());
      await onDecrypt(entryId);
    } catch (error) {
      console.error("[EncryptedScoreCard] Failed to decrypt:", error);
    }
  };

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
          {isDecrypted ? `Score: ${progress}/100` : `${encryptedScore.substring(0, 20)}...`}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Score</span>
            <span className="font-semibold text-foreground">
              {isDecrypted ? `${progress}/100` : "Encrypted"}
            </span>
          </div>
          <Progress value={isDecrypted ? progress : 0} className="h-2" />
        </div>
        {!isDecrypted && (
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-xs"
            onClick={handleDecrypt}
            disabled={isDecrypting}
          >
            {isDecrypting ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                Decrypting...
              </>
            ) : (
              "Decrypt Score"
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
