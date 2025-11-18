
import React from 'react';
import { TerrainType, TERRAIN_COLORS } from '../types';
import * as THREE from 'three';

// Reusable Hexagon Geometry
const hexGeometry = new THREE.CylinderGeometry(1, 1, 0.5, 6);

interface HexTileProps {
  x: number;
  z: number;
  terrain: TerrainType;
  onClick: () => void;
  isHovered?: boolean;
}

export const HexTile3D: React.FC<HexTileProps> = ({ x, z, terrain, onClick, isHovered }) => {
  const color = TERRAIN_COLORS[terrain];
  
  // Height variation based on terrain
  let height = 0.5;
  let yPos = 0;
  let terrainColor = color;

  if (terrain === TerrainType.Mountain) {
    height = 1.2;
    yPos = 0.35;
  } else if (terrain === TerrainType.HighMountain) {
    height = 2.0; // Much taller
    yPos = 0.75;
  } else if (terrain === TerrainType.Ocean) {
    yPos = -0.15;
    height = 0.4;
  } else if (terrain === TerrainType.River) {
    yPos = -0.1;
  } else if (terrain === TerrainType.Marsh) {
    yPos = -0.05;
    height = 0.45;
  }

  return (
    <group position={[x, yPos, z]}>
      <mesh 
        geometry={hexGeometry} 
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        scale={[1, height, 1]}
        receiveShadow
        castShadow
      >
        <meshStandardMaterial 
          color={isHovered ? '#e2e8f0' : terrainColor} 
          roughness={0.8}
          metalness={0.05}
        />
      </mesh>
      
      {/* Selection Ring */}
      {isHovered && (
         <mesh position={[0, height/2 + 0.02, 0]} rotation={[-Math.PI/2, 0, 0]}>
            <ringGeometry args={[0.85, 0.95, 6]} />
            <meshBasicMaterial color="white" toneMapped={false} />
         </mesh>
      )}
      
      {/* Forest Details */}
      {terrain === TerrainType.Forest && (
        <group position={[0, 0.5, 0]}>
            {[
                { x: -0.3, z: -0.2, s: 0.8 }, 
                { x: 0.3, z: 0.1, s: 1 }, 
                { x: -0.1, z: 0.4, s: 0.7 }
            ].map((tree, i) => (
                <group key={i} position={[tree.x, 0, tree.z]} scale={[tree.s, tree.s, tree.s]}>
                    <mesh position={[0, 0.4, 0]} castShadow>
                        <coneGeometry args={[0.25, 0.8, 8]} />
                        <meshStandardMaterial color="#14532d" roughness={0.8} />
                    </mesh>
                     <mesh position={[0, 0.1, 0]} castShadow>
                        <cylinderGeometry args={[0.08, 0.08, 0.2, 6]} />
                        <meshStandardMaterial color="#3f2e20" />
                    </mesh>
                </group>
            ))}
        </group>
      )}
      
      {/* Mountain Peaks */}
      {terrain === TerrainType.Mountain && (
        <group position={[0, 0.8, 0]}>
             <mesh position={[0, 0, 0]} castShadow rotation={[0, Math.PI/4, 0]}>
                <coneGeometry args={[0.7, 1, 4]} />
                <meshStandardMaterial color="#78716c" roughness={0.9} flatShading />
            </mesh>
            <mesh position={[0, 0.35, 0]} rotation={[0, Math.PI/4, 0]}>
                <coneGeometry args={[0.32, 0.32, 4]} />
                <meshStandardMaterial color="#f1f5f9" roughness={0.3} flatShading />
            </mesh>
        </group>
      )}

      {/* High Mountain Peaks (Taller, purpler) */}
      {terrain === TerrainType.HighMountain && (
        <group position={[0, 1.2, 0]}>
             <mesh position={[0, 0, 0]} castShadow rotation={[0, Math.PI/4, 0]}>
                <coneGeometry args={[0.8, 1.5, 4]} />
                <meshStandardMaterial color="#475569" roughness={0.9} flatShading />
            </mesh>
            <mesh position={[0, 0.5, 0]} rotation={[0, Math.PI/4, 0]}>
                <coneGeometry args={[0.35, 0.5, 4]} />
                <meshStandardMaterial color="#e2e8f0" roughness={0.3} flatShading />
            </mesh>
        </group>
      )}
    </group>
  );
};

// Helper material for that smooth "game piece" look
const gamePieceMaterial = (color: string) => (
    <meshStandardMaterial 
        color={color} 
        roughness={0.4} 
        metalness={0.1} 
    />
);

