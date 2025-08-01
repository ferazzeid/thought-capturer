export interface Position3D {
  x: number;
  y: number;
  z: number;
}

export interface NodeData {
  label: string;
  content?: string;
  tags?: string[];
  color?: string;
}

export interface MindMapNode {
  id: string;
  type: 'idea' | 'category';
  position: Position3D;
  data: NodeData;
}

export interface MindMapEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

export interface SafeNode extends MindMapNode {
  position: Required<Position3D>;
  data: Required<NodeData>;
}

export interface SafeEdge extends MindMapEdge {
  source: string;
  target: string;
}