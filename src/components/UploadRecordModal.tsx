import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { toast } from "@/hooks/use-toast";

export const UploadRecordModal = () => {
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    subject: "",
    score: "",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simulate upload and encryption
    const encryptedScore = `0x${Math.random().toString(16).substring(2, 18)}...`;
    
    toast({
      title: "Learning Record Uploaded",
      description: `Your ${formData.subject} record has been encrypted and stored. Encrypted hash: ${encryptedScore}`,
    });
    
    setFormData({ subject: "", score: "", description: "" });
    setOpen(false);
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
          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" variant="wallet" className="flex-1">
              Encrypt & Upload
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
