import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Suspense, useMemo } from 'react';
import { Idea3DNode } from './Idea3DNode';
import { Category3DNode } from './Category3DNode';
import { Connection3D } from './Connection3D';
import { ErrorBoundary3D } from './ErrorBoundary3D';
import { sanitizeNodes, sanitizeEdges } from '@/utils/mindmapValidation';
import { SafeNode, SafeEdge } from '@/types/mindmap';

interface ThreeMindMapProps {
  nodes: any[];
  edges: any[];
  searchTerm?: string;
  filteredNodes?: any[];
}

export function ThreeMindMap({ nodes, edges, searchTerm, filteredNodes }: ThreeMindMapProps) {
  const { safeNodes, safeEdges, categoryNodes, ideaNodes } = useMemo(() => {
    const rawNodes = filteredNodes || nodes;
    const safeNodes = sanitizeNodes(rawNodes);
    const safeEdges = sanitizeEdges(edges);
    
    const categoryNodes = safeNodes.filter(node => node.type === 'category');
    const ideaNodes = safeNodes.filter(node => node.type === 'idea');
    
    return { safeNodes, safeEdges, categoryNodes, ideaNodes };
  }, [nodes, edges, filteredNodes]);

  const LoadingFallback = () => (
    <mesh position={[0, 0, 0]}>
      <boxGeometry args={[1, 1, 1]} />
      <meshBasicMaterial color="#8b5cf6" transparent opacity={0.3} />
    </mesh>
  );

  return (
    <ErrorBoundary3D
      fallback={
        <div className="w-full h-full flex items-center justify-center bg-gradient-subtle">
          <div className="text-center">
            <div className="text-destructive mb-2">3D View Error</div>
            <div className="text-sm text-muted-foreground">Falling back to safe mode</div>
          </div>
        </div>
      }
    >
      <Canvas
        camera={{ position: [0, 0, 50], fov: 75 }}
        style={{ background: 'linear-gradient(135deg, hsl(var(--background)), hsl(var(--muted)))' }}
        gl={{ antialias: true, alpha: false }}
        dpr={Math.min(window.devicePixelRatio, 2)}
      >
        <Suspense fallback={<LoadingFallback />}>
          <ambientLight intensity={0.3} />
          <pointLight position={[10, 10, 10]} intensity={0.8} />
          <pointLight position={[-10, -10, 10]} intensity={0.5} color="#8b5cf6" />
          
          <Stars radius={100} depth={50} count={500} factor={4} saturation={0} fade speed={0.5} />
          
          {/* Render Category Nodes */}
          {categoryNodes.map((node) => (
            <ErrorBoundary3D key={`category-${node.id}`}>
              <Category3DNode 
                node={node}
                highlighted={searchTerm ? node.data.label.toLowerCase().includes(searchTerm.toLowerCase()) : false}
              />
            </ErrorBoundary3D>
          ))}
          
          {/* Render Idea Nodes */}
          {ideaNodes.map((node) => (
            <ErrorBoundary3D key={`idea-${node.id}`}>
              <Idea3DNode 
                node={node}
                highlighted={searchTerm ? (
                  (node.data.content?.toLowerCase().includes(searchTerm.toLowerCase()) || false) ||
                  (node.data.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase())) || false)
                ) : false}
              />
            </ErrorBoundary3D>
          ))}
          
          {/* Render Connections */}
          {safeEdges.map((edge) => (
            <ErrorBoundary3D key={`connection-${edge.id}`}>
              <Connection3D edge={edge} nodes={safeNodes} />
            </ErrorBoundary3D>
          ))}
          
          <OrbitControls 
            enablePan={true}
            enableZoom={true}
            enableRotate={true}
            minDistance={10}
            maxDistance={100}
            autoRotate={false}
            autoRotateSpeed={0.5}
          />
        </Suspense>
      </Canvas>
    </ErrorBoundary3D>
  );
}