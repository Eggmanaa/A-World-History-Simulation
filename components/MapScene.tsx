
import React, { useState, useRef, useEffect, useMemo, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, SoftShadows } from '@react-three/drei';
import { EffectComposer, Bloom, Vignette, SMAA, BrightnessContrast, HueSaturation } from '@react-three/postprocessing';
import * as THREE from 'three';
import { TileData, BuildingType } from '../types';
import { HexTile3D, House3D, Farm3D, Workshop3D, Library3D, Barracks3D, Temple3D, Wall3D, Amphitheatre3D, Wonder3D, ArchimedesTower3D } from './Models';

interface MapSceneProps {
  tiles: TileData[];
  onTileClick: (tileId: string) => void;
}

// Stable hash so each tile gets the same organic jitter every render — without
// this each frame would re-randomize and the map would jitter visibly.
const hashJitter = (id: string, salt: number) => {
  let h = salt;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((h >>> 0) % 1000) / 1000; // 0..1
};

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
          const wheelEvent = new WheelEvent('wheel', {
            deltaY: (scale < 1 ? 50 : -50),
            bubbles: true,
            cancelable: true,
          });
          canvas.dispatchEvent(wheelEvent);
        }
        lastDistance = distance;
      } else if (e.touches.length === 1) {
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

  const dpr = Math.min(window.devicePixelRatio, 2);

  // Pre-compute organic jitter (rotation + tiny scale variance) per tile so
  // the grid doesn't read as a sterile crystal lattice. Hash on tile.id so
  // it's stable across renders.
  const tileJitter = useMemo(
    () =>
      tiles.map((t) => ({
        rotY: (hashJitter(t.id, 7) - 0.5) * 0.18, // ±~5°
        scale: 0.96 + hashJitter(t.id, 13) * 0.08, // 0.96..1.04
      })),
    [tiles],
  );

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
        gl={{
          antialias: true,
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.05,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
        }}
      >
        <Suspense fallback={null}>
          {/* Atmospheric backdrop — gradient sky beats flat black for depth */}
          <color attach="background" args={['#1e3a5f']} />
          <fog attach="fog" args={['#1e3a5f', 60, 120]} />

          {/* Hemisphere fill: warm sun-lit top, cool sky-bounced bottom.
              Cheap GI approximation that makes biomes pop. */}
          <hemisphereLight args={['#ffd9a8', '#1e3a5f', 0.7]} />

          <ambientLight intensity={0.35} />

          {/* Key directional light = sun. Stronger and warmer than baseline. */}
          <directionalLight
            position={[25, 50, 20]}
            intensity={2.0}
            color="#fff5d6"
            castShadow
            shadow-mapSize={[4096, 4096]}
            shadow-bias={-0.0005}
            shadow-camera-left={-40}
            shadow-camera-right={40}
            shadow-camera-top={40}
            shadow-camera-bottom={-40}
          />

          {/* Cool rim light from opposite side for separation */}
          <directionalLight position={[-20, 25, -20]} intensity={0.4} color="#a3c9ff" />

          <pointLight position={[-15, 15, -15]} intensity={0.4} color="#bfdbfe" />
          <pointLight position={[15, 10, -15]} intensity={0.25} color="#fef3c7" />

          <group position={[0, -2, 0]} rotation={[0, Math.PI / 6, 0]}>
            {tiles.map((tile, idx) => {
              const j = tileJitter[idx];
              return (
                <group
                  key={tile.id}
                  rotation={[0, j.rotY, 0]}
                  scale={[j.scale, 1, j.scale]}
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
                  {tile.building === BuildingType.Farm && <Farm3D position={[tile.x, 0, tile.z]} />}
                  {tile.building === BuildingType.Workshop && <Workshop3D position={[tile.x, 0, tile.z]} />}
                  {tile.building === BuildingType.Library && <Library3D position={[tile.x, 0, tile.z]} />}
                  {tile.building === BuildingType.Barracks && <Barracks3D position={[tile.x, 0, tile.z]} />}
                  {tile.building === BuildingType.Temple && <Temple3D position={[tile.x, 0, tile.z]} />}
                  {tile.building === BuildingType.Wall && <Wall3D position={[tile.x, 0, tile.z]} />}
                  {tile.building === BuildingType.Amphitheatre && <Amphitheatre3D position={[tile.x, 0, tile.z]} />}
                  {tile.building === BuildingType.Wonder && <Wonder3D position={[tile.x, 0, tile.z]} />}
                  {tile.building === BuildingType.ArchimedesTower && <ArchimedesTower3D position={[tile.x, 0, tile.z]} />}
                </group>
              );
            })}
          </group>

          <SoftShadows size={4} samples={12} focus={0.6} />

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

          {/* Post-processing temporarily disabled while we verify base
              scene renders. iter-2 will reintroduce SMAA + Bloom + Vignette
              once we confirm the EffectComposer compositing issue. */}
        </Suspense>
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
