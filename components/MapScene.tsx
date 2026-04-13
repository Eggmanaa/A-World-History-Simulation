
import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, SoftShadows } from '@react-three/drei';
import { TileData, BuildingType } from '../types';
import { HexTile3D, House3D, Temple3D, Wall3D, Amphitheatre3D, Wonder3D, ArchimedesTower3D } from './Models';

interface MapSceneProps {
  tiles: TileData[];
  onTileClick: (tileId: string) => void;
}

const MapScene: React.FC<MapSceneProps> = ({ tiles, onTileClick }) => {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isTouch, setIsTouch] = useState(false);

  // Detect touch device and set initial state
  useEffect(() => {
    setIsTouch(
      () => true === ('ontouchstart' in window || navigator.maxTouchPoints > 0)
    );
  }, []);

  // Handle touch events for iPad/mobile
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !isTouch) return;

    let lastDistance = 0;

    const handleTouchMove = (e: TouchEvent) => {
      // Multi-touch pinch to zoom
      if (e.touches.length === 2) {
        e.preventDefault();
        const touch1 = e.touches[0];
        const touch2 = e.touches[1];
        const distance = Math.hypot(
          touch1.clientX - touch2.clientX,
          touch1.clientY - touch2.clientY
        );

        if (lastDistance > 0) {
          const scale = distance / lastDistance;
          // Pinch gesture detected - let OrbitControls handle it via wheel event
          const wheelEvent = new WheelEvent('wheel', {
            deltaY: (scale < 1 ? 50 : -50),
            bubbles: true,
            cancelable: true,
          });
          canvas.dispatchEvent(wheelEvent);
        }
        lastDistance = distance;
      } else if (e.touches.length === 1) {
        // Single finger drag for rotation
        lastDistance = 0;
      }
    };

    const handleTouchEnd = () => {
      lastDistance = 0;
    };

    canvas.addEventListener('touchmove', handleTouchMove, false);
    canvas.addEventListener('touchend', handleTouchEnd, false);
    canvas.addEventListener('touchcancel', handleTouchEnd, false);

    return () => {
      canvas.removeEventListener('touchmove', handleTouchMove, false);
      canvas.removeEventListener('touchend', handleTouchEnd, false);
      canvas.removeEventListener('touchcancel', handleTouchEnd, false);
    };
  }, [isTouch]);

  // Calculate device pixel ratio cap (2 max for Retina iPads)
  const dpr = Math.min(window.devicePixelRatio, 2);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-slate-900 rounded-lg overflow-hidden shadow-inner border border-slate-700 relative"
      style={{ touchAction: 'none' }}
    >
      <Canvas
        ref={canvasRef}
        shadows
        camera={{ position: [0, 45, 35], fov: 45, near: 1, far: 1000 }}
        dpr={dpr}
      >
        <color attach="background" args={['#0f172a']} /> {/* Darker, more dramatic background */}
        <fog attach="fog" args={['#0f172a', 50, 90]} />

        {/* Studio Lighting for Board Game Look */}
        <ambientLight intensity={0.6} />

        <directionalLight
          position={[20, 40, 20]}
          intensity={1.8}
          castShadow
          shadow-mapSize={[4096, 4096]}
          shadow-bias={-0.0005}
          shadow-camera-left={-40}
          shadow-camera-right={40}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
        />

        <pointLight position={[-15, 15, -15]} intensity={0.5} color="#bfdbfe" />
        <pointLight position={[15, 10, -15]} intensity={0.3} color="#fef3c7" />

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
              {tile.building === BuildingType.ArchimedesTower && <ArchimedesTower3D position={[tile.x, 0, tile.z]} />}
            </group>
          ))}
        </group>

        <SoftShadows size={5} samples={16} focus={0.5} />

        <OrbitControls
          enablePan={true}
          enableZoom={true}
          enableDamping={true}
          dampingFactor={0.05}
          minDistance={10}
          maxDistance={60}
          maxPolarAngle={Math.PI / 2.5}
          minPolarAngle={Math.PI / 6}
        />
      </Canvas>

      <div className="absolute bottom-4 left-4 bg-black/70 text-slate-300 p-3 rounded-xl text-xs pointer-events-none select-none backdrop-blur-md border border-slate-600/50 shadow-xl">
        <p className="font-bold text-amber-500 mb-1">CONTROLS</p>
        {isTouch ? (
          <>
            <p>One Finger: Rotate View</p>
            <p>Two Finger Pinch: Zoom</p>
            <p>Tap: Build / Select</p>
          </>
        ) : (
          <>
            <p>Left Click: Build / Select</p>
            <p>Right Click + Drag: Rotate View</p>
            <p>Scroll: Zoom In/Out</p>
          </>
        )}
      </div>
    </div>
  );
};

export default MapScene;
