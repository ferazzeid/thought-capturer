import { Button } from '@/components/ui/button';
import { Trash2, Bot, Link, Lightbulb, ListChecks } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Idea {
  id: string;
  content: string;
  ai_response?: string;
  created_at: string;
  idea_type?: 'main' | 'sub-component' | 'follow-up';
  master_idea_id?: string;
  ai_auto_tags?: string[];
  confidence_level?: number;
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
  const getIdeaTypeIcon = () => {
    switch (idea.idea_type) {
      case 'main':
        return <Lightbulb className="h-3 w-3 text-amber-500" />;
      case 'sub-component':
        return <ListChecks className="h-3 w-3 text-blue-500" />;
      case 'follow-up':
        return <Link className="h-3 w-3 text-green-500" />;
      default:
        return <Lightbulb className="h-3 w-3 text-amber-500" />;
    }
  };

  const getIdeaTypeLabel = () => {
    switch (idea.idea_type) {
      case 'main':
        return 'Main Idea';
      case 'sub-component':
        return 'Component';
      case 'follow-up':
        return 'Follow-up';
      default:
        return 'Idea';
    }
  };

  const isSubComponent = idea.idea_type === 'sub-component';

  return (
    <div className={cn(
      "relative group mb-3",
      isSubComponent && "ml-6" // Indent sub-components
    )}>
      {/* Delete button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(idea.id)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive z-10"
      >
        <Trash2 className="h-3 w-3" />
      </Button>

      {/* Idea content */}
      <div className={cn(
        "rounded-lg p-3 pr-10 relative",
        isSubComponent ? "bg-muted/20 border-l-2 border-muted" : "bg-muted/30"
      )}>
        {/* Category color indicator for main ideas */}
        {idea.category && !isSubComponent && (
          <div 
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
            style={{ backgroundColor: idea.category.color }}
          />
        )}

        {/* Idea type badge */}
        <div className="flex items-center gap-2 mb-2">
          {getIdeaTypeIcon()}
          <span className="text-xs text-muted-foreground font-medium">
            {getIdeaTypeLabel()}
          </span>
          {idea.confidence_level !== undefined && idea.confidence_level < 0.8 && (
            <span className="text-xs bg-amber-500/20 text-amber-700 px-1 rounded">
              Uncertain
            </span>
          )}
        </div>
        
        <p className="text-sm text-foreground leading-relaxed">{idea.content}</p>
        
        {/* AI auto-tags for semantic linking */}
        {idea.ai_auto_tags && idea.ai_auto_tags.length > 0 && (
          <div className="mt-2">
            <div className="text-xs text-muted-foreground/50">
              Auto-tags: {idea.ai_auto_tags.slice(0, 3).join(', ')}
              {idea.ai_auto_tags.length > 3 && ` +${idea.ai_auto_tags.length - 3} more`}
            </div>
          </div>
        )}
        
        {/* AI response */}
        {idea.ai_response && (
          <div className="mt-3 pt-3 border-t border-muted">
            <div className="flex items-start gap-2">
              <Bot className="h-3 w-3 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground leading-relaxed">{idea.ai_response}</p>
            </div>
          </div>
        )}
        
        {/* User tags in bottom right corner */}
        {idea.tags && idea.tags.length > 0 && (
          <div className="absolute bottom-2 right-8">
            <div className="text-xs text-muted-foreground/60">
              #{idea.tags.slice(0, 2).join(' #')}
              {idea.tags.length > 2 && ` +${idea.tags.length - 2}`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}