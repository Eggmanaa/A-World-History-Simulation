
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, SoftShadows } from '@react-three/drei';
import { TileData, BuildingType } from '../types';
import { HexTile3D, House3D, Temple3D, Wall3D, Amphitheatre3D, Wonder3D } from './Models';

interface MapSceneProps {
  tiles: TileData[];
  onTileClick: (tileId: string) => void;
}

const MapScene: React.FC<MapSceneProps> = ({ tiles, onTileClick }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="w-full h-full bg-slate-900 rounded-lg overflow-hidden shadow-inner border border-slate-700 relative">
      <Canvas shadows camera={{ position: [20, 20, 20], fov: 30, near: 1, far: 1000 }}>
        <color attach="background" args={['#1e293b']} /> {/* Slate-900ish background */}
        <fog attach="fog" args={['#1e293b', 30, 80]} />

        {/* Studio Lighting for Board Game Look */}
        <ambientLight intensity={0.4} color="#cbd5e1" />

        <directionalLight
          position={[10, 20, 5]}
          intensity={1.5}
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-bias={-0.0001}
        >
          <orthographicCamera attach="shadow-camera" args={[-20, 20, 20, -20]} />
        </directionalLight>

        <pointLight position={[-10, 10, -10]} intensity={0.5} color="#a78bfa" /> {/* Violet tint */}
        <pointLight position={[10, 5, 10]} intensity={0.3} color="#fbbf24" /> {/* Amber tint */}

        <group position={[0, -2, 0]} rotation={[0, Math.PI / 6, 0]}>
          {tiles.map((tile) => (
            <group
              key={tile.id}
              onPointerOver={(e) => { e.stopPropagation(); setHoveredId(tile.id); }}
              onPointerOut={(e) => { e.stopPropagation(); setHoveredId(null); }}
            >
              <HexTile3D
                x={tile.x}
                z={tile.z}
                terrain={tile.terrain}
                isHovered={hoveredId === tile.id}
                onClick={() => onTileClick(tile.id)}
              />
              {tile.building === BuildingType.House && <House3D position={[tile.x, 0, tile.z]} />}
              {tile.building === BuildingType.Temple && <Temple3D position={[tile.x, 0, tile.z]} />}
              {tile.building === BuildingType.Wall && <Wall3D position={[tile.x, 0, tile.z]} />}
              {tile.building === BuildingType.Amphitheatre && <Amphitheatre3D position={[tile.x, 0, tile.z]} />}
              {tile.building === BuildingType.Wonder && <Wonder3D position={[tile.x, 0, tile.z]} />}
            </group>
          ))}
        </group>

        <SoftShadows size={5} samples={16} focus={0.5} />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          minDistance={10}
          maxDistance={60}
          maxPolarAngle={Math.PI / 2.5}
          minPolarAngle={Math.PI / 6}
        />
      </Canvas>

      <div className="absolute bottom-4 left-4 bg-black/70 text-slate-300 p-3 rounded-xl text-xs pointer-events-none select-none backdrop-blur-md border border-slate-600/50 shadow-xl">
        <p className="font-bold text-amber-500 mb-1">CONTROLS</p>
        <p>Left Click: Build / Select</p>
        <p>Right Click + Drag: Rotate View</p>
        <p>Scroll: Zoom In/Out</p>
      </div>
    </div>
  );
};

export default MapScene;
