import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface Category3DNodeProps {
  node: any;
  highlighted?: boolean;
}

export function Category3DNode({ node, highlighted }: Category3DNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const position: [number, number, number] = [
    node.position.x / 10,
    node.position.y / 10,
    node.position.z || 0
  ];

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.01;
      
      if (highlighted) {
        meshRef.current.scale.setScalar(2.5 + Math.sin(state.clock.elapsedTime * 3) * 0.2);
      } else if (hovered) {
        meshRef.current.scale.setScalar(2.2);
      } else {
        meshRef.current.scale.setScalar(2);
      }
    }
  });

  const handleClick = () => {
    console.log('Clicked category:', node.data.label);
  };

  return (
    <group position={position}>
      {/* Main category sphere */}
      <Sphere
        ref={meshRef}
        args={[1, 20, 20]}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={highlighted ? "#ff8cc8" : node.data.color}
          transparent
          opacity={0.7}
          emissive={highlighted ? "#ff69b4" : node.data.color}
          emissiveIntensity={highlighted ? 0.4 : 0.2}
        />
      </Sphere>
      
      {/* Outer glow ring */}
      <Sphere args={[1.5, 16, 16]}>
        <meshBasicMaterial 
          color={node.data.color}
          transparent
          opacity={0.1}
          side={THREE.BackSide}
        />
      </Sphere>
      
      {/* Category label */}
      <Text
        position={[0, 3, 0]}
        fontSize={0.8}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        fontWeight="bold"
      >
        {node.data.label}
      </Text>
    </group>
  );
}