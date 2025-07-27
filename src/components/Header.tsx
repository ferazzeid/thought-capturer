import { Button } from '@/components/ui/button';
import { Settings, Menu, Mic } from 'lucide-react';

interface HeaderProps {
  onOpenSettings: () => void;
  hasApiKey?: boolean;
}

export function Header({ onOpenSettings, hasApiKey }: HeaderProps) {
  return (
    <header className="bg-card border-b border-border shadow-soft">
      <div className="max-w-md mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-voice p-2 rounded-lg shadow-voice">
              <Mic className="h-5 w-5 text-accent-foreground" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Voice Ideas</h1>
              <p className="text-xs text-muted-foreground">
                {hasApiKey ? 'AI Ready' : 'Setup Required'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${hasApiKey ? 'bg-ready' : 'bg-recording'}`} />
            <Button
              variant="ghost"
              size="icon"
              onClick={onOpenSettings}
              className="hover:bg-secondary-hover"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}