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
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';

const nodeTypes = {
  idea: IdeaNode,
  category: CategoryNode,
};

const MindMap = () => {
  const { user, isLoading } = useSupabaseAuth();
  const { profile } = useProfile();
  const [showSettings, setShowSettings] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
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
            <Panel position="top-left" className="m-4">
              <div className="flex items-center gap-2 bg-card border border-border rounded-lg px-3 py-2 shadow-soft">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search ideas..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="border-0 bg-transparent focus:ring-0 min-w-[200px]"
                />
              </div>
            </Panel>
            {dataLoading && (
              <Panel position="top-right" className="m-4">
                <div className="bg-card border border-border rounded-lg px-3 py-2 shadow-soft">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                    <span className="text-sm text-muted-foreground">Loading mind map...</span>
                  </div>
                </div>
              </Panel>
            )}
          </ReactFlow>
        </div>
      </main>

      {showSettings && (
        <Settings onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
};

export default MindMap;