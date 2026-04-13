
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
    // Rustic house with steep red-tiled roof and stone base (Mediterranean style)
    const roofColor = "#8B4513"; // Red-brown terracotta roof tiles
    const stoneColor = "#D4C4A8"; // Warm beige stone
    const woodColor = "#5D4E37"; // Dark wood accents

    return (
        <group position={position}>
            <group position={[0, 0.3, 0]} scale={[0.9, 0.9, 0.9]}>
                {/* Stone foundation/base */}
                <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.6, 0.15, 0.55]} />
                    <meshStandardMaterial color="#9B8B7A" roughness={0.9} flatShading />
                </mesh>

                {/* Main stone walls */}
                <mesh position={[0, 0.32, 0]} castShadow>
                    <boxGeometry args={[0.5, 0.4, 0.45]} />
                    <meshStandardMaterial color={stoneColor} roughness={0.85} flatShading />
                </mesh>

                {/* Wood beam detail on front */}
                <mesh position={[0, 0.35, 0.23]} castShadow>
                    <boxGeometry args={[0.45, 0.08, 0.02]} />
                    <meshStandardMaterial color={woodColor} roughness={0.7} />
                </mesh>

                {/* Steep roof - terracotta tiles (4-sided pyramid) */}
                <mesh position={[0, 0.72, 0]} rotation={[0, Math.PI/4, 0]} castShadow>
                    <coneGeometry args={[0.42, 0.5, 4]} />
                    <meshStandardMaterial color={roofColor} roughness={0.8} flatShading />
                </mesh>

                {/* Roof trim */}
                <mesh position={[0, 0.52, 0]} rotation={[0, Math.PI/4, 0]} castShadow>
                    <boxGeometry args={[0.55, 0.04, 0.55]} />
                    <meshStandardMaterial color={woodColor} roughness={0.6} />
                </mesh>

                {/* Door */}
                <mesh position={[0, 0.25, 0.23]} castShadow>
                    <boxGeometry args={[0.12, 0.22, 0.02]} />
                    <meshStandardMaterial color="#3D2817" roughness={0.8} />
                </mesh>

                {/* Small window */}
                <mesh position={[0.15, 0.38, 0.23]} castShadow>
                    <boxGeometry args={[0.08, 0.08, 0.02]} />
                    <meshStandardMaterial color="#87CEEB" roughness={0.3} metalness={0.1} />
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
    // Robust beige/tan stone wall with battlements (low-poly style)
    const stoneColor = "#C9B896"; // Warm beige stone
    const darkStone = "#A89B7E"; // Darker accent stone

    return (
        <group position={position}>
            <group position={[0, 0.3, 0]} scale={[0.95, 0.95, 0.95]}>
                {/* Main wall tower base */}
                <mesh position={[0, 0.25, 0]} castShadow receiveShadow>
                    <cylinderGeometry args={[0.32, 0.38, 0.5, 6]} />
                    <meshStandardMaterial color={stoneColor} roughness={0.9} flatShading />
                </mesh>

                {/* Stone texture band */}
                <mesh position={[0, 0.12, 0]} castShadow>
                    <cylinderGeometry args={[0.36, 0.4, 0.08, 6]} />
                    <meshStandardMaterial color={darkStone} roughness={0.95} flatShading />
                </mesh>

                {/* Top platform */}
                <mesh position={[0, 0.52, 0]} castShadow>
                    <cylinderGeometry args={[0.36, 0.32, 0.06, 6]} />
                    <meshStandardMaterial color={darkStone} roughness={0.85} flatShading />
                </mesh>

                {/* Battlements (crenellations) */}
                {[0, 60, 120, 180, 240, 300].map((angle, i) => (
                    <mesh
                        key={i}
                        position={[
                            Math.cos(angle * Math.PI / 180) * 0.28,
                            0.62,
                            Math.sin(angle * Math.PI / 180) * 0.28
                        ]}
                        castShadow
                    >
                        <boxGeometry args={[0.1, 0.14, 0.1]} />
                        <meshStandardMaterial color={stoneColor} roughness={0.9} flatShading />
                    </mesh>
                ))}

                {/* Wall connections to other segments */}
                {connections.map((angle, i) => (
                    <group key={i} rotation={[0, (angle * Math.PI) / 180, 0]}>
                        {/* Wall segment */}
                        <mesh position={[0.48, 0.2, 0]} castShadow receiveShadow>
                            <boxGeometry args={[0.6, 0.4, 0.18]} />
                            <meshStandardMaterial color={stoneColor} roughness={0.9} flatShading />
                        </mesh>
                        {/* Wall top crenellations */}
                        {[-0.2, 0.2].map((offset, j) => (
                            <mesh key={j} position={[0.48 + offset, 0.47, 0]} castShadow>
                                <boxGeometry args={[0.15, 0.12, 0.2]} />
                                <meshStandardMaterial color={stoneColor} roughness={0.9} flatShading />
                            </mesh>
                        ))}
                    </group>
                ))}
            </group>
        </group>
    );
};

