import { ConnectButton } from '@rainbow-me/rainbowkit';

export const Header = () => {
  return (
    <header className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="Crypto Grade Proof Logo" className="h-10 w-10" />
          <div>
            <h1 className="text-xl font-bold text-foreground">Crypto Grade Proof</h1>
            <p className="text-xs text-muted-foreground">Encrypted Grade Records & Trend Analysis</p>
          </div>
        </div>
        <ConnectButton />
      </div>
    </header>
  );
};
