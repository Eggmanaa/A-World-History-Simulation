
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, SoftShadows } from '@react-three/drei';
import * as THREE from 'three';
import { TileData, BuildingType, ClimateZone } from '../types';
import { HexTile3D, House3D, Farm3D, Workshop3D, Library3D, Barracks3D, Temple3D, Wall3D, Amphitheatre3D, Wonder3D, ArchimedesTower3D } from './Models';

interface MapSceneProps {
  tiles: TileData[];
  onTileClick: (tileId: string) => void;
  // Cosmetic-only: drives tree species, undergrowth, and dressing so each
  // civ's map reads as authentically *theirs*. Defaults to 'temperate'.
  climate?: ClimateZone;
}

// Stable hash so each tile gets the same organic jitter every render. If we
// re-randomized every frame the map would vibrate visibly.
const hashJitter = (id: string, salt: number) => {
  let h = salt;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0;
  return ((h >>> 0) % 1000) / 1000; // 0..1
};

const MapScene: React.FC<MapSceneProps> = ({ tiles, onTileClick, climate = 'temperate' }) => {
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

  // Slight over-scale so hex edges overlap and kill triangular seam
  // gaps between neighbors. 1.04 covers the worst-case float dust
  // while staying invisible from the default camera angle.
  const tileJitter = useMemo(
    () =>
      tiles.map((_t) => ({
        rotY: 0,
        scale: 1.04,
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
        onCreated={({ gl }) => {
          // Post-construction renderer tweaks — putting these in the gl
          // constructor prop caused a silent R3F init failure in iter-A.
          // Applying them here after the renderer exists works reliably.
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.1;
        }}
      >
        {/* Atmospheric navy backdrop beats flat slate for depth */}
        <color attach="background" args={['#152238']} />
        <fog attach="fog" args={['#152238', 55, 110]} />

        {/* Hemisphere fill: warm top (sun-sky) and cool bottom (sky-bounce).
            Cheap global-illumination approximation that makes biomes read. */}
        <hemisphereLight args={['#ffd9a8', '#1e3a5f', 0.55]} />

        {/* Studio Lighting for Board Game Look */}
        <ambientLight intensity={0.35} />

        <directionalLight
          position={[20, 40, 20]}
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

        {/* Cool rim light from opposite side for figure/ground separation */}
        <directionalLight position={[-20, 25, -20]} intensity={0.35} color="#a3c9ff" />

        <pointLight position={[-15, 15, -15]} intensity={0.4} color="#bfdbfe" />
        <pointLight position={[15, 10, -15]} intensity={0.25} color="#fef3c7" />

        {/* No rotation needed on the outer group — the hex geometry is
            already pre-rotated 30° in Models.tsx so individual tiles
            match the pointy-top coordinate math. */}
        <group position={[0, -2, 0]}>
          {/* GROUND PLANE — a large flat disc sitting just below the
              tile grid. When tiny triangular seam-gaps exist between
              tiles (especially at height transitions like water→land),
              this plane shows an earthy color instead of the navy void.
              Sized to cover the entire map radius with margin. */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.3, 0]}
            receiveShadow
          >
            <circleGeometry args={[22, 48]} />
            <meshStandardMaterial
              color={
                climate === 'arid' || climate === 'savanna'
                  ? '#b89446'
                  : climate === 'tropical'
                    ? '#5c8a47'
                    : climate === 'boreal' || climate === 'alpine'
                      ? '#4a5040'
                      : climate === 'mediterranean'
                        ? '#c4b877'
                        : '#8c7a4d'
              }
              roughness={1}
            />
          </mesh>

          {tiles.map((tile, idx) => {
            const j = tileJitter[idx] || { rotY: 0, scale: 1 };
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
                climate={tile.climate || climate}
                building={tile.building}
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