export const Temple3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    // Classical Greek/Roman temple with columns and triangular pediment
    const marbleColor = "#E8E4DC"; // Warm off-white marble
    const columnColor = "#DDD8CC"; // Slightly darker for columns
    const roofColor = "#8B7355"; // Terracotta/bronze roof
    const baseColor = "#C9C0B0"; // Stone base

    return (
        <group position={position}>
            <group scale={[0.85, 0.85, 0.85]} position={[0, 0.3, 0]}>
                {/* Stepped base (stylobate) */}
                <mesh position={[0, 0.04, 0]} receiveShadow castShadow>
                    <boxGeometry args={[0.95, 0.08, 0.7]} />
                    <meshStandardMaterial color={baseColor} roughness={0.85} flatShading />
                </mesh>
                <mesh position={[0, 0.12, 0]} receiveShadow castShadow>
                    <boxGeometry args={[0.85, 0.08, 0.6]} />
                    <meshStandardMaterial color={marbleColor} roughness={0.8} flatShading />
                </mesh>

                {/* Floor/Cella base */}
                <mesh position={[0, 0.2, 0]} receiveShadow>
                    <boxGeometry args={[0.75, 0.08, 0.5]} />
                    <meshStandardMaterial color={marbleColor} roughness={0.75} flatShading />
                </mesh>

                {/* Columns - front row */}
                {[-0.28, -0.09, 0.09, 0.28].map((x, i) => (
                    <group key={`front-${i}`} position={[x, 0.42, 0.18]}>
                        {/* Column shaft */}
                        <mesh castShadow>
                            <cylinderGeometry args={[0.045, 0.055, 0.4, 8]} />
                            <meshStandardMaterial color={columnColor} roughness={0.7} flatShading />
                        </mesh>
                        {/* Column capital */}
                        <mesh position={[0, 0.22, 0]} castShadow>
                            <boxGeometry args={[0.1, 0.05, 0.1]} />
                            <meshStandardMaterial color={marbleColor} roughness={0.6} flatShading />
                        </mesh>
                    </group>
                ))}

                {/* Columns - back row */}
                {[-0.28, -0.09, 0.09, 0.28].map((x, i) => (
                    <group key={`back-${i}`} position={[x, 0.42, -0.18]}>
                        <mesh castShadow>
                            <cylinderGeometry args={[0.045, 0.055, 0.4, 8]} />
                            <meshStandardMaterial color={columnColor} roughness={0.7} flatShading />
                        </mesh>
                        <mesh position={[0, 0.22, 0]} castShadow>
                            <boxGeometry args={[0.1, 0.05, 0.1]} />
                            <meshStandardMaterial color={marbleColor} roughness={0.6} flatShading />
                        </mesh>
                    </group>
                ))}

                {/* Inner cella/sanctuary */}
                <mesh position={[0, 0.42, 0]} castShadow>
                    <boxGeometry args={[0.35, 0.38, 0.25]} />
                    <meshStandardMaterial color={marbleColor} roughness={0.75} flatShading />
                </mesh>

                {/* Entablature (horizontal beam) */}
                <mesh position={[0, 0.66, 0]} castShadow>
                    <boxGeometry args={[0.8, 0.06, 0.55]} />
                    <meshStandardMaterial color={marbleColor} roughness={0.7} flatShading />
                </mesh>

                {/* Triangular pediment (roof) */}
                <mesh position={[0, 0.82, 0]} rotation={[0, Math.PI/2, 0]} castShadow>
                    <coneGeometry args={[0.45, 0.28, 3]} />
                    <meshStandardMaterial color={roofColor} roughness={0.8} flatShading />
                </mesh>

                {/* Roof ridge ornament */}
                <mesh position={[0, 0.95, 0]} castShadow>
                    <sphereGeometry args={[0.05, 6, 6]} />
                    <meshStandardMaterial color="#B8860B" roughness={0.4} metalness={0.3} />
                </mesh>
            </group>
        </group>
    );
};

