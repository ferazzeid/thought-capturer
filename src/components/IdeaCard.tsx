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
    <div className="relative group mb-3">
      {/* Delete button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onDelete(idea.id)}
        className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0 hover:bg-destructive/20 hover:text-destructive z-10"
      >
        <Trash2 className="h-3 w-3" />
      </Button>

      {/* Idea content - left aligned */}
      <div className="bg-blue-50 rounded-lg p-3 pr-10 relative">
        {/* Category color indicator */}
        {idea.category && (
          <div 
            className="absolute left-0 top-0 bottom-0 w-1 rounded-l-lg"
            style={{ backgroundColor: idea.category.color }}
          />
        )}
        
        <p className="text-sm text-gray-800 leading-relaxed">{idea.content}</p>
        
        {/* AI response */}
        {idea.ai_response && (
          <div className="mt-3 pt-3 border-t border-blue-100">
            <p className="text-xs text-gray-600 leading-relaxed">{idea.ai_response}</p>
          </div>
        )}
        
        {/* Minimal metadata - left aligned */}
        {idea.tags && idea.tags.length > 0 && (
          <div className="mt-2">
            <div className="text-xs text-gray-400">
              {idea.tags.slice(0, 2).join(', ')}
              {idea.tags.length > 2 && ` +${idea.tags.length - 2}`}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}