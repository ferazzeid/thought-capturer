import { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Tag } from 'lucide-react';

interface CategoryNodeData {
  id: string;
  label: string;
  color: string;
  type: 'category';
}

interface CategoryNodeProps {
  data: CategoryNodeData;
  selected?: boolean;
}

export const CategoryNode = memo(({ data, selected }: CategoryNodeProps) => {
  return (
    <div 
      className={`
        bg-card border-2 rounded-full p-4 shadow-soft min-w-[120px] min-h-[120px]
        flex flex-col items-center justify-center text-center
        ${selected ? 'ring-2 ring-primary' : ''}
        hover:shadow-md transition-all duration-200
      `}
      style={{ borderColor: data.color }}
    >
      <Handle 
        type="source" 
        position={Position.Top}
        className="!w-3 !h-3"
        style={{ background: data.color, border: `2px solid ${data.color}` }}
      />
      <Handle 
        type="source" 
        position={Position.Right}
        className="!w-3 !h-3"
        style={{ background: data.color, border: `2px solid ${data.color}` }}
      />
      <Handle 
        type="source" 
        position={Position.Bottom}
        className="!w-3 !h-3"
        style={{ background: data.color, border: `2px solid ${data.color}` }}
      />
      <Handle 
        type="source" 
        position={Position.Left}
        className="!w-3 !h-3"
        style={{ background: data.color, border: `2px solid ${data.color}` }}
      />
      
      <Tag 
        className="h-6 w-6 mb-2" 
        style={{ color: data.color }}
      />
      <span 
        className="text-sm font-medium break-words"
        style={{ color: data.color }}
      >
        {data.label}
      </span>
    </div>
  );
});