export const Amphitheatre3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    // Semi-circular amphitheatre with tiered seating (Roman style)
    const stoneColor = "#D4CAB8"; // Warm limestone
    const seatColor = "#C4B8A4"; // Slightly darker for seats
    const stageColor = "#8B7355"; // Dark wood/earth stage
    const archColor = "#BFB5A3"; // Arch stone color

    return (
        <group position={position}>
            <group scale={[0.85, 0.85, 0.85]} position={[0, 0.25, 0]}>
                {/* Base foundation */}
                <mesh position={[0, 0.02, 0]} receiveShadow>
                    <cylinderGeometry args={[0.75, 0.8, 0.04, 16, 1, false, 0, Math.PI]} />
                    <meshStandardMaterial color={"#A89B7E"} roughness={0.9} flatShading />
                </mesh>

                {/* Tiered seating - semicircular rows */}
                {[0.7, 0.58, 0.46, 0.34].map((radius, tier) => (
                    <mesh
                        key={tier}
                        position={[0, 0.08 + tier * 0.12, -0.02 * tier]}
                        castShadow
                    >
                        <cylinderGeometry args={[radius, radius + 0.04, 0.1, 12, 1, false, 0, Math.PI]} />
                        <meshStandardMaterial
                            color={tier % 2 === 0 ? seatColor : stoneColor}
                            roughness={0.85}
                            flatShading
                        />
                    </mesh>
                ))}

                {/* Top wall/rim of amphitheatre */}
                <mesh position={[0, 0.58, -0.08]} castShadow>
                    <cylinderGeometry args={[0.72, 0.75, 0.08, 12, 1, false, 0, Math.PI]} />
                    <meshStandardMaterial color={archColor} roughness={0.8} flatShading />
                </mesh>

                {/* Arched entrances on sides */}
                {[-0.62, 0.62].map((x, i) => (
                    <group key={i} position={[x, 0.25, 0.15]} rotation={[0, i === 0 ? 0.3 : -0.3, 0]}>
                        <mesh castShadow>
                            <boxGeometry args={[0.12, 0.35, 0.15]} />
                            <meshStandardMaterial color={stoneColor} roughness={0.85} flatShading />
                        </mesh>
                        {/* Arch top */}
                        <mesh position={[0, 0.2, 0]} castShadow>
                            <cylinderGeometry args={[0.06, 0.06, 0.15, 8, 1, false, 0, Math.PI]} />
                            <meshStandardMaterial color={archColor} roughness={0.8} flatShading />
                        </mesh>
                    </group>
                ))}

                {/* Orchestra/Stage area (half circle at front) */}
                <mesh position={[0, 0.06, 0.25]} rotation={[-Math.PI/2, 0, 0]} receiveShadow>
                    <circleGeometry args={[0.25, 16, 0, Math.PI]} />
                    <meshStandardMaterial color={stageColor} roughness={0.9} flatShading />
                </mesh>

                {/* Stage back wall (scaenae frons) */}
                <mesh position={[0, 0.2, 0.45]} castShadow>
                    <boxGeometry args={[0.6, 0.32, 0.06]} />
                    <meshStandardMaterial color={stoneColor} roughness={0.8} flatShading />
                </mesh>

                {/* Decorative columns on stage wall */}
                {[-0.2, 0, 0.2].map((x, i) => (
                    <mesh key={i} position={[x, 0.2, 0.42]} castShadow>
                        <cylinderGeometry args={[0.025, 0.03, 0.3, 6]} />
                        <meshStandardMaterial color={"#E8E0D4"} roughness={0.6} flatShading />
                    </mesh>
                ))}
            </group>
        </group>
    );
};

