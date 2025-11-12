import { Button } from "@/components/ui/button";
import { Wallet } from "lucide-react";
import logo from "@/assets/learncrypt-logo.png";

export const Header = () => {
  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="LearnCrypt Logo" className="h-10 w-10" />
          <div>
            <h1 className="text-xl font-bold text-foreground">LearnCrypt</h1>
            <p className="text-xs text-muted-foreground">Learn in Privacy. Prove in Public.</p>
          </div>
        </div>
        <Button variant="wallet" size="lg" className="gap-2">
          <Wallet className="h-5 w-5" />
          Connect Rainbow Wallet
        </Button>
      </div>
    </header>
  );
};
