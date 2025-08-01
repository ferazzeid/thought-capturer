import { MessageBubble } from '@/components/MessageBubble';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Trash2, Bot, Hash, Calendar, Folder } from 'lucide-react';
import { getRelativeTimeLabel } from '@/utils/timeFilters';

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
  const userMessage = {
    id: idea.id,
    content: idea.content,
    sender: 'user' as const,
    timestamp: new Date(idea.created_at)
  };

  const aiMessage = idea.ai_response ? {
    id: `${idea.id}-ai`,
    content: idea.ai_response,
    sender: 'assistant' as const,
    timestamp: new Date(idea.created_at)
  } : null;

  const createdDate = new Date(idea.created_at);
  const relativeTime = getRelativeTimeLabel(createdDate);
  const exactDateTime = createdDate.toLocaleString();

  return (
    <div className="space-y-4 p-4 border rounded-lg bg-card hover:bg-card/50 transition-colors relative group">
      {/* Delete button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(idea.id)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive"
      >
        <Trash2 className="h-3 w-3" />
      </Button>

      {/* Main content */}
      <div className="pr-10">
        <MessageBubble message={userMessage} />
        
        {aiMessage && (
          <div className="mt-3">
            <MessageBubble message={aiMessage} icon={<Bot className="h-4 w-4" />} />
          </div>
        )}
      </div>

      {/* Compact metadata footer */}
      <div className="flex items-center justify-between pt-2 border-t border-border/50">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-1 hover:text-foreground transition-colors cursor-default">
                  <Calendar className="h-3 w-3" />
                  <span>{relativeTime}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>{exactDateTime}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {idea.category && (
            <div className="flex items-center gap-1">
              <Folder className="h-3 w-3" />
              <span className="px-1.5 py-0.5 rounded text-xs" style={{ backgroundColor: `${idea.category.color}20`, color: idea.category.color }}>
                {idea.category.name}
              </span>
            </div>
          )}
        </div>

        {idea.tags && idea.tags.length > 0 && (
          <div className="flex items-center gap-1">
            <Hash className="h-3 w-3 text-muted-foreground" />
            <div className="flex gap-1">
              {idea.tags.slice(0, 3).map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs px-1.5 py-0 h-5 text-muted-foreground border-muted-foreground/30">
                  {tag}
                </Badge>
              ))}
              {idea.tags.length > 3 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 text-muted-foreground border-muted-foreground/30 cursor-default">
                        +{idea.tags.length - 3}
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="flex flex-wrap gap-1 max-w-48">
                        {idea.tags.slice(3).map((tag, index) => (
                          <span key={index} className="text-xs">{tag}</span>
                        ))}
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}