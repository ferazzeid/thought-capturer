import { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text, Sphere } from '@react-three/drei';
import * as THREE from 'three';

interface Idea3DNodeProps {
  node: any;
  highlighted?: boolean;
}

export function Idea3DNode({ node, highlighted }: Idea3DNodeProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const position: [number, number, number] = [
    node.position.x / 10,
    node.position.y / 10,
    node.position.z || 0
  ];

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime) * 0.1;
      meshRef.current.rotation.y += 0.005;
      
      if (highlighted) {
        meshRef.current.scale.setScalar(1.3 + Math.sin(state.clock.elapsedTime * 2) * 0.1);
      } else if (hovered) {
        meshRef.current.scale.setScalar(1.2);
      } else {
        meshRef.current.scale.setScalar(1);
      }
    }
  });

  const handleClick = () => {
    console.log('Clicked idea:', node.data.content);
  };

  return (
    <group position={position}>
      <Sphere
        ref={meshRef}
        args={[1, 16, 16]}
        onClick={handleClick}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <meshStandardMaterial 
          color={highlighted ? "#ff6b6b" : hovered ? "#74c0fc" : "#8b5cf6"}
          transparent
          opacity={0.8}
          emissive={highlighted ? "#ff3333" : hovered ? "#4dabf7" : "#6741d9"}
          emissiveIntensity={highlighted ? 0.3 : hovered ? 0.2 : 0.1}
        />
      </Sphere>
      
      {/* Floating text */}
      <Text
        position={[0, 2, 0]}
        fontSize={0.5}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={8}
        textAlign="center"
      >
        {node.data.content.substring(0, 50)}...
      </Text>
      
      {/* Tag indicators */}
      {node.data.tags?.slice(0, 3).map((tag: string, index: number) => (
        <Sphere
          key={tag}
          args={[0.2, 8, 8]}
          position={[
            Math.cos((index * Math.PI * 2) / 3) * 2,
            0,
            Math.sin((index * Math.PI * 2) / 3) * 2
          ]}
        >
          <meshStandardMaterial color="#ffd43b" emissive="#ffd43b" emissiveIntensity={0.2} />
        </Sphere>
      ))}
    </group>
  );
}