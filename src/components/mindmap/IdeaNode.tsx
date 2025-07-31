import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Badge } from '@/components/ui/badge';
import { MessageCircle } from 'lucide-react';

interface IdeaNodeData {
  id: string;
  content: string;
  tags: string[];
  categoryId: string | null;
  createdAt: string;
  type: 'idea';
}

interface IdeaNodeProps {
  data: IdeaNodeData;
  selected?: boolean;
}

export const IdeaNode = memo(({ data, selected }: IdeaNodeProps) => {
  const truncatedContent = data.content.length > 100 
    ? data.content.substring(0, 100) + '...' 
    : data.content;

  return (
    <div className={`
      bg-card border border-border rounded-lg p-3 shadow-soft min-w-[200px] max-w-[300px]
      ${selected ? 'ring-2 ring-primary' : ''}
      hover:shadow-md transition-all duration-200
    `}>
      <Handle 
        type="target" 
        position={Position.Top}
        className="!bg-primary !border-primary-foreground !w-2 !h-2"
      />
      <Handle 
        type="source" 
        position={Position.Bottom}
        className="!bg-primary !border-primary-foreground !w-2 !h-2"
      />
      
      <div className="flex items-start gap-2">
        <MessageCircle className="h-4 w-4 text-primary mt-1 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-foreground leading-relaxed break-words">
            {truncatedContent}
          </p>
          
          {data.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {data.tags.slice(0, 3).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="secondary" 
                  className="text-xs px-1.5 py-0.5"
                >
                  #{tag}
                </Badge>
              ))}
              {data.tags.length > 3 && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                  +{data.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
          
          <div className="text-xs text-muted-foreground mt-2">
            {new Date(data.createdAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
});