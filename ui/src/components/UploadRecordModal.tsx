import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAccount } from "wagmi";
import { useEncryptedGradeRecord } from "@/hooks/useEncryptedGradeRecord";

export const UploadRecordModal = () => {
  const { isConnected } = useAccount();
  const { submitGrade, isSubmitting, message, isDeployed, fhevmStatus } = useEncryptedGradeRecord();
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    score: "",
    description: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    if (!isDeployed) {
      toast({
        title: "Contract Not Deployed",
        description: "The contract is not deployed on this network. Please deploy it first.",
        variant: "destructive",
      });
      return;
    }

    if (fhevmStatus !== "ready") {
      toast({
        title: "FHEVM Not Ready",
        description: "FHEVM is initializing. Please wait...",
        variant: "destructive",
      });
      return;
    }

    const scoreNum = parseFloat(formData.score);
    if (isNaN(scoreNum) || scoreNum < 0 || scoreNum > 100) {
      toast({
        title: "Invalid Score",
        description: "Please enter a valid score between 0 and 100.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("[UploadRecordModal] Submitting grade:", {
        subject: formData.subject,
        score: Math.round(scoreNum),
      });
      
      await submitGrade(formData.subject, Math.round(scoreNum));
      
      toast({
        title: "Learning Record Uploaded",
        description: `Your ${formData.subject} record has been encrypted and stored on-chain.`,
      });
      
      setFormData({ subject: "", score: "", description: "" });
      setOpen(false);
      
      // Note: loadGrades is called inside submitGrade after successful transaction
    } catch (error: any) {
      const errorMsg = error?.message || "Failed to submit grade";
      console.error("[UploadRecordModal] Submit error:", error);
      toast({
        title: "Upload Failed",
        description: errorMsg,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="achievement" size="lg" className="gap-2">
          <Upload className="h-5 w-5" />
          Upload Learning Record
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Upload Learning Record</DialogTitle>
          <DialogDescription>
            Submit your learning achievement. It will be encrypted and stored on-chain.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label htmlFor="subject">Subject/Course Name</Label>
            <Input
              id="subject"
              placeholder="e.g., Advanced Cryptography"
              value={formData.subject}
              onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="score">Score/Grade</Label>
            <Input
              id="score"
              placeholder="e.g., 95 or A+"
              value={formData.score}
              onChange={(e) => setFormData({ ...formData, score: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Additional details about this achievement..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
            />
          </div>
          {message && (
            <div className="text-sm text-muted-foreground p-2 bg-muted rounded">
              {message}
            </div>
          )}
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="wallet" className="flex-1" disabled={isSubmitting || !isConnected || !isDeployed || fhevmStatus !== "ready"}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Encrypting...
                </>
              ) : (
                "Encrypt & Upload"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
