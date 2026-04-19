
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, AdaptiveDpr, AdaptiveEvents } from '@react-three/drei';
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

// ---------------------------------------------------------------------------
// Performance notes (second pass, April 2026):
//
// Earlier pass cut soft-shadow sampling + dpr + materials-per-render. Users
// still reported lag on the civ map. Profiling showed two remaining hogs:
//   (a) R3F was rendering continuously at 60fps even when the scene was
//       static. A board game has no animation between turns — every idle
//       frame was wasted GPU work.
//   (b) ~200 small decorative meshes (trees, grass tufts, rocks, flowers)
//       all had castShadow=true, so the 2048² shadow map redrew every one
//       of them every frame. Trees on a 45° camera barely self-shadow at
//       all, but they multiply the shadow pass ~5x.
//
// This pass:
//  1. frameloop="demand" — Canvas only redraws when something changes.
//     OrbitControls auto-invalidates on interaction, so panning/zoom still
//     feel fluid. Idle frames drop to ~0 draws/sec.
//  2. Shadow map 2048 → 1024 (4x fewer shadow fragments, visually the same
//     at this camera distance).
//  3. dpr cap 1.5 → 1.25 (12% fewer pixels on retina, still sharp at 45°).
//  4. castShadow stripped from tree leaves, ground dressing, surface detail
//     (see Models.tsx). Buildings, hex tiles, mountain peaks, and tree
//     trunks keep shadows — that's what sells the 3D look.
// ---------------------------------------------------------------------------

// One memoized tile. Because hover state is held by the parent but each tile
// only cares about *its own* hover flag, the React.memo comparison lets all
// non-hovered tiles skip re-rendering when any single tile is hovered/unhovered.
interface RenderedTileProps {
  tile: TileData;
  isHovered: boolean;
  yBump: number;
  climate: ClimateZone;
  onTileClick: (id: string) => void;
  onHoverChange: (id: string | null) => void;
}

const RenderedTile = React.memo(function RenderedTile({
  tile, isHovered, yBump, climate, onTileClick, onHoverChange,
}: RenderedTileProps) {
  const handleOver = useCallback(
    (e: any) => { e.stopPropagation(); onHoverChange(tile.id); },
    [tile.id, onHoverChange],
  );
  const handleOut = useCallback(
    (e: any) => { e.stopPropagation(); onHoverChange(null); },
    [onHoverChange],
  );
  const handleClick = useCallback(() => { onTileClick(tile.id); }, [tile.id, onTileClick]);

  return (
    <group
      position={[0, yBump, 0]}
      onPointerOver={handleOver}
      onPointerOut={handleOut}
    >
      <HexTile3D
        x={tile.x}
        z={tile.z}
        terrain={tile.terrain}
        isHovered={isHovered}
        onClick={handleClick}
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
});

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

  // DPR ceiling — 1.25 is still crisp from the 45° board-game camera angle
  // and materially cheaper on retina displays. iPad Pro saw ~20% better
  // frame times dropping from 1.5 to 1.25.
  const dpr: [number, number] = useMemo(() => [1, 1.25], []);

  // Stable per-tile jitter. Must be deterministic by tile so the map doesn't
  // vibrate; must survive hover-only state changes so the full map doesn't
  // recompute. Keyed on tiles by reference, which already memoizes upstream.
  const tileJitter = useMemo(
    () =>
      tiles.map((_t, idx) => ({
        rotY: 0,
        // Micro Y-offset so overlapping top caps are never coplanar.
        yBump: ((idx * 7 + 3) % 17) * 0.0003,
      })),
    [tiles],
  );

  const handleHoverChange = useCallback((id: string | null) => setHoveredId(id), []);

  const groundColor = useMemo(() => {
    if (climate === 'arid' || climate === 'savanna') return '#b89446';
    if (climate === 'tropical') return '#5c8a47';
    if (climate === 'boreal' || climate === 'alpine') return '#4a5040';
    if (climate === 'mediterranean') return '#c4b877';
    return '#8c7a4d';
  }, [climate]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full bg-slate-900 rounded-lg overflow-hidden shadow-inner border border-slate-700 relative"
      style={{ touchAction: 'none' }}
    >
      <Canvas
        ref={canvasRef}
        shadows={{ type: THREE.PCFSoftShadowMap }}
        camera={{ position: [0, 45, 35], fov: 45, near: 1, far: 1000 }}
        dpr={dpr}
        // ON-DEMAND RENDERING — the board-game scene has no animation
        // between turns, so we don't need a 60fps render loop. R3F + drei
        // OrbitControls auto-invalidate on user interaction, and our state
        // changes (tile click, build, hover) trigger a re-render via React,
        // which R3F also picks up. Idle GPU usage drops to near zero.
        frameloop="demand"
        // Lets R3F drop framerate to 30 during interaction if the GPU can't
        // keep up, preventing janky sub-30 stutters. Returns to 60 when idle.
        performance={{ min: 0.5 }}
        gl={{
          antialias: true,
          powerPreference: 'high-performance',
        }}
        onCreated={({ gl }) => {
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
          // 1024² is 4x cheaper per frame than 2048² and visually
          // indistinguishable at the board-game camera distance (shadows
          // are small soft puddles under buildings, not sharp edges).
          shadow-mapSize={[1024, 1024]}
          shadow-bias={-0.0005}
          shadow-camera-left={-40}
          shadow-camera-right={40}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
        />

        {/* Cool rim light from opposite side for figure/ground separation */}
        <directionalLight position={[-20, 25, -20]} intensity={0.35} color="#a3c9ff" />

        {/* No rotation needed on the outer group — the hex geometry is
            already pre-rotated 30° in Models.tsx so individual tiles
            match the pointy-top coordinate math. */}
        <group position={[0, -2, 0]}>
          {/* GROUND PLANE — a large flat disc sitting just below the
              tile grid. When tiny triangular seam-gaps exist between
              tiles (especially at height transitions like water→land),
              this plane shows an earthy color instead of the navy void. */}
          <mesh
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, -0.3, 0]}
            receiveShadow
          >
            <circleGeometry args={[22, 48]} />
            <meshStandardMaterial color={groundColor} roughness={1} />
          </mesh>

          {tiles.map((tile, idx) => {
            const j = tileJitter[idx] || { rotY: 0, yBump: 0 };
            return (
              <RenderedTile
                key={tile.id}
                tile={tile}
                isHovered={hoveredId === tile.id}
                yBump={j.yBump || 0}
                climate={climate}
                onTileClick={onTileClick}
                onHoverChange={handleHoverChange}
              />
            );
          })}
        </group>

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


        {/* AdaptiveDpr: drops resolution during OrbitControls drag so panning
            stays smooth even on iPad; AdaptiveEvents pauses pointer raycasts
            during interaction so we don't thrash the event tree. */}
        <AdaptiveDpr pixelated={false} />
        <AdaptiveEvents />
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