export const Wonder3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    return (
        <group position={position}>
            {/* Ziggurat - stepped pyramid */}
            <group position={[0, 0.3, 0]} scale={[0.9, 0.9, 0.9]}>
                {/* Base step */}
                <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
                    <boxGeometry args={[0.9, 0.15, 0.9]} />
                    <meshStandardMaterial color="#CD853F" roughness={0.8} flatShading />
                </mesh>
                {/* Middle step */}
                <mesh position={[0, 0.25, 0]} castShadow>
                    <boxGeometry args={[0.7, 0.15, 0.7]} />
                    <meshStandardMaterial color="#DEB887" roughness={0.8} flatShading />
                </mesh>
                {/* Top step */}
                <mesh position={[0, 0.42, 0]} castShadow>
                    <boxGeometry args={[0.5, 0.15, 0.5]} />
                    <meshStandardMaterial color="#D2B48C" roughness={0.75} flatShading />
                </mesh>
                {/* Shrine on top */}
                <mesh position={[0, 0.58, 0]} castShadow>
                    <boxGeometry args={[0.25, 0.18, 0.25]} />
                    <meshStandardMaterial color="#B8860B" roughness={0.4} metalness={0.3} flatShading />
                </mesh>
                {/* Gold ornament */}
                <mesh position={[0, 0.72, 0]} castShadow>
                    <sphereGeometry args={[0.08, 8, 8]} />
                    <meshStandardMaterial color="#FFD700" roughness={0.3} metalness={0.5} />
                </mesh>
            </group>
        </group>
    );
};

