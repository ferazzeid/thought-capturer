import { useMemo } from 'react';
import * as THREE from 'three';

interface Connection3DProps {
  edge: any;
  nodes: any[];
}

export function Connection3D({ edge, nodes }: Connection3DProps) {
  const points = useMemo(() => {
    const sourceNode = nodes.find(n => n.id === edge.source);
    const targetNode = nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) return [];
    
    const start = new THREE.Vector3(
      sourceNode.position.x / 10,
      sourceNode.position.y / 10,
      sourceNode.position.z || 0
    );
    
    const end = new THREE.Vector3(
      targetNode.position.x / 10,
      targetNode.position.y / 10,
      targetNode.position.z || 0
    );
    
    // Create a curved path
    const mid = start.clone().lerp(end, 0.5);
    mid.y += Math.abs(start.x - end.x) * 0.2; // Add some curve
    
    const curve = new THREE.QuadraticBezierCurve3(start, mid, end);
    return curve.getPoints(20);
  }, [edge, nodes]);

  const geometry = useMemo(() => {
    if (points.length === 0) return null;
    
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(points.flatMap(p => [p.x, p.y, p.z]));
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geometry;
  }, [points]);

  if (!geometry) return null;

  return (
    <line>
      <primitive object={geometry} attach="geometry" />
      <lineBasicMaterial 
        color="#8b5cf6" 
        transparent 
        opacity={0.4}
      />
    </line>
  );
}