import { Canvas } from '@react-three/fiber';
import { OrbitControls, Stars } from '@react-three/drei';
import { Idea3DNode } from './Idea3DNode';
import { Category3DNode } from './Category3DNode';
import { Connection3D } from './Connection3D';

interface ThreeMindMapProps {
  nodes: any[];
  edges: any[];
  searchTerm?: string;
  filteredNodes?: any[];
}

export function ThreeMindMap({ nodes, edges, searchTerm, filteredNodes }: ThreeMindMapProps) {
  const displayNodes = filteredNodes || nodes;
  const categoryNodes = displayNodes.filter(node => node.type === 'category');
  const ideaNodes = displayNodes.filter(node => node.type === 'idea');

  return (
    <Canvas
      camera={{ position: [0, 0, 50], fov: 75 }}
      style={{ background: 'linear-gradient(135deg, hsl(var(--background)), hsl(var(--muted)))' }}
    >
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={0.8} />
      <pointLight position={[-10, -10, 10]} intensity={0.5} color="#8b5cf6" />
      
      <Stars radius={100} depth={50} count={500} factor={4} saturation={0} fade speed={0.5} />
      
      {/* Render Category Nodes */}
      {categoryNodes.map((node) => (
        <Category3DNode 
          key={node.id} 
          node={node}
          highlighted={searchTerm ? node.data.label.toLowerCase().includes(searchTerm.toLowerCase()) : false}
        />
      ))}
      
      {/* Render Idea Nodes */}
      {ideaNodes.map((node) => (
        <Idea3DNode 
          key={node.id} 
          node={node}
          highlighted={searchTerm ? (
            node.data.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
            node.data.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm.toLowerCase()))
          ) : false}
        />
      ))}
      
      {/* Render Connections */}
      {edges.map((edge) => (
        <Connection3D key={edge.id} edge={edge} nodes={displayNodes} />
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
    </Canvas>
  );
}