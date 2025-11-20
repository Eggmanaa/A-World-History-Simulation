
import React from 'react';
import { TerrainType } from '../types';
import * as THREE from 'three';
import { useLoader } from '@react-three/fiber';

// Reusable Hexagon Geometry
const hexGeometry = new THREE.CylinderGeometry(1, 1, 0.2, 6);

interface HexTileProps {
    x: number;
    z: number;
    terrain: TerrainType;
    onClick: () => void;
    isHovered?: boolean;
}

export const HexTile3D: React.FC<HexTileProps> = ({ x, z, terrain, onClick, isHovered }) => {
    // Color Palette
    const COLORS = {
        [TerrainType.Plains]: "#e2e8f0", // Slate-200 (Matte White/Grey)
        [TerrainType.Grassland]: "#cbd5e1", // Slate-300
        [TerrainType.Forest]: "#475569", // Slate-600 (Dark Grey Forest)
        [TerrainType.Desert]: "#fef3c7", // Amber-100 (Pale Yellow)
        [TerrainType.Mountain]: "#78350f", // Amber-900 (Deep Brown)
        [TerrainType.HighMountain]: "#4c1d95", // Violet-900 (Deep Purple)
        [TerrainType.Ocean]: "#38bdf8", // Sky-400 (Acrylic Blue)
        [TerrainType.River]: "#7dd3fc", // Sky-300
        [TerrainType.Marsh]: "#94a3b8", // Slate-400
    };

    const color = COLORS[terrain];

    // Height variation based on terrain
    let height = 0.2;
    let yPos = 0;

    // Special handling for Water (Acrylic)
    const isWater = terrain === TerrainType.Ocean || terrain === TerrainType.River;

    if (terrain === TerrainType.Mountain) {
        // Mountains are handled as separate objects on top of a base tile
        yPos = 0;
    } else if (terrain === TerrainType.HighMountain) {
        yPos = 0;
    } else if (isWater) {
        yPos = -0.1;
        height = 0.15;
    }

    return (
        <group position={[x, yPos, z]}>
            {/* Base Tile */}
            <mesh
                geometry={hexGeometry}
                onClick={(e) => { e.stopPropagation(); onClick(); }}
                scale={[1, isWater ? 1 : 1, 1]}
                receiveShadow
                castShadow={!isWater}
            >
                {isWater ? (
                    <meshPhysicalMaterial
                        color={color}
                        transmission={0.6}
                        opacity={0.8}
                        roughness={0.1}
                        metalness={0.1}
                        thickness={0.5}
                        transparent
                    />
                ) : (
                    <meshStandardMaterial
                        color={isHovered ? '#f8fafc' : color}
                        roughness={0.9} // Matte
                        metalness={0.0}
                    />
                )}
            </mesh>

            {/* Selection Ring */}
            {isHovered && (
                <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[0.8, 0.9, 6]} />
                    <meshBasicMaterial color="#fbbf24" toneMapped={false} />
                </mesh>
            )}

            {/* Forest Details - Minimalist Cones */}
            {terrain === TerrainType.Forest && (
                <group position={[0, 0.1, 0]}>
                    {[
                        { x: -0.3, z: -0.2, s: 0.5 },
                        { x: 0.3, z: 0.1, s: 0.7 },
                        { x: -0.1, z: 0.4, s: 0.4 }
                    ].map((tree, i) => (
                        <mesh key={i} position={[tree.x, 0.3, tree.z]} scale={[tree.s, tree.s, tree.s]} castShadow>
                            <coneGeometry args={[0.4, 1, 8]} />
                            <meshStandardMaterial color="#334155" roughness={0.9} />
                        </mesh>
                    ))}
                </group>
            )}

            {/* Mountain - Blocky Wooden Geometric Peaks (Brown) */}
            {terrain === TerrainType.Mountain && (
                <group position={[0, 0.1, 0]}>
                    <mesh position={[0, 0.4, 0]} castShadow>
                        <cylinderGeometry args={[0, 0.7, 0.8, 4]} />
                        <meshStandardMaterial color="#78350f" roughness={0.6} />
                    </mesh>
                </group>
            )}

            {/* High Mountain - Tall Abstract Wooden Prisms (Deep Purple) */}
            {terrain === TerrainType.HighMountain && (
                <group position={[0, 0.1, 0]}>
                    <mesh position={[0, 1.0, 0]} castShadow>
                        <boxGeometry args={[0.8, 2.0, 0.8]} />
                        <meshStandardMaterial color="#4c1d95" roughness={0.6} />
                    </mesh>
                </group>
            )}
        </group>
    );
};

// Helper material for Maple Wood
const mapleWoodMaterial = (
    <meshStandardMaterial
        color="#ffedd5" // Orange-100ish
        roughness={0.5}
        metalness={0.0}
    />
);

export const House3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    return (
        <group position={position}>
            {/* Small Natural Maple Wood Cube */}
            <mesh position={[0, 0.3, 0]} castShadow>
                <boxGeometry args={[0.4, 0.4, 0.4]} />
                {mapleWoodMaterial}
            </mesh>
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
            <mesh position={[0, 0.3, 0]} castShadow>
                <cylinderGeometry args={[0.3, 0.3, 0.4, 6]} />
                <meshStandardMaterial color={stoneColor} roughness={0.8} />
            </mesh>
        </group>
    );
};

export const Temple3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    return (
        <group position={position}>
            <mesh position={[0, 0.4, 0]} castShadow>
                <cylinderGeometry args={[0.4, 0.4, 0.6, 8]} />
                <meshStandardMaterial color="#f1f5f9" roughness={0.2} /> {/* Marble */}
            </mesh>
            <mesh position={[0, 0.8, 0]} castShadow>
                <sphereGeometry args={[0.4, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
                <meshStandardMaterial color="#fbbf24" metalness={0.5} roughness={0.2} /> {/* Gold Dome */}
            </mesh>
        </group>
    );
};

export const Amphitheatre3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    return (
        <group position={position}>
            <mesh position={[0, 0.2, 0]} castShadow>
                <torusGeometry args={[0.4, 0.1, 8, 16, Math.PI]} rotation={[-Math.PI / 2, 0, 0]} />
                <meshStandardMaterial color="#e7e5e4" roughness={0.8} />
            </mesh>
        </group>
    );
};

export const Wonder3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    return (
        <group position={position}>
            {/* Ziggurat - Wooden Pawn */}
            <group position={[0, 0.1, 0]}>
                <mesh position={[0, 0.15, 0]} castShadow>
                    <boxGeometry args={[0.8, 0.3, 0.8]} />
                    <meshStandardMaterial color="#d97706" roughness={0.6} />
                </mesh>
                <mesh position={[0, 0.45, 0]} castShadow>
                    <boxGeometry args={[0.6, 0.3, 0.6]} />
                    <meshStandardMaterial color="#d97706" roughness={0.6} />
                </mesh>
                <mesh position={[0, 0.75, 0]} castShadow>
                    <boxGeometry args={[0.4, 0.3, 0.4]} />
                    <meshStandardMaterial color="#d97706" roughness={0.6} />
                </mesh>
            </group>
        </group>
    );
};
