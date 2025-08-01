import { MindMapNode, MindMapEdge, SafeNode, SafeEdge } from '@/types/mindmap';

export function validateNode(node: any): node is MindMapNode {
  return (
    node &&
    typeof node.id === 'string' &&
    typeof node.type === 'string' &&
    (node.type === 'idea' || node.type === 'category') &&
    node.position &&
    typeof node.position.x === 'number' &&
    typeof node.position.y === 'number' &&
    node.data &&
    typeof node.data.label === 'string'
  );
}

export function validateEdge(edge: any): edge is MindMapEdge {
  return (
    edge &&
    typeof edge.id === 'string' &&
    typeof edge.source === 'string' &&
    typeof edge.target === 'string'
  );
}

export function sanitizeNode(node: any): SafeNode | null {
  if (!validateNode(node)) {
    console.warn('Invalid node data:', node);
    return null;
  }

  return {
    ...node,
    position: {
      x: node.position.x || 0,
      y: node.position.y || 0,
      z: node.position.z || 0,
    },
    data: {
      label: node.data.label || 'Untitled',
      content: node.data.content || '',
      tags: Array.isArray(node.data.tags) ? node.data.tags : [],
      color: node.data.color || '#8b5cf6',
    },
  };
}

export function sanitizeEdge(edge: any): SafeEdge | null {
  if (!validateEdge(edge)) {
    console.warn('Invalid edge data:', edge);
    return null;
  }

  return {
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type || 'default',
  };
}

export function sanitizeNodes(nodes: any[]): SafeNode[] {
  if (!Array.isArray(nodes)) {
    console.warn('Nodes is not an array:', nodes);
    return [];
  }

  return nodes
    .map(sanitizeNode)
    .filter((node): node is SafeNode => node !== null);
}

export function sanitizeEdges(edges: any[]): SafeEdge[] {
  if (!Array.isArray(edges)) {
    console.warn('Edges is not an array:', edges);
    return [];
  }

  return edges
    .map(sanitizeEdge)
    .filter((edge): edge is SafeEdge => edge !== null);
}