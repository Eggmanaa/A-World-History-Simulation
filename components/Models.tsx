
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

  // Visual tweaks based on reference
  if (terrain === TerrainType.Mountain) {
    height = 1.2;
    yPos = 0.35;
    terrainColor = '#57534e'; // Stone grey/brown
  } else if (terrain === TerrainType.Ocean) {
    yPos = -0.15;
    height = 0.4;
    terrainColor = '#1e40af';
  } else if (terrain === TerrainType.River) {
    yPos = -0.1;
    terrainColor = '#3b82f6';
  } else if (terrain === TerrainType.Desert) {
    terrainColor = '#fbbf24'; // Sand
  } else if (terrain === TerrainType.Forest) {
    terrainColor = '#14532d'; // Dark Green
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
      
      {/* Forest Details (Low Poly Trees - Board Game Style) */}
      {terrain === TerrainType.Forest && (
        <group position={[0, 0.5, 0]}>
            {[
                { x: -0.3, z: -0.2, s: 0.8 }, 
                { x: 0.3, z: 0.1, s: 1 }, 
                { x: -0.1, z: 0.4, s: 0.7 }
            ].map((tree, i) => (
                <group key={i} position={[tree.x, 0, tree.z]} scale={[tree.s, tree.s, tree.s]}>
                    {/* Cone Tree - Very stylized */}
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
      
      {/* Mountain Peaks - Stylized Pyramids */}
      {terrain === TerrainType.Mountain && (
        <group position={[0, 0.8, 0]}>
             <mesh position={[0, 0, 0]} castShadow>
                <coneGeometry args={[0.7, 1, 4]} rotation={[0, Math.PI/4, 0]} />
                <meshStandardMaterial color="#57534e" roughness={0.9} flatShading />
            </mesh>
            {/* Snow Cap */}
            <mesh position={[0, 0.35, 0]}>
                <coneGeometry args={[0.32, 0.32, 4]} rotation={[0, Math.PI/4, 0]} />
                <meshStandardMaterial color="#f1f5f9" roughness={0.3} flatShading />
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
    // Style: Clean wooden token
    const houseColor = "#f97316"; // Orange-500

    return (
        <group position={position}>
            <group position={[0, 0.3, 0]} scale={[1.1, 1.1, 1.1]}>
                {/* Base Block */}
                <mesh position={[0, 0.2, 0]} castShadow>
                    <boxGeometry args={[0.5, 0.4, 0.5]} />
                    {gamePieceMaterial(houseColor)}
                </mesh>
                {/* Roof Prism */}
                <mesh position={[0, 0.6, 0]} rotation={[0, Math.PI/4, 0]} castShadow>
                    <coneGeometry args={[0.45, 0.4, 4]} /> 
                    {gamePieceMaterial(houseColor)}
                </mesh>
            </group>
        </group>
    );
};

export const Wall3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    // Style: Stone Fortification Token
    const stoneColor = "#94a3b8"; // Slate-400

    return (
        <group position={position}>
            <group position={[0, 0.3, 0]} scale={[1.2, 1.2, 1.2]}>
                {/* Main Octagonal Tower */}
                <mesh position={[0, 0.25, 0]} castShadow>
                    <cylinderGeometry args={[0.4, 0.45, 0.5, 8]} />
                    {gamePieceMaterial(stoneColor)}
                </mesh>
                {/* Crenellations */}
                <group position={[0, 0.55, 0]}>
                     <mesh castShadow>
                        <ringGeometry args={[0.3, 0.45, 8]} />
                        <meshStandardMaterial color={stoneColor} side={THREE.DoubleSide} />
                     </mesh>
                     {/* Spikes/Teeth */}
                     {[0, 45, 90, 135, 180, 225, 270, 315].map((rot, i) => (
                         <mesh key={i} position={[Math.sin(rot * Math.PI/180)*0.37, 0.1, Math.cos(rot * Math.PI/180)*0.37]}>
                             <boxGeometry args={[0.1, 0.2, 0.1]} />
                             {gamePieceMaterial(stoneColor)}
                         </mesh>
                     ))}
                </group>
            </group>
        </group>
    );
};

export const Temple3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    // Style: Pristine White Marble Temple Token
    const marbleColor = "#f1f5f9"; // Slate-100
    const roofColor = "#3b82f6"; // Blue roof for contrast

    return (
        <group position={position}>
            <group scale={[1.1, 1.1, 1.1]} position={[0, 0.3, 0]}>
                {/* Base */}
                 <mesh position={[0, 0.05, 0]} receiveShadow>
                    <boxGeometry args={[0.7, 0.1, 0.7]} />
                    {gamePieceMaterial("#cbd5e1")}
                </mesh>
                
                {/* Pillars (Simplified as a block with texture or just distinct cylinders) */}
                {/* Using 4 corner pillars for cleaner look */}
                <group>
                    {[-0.25, 0.25].map(x => [-0.25, 0.25].map(z => (
                        <mesh key={`${x}-${z}`} position={[x, 0.35, z]} castShadow>
                            <cylinderGeometry args={[0.08, 0.08, 0.5, 8]} />
                            {gamePieceMaterial(marbleColor)}
                        </mesh>
                    )))}
                </group>

                {/* Inner Sanctum */}
                 <mesh position={[0, 0.35, 0]}>
                    <boxGeometry args={[0.4, 0.5, 0.4]} />
                    {gamePieceMaterial(marbleColor)}
                </mesh>

                {/* Roof */}
                <mesh position={[0, 0.7, 0]} rotation={[0, 0, 0]} castShadow>
                     {/* Pyramid roof */}
                    <coneGeometry args={[0.55, 0.3, 4]} rotation={[0, Math.PI/4, 0]} />
                    {gamePieceMaterial(roofColor)}
                </mesh>
            </group>
        </group>
    );
};

export const Amphitheatre3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    // Style: Classical Stone Amphitheatre
    const stoneColor = "#e7e5e4"; // Warm grey/stone
    
    return (
        <group position={position}>
            <group scale={[1, 1, 1]} position={[0, 0.3, 0]}>
                {/* Base Ring */}
                <mesh position={[0, 0.15, 0]} castShadow>
                    <cylinderGeometry args={[0.65, 0.7, 0.3, 16]} />
                    {gamePieceMaterial(stoneColor)}
                </mesh>

                {/* Upper Tier (Half circle) */}
                 <mesh position={[0, 0.4, 0.1]} castShadow>
                    <cylinderGeometry args={[0.65, 0.65, 0.3, 16, 1, false, 0, Math.PI]} rotation={[0, Math.PI/2, 0]} />
                    <meshStandardMaterial color={stoneColor} side={THREE.DoubleSide} roughness={0.5} />
                </mesh>
                
                {/* Inner Floor */}
                <mesh position={[0, 0.31, 0]}>
                    <cylinderGeometry args={[0.5, 0.5, 0.05, 16]} />
                    <meshStandardMaterial color="#78350f" /> {/* Dirt/Wood floor */}
                </mesh>

                {/* Detail: Little archway entries */}
                <mesh position={[0, 0.15, 0.7]}>
                     <boxGeometry args={[0.2, 0.3, 0.1]} />
                     <meshStandardMaterial color="#44403c" />
                </mesh>
            </group>
        </group>
    );
};
