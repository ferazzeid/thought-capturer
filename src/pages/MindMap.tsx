import { useState, useMemo, useCallback } from 'react';
import { Navigate } from 'react-router-dom';
import {
  ReactFlow,
  Node,
  Edge,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Background,
  Controls,
  MiniMap,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useSupabaseAuth } from '@/components/SupabaseAuthProvider';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';
import { Settings } from '@/components/Settings';
import { useProfile } from '@/hooks/useProfile';
import { useMindMapData } from '@/hooks/useMindMapData';
import { IdeaNode } from '@/components/mindmap/IdeaNode';
import { CategoryNode } from '@/components/mindmap/CategoryNode';
import { ThreeMindMap } from '@/components/mindmap/ThreeMindMap';
import { Search, Layers } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const nodeTypes = {
  idea: IdeaNode,
  category: CategoryNode,
};

const MindMap = () => {
  const { user, isLoading } = useSupabaseAuth();
  const { profile } = useProfile();
  const [showSettings, setShowSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [is3D, setIs3D] = useState(false);
  
  const { nodes: initialNodes, edges: initialEdges, isLoading: dataLoading } = useMindMapData();
  
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Filter nodes based on search term
  const filteredNodes = useMemo(() => {
    if (!searchTerm) return nodes;
    return nodes.filter(node => {
      const label = typeof node.data.label === 'string' ? node.data.label : '';
      const content = typeof node.data.content === 'string' ? node.data.content : '';
      const tags = Array.isArray(node.data.tags) ? node.data.tags : [];
      
      return label.toLowerCase().includes(searchTerm.toLowerCase()) ||
             content.toLowerCase().includes(searchTerm.toLowerCase()) ||
             tags.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    });
  }, [nodes, searchTerm]);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  // Update nodes when initial data changes
  useMemo(() => {
    setNodes(initialNodes);
    setEdges(initialEdges);
  }, [initialNodes, initialEdges, setNodes, setEdges]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <Header 
        onOpenSettings={() => setShowSettings(true)}
        hasApiKey={!!profile?.api_key}
      />
      <Navigation />
      
      <main className="pb-safe h-[calc(100vh-120px)]">
        <div className="w-full h-full relative">
          {is3D ? (
            <ThreeMindMap 
              nodes={nodes}
              edges={edges}
              searchTerm={searchTerm}
              filteredNodes={filteredNodes}
            />
          ) : (
            <ReactFlow
              nodes={filteredNodes}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              nodeTypes={nodeTypes}
              fitView
              fitViewOptions={{
                padding: 0.1,
                maxZoom: 1,
              }}
              className="bg-gradient-subtle"
              proOptions={{ hideAttribution: true }}
            >
              <Background />
              <Controls />
              <MiniMap 
                className="!bg-card !border-border"
                nodeColor="#8b5cf6"
                maskColor="rgba(0, 0, 0, 0.1)"
              />
            </ReactFlow>
          )}
          
          {/* Search Panel */}
          <div className="absolute top-4 left-4 z-10">
            <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 shadow-soft">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search ideas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border-0 bg-transparent focus:ring-0 min-w-[200px]"
              />
            </div>
          </div>
          
          {/* 2D/3D Toggle */}
          <div className="absolute top-4 right-4 z-10">
            <Button
              variant={is3D ? "default" : "outline"}
              size="sm"
              onClick={() => setIs3D(!is3D)}
              className="flex items-center gap-2"
            >
              <Layers className="h-4 w-4" />
              {is3D ? '3D' : '2D'}
            </Button>
          </div>
          
          {dataLoading && (
            <div className="absolute top-16 right-4 z-10">
              <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-soft">
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span className="text-sm text-muted-foreground">Loading mind map...</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default MindMap;