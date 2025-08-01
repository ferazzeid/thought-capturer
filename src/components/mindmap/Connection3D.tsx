import { useMemo } from 'react';
import { Line } from '@react-three/drei';
import * as THREE from 'three';
import { SafeNode, SafeEdge } from '@/types/mindmap';
import { ErrorBoundary3D } from './ErrorBoundary3D';

interface Connection3DProps {
  edge: SafeEdge;
  nodes: SafeNode[];
}

export function Connection3D({ edge, nodes }: Connection3DProps) {
  const points = useMemo(() => {
    try {
      const sourceNode = nodes.find(n => n.id === edge.source);
      const targetNode = nodes.find(n => n.id === edge.target);
      
      if (!sourceNode || !targetNode) {
        console.warn('Missing nodes for edge:', edge.id);
        return [];
      }
      
      const start = new THREE.Vector3(
        (sourceNode.position.x || 0) / 10,
        (sourceNode.position.y || 0) / 10,
        (sourceNode.position.z || 0)
      );
      
      const end = new THREE.Vector3(
        (targetNode.position.x || 0) / 10,
        (targetNode.position.y || 0) / 10,
        (targetNode.position.z || 0)
      );
      
      // Create a curved path for visual appeal
      const distance = start.distanceTo(end);
      const mid = start.clone().lerp(end, 0.5);
      mid.y += Math.min(distance * 0.2, 2); // Limit curve height
      
      const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
      return curve.getPoints(Math.max(10, Math.min(30, Math.floor(distance * 2))));
    } catch (error) {
      console.error('Error calculating connection points:', error);
      return [];
    }
  }, [edge, nodes]);

  if (points.length === 0) return null;

  return (
    <ErrorBoundary3D>
      <Line
        points={points}
        color="#8b5cf6"
        lineWidth={2}
        transparent
        opacity={0.6}
      />
    </ErrorBoundary3D>
  );
}