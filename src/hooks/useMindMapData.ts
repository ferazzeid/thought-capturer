import { useState, useEffect } from 'react';
import { Node, Edge } from '@xyflow/react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/components/SupabaseAuthProvider';

interface Position3D {
  x: number;
  y: number;
  z?: number;
}

interface Idea {
  id: string;
  content: string;
  tags: string[];
  category_id: string | null;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  color: string;
}

interface ExtendedNode extends Omit<Node, 'position'> {
  position: Position3D;
}

export function useMindMapData() {
  const { user } = useSupabaseAuth();
  const [nodes, setNodes] = useState<ExtendedNode[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setIsLoading(true);
      
      try {
        // Fetch ideas and categories
        const [ideasResult, categoriesResult] = await Promise.all([
          supabase
            .from('ideas')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false }),
          supabase
            .from('categories')
            .select('*')
            .or(`user_id.eq.${user.id},is_default.eq.true`)
            .order('is_default', { ascending: false })
        ]);

        if (ideasResult.error) throw ideasResult.error;
        if (categoriesResult.error) throw categoriesResult.error;

        const ideas: Idea[] = ideasResult.data || [];
        const categories: Category[] = categoriesResult.data || [];

        // Create category nodes
        const categoryNodes: ExtendedNode[] = categories.map((category, index) => ({
          id: `category-${category.id}`,
          type: 'category',
          position: {
            x: Math.cos((index * 2 * Math.PI) / categories.length) * 300,
            y: Math.sin((index * 2 * Math.PI) / categories.length) * 300,
            z: Math.sin((index * 2 * Math.PI) / categories.length * 2) * 100, // Add 3D positioning
          },
          data: {
            id: category.id,
            label: category.name,
            color: category.color,
            type: 'category',
          },
        }));

        // Create idea nodes positioned around their categories
        const ideaNodes: ExtendedNode[] = [];
        const categoryIdeasMap = new Map<string, Idea[]>();
        
        // Group ideas by category
        ideas.forEach(idea => {
          const categoryId = idea.category_id || 'uncategorized';
          if (!categoryIdeasMap.has(categoryId)) {
            categoryIdeasMap.set(categoryId, []);
          }
          categoryIdeasMap.get(categoryId)!.push(idea);
        });

        // Position ideas around their categories
        categoryIdeasMap.forEach((categoryIdeas, categoryId) => {
          const categoryNode = categoryNodes.find(node => node.data.id === categoryId);
          const categoryCenter: Position3D = categoryNode ? categoryNode.position : { x: 0, y: 0, z: 0 };
          
          categoryIdeas.forEach((idea, index) => {
            const angle = (index * 2 * Math.PI) / categoryIdeas.length;
            const radius = 150 + Math.random() * 50; // Add some randomness
            
            ideaNodes.push({
              id: `idea-${idea.id}`,
              type: 'idea',
              position: {
                x: categoryCenter.x + Math.cos(angle) * radius,
                y: categoryCenter.y + Math.sin(angle) * radius,
                z: (categoryCenter.z || 0) + Math.sin(angle + index) * 50, // Add 3D positioning
              },
              data: {
                id: idea.id,
                content: idea.content,
                tags: idea.tags || [],
                categoryId: idea.category_id,
                createdAt: idea.created_at,
                type: 'idea',
              },
            });
          });
        });

        // Create edges between ideas and categories
        const categoryEdges: Edge[] = ideas
          .filter(idea => idea.category_id)
          .map(idea => ({
            id: `edge-${idea.id}-${idea.category_id}`,
            source: `category-${idea.category_id}`,
            target: `idea-${idea.id}`,
            type: 'smoothstep',
            style: { stroke: '#8b5cf6', strokeWidth: 2, opacity: 0.6 },
            animated: false,
          }));

        // Create edges between ideas with shared tags
        const tagEdges: Edge[] = [];
        for (let i = 0; i < ideas.length; i++) {
          for (let j = i + 1; j < ideas.length; j++) {
            const idea1 = ideas[i];
            const idea2 = ideas[j];
            const sharedTags = idea1.tags.filter(tag => idea2.tags.includes(tag));
            
            if (sharedTags.length > 0) {
              tagEdges.push({
                id: `tag-edge-${idea1.id}-${idea2.id}`,
                source: `idea-${idea1.id}`,
                target: `idea-${idea2.id}`,
                type: 'smoothstep',
                style: { 
                  stroke: '#10b981', 
                  strokeWidth: Math.min(sharedTags.length, 3),
                  opacity: 0.4,
                  strokeDasharray: '5,5',
                },
                animated: false,
                label: sharedTags.length > 1 ? `${sharedTags.length} shared tags` : sharedTags[0],
              });
            }
          }
        }

        setNodes([...categoryNodes, ...ideaNodes]);
        setEdges([...categoryEdges, ...tagEdges]);
      } catch (error) {
        console.error('Error fetching mind map data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  return { nodes, edges, isLoading };
}