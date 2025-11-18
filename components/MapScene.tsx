
import React, { useState } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, SoftShadows } from '@react-three/drei';
import { TileData, BuildingType } from '../types';
import { HexTile3D, House3D, Temple3D, Wall3D, Amphitheatre3D } from './Models';

interface MapSceneProps {
  tiles: TileData[];
  onTileClick: (tileId: string) => void;
}

const MapScene: React.FC<MapSceneProps> = ({ tiles, onTileClick }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  return (
    <div className="w-full h-full bg-slate-900 rounded-lg overflow-hidden shadow-inner border border-slate-700 relative">
      <Canvas shadows camera={{ position: [0, 14, 10], fov: 45 }}>
        <color attach="background" args={['#0f172a']} />
        <fog attach="fog" args={['#0f172a', 15, 35]} />
        
        {/* Enhanced Studio Lighting for Board Game Look */}
        <ambientLight intensity={0.6} />
        
        <directionalLight 
            position={[8, 12, 8]} 
            intensity={1.8} 
            castShadow 
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0005}
        />
        
        <pointLight position={[-5, 5, -5]} intensity={0.5} color="#bfdbfe" />
        <pointLight position={[5, 2, -5]} intensity={0.3} color="#fef3c7" />

        <group position={[0, 0, 0]}> 
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
            </group>
          ))}
        </group>

        <SoftShadows size={8} samples={12} focus={0.5} />
        
        <OrbitControls 
            target={[0, 0, 0]}
            enablePan={true} 
            enableZoom={true} 
            minDistance={5} 
            maxDistance={30} 
            maxPolarAngle={Math.PI / 2.2}
        />
      </Canvas>
      
      <div className="absolute bottom-4 left-4 bg-black/70 text-slate-300 p-2 rounded text-xs pointer-events-none select-none backdrop-blur-sm">
        <p>Left Click: Build Selected</p>
        <p>Right Click + Drag: Rotate</p>
        <p>Scroll: Zoom</p>
      </div>
    </div>
  );
};

export default MapScene;
