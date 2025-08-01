import { Button } from '@/components/ui/button';
import { Trash2, Bot } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Idea {
  id: string;
  content: string;
  ai_response?: string;
  created_at: string;
  category?: {
    name: string;
    color: string;
  };
  tags?: string[];
}

interface IdeaCardProps {
  idea: Idea;
  onDelete: (id: string) => void;
}

export function IdeaCard({ idea, onDelete }: IdeaCardProps) {
  return (
    <div className="relative group mb-2">
      {/* Delete button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(idea.id)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive z-10"
      >
        <Trash2 className="h-3 w-3" />
      </Button>

      {/* User idea bubble */}
      <div className="flex justify-end mb-2">
        <div className="max-w-[85%] bg-gradient-primary text-primary-foreground rounded-lg p-3 shadow-sm">
          <p className="text-sm leading-relaxed">{idea.content}</p>
        </div>
      </div>

      {/* AI response bubble */}
      {idea.ai_response && (
        <div className="flex justify-start mb-2">
          <div className="max-w-[85%] bg-card text-card-foreground border rounded-lg p-3 shadow-sm">
            <div className="flex items-start space-x-2">
              <Bot className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
              <p className="text-sm leading-relaxed">{idea.ai_response}</p>
            </div>
          </div>
        </div>
      )}

      {/* Minimal metadata in bottom right */}
      <div className="flex justify-end">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {idea.category && (
            <span className="text-xs opacity-60">{idea.category.name}</span>
          )}
          {idea.tags && idea.tags.length > 0 && (
            <span className="text-xs opacity-60">
              {idea.tags.slice(0, 2).join(', ')}
              {idea.tags.length > 2 && ' +' + (idea.tags.length - 2)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}