export const House3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    const houseColor = "#f97316"; 
    return (
        <group position={position}>
            <group position={[0, 0.3, 0]} scale={[1.1, 1.1, 1.1]}>
                <mesh position={[0, 0.2, 0]} castShadow>
                    <boxGeometry args={[0.5, 0.4, 0.5]} />
                    {gamePieceMaterial(houseColor)}
                </mesh>
                <mesh position={[0, 0.6, 0]} rotation={[0, Math.PI/4, 0]} castShadow>
                    <coneGeometry args={[0.45, 0.4, 4]} /> 
                    {gamePieceMaterial(houseColor)}
                </mesh>
            </group>
        </group>
    );
};

interface Wall3DProps {
    position: [number, number, number];
    connections?: number[]; 
}

export const Wall3D: React.FC<Wall3DProps> = ({ position, connections = [] }) => {
    const stoneColor = "#94a3b8"; 

    return (
        <group position={position}>
            <group position={[0, 0.3, 0]} scale={[1, 1, 1]}>
                <mesh position={[0, 0.3, 0]} castShadow>
                    <cylinderGeometry args={[0.25, 0.3, 0.6, 8]} />
                    {gamePieceMaterial(stoneColor)}
                </mesh>
                 <mesh position={[0, 0.6, 0]} castShadow>
                    <cylinderGeometry args={[0.3, 0.1, 0.15, 8]} />
                    {gamePieceMaterial(stoneColor)}
                </mesh>
                {connections.map((angle, i) => (
                    <group key={i} rotation={[0, (angle * Math.PI) / 180, 0]}>
                        <mesh position={[0.45, 0.25, 0]} castShadow>
                            <boxGeometry args={[0.55, 0.4, 0.15]} />
                            {gamePieceMaterial(stoneColor)}
                        </mesh>
                         <mesh position={[0.45, 0.5, 0]}>
                            <boxGeometry args={[0.5, 0.1, 0.18]} />
                             {gamePieceMaterial(stoneColor)}
                        </mesh>
                    </group>
                ))}
            </group>
        </group>
    );
};

export const Temple3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    const marbleColor = "#f1f5f9"; 
    const roofColor = "#3b82f6"; 

    return (
        <group position={position}>
            <group scale={[1.2, 1.2, 1.2]} position={[0, 0.3, 0]}>
                 <mesh position={[0, 0.05, 0]} receiveShadow>
                    <cylinderGeometry args={[0.6, 0.65, 0.1, 8]} />
                    {gamePieceMaterial("#cbd5e1")}
                </mesh>
                <mesh position={[0, 0.35, 0]} castShadow>
                    <cylinderGeometry args={[0.5, 0.5, 0.5, 16]} />
                    {gamePieceMaterial(marbleColor)}
                </mesh>
                <group position={[0, 0.3, 0.4]}>
                    <mesh position={[0, 0, 0]} castShadow>
                        <boxGeometry args={[0.4, 0.5, 0.2]} />
                        {gamePieceMaterial(marbleColor)}
                    </mesh>
                    <mesh position={[0, 0.35, 0]} rotation={[0, Math.PI/4, 0]}>
                         <coneGeometry args={[0.35, 0.25, 4]} />
                         {gamePieceMaterial(marbleColor)}
                    </mesh>
                </group>
                <mesh position={[0, 0.6, 0]} castShadow>
                    <sphereGeometry args={[0.5, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    {gamePieceMaterial(roofColor)}
                </mesh>
            </group>
        </group>
    );
};

export const Amphitheatre3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    const stoneColor = "#e7e5e4"; 
    
    return (
        <group position={position}>
            <group scale={[1.1, 1.1, 1.1]} position={[0, 0.2, 0]}>
                <mesh position={[0, 0.25, 0]} castShadow>
                    <cylinderGeometry args={[0.7, 0.7, 0.5, 16]} />
                    {gamePieceMaterial(stoneColor)}
                </mesh>
                <mesh position={[0, 0.35, 0]} castShadow>
                     <cylinderGeometry args={[0.7, 0.6, 0.1, 16]} />
                     <meshStandardMaterial color="#d6d3d1" />
                </mesh>
                 <mesh position={[0, 0.25, 0]} castShadow>
                     <cylinderGeometry args={[0.6, 0.5, 0.1, 16]} />
                     <meshStandardMaterial color="#a8a29e" />
                </mesh>
                 <mesh position={[0, 0.15, 0]} castShadow>
                     <cylinderGeometry args={[0.5, 0.4, 0.1, 16]} />
                     <meshStandardMaterial color="#78716c" />
                </mesh>
                <mesh position={[0, 0.3, 0]}>
                    <cylinderGeometry args={[0.35, 0.35, 0.4, 16]} />
                    <meshStandardMaterial color="#78350f" roughness={0.9} /> 
                </mesh>
                <mesh position={[0, 0.1, 0.6]}>
                     <boxGeometry args={[0.2, 0.4, 0.3]} />
                     <meshStandardMaterial color="#44403c" />
                </mesh>
            </group>
        </group>
    );
};