export const ArchimedesTower3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    // Archimedes Tower - tall slender stone tower with mechanical gears and pulleys
    const stoneColor = "#C9B896"; // Warm beige stone
    const darkStone = "#9B8B7A"; // Darker stone accents
    const woodColor = "#5D4E37"; // Dark wood for mechanisms
    const bronzeColor = "#CD7F32"; // Bronze for gears
    const ropeColor = "#8B7355"; // Rope/pulley color

    return (
        <group position={position}>
            <group scale={[0.85, 0.85, 0.85]} position={[0, 0.3, 0]}>
                {/* Stone foundation base */}
                <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
                    <cylinderGeometry args={[0.4, 0.45, 0.12, 8]} />
                    <meshStandardMaterial color={darkStone} roughness={0.9} flatShading />
                </mesh>

                {/* Main tower body - tapered cylinder */}
                <mesh position={[0, 0.55, 0]} castShadow>
                    <cylinderGeometry args={[0.22, 0.32, 0.9, 8]} />
                    <meshStandardMaterial color={stoneColor} roughness={0.85} flatShading />
                </mesh>

                {/* Stone band detail at base of tower */}
                <mesh position={[0, 0.15, 0]} castShadow>
                    <cylinderGeometry args={[0.35, 0.38, 0.08, 8]} />
                    <meshStandardMaterial color={darkStone} roughness={0.9} flatShading />
                </mesh>

                {/* Stone band detail at mid tower */}
                <mesh position={[0, 0.55, 0]} castShadow>
                    <cylinderGeometry args={[0.28, 0.3, 0.06, 8]} />
                    <meshStandardMaterial color={darkStone} roughness={0.85} flatShading />
                </mesh>

                {/* Upper tower section */}
                <mesh position={[0, 1.1, 0]} castShadow>
                    <cylinderGeometry args={[0.18, 0.22, 0.4, 8]} />
                    <meshStandardMaterial color={stoneColor} roughness={0.8} flatShading />
                </mesh>

                {/* Tower top platform */}
                <mesh position={[0, 1.32, 0]} castShadow>
                    <cylinderGeometry args={[0.24, 0.2, 0.06, 8]} />
                    <meshStandardMaterial color={darkStone} roughness={0.85} flatShading />
                </mesh>

                {/* Pointed roof/spire */}
                <mesh position={[0, 1.52, 0]} castShadow>
                    <coneGeometry args={[0.2, 0.35, 8]} />
                    <meshStandardMaterial color={bronzeColor} roughness={0.6} metalness={0.3} flatShading />
                </mesh>

                {/* Large main gear (Archimedes mechanism) */}
                <group position={[0.3, 0.7, 0]} rotation={[0, 0, Math.PI/2]}>
                    <mesh castShadow>
                        <torusGeometry args={[0.18, 0.03, 8, 12]} />
                        <meshStandardMaterial color={bronzeColor} roughness={0.5} metalness={0.4} flatShading />
                    </mesh>
                    {/* Gear teeth */}
                    {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
                        <mesh
                            key={i}
                            position={[
                                Math.cos(angle * Math.PI / 180) * 0.18,
                                Math.sin(angle * Math.PI / 180) * 0.18,
                                0
                            ]}
                            rotation={[0, 0, angle * Math.PI / 180]}
                            castShadow
                        >
                            <boxGeometry args={[0.04, 0.06, 0.03]} />
                            <meshStandardMaterial color={bronzeColor} roughness={0.5} metalness={0.4} />
                        </mesh>
                    ))}
                    {/* Gear center axle */}
                    <mesh castShadow>
                        <cylinderGeometry args={[0.04, 0.04, 0.08, 8]} />
                        <meshStandardMaterial color={woodColor} roughness={0.7} />
                    </mesh>
                </group>

                {/* Small secondary gear */}
                <group position={[0.28, 0.42, 0.1]} rotation={[0.3, 0, Math.PI/2]}>
                    <mesh castShadow>
                        <torusGeometry args={[0.1, 0.02, 6, 10]} />
                        <meshStandardMaterial color={bronzeColor} roughness={0.5} metalness={0.4} flatShading />
                    </mesh>
                    <mesh castShadow>
                        <cylinderGeometry args={[0.025, 0.025, 0.06, 6]} />
                        <meshStandardMaterial color={woodColor} roughness={0.7} />
                    </mesh>
                </group>

                {/* Pulley system on other side */}
                <group position={[-0.25, 0.9, 0]}>
                    {/* Pulley wheel */}
                    <mesh rotation={[0, 0, Math.PI/2]} castShadow>
                        <torusGeometry args={[0.12, 0.025, 6, 12]} />
                        <meshStandardMaterial color={woodColor} roughness={0.7} flatShading />
                    </mesh>
                    {/* Pulley bracket */}
                    <mesh position={[0.08, 0, 0]} castShadow>
                        <boxGeometry args={[0.04, 0.08, 0.06]} />
                        <meshStandardMaterial color={darkStone} roughness={0.9} flatShading />
                    </mesh>
                    {/* Rope going down */}
                    <mesh position={[-0.12, -0.25, 0]} castShadow>
                        <cylinderGeometry args={[0.015, 0.015, 0.5, 6]} />
                        <meshStandardMaterial color={ropeColor} roughness={0.9} />
                    </mesh>
                    {/* Weight/bucket at bottom */}
                    <mesh position={[-0.12, -0.52, 0]} castShadow>
                        <cylinderGeometry args={[0.06, 0.05, 0.08, 6]} />
                        <meshStandardMaterial color={woodColor} roughness={0.8} flatShading />
                    </mesh>
                </group>

                {/* Archimedes screw element (spiral) */}
                <group position={[0.18, 0.25, -0.2]} rotation={[0.5, 0.3, 0]}>
                    <mesh castShadow>
                        <cylinderGeometry args={[0.04, 0.04, 0.4, 8]} />
                        <meshStandardMaterial color={woodColor} roughness={0.7} />
                    </mesh>
                    {/* Screw spirals (simplified as rings) */}
                    {[0, 0.1, 0.2, 0.3].map((y, i) => (
                        <mesh key={i} position={[0, -0.15 + y, 0]} rotation={[0, i * Math.PI/4, 0]} castShadow>
                            <torusGeometry args={[0.07, 0.015, 4, 8, Math.PI]} />
                            <meshStandardMaterial color={bronzeColor} roughness={0.5} metalness={0.3} />
                        </mesh>
                    ))}
                </group>

                {/* Window slits */}
                {[0, Math.PI/2, Math.PI, Math.PI*1.5].map((angle, i) => (
                    <mesh
                        key={i}
                        position={[
                            Math.cos(angle) * 0.23,
                            0.7,
                            Math.sin(angle) * 0.23
                        ]}
                        rotation={[0, -angle + Math.PI/2, 0]}
                        castShadow
                    >
                        <boxGeometry args={[0.04, 0.12, 0.03]} />
                        <meshStandardMaterial color="#2D2D2D" roughness={0.9} />
                    </mesh>
                ))}
            </group>
        </group>
    );
};
