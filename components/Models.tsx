
import React from 'react';
import { TerrainType, TERRAIN_COLORS, ClimateZone } from '../types';
import * as THREE from 'three';

// ============================================================
// HEX GEOMETRY — SINGLE CYLINDER WITH TRANSPARENT SIDES
// ============================================================
// HEX TILING (revised Apr 2026):
//
// CylinderGeometry has 3 material groups: 0=sides, 1=top, 2=bottom.
// The mathematically perfect tiling (adjacent hex centers at sqrt(3)
// apart with hex flat-to-flat width = sqrt(3)) leaves pixel-precision
// seams visible on retina/iPad displays. Two-part fix here:
//
//   - Geometry radius bumped from 1.0 to 1.003 (0.3% overlap). Tiny
//     enough to not visibly overlap, large enough to close anti-alias
//     hairlines at hex edges.
//   - Side material is now OPAQUE earth-tone instead of transparent.
//     Where one tile is taller than its neighbor (Mountain over
//     Plains, etc.), the exposed side now reads as a rocky cliff or
//     earthy bank — the visible 'thickness' of each tile is exactly
//     what makes a hex grid look like a puzzle of physical tiles
//     fitting together.
//
// Earlier 1.04 overlap (4%) caused Z-fighting on overlapping side
// faces; 0.3% is well under the depth-precision threshold and stays
// clean. polygonOffset on the cap materials handles any residual
// top-cap edge cases.
//
// Pointy-top orientation via rotateY(30°) to match the axial grid
// math: x = sqrt(3)*(q + r/2), z = 1.5*r.

// IMPORTANT: do NOT call rotateY(Math.PI/6). Three.js CylinderGeometry
// with 6 radial segments already produces a POINTY-TOP hex (vertices at
// +Z and -Z, flat sides facing 0/60/120/180/240/300 degrees from +X
// in the X-Z plane). That orientation matches the pointy-top axial
// placement formula x = sqrt(3)*(q + r/2), z = 1.5*r used in
// constants.ts/generateMap. A 30-degree rotation here was the historical
// cause of the diamond-shaped gaps where 3 hex corners meet — it
// turned the geometry into flat-top while the placement still expected
// pointy-top, so adjacent hexes were placed across each other's
// VERTICES instead of their flat sides.
const hexGeometry = new THREE.CylinderGeometry(1.005, 1.005, 0.5, 6);

// Earthy dark-soil tone for the cylinder side faces. Acts as a base
// layer when adjacent tiles have different heights and as a seam-fill
// at pixel boundaries between coplanar caps.
const HEX_SIDE_MATERIAL = new THREE.MeshStandardMaterial({
  color: '#3a2a1f',
  roughness: 0.95,
  metalness: 0,
  // polygonOffset: side faces of adjacent hexes interpenetrate by ~1.3%
  // at our circumradius (1.015 vs sqrt(3) row pitch). The offset biases
  // depth so coplanar overlaps don't strobe between which side wins.
  polygonOffset: true,
  polygonOffsetFactor: 1,
  polygonOffsetUnits: 1,
});

// ============================================================
// MINIATURE SHARED RESOURCES (Apr 2026 graphics upgrade)
// ============================================================
// One material per color for ALL building/wonder miniatures. Sharing
// materials at module scope means the detail upgrade REDUCES GPU state
// changes versus the old per-mesh inline materials, even though each
// piece now has more geometry. flatShading keeps the board-game look.
const MM = {
  stone:      new THREE.MeshStandardMaterial({ color: '#c9b896', roughness: 0.9,  flatShading: true }),
  stoneDark:  new THREE.MeshStandardMaterial({ color: '#9b8b7a', roughness: 0.92, flatShading: true }),
  stucco:     new THREE.MeshStandardMaterial({ color: '#e8dcc0', roughness: 0.85, flatShading: true }),
  marble:     new THREE.MeshStandardMaterial({ color: '#efe9dc', roughness: 0.75, flatShading: true }),
  marbleDim:  new THREE.MeshStandardMaterial({ color: '#d9d2c0', roughness: 0.8,  flatShading: true }),
  wood:       new THREE.MeshStandardMaterial({ color: '#6b4f33', roughness: 0.8,  flatShading: true }),
  woodDark:   new THREE.MeshStandardMaterial({ color: '#4a3826', roughness: 0.85, flatShading: true }),
  terracotta: new THREE.MeshStandardMaterial({ color: '#a4502f', roughness: 0.8,  flatShading: true }),
  thatch:     new THREE.MeshStandardMaterial({ color: '#c2a34e', roughness: 0.95, flatShading: true }),
  leaf:       new THREE.MeshStandardMaterial({ color: '#3f7a3a', roughness: 0.9,  flatShading: true }),
  leafDark:   new THREE.MeshStandardMaterial({ color: '#2d5c2a', roughness: 0.9,  flatShading: true }),
  gold:       new THREE.MeshStandardMaterial({ color: '#e0b64f', roughness: 0.35, metalness: 0.6, flatShading: true }),
  iron:       new THREE.MeshStandardMaterial({ color: '#5a6068', roughness: 0.6,  metalness: 0.3, flatShading: true }),
  clothRed:   new THREE.MeshStandardMaterial({ color: '#a03030', roughness: 0.9,  flatShading: true }),
  clothBlue:  new THREE.MeshStandardMaterial({ color: '#2f5f9e', roughness: 0.9,  flatShading: true }),
  soil:       new THREE.MeshStandardMaterial({ color: '#7a5c3d', roughness: 1.0,  flatShading: true }),
  sand:       new THREE.MeshStandardMaterial({ color: '#d6c08a', roughness: 0.95, flatShading: true }),
  water:      new THREE.MeshStandardMaterial({ color: '#3f7fc4', roughness: 0.25, metalness: 0.3, flatShading: true }),
  flame:      new THREE.MeshStandardMaterial({ color: '#ffb03a', emissive: new THREE.Color('#ff7a26'), emissiveIntensity: 1.1, roughness: 0.4 }),
  smoke:      new THREE.MeshStandardMaterial({ color: '#b9b9b9', transparent: true, opacity: 0.55, roughness: 1 }),
};

// Soft contact shadow under every piece - one geometry + one material
// shared by all instances. polygonOffset keeps it from z-fighting the
// hex top cap.
const GROUND_SHADOW_GEO = new THREE.CircleGeometry(0.42, 20);
const GROUND_SHADOW_MAT = new THREE.MeshBasicMaterial({
  color: '#000000', transparent: true, opacity: 0.22, depthWrite: false,
  polygonOffset: true, polygonOffsetFactor: -1, polygonOffsetUnits: -1,
});
const GroundShadow: React.FC<{ r?: number }> = ({ r = 1 }) => (
  <mesh
    geometry={GROUND_SHADOW_GEO}
    material={GROUND_SHADOW_MAT}
    rotation={[-Math.PI / 2, 0, 0]}
    position={[0, 0.135, 0]}
    scale={[r, r, 1]}
  />
);

// ============================================================
// ECOSYSTEM & TREE SPECIES SYSTEM
// ============================================================
// Each climate has MULTIPLE tree species (like a real forest) and
// per-terrain ground dressing that matches what you'd actually see in
// that part of the world. Random-but-stable hash jitter per tile keeps
// the composition lively without re-randomizing each frame.
//
// Performance: all geometry is primitive (cone / sphere / cylinder /
// torus) and trees top out at ~5 sub-meshes each. A fully dressed
// forest tile renders ~20 meshes, which is well within budget.
//
// SHADOW BUDGET: these decorative meshes (tree crowns, grass, flowers,
// small rocks) intentionally DO NOT cast shadows — at a 45° board-game
// camera their self-shadows are invisible, but each castShadow mesh
// doubles the directional light's shadow-pass draw count. Only trunks
// and load-bearing structures (buildings, mountain peaks, hex tiles)
// cast shadows. That's what keeps the civilization map smooth on iPad.

// Stable pseudo-random 0..1 from an integer seed.
const rng = (seed: number) => {
  const s = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return ((s % 1) + 1) % 1;
};

// ---------- Species primitives ----------
// Each species is a small component keyed to a climate. They share a
// signature so the forest renderer can pick one and drop it in.

type SpeciesProps = { seed: number; scale?: number };

// OAK — broad sphere on thick trunk. Temperate deciduous classic.
const Oak: React.FC<SpeciesProps> = ({ seed, scale = 1 }) => {
  const hue = rng(seed);
  const color = hue < 0.33 ? '#166534' : hue < 0.66 ? '#15803d' : '#4d7c0f';
  return (
    <group scale={[scale, scale, scale]}>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.1, 0.12, 0.3, 7]} />
        <meshStandardMaterial color="#3f2e20" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.35, 10, 8]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0.1, 0.7, 0.1]}>
        <sphereGeometry args={[0.22, 8, 7]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
    </group>
  );
};

// PINE — classic conifer cone stacked in two tiers. Boreal/alpine/temperate.
const Pine: React.FC<SpeciesProps> = ({ seed, scale = 1 }) => {
  const tall = 0.9 + rng(seed) * 0.3;
  const hue = rng(seed + 1);
  const color = hue < 0.5 ? '#064e3b' : '#14532d';
  return (
    <group scale={[scale, scale, scale]}>
      <mesh position={[0, 0.1, 0]} castShadow>
        <cylinderGeometry args={[0.07, 0.09, 0.2, 6]} />
        <meshStandardMaterial color="#44352a" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.5 * tall, 0]}>
        <coneGeometry args={[0.3, 0.55 * tall, 8]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.85 * tall, 0]}>
        <coneGeometry args={[0.22, 0.4 * tall, 8]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
    </group>
  );
};

// BIRCH — white trunk, round crown. Adds high contrast to boreal/temperate.
const Birch: React.FC<SpeciesProps> = ({ seed, scale = 1 }) => {
  const hue = rng(seed);
  const leafColor = hue < 0.5 ? '#86efac' : '#a3e635';
  return (
    <group scale={[scale, scale, scale]}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.07, 0.6, 6]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.6} />
      </mesh>
      {/* dark bark stripes */}
      <mesh position={[0, 0.38, 0.065]}>
        <boxGeometry args={[0.07, 0.03, 0.01]} />
        <meshStandardMaterial color="#1f2937" />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <sphereGeometry args={[0.25, 10, 8]} />
        <meshStandardMaterial color={leafColor} roughness={0.85} />
      </mesh>
    </group>
  );
};

// CYPRESS — tall narrow spire. Mediterranean signature.
const Cypress: React.FC<SpeciesProps> = ({ seed, scale = 1 }) => {
  const tall = 1.1 + rng(seed) * 0.35;
  return (
    <group scale={[scale, scale, scale]}>
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.06, 0.14, 6]} />
        <meshStandardMaterial color="#5b4020" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.55 * tall, 0]}>
        <coneGeometry args={[0.12, 1.0 * tall, 8]} />
        <meshStandardMaterial color="#14532d" roughness={0.85} />
      </mesh>
    </group>
  );
};

// OLIVE — squat, silver-green puffball. Mediterranean workhorse.
const Olive: React.FC<SpeciesProps> = ({ seed, scale = 1 }) => {
  const hue = rng(seed);
  const color = hue < 0.5 ? '#84cc16' : '#a3a05c';
  return (
    <group scale={[scale, scale, scale]}>
      <mesh position={[0, 0.11, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.1, 0.22, 6]} />
        <meshStandardMaterial color="#5b4020" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.28, 10, 6]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0.15, 0.42, 0.05]}>
        <sphereGeometry args={[0.15, 8, 6]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
    </group>
  );
};

// UMBRELLA PINE — low wide canopy. Italian/Mediterranean hills.
const UmbrellaPine: React.FC<SpeciesProps> = ({ seed, scale = 1 }) => {
  return (
    <group scale={[scale, scale, scale]}>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.6, 6]} />
        <meshStandardMaterial color="#5b4020" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.7, 0]}>
        <cylinderGeometry args={[0.35, 0.1, 0.2, 10]} />
        <meshStandardMaterial color="#15803d" roughness={0.85} />
      </mesh>
    </group>
  );
};

// DATE PALM — tall trunk, radial fronds. Egyptian/Mesopotamian signature.
const DatePalm: React.FC<SpeciesProps> = ({ seed, scale = 1 }) => {
  const tall = 1.0 + rng(seed) * 0.4;
  return (
    <group scale={[scale, scale, scale]}>
      <mesh position={[0, 0.35 * tall, 0]} castShadow>
        <cylinderGeometry args={[0.05, 0.07, 0.7 * tall, 6]} />
        <meshStandardMaterial color="#78350f" roughness={0.95} />
      </mesh>
      <group position={[0, 0.7 * tall, 0]}>
        {[0, 1, 2, 3, 4, 5, 6].map((i) => (
          <mesh key={i} rotation={[Math.PI / 2.6, (i * Math.PI * 2) / 7, 0]}>
            <coneGeometry args={[0.07, 0.5, 4]} />
            <meshStandardMaterial color="#65a30d" roughness={0.75} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// ACACIA — umbrella shape, golden. Arid / savanna. East Africa icon.
const Acacia: React.FC<SpeciesProps> = ({ seed, scale = 1 }) => {
  const hue = rng(seed);
  const color = hue < 0.5 ? '#a16207' : '#ca8a04';
  return (
    <group scale={[scale, scale, scale]}>
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.4, 6]} />
        <meshStandardMaterial color="#78350f" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.35, 0.15, 0.12, 10]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0.08, 0.62, 0.02]}>
        <cylinderGeometry args={[0.18, 0.1, 0.08, 8]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </group>
  );
};

// BAOBAB — fat trunk, sparse crown. Savanna centerpiece.
const Baobab: React.FC<SpeciesProps> = ({ seed, scale = 1 }) => {
  return (
    <group scale={[scale, scale, scale]}>
      <mesh position={[0, 0.25, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.22, 0.5, 8]} />
        <meshStandardMaterial color="#78350f" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.28, 0.18, 0.1, 10]} />
        <meshStandardMaterial color="#a3e635" roughness={0.9} />
      </mesh>
    </group>
  );
};

// JUNGLE PALM — tall, broad canopy with many fronds. Tropical.
const JunglePalm: React.FC<SpeciesProps> = ({ seed, scale = 1 }) => {
  const tall = 1.0 + rng(seed) * 0.5;
  return (
    <group scale={[scale, scale, scale]}>
      <mesh position={[0, 0.4 * tall, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.8 * tall, 6]} />
        <meshStandardMaterial color="#713f12" roughness={0.95} />
      </mesh>
      <group position={[0, 0.85 * tall, 0]}>
        {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
          <mesh key={i} rotation={[Math.PI / 2.8, (i * Math.PI * 2) / 9, 0]}>
            <coneGeometry args={[0.09, 0.55, 4]} />
            <meshStandardMaterial color="#15803d" roughness={0.75} />
          </mesh>
        ))}
      </group>
    </group>
  );
};

// BANYAN — wide spreading canopy with hanging roots. Indian subcontinent.
const Banyan: React.FC<SpeciesProps> = ({ seed, scale = 1 }) => {
  return (
    <group scale={[scale, scale, scale]}>
      <mesh position={[0, 0.15, 0]} castShadow>
        <cylinderGeometry args={[0.14, 0.18, 0.3, 8]} />
        <meshStandardMaterial color="#44352a" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.4, 10, 8]} />
        <meshStandardMaterial color="#166534" roughness={0.85} />
      </mesh>
      {/* aerial roots */}
      <mesh position={[0.22, 0.28, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 4]} />
        <meshStandardMaterial color="#3f2e20" />
      </mesh>
      <mesh position={[-0.18, 0.3, 0.1]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 4]} />
        <meshStandardMaterial color="#3f2e20" />
      </mesh>
    </group>
  );
};

// FIR — tighter, taller cone than pine. Alpine.
const Fir: React.FC<SpeciesProps> = ({ seed, scale = 1 }) => {
  const tall = 1.2 + rng(seed) * 0.25;
  return (
    <group scale={[scale, scale, scale]}>
      <mesh position={[0, 0.08, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.08, 0.16, 6]} />
        <meshStandardMaterial color="#44352a" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.55 * tall, 0]}>
        <coneGeometry args={[0.22, 0.9 * tall, 8]} />
        <meshStandardMaterial color="#064e3b" roughness={0.85} />
      </mesh>
    </group>
  );
};

// Maps each climate to a weighted list of species. The weights are
// reflected by how many times an entry appears in the array.
type SpeciesName =
  | 'oak' | 'pine' | 'birch' | 'cypress' | 'olive' | 'umbrellaPine'
  | 'datePalm' | 'acacia' | 'baobab' | 'junglePalm' | 'banyan' | 'fir';

const SPECIES_BY_CLIMATE: Record<ClimateZone, SpeciesName[]> = {
  // Mixed European / Chinese deciduous: oak-heavy, pine, occasional birch.
  temperate: ['oak', 'oak', 'oak', 'pine', 'pine', 'birch'],
  // Olives dominate, cypress signatures, umbrella pines on hills.
  mediterranean: ['olive', 'olive', 'cypress', 'cypress', 'umbrellaPine'],
  // Sparse palms + acacia, occasional baobab.
  arid: ['datePalm', 'datePalm', 'acacia', 'acacia'],
  // Dense jungle — palms, banyans, tall canopy.
  tropical: ['junglePalm', 'junglePalm', 'banyan', 'banyan', 'oak'],
  // Pines dominate, birches for contrast, occasional fir.
  boreal: ['pine', 'pine', 'pine', 'birch', 'birch', 'fir'],
  // Scattered baobabs + acacia umbrellas.
  savanna: ['acacia', 'acacia', 'baobab', 'acacia', 'baobab'],
  // Firs and pines, a rare birch.
  alpine: ['fir', 'fir', 'pine', 'pine', 'birch'],
  // Mixed broadleaf + conifer + acacia: Ethiopian/Andean diversity.
  highland: ['oak', 'pine', 'acacia', 'fir', 'olive'],
};

const SPECIES_COMPONENTS: Record<SpeciesName, React.FC<SpeciesProps>> = {
  oak: Oak, pine: Pine, birch: Birch, cypress: Cypress, olive: Olive,
  umbrellaPine: UmbrellaPine, datePalm: DatePalm, acacia: Acacia,
  baobab: Baobab, junglePalm: JunglePalm, banyan: Banyan, fir: Fir,
};

// Picks a species from the climate's weighted list based on a seed.
const pickSpecies = (climate: ClimateZone, seed: number): SpeciesName => {
  const list = SPECIES_BY_CLIMATE[climate] || SPECIES_BY_CLIMATE.temperate;
  const idx = Math.floor(rng(seed) * list.length);
  return list[idx];
};

// Renders a single climate-appropriate tree, random species picked by seed.
const Tree: React.FC<{ climate: ClimateZone; seed: number; scale?: number }> = ({ climate, seed, scale = 1 }) => {
  const species = pickSpecies(climate, seed);
  const Component = SPECIES_COMPONENTS[species];
  return <Component seed={seed} scale={scale} />;
};

// ---------- Ground dressing ----------
// Climate-specific decor that appears on plains/grassland to give each
// biome a distinct "vibe" even when there's no forest tile.

// A small rock — gray pyramid. Used across many climates.
const Rock: React.FC<{ pos: [number, number]; tone?: 'gray' | 'red' | 'sand' }> = ({ pos, tone = 'gray' }) => {
  const color = tone === 'red' ? '#b45309' : tone === 'sand' ? '#d6a86c' : '#9ca3af';
  return (
    <mesh position={[pos[0], 0, pos[1]]} rotation={[0.2, rng(pos[0] + pos[1]) * 6, 0.1]}>
      <coneGeometry args={[0.11, 0.14, 5]} />
      <meshStandardMaterial color={color} roughness={0.95} flatShading />
    </mesh>
  );
};

// A grass tuft — small green cone cluster.
const GrassTuft: React.FC<{ pos: [number, number]; color?: string }> = ({ pos, color = '#65a30d' }) => (
  <group position={[pos[0], 0, pos[1]]}>
    <mesh position={[0, 0.06, 0]}>
      <coneGeometry args={[0.05, 0.12, 4]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
    <mesh position={[0.04, 0.05, 0.03]}>
      <coneGeometry args={[0.04, 0.1, 4]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
    <mesh position={[-0.03, 0.055, 0.02]}>
      <coneGeometry args={[0.04, 0.11, 4]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  </group>
);

// A cactus — three segment saguaro.
const Cactus: React.FC<{ pos: [number, number] }> = ({ pos }) => (
  <group position={[pos[0], 0, pos[1]]}>
    <mesh position={[0, 0.15, 0]}>
      <cylinderGeometry args={[0.06, 0.08, 0.3, 6]} />
      <meshStandardMaterial color="#15803d" roughness={0.85} />
    </mesh>
    <mesh position={[0.1, 0.18, 0]} rotation={[0, 0, -0.4]}>
      <cylinderGeometry args={[0.04, 0.05, 0.15, 5]} />
      <meshStandardMaterial color="#15803d" roughness={0.85} />
    </mesh>
    <mesh position={[-0.08, 0.2, 0]} rotation={[0, 0, 0.3]}>
      <cylinderGeometry args={[0.04, 0.05, 0.14, 5]} />
      <meshStandardMaterial color="#15803d" roughness={0.85} />
    </mesh>
  </group>
);

// A flower patch — tiny colored sphere on a stem. Cheerful highland/
// temperate meadow detail.
const Flower: React.FC<{ pos: [number, number]; color?: string }> = ({ pos, color = '#f472b6' }) => (
  <group position={[pos[0], 0, pos[1]]}>
    <mesh position={[0, 0.05, 0]}>
      <cylinderGeometry args={[0.01, 0.01, 0.1, 4]} />
      <meshStandardMaterial color="#65a30d" />
    </mesh>
    <mesh position={[0, 0.11, 0]}>
      <sphereGeometry args={[0.035, 6, 5]} />
      <meshStandardMaterial color={color} roughness={0.6} />
    </mesh>
  </group>
);

// Reeds for marsh/river edges.
const Reeds: React.FC<{ pos: [number, number] }> = ({ pos }) => (
  <group position={[pos[0], 0, pos[1]]}>
    {[0, 1, 2, 3].map((i) => (
      <mesh key={i} position={[(i - 1.5) * 0.04, 0.1, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.2, 4]} />
        <meshStandardMaterial color="#365314" roughness={0.9} />
      </mesh>
    ))}
  </group>
);

// A low scrub bush — for arid/mediterranean hills.
const Scrub: React.FC<{ pos: [number, number]; tone?: string }> = ({ pos, tone = '#84cc16' }) => (
  <group position={[pos[0], 0, pos[1]]}>
    <mesh position={[0, 0.08, 0]}>
      <sphereGeometry args={[0.1, 7, 5]} />
      <meshStandardMaterial color={tone} roughness={0.9} />
    </mesh>
    <mesh position={[0.06, 0.06, 0.04]}>
      <sphereGeometry args={[0.07, 6, 5]} />
      <meshStandardMaterial color={tone} roughness={0.9} />
    </mesh>
  </group>
);

// A pile of rocks — 2-3 stones stacked. Alpine/boreal.
const RockPile: React.FC<{ pos: [number, number] }> = ({ pos }) => (
  <group position={[pos[0], 0, pos[1]]}>
    <mesh position={[0, 0.05, 0]}>
      <coneGeometry args={[0.13, 0.1, 5]} />
      <meshStandardMaterial color="#78716c" roughness={0.95} flatShading />
    </mesh>
    <mesh position={[0.08, 0.14, 0.03]} rotation={[0.3, 0.4, 0]}>
      <coneGeometry args={[0.07, 0.1, 5]} />
      <meshStandardMaterial color="#9ca3af" roughness={0.95} flatShading />
    </mesh>
  </group>
);

// Climate + terrain → ground dressing renderer. Returns up to ~4 elements
// so we never drown the tile in clutter.
const GroundDressing: React.FC<{ climate: ClimateZone; terrain: TerrainType; seed: number }> = ({
  climate, terrain, seed,
}) => {
  // Determine density: more on Grassland than Plains, none on water.
  if (
    terrain === TerrainType.Ocean ||
    terrain === TerrainType.River ||
    terrain === TerrainType.HighMountain
  ) {
    return null;
  }

  const elements: React.ReactNode[] = [];

  // Marsh gets reeds regardless of climate.
  if (terrain === TerrainType.Marsh) {
    elements.push(<Reeds key="r1" pos={[0.2, 0.2]} />);
    elements.push(<Reeds key="r2" pos={[-0.2, -0.1]} />);
    if (climate === 'tropical') elements.push(<JunglePalm key="jp" seed={seed + 7} scale={0.5} />);
    return <group position={[0, 0.25, 0]}>{elements}</group>;
  }

  // Desert tiles — always sparse.
  if (terrain === TerrainType.Desert) {
    if (climate === 'arid') {
      // Sand + rocks + occasional palm + cactus.
      elements.push(<Rock key="r1" pos={[0.2, -0.1]} tone="sand" />);
      elements.push(<Rock key="r2" pos={[-0.25, 0.15]} tone="sand" />);
      if (rng(seed + 3) > 0.6) {
        elements.push(<DatePalm key="dp" seed={seed + 1} scale={0.5} />);
      } else if (rng(seed + 4) > 0.6) {
        elements.push(<Cactus key="c" pos={[0, 0]} />);
      }
    } else if (climate === 'savanna') {
      elements.push(<GrassTuft key="g1" pos={[0.2, 0.1]} color="#a16207" />);
      elements.push(<GrassTuft key="g2" pos={[-0.15, -0.15]} color="#a16207" />);
      elements.push(<Rock key="r" pos={[0.1, 0.2]} tone="red" />);
    } else {
      elements.push(<Rock key="r1" pos={[0.15, 0.1]} tone="sand" />);
    }
    return <group position={[0, 0.25, 0]}>{elements}</group>;
  }

  // Plains & Grassland — the main canvas for climate flavor.
  if (terrain === TerrainType.Plains || terrain === TerrainType.Grassland) {
    switch (climate) {
      case 'temperate':
        elements.push(<GrassTuft key="g1" pos={[0.2, 0.15]} />);
        if (rng(seed) > 0.5) elements.push(<Flower key="f" pos={[-0.15, 0.1]} color="#facc15" />);
        if (rng(seed + 1) > 0.7) elements.push(<Oak key="t" seed={seed} scale={0.5} />);
        break;
      case 'mediterranean':
        elements.push(<Scrub key="s1" pos={[0.2, -0.15]} tone="#84cc16" />);
        elements.push(<Rock key="r" pos={[-0.2, 0.2]} />);
        if (rng(seed + 2) > 0.5) elements.push(<Olive key="o" seed={seed} scale={0.55} />);
        if (rng(seed + 3) > 0.7) elements.push(<Flower key="f" pos={[0, 0.1]} color="#a855f7" />);
        break;
      case 'arid':
        elements.push(<Rock key="r1" pos={[0.18, -0.1]} tone="sand" />);
        elements.push(<Scrub key="s" pos={[-0.12, 0.15]} tone="#a3a05c" />);
        if (rng(seed + 3) > 0.65) elements.push(<DatePalm key="dp" seed={seed} scale={0.55} />);
        if (rng(seed + 4) > 0.75) elements.push(<Cactus key="c" pos={[0.05, 0.2]} />);
        break;
      case 'tropical':
        elements.push(<GrassTuft key="g1" pos={[0.2, 0.15]} color="#15803d" />);
        elements.push(<GrassTuft key="g2" pos={[-0.2, -0.1]} color="#15803d" />);
        if (rng(seed + 2) > 0.4) elements.push(<JunglePalm key="jp" seed={seed} scale={0.55} />);
        if (rng(seed + 5) > 0.6) elements.push(<Flower key="f" pos={[0.1, -0.2]} color="#f97316" />);
        break;
      case 'boreal':
        elements.push(<RockPile key="rp" pos={[0.22, -0.1]} />);
        elements.push(<GrassTuft key="g" pos={[-0.2, 0.15]} color="#4d7c0f" />);
        if (rng(seed + 2) > 0.5) elements.push(<Pine key="p" seed={seed} scale={0.55} />);
        break;
      case 'savanna':
        elements.push(<GrassTuft key="g1" pos={[0.22, 0.1]} color="#a16207" />);
        elements.push(<GrassTuft key="g2" pos={[-0.18, -0.15]} color="#a16207" />);
        elements.push(<GrassTuft key="g3" pos={[0.0, 0.2]} color="#ca8a04" />);
        if (rng(seed + 2) > 0.55) elements.push(<Acacia key="a" seed={seed} scale={0.55} />);
        if (rng(seed + 4) > 0.85) elements.push(<Baobab key="b" seed={seed} scale={0.55} />);
        break;
      case 'alpine':
        elements.push(<RockPile key="rp" pos={[0.2, 0.1]} />);
        elements.push(<Flower key="f" pos={[-0.15, -0.1]} color="#60a5fa" />);
        if (rng(seed + 2) > 0.5) elements.push(<Fir key="fir" seed={seed} scale={0.55} />);
        break;
      case 'highland':
        elements.push(<GrassTuft key="g" pos={[0.2, 0.15]} color="#4d7c0f" />);
        elements.push(<Flower key="f1" pos={[-0.2, 0.1]} color="#facc15" />);
        elements.push(<Flower key="f2" pos={[0.1, -0.2]} color="#f472b6" />);
        if (rng(seed + 2) > 0.5) elements.push(<Acacia key="a" seed={seed} scale={0.5} />);
        break;
    }
  }

  return <group position={[0, 0.25, 0]}>{elements}</group>;
};

// ---------- Climate-tinted terrain colors ----------
// Same terrain types look different in different parts of the world.
// "Plains" in Egypt should read sandier than "Plains" in Germania.
// This table lets each climate override the default TERRAIN_COLORS
// for certain terrain types. If a climate isn't in the table, the
// default color is used.
const TERRAIN_COLOR_BY_CLIMATE: Partial<
  Record<ClimateZone, Partial<Record<TerrainType, string>>>
> = {
  arid: {
    [TerrainType.Plains]: '#f3e1a0',     // sandy-beige
    [TerrainType.Grassland]: '#d4b670',  // dry golden grass
    [TerrainType.Desert]: '#f3d488',     // warmer sand
    [TerrainType.Mountain]: '#a98557',   // sandstone
  },
  savanna: {
    [TerrainType.Plains]: '#e3c879',     // dry grass plain
    [TerrainType.Grassland]: '#caa55c',  // golden savanna
    [TerrainType.Desert]: '#d89e55',     // red-gold earth
    [TerrainType.Mountain]: '#8f6a40',
  },
  tropical: {
    [TerrainType.Plains]: '#bde575',     // lush light green
    [TerrainType.Grassland]: '#86efac',  // deep fresh green
    [TerrainType.Forest]: '#14532d',     // dense jungle canopy
    [TerrainType.Marsh]: '#065f46',      // deep mangrove
  },
  mediterranean: {
    [TerrainType.Plains]: '#d4c77a',     // sun-bleached straw
    [TerrainType.Grassland]: '#b8cd6c',  // dry olive-green
    [TerrainType.Forest]: '#4d7c0f',     // silvery olive
    [TerrainType.Mountain]: '#9b7d53',   // sunlit limestone
  },
  boreal: {
    [TerrainType.Plains]: '#92a060',     // cool damp green-brown
    [TerrainType.Grassland]: '#5c8a47',  // moss-rich
    [TerrainType.Forest]: '#14532d',     // dark conifer
    [TerrainType.Mountain]: '#6b5c48',   // dark granite
  },
  temperate: {
    [TerrainType.Plains]: '#d8cf86',     // softer wheat
    [TerrainType.Grassland]: '#84cc16',  // classic meadow
    [TerrainType.Forest]: '#166534',     // deciduous mid-green
  },
  alpine: {
    [TerrainType.Plains]: '#a8a875',     // hardy stony ground
    [TerrainType.Grassland]: '#7fa55c',  // crisp mountain meadow
    [TerrainType.Forest]: '#064e3b',     // dense fir
    [TerrainType.Mountain]: '#7d7368',   // cold granite
  },
  highland: {
    [TerrainType.Plains]: '#c4b877',     // dry upland plain
    [TerrainType.Grassland]: '#8baa4a',  // highland meadow
    [TerrainType.Forest]: '#3f6b2a',     // mixed highland green
    [TerrainType.Mountain]: '#947a50',   // red-earth rock
  },
};

// Resolves the right color for a terrain + climate pair, falling back
// to the default TERRAIN_COLORS table if there's no override.
const resolveTerrainColor = (terrain: TerrainType, climate: ClimateZone): string => {
  const override = TERRAIN_COLOR_BY_CLIMATE[climate]?.[terrain];
  return override || TERRAIN_COLORS[terrain];
};

// ---------- Surface Detail ----------
// Subtle meshes added to the TOP of a hex to make the surface look
// textured instead of flat. Each terrain has its own pattern. These
// sit at y≈0.01 above the tile's top face and are hash-stable per tile.
const SurfaceDetail: React.FC<{
  terrain: TerrainType;
  climate: ClimateZone;
  seed: number;
}> = ({ terrain, climate, seed }) => {
  // All details live just above the tile surface. We use a larger
  // offset + depthWrite:false on detail materials to avoid Z-fighting
  // with the hex face underneath.
  const yBase = 0.003;

  if (terrain === TerrainType.Plains) {
    // Soil furrows — thin dark lines suggesting rows of farming ready
    // ground. Two parallel, very thin strips.
    const tint = climate === 'arid' || climate === 'savanna' ? '#b89446' : '#8c7a4d';
    return (
      <group position={[0, yBase, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, rng(seed) * 0.6]}>
          <planeGeometry args={[1.0, 0.06]} />
          <meshStandardMaterial color={tint} roughness={0.95} transparent opacity={0.5} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, rng(seed) * 0.6]} position={[0.1, 0, 0.1]}>
          <planeGeometry args={[0.9, 0.05]} />
          <meshStandardMaterial color={tint} roughness={0.95} transparent opacity={0.4} />
        </mesh>
      </group>
    );
  }

  if (terrain === TerrainType.Grassland) {
    // Two or three darker/lighter patches to break the uniform green.
    const dark = climate === 'tropical' ? '#15803d' : climate === 'savanna' ? '#a16207' : '#65a30d';
    const light = climate === 'tropical' ? '#a3e635' : climate === 'savanna' ? '#eab308' : '#a3e635';
    return (
      <group position={[0, yBase, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.2, 0, 0.1]}>
          <circleGeometry args={[0.25, 6]} />
          <meshStandardMaterial color={dark} roughness={0.95} transparent opacity={0.35} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.25, 0, -0.15]}>
          <circleGeometry args={[0.2, 6]} />
          <meshStandardMaterial color={light} roughness={0.95} transparent opacity={0.3} />
        </mesh>
      </group>
    );
  }

  if (terrain === TerrainType.Desert) {
    // Dune ripple lines — two wavy strips suggesting wind patterns.
    const rot = rng(seed) * Math.PI;
    return (
      <group position={[0, yBase, 0]} rotation={[0, rot, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.15]}>
          <torusGeometry args={[0.5, 0.015, 4, 16, Math.PI * 0.8]} />
          <meshStandardMaterial color="#d69e55" roughness={0.95} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, -0.15]}>
          <torusGeometry args={[0.4, 0.012, 4, 16, Math.PI * 0.75]} />
          <meshStandardMaterial color="#d69e55" roughness={0.95} />
        </mesh>
      </group>
    );
  }

  if (terrain === TerrainType.Forest) {
    // Leaf-litter patches — small dark circles under the canopy to
    // suggest shadowed forest floor.
    const litter = climate === 'tropical' ? '#064e3b' : climate === 'boreal' || climate === 'alpine' ? '#1c1917' : '#3f2e20';
    return (
      <group position={[0, yBase, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.15, 0, -0.15]}>
          <circleGeometry args={[0.22, 6]} />
          <meshStandardMaterial color={litter} roughness={0.95} transparent opacity={0.45} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.2, 0, 0.18]}>
          <circleGeometry args={[0.18, 6]} />
          <meshStandardMaterial color={litter} roughness={0.95} transparent opacity={0.4} />
        </mesh>
      </group>
    );
  }

  if (terrain === TerrainType.Mountain || terrain === TerrainType.HighMountain) {
    // Rocky patches on the lower slopes — scattered small polygons.
    return (
      <group position={[0, yBase, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, rng(seed) * 6]} position={[0.3, 0, 0.1]}>
          <circleGeometry args={[0.12, 5]} />
          <meshStandardMaterial color="#6b5c48" roughness={0.95} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, rng(seed + 1) * 6]} position={[-0.2, 0, -0.25]}>
          <circleGeometry args={[0.09, 5]} />
          <meshStandardMaterial color="#78716c" roughness={0.95} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, rng(seed + 2) * 6]} position={[-0.3, 0, 0.2]}>
          <circleGeometry args={[0.1, 5]} />
          <meshStandardMaterial color="#57534e" roughness={0.95} />
        </mesh>
      </group>
    );
  }

  if (terrain === TerrainType.Ocean) {
    // Wave foam — small white semicircles near the tile edges.
    return (
      <group position={[0, yBase, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.3, 0, 0.15]}>
          <torusGeometry args={[0.12, 0.008, 4, 12, Math.PI]} />
          <meshStandardMaterial color="#e0f2fe" emissive="#bae6fd" emissiveIntensity={0.4} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, Math.PI]} position={[-0.25, 0, -0.2]}>
          <torusGeometry args={[0.1, 0.007, 4, 12, Math.PI]} />
          <meshStandardMaterial color="#e0f2fe" emissive="#bae6fd" emissiveIntensity={0.35} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]} position={[-0.2, 0, 0.3]}>
          <torusGeometry args={[0.09, 0.006, 4, 12, Math.PI]} />
          <meshStandardMaterial color="#e0f2fe" emissive="#bae6fd" emissiveIntensity={0.35} />
        </mesh>
      </group>
    );
  }

  if (terrain === TerrainType.River) {
    // Flow ripples — chevron-like arc patterns.
    return (
      <group position={[0, yBase, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]}>
          <torusGeometry args={[0.35, 0.01, 4, 12, Math.PI]} />
          <meshStandardMaterial color="#93c5fd" emissive="#60a5fa" emissiveIntensity={0.3} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.25]}>
          <torusGeometry args={[0.22, 0.008, 4, 12, Math.PI]} />
          <meshStandardMaterial color="#93c5fd" emissive="#60a5fa" emissiveIntensity={0.25} />
        </mesh>
      </group>
    );
  }

  if (terrain === TerrainType.Marsh) {
    // Scattered puddles — small darker water patches.
    return (
      <group position={[0, yBase, 0]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.2, 0, 0.1]}>
          <circleGeometry args={[0.14, 8]} />
          <meshStandardMaterial color="#0f172a" emissive="#1e3a8a" emissiveIntensity={0.2} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-0.25, 0, -0.15]}>
          <circleGeometry args={[0.1, 8]} />
          <meshStandardMaterial color="#0f172a" emissive="#1e3a8a" emissiveIntensity={0.2} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0.05, 0, -0.3]}>
          <circleGeometry args={[0.08, 8]} />
          <meshStandardMaterial color="#0f172a" emissive="#1e3a8a" emissiveIntensity={0.2} />
        </mesh>
      </group>
    );
  }

  return null;
};

interface HexTileProps {
  x: number;
  z: number;
  terrain: TerrainType;
  onClick: () => void;
  isHovered?: boolean;
  climate?: ClimateZone;
  // When a building is placed on a tile, suppress forest trees and
  // large ground dressing so the building model is clearly visible.
  building?: string;
}

export const HexTile3D: React.FC<HexTileProps> = ({ x, z, terrain, onClick, isHovered, climate = 'temperate', building }) => {
  // When a building occupies this tile, suppress forest trees and large
  // ground props so the building model is clearly visible. Surface
  // detail (furrows, dune ripples, etc.) stays because it's flat and
  // doesn't block the view.
  const hasBuilding = !!building && building !== 'None';
  const color = resolveTerrainColor(terrain, climate);

  // Height variation based on terrain
  let height = 0.5;
  let yPos = 0;
  let terrainColor = color;

  if (terrain === TerrainType.Mountain) {
    // Mountain bottom plane matches Plains (-0.125) so the tile is not
    // floating in the air. Height 1.0 (rendered 0.5) gives a +0.25 rise
    // above Plains top. yPos = -0.125 + (height * geometry-h) / 2
    //                       = -0.125 + (1.0 * 0.5) / 2 = 0.125
    height = 1.0;
    yPos = 0.125;
  } else if (terrain === TerrainType.HighMountain) {
    // HighMountain: same alignment, but rises +0.5 above Plains top.
    // height 1.5 -> rendered 0.75 -> half 0.375 -> yPos = 0.25
    height = 1.5;
    yPos = 0.25;
  } else if (terrain === TerrainType.Ocean) {
    yPos = -0.15;
    height = 0.4;
  } else if (terrain === TerrainType.River) {
    yPos = -0.1;
  } else if (terrain === TerrainType.Marsh) {
    yPos = -0.05;
    height = 0.45;
  }

  // Biome-aware material: water tiles get reflective/emissive treatment so
  // ocean/river/marsh read as wet, while land tiles keep the matte board-game
  // look. Centralizing the params here lets us tune biomes without touching
  // the mesh tree.
  let matRoughness = 0.8;
  let matMetalness = 0.05;
  let matEmissive = '#000000';
  let matEmissiveIntensity = 0;
  if (terrain === TerrainType.Ocean) {
    matRoughness = 0.15;
    matMetalness = 0.35;
    matEmissive = '#0c4a6e';
    matEmissiveIntensity = 0.18;
  } else if (terrain === TerrainType.River) {
    matRoughness = 0.25;
    matMetalness = 0.25;
    matEmissive = '#1e3a8a';
    matEmissiveIntensity = 0.1;
  } else if (terrain === TerrainType.Marsh) {
    matRoughness = 0.45;
    matMetalness = 0.15;
    matEmissive = '#064e3b';
    matEmissiveIntensity = 0.08;
  } else if (terrain === TerrainType.Forest) {
    matRoughness = 0.85; // extra matte for canopy richness
  } else if (terrain === TerrainType.Desert) {
    matRoughness = 0.9;
    matMetalness = 0; // dry, no sheen
  }

  // Multi-material array: [0] sides = invisible, [1] top = terrain, [2] bottom = dark
  const topMat = React.useMemo(() => new THREE.MeshStandardMaterial({
    color: isHovered ? '#e2e8f0' : terrainColor,
    roughness: matRoughness,
    metalness: matMetalness,
    emissive: new THREE.Color(matEmissive),
    emissiveIntensity: matEmissiveIntensity,
    // polygonOffset biases the depth test so overlapping top caps never
    // Z-fight with neighbours. Without this, the scale fudge alone cannot
    // guarantee which face wins at the depth buffer's precision limit,
    // which is what caused the strobing flicker after commit 85e8aef.
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  }), [isHovered, terrainColor, matRoughness, matMetalness, matEmissive, matEmissiveIntensity]);

  const bottomMat = React.useMemo(() => new THREE.MeshStandardMaterial({
    color: isHovered ? '#d1d5db' : terrainColor,
    roughness: 1,
    metalness: 0,
    polygonOffset: true,
    polygonOffsetFactor: 1,
    polygonOffsetUnits: 1,
  }), [isHovered, terrainColor]);

  const materials = React.useMemo(
    () => [HEX_SIDE_MATERIAL, topMat, bottomMat],
    [topMat, bottomMat],
  );

  return (
    <group position={[x, yPos, z]}>
      {/* Hex cylinder. Geometry baked at radius 1.003 (see hexGeometry
          above) for pixel-seam closure; opaque dark-earth side material
          fills any height-gap between tall (Mountain) and short
          (Plains) neighbors. polygonOffset on caps handles top-cap
          Z-fighting at edges. */}
      <mesh
        geometry={hexGeometry}
        material={materials}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        scale={[1.0, height, 1.0]}
        receiveShadow
        castShadow
      />

      {/* Selection Ring */}
      {isHovered && (
         <mesh position={[0, height/2 + 0.02, 0]} rotation={[-Math.PI/2, 0, Math.PI/6]}>
            <ringGeometry args={[0.85, 0.95, 6]} />
            <meshBasicMaterial color="white" toneMapped={false} />
         </mesh>
      )}

      {/* Surface detail — climate-aware texture on the top face.
          The cylinder top face is at local y = 0.25 * height. */}
      <group position={[0, 0.25 * height + 0.01, 0]}>
        <SurfaceDetail
          terrain={terrain}
          climate={climate}
          seed={Math.floor(x * 97 + z * 43)}
        />
      </group>

      {/* Forest Details — mixed species forest. Each tree independently
          picks a species from the climate's weighted pool, so a Germanic
          forest tile shows a mix of pines and birches while a Khmer
          forest shows jungle palms, banyans, and the occasional
          broadleaf. Density scales with climate's biodiversity. */}
      {terrain === TerrainType.Forest && !hasBuilding && (() => {
        const tileSeed = Math.floor(x * 31 + z * 17);
        // Dense climates (tropical, temperate, boreal) get 4 trees,
        // sparse climates (arid, savanna) get 2-3.
        const dense = climate === 'tropical' || climate === 'temperate' || climate === 'boreal' || climate === 'alpine';
        const sparse = climate === 'arid' || climate === 'savanna';
        const slots = dense
          ? [
              { x: -0.3, z: -0.25, s: 0.85, seed: 11 },
              { x: 0.3, z: 0.1, s: 1.0, seed: 22 },
              { x: -0.1, z: 0.35, s: 0.75, seed: 33 },
              { x: 0.25, z: -0.35, s: 0.7, seed: 44 },
            ]
          : sparse
            ? [
                { x: -0.2, z: -0.1, s: 0.85, seed: 11 },
                { x: 0.25, z: 0.2, s: 0.75, seed: 22 },
              ]
            : [
                { x: -0.3, z: -0.2, s: 0.85, seed: 11 },
                { x: 0.3, z: 0.1, s: 1.0, seed: 22 },
                { x: -0.05, z: 0.35, s: 0.75, seed: 33 },
              ];
        return (
          <group position={[0, 0.25, 0]}>
            {slots.map((tree, i) => (
              <group key={i} position={[tree.x, 0, tree.z]}>
                <Tree climate={climate} seed={tree.seed + tileSeed} scale={tree.s} />
              </group>
            ))}
            {/* Forest floor detail — a grass tuft or rock to fill space. */}
            {rng(tileSeed) > 0.4 && (
              <GrassTuft
                pos={[0.15, -0.3]}
                color={climate === 'tropical' ? '#15803d' : climate === 'boreal' ? '#4d7c0f' : climate === 'arid' || climate === 'savanna' ? '#a16207' : '#65a30d'}
              />
            )}
          </group>
        );
      })()}

      {/* Non-forest ground dressing — plains, grassland, desert, marsh
          all get climate-appropriate props so each biome feels alive.
          Suppressed when a building is present to keep the model visible. */}
      {!hasBuilding && (terrain === TerrainType.Plains ||
        terrain === TerrainType.Grassland ||
        terrain === TerrainType.Desert ||
        terrain === TerrainType.Marsh) && (
        <GroundDressing
          climate={climate}
          terrain={terrain}
          seed={Math.floor(x * 31 + z * 17)}
        />
      )}

      {/* Mountain Peaks. Group y = cone half-height (0.5) so the cone
          BASE sits on the hex top cap (which is the parent SurfaceDetail
          group, already at +0.01 above the cap). Was previously 0.8
          which floated the cone 0.3 units above the tile. */}
      {terrain === TerrainType.Mountain && (
        <group position={[0, 0.5, 0]}>
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

      {/* High Mountain Peaks (Taller, purpler). Group y = cone
          half-height (0.75) so cone base lands on the tile top.
          Previously 1.2 which floated the peak 0.45 units up. */}
      {terrain === TerrainType.HighMountain && (
        <group position={[0, 0.75, 0]}>
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
    // Detailed timber-framed cottage: stone footing, stucco walls with
    // crossed beams, terracotta pyramid roof with ridge cap, chimney with
    // smoke, door + lintel, two windows, stepping stones.
    return (
        <group position={position}>
            <GroundShadow r={0.85} />
            <group position={[0, 0.3, 0]} scale={[0.9, 0.9, 0.9]}>
                <mesh position={[0, 0.07, 0]} material={MM.stoneDark} castShadow receiveShadow>
                    <boxGeometry args={[0.62, 0.14, 0.56]} />
                </mesh>
                <mesh position={[0, 0.32, 0]} material={MM.stucco} castShadow>
                    <boxGeometry args={[0.5, 0.4, 0.45]} />
                </mesh>
                {/* timber frame beams */}
                <mesh position={[0, 0.47, 0.228]} material={MM.woodDark}>
                    <boxGeometry args={[0.5, 0.05, 0.02]} />
                </mesh>
                <mesh position={[-0.17, 0.32, 0.228]} material={MM.woodDark}>
                    <boxGeometry args={[0.04, 0.36, 0.02]} />
                </mesh>
                <mesh position={[0.17, 0.32, 0.228]} material={MM.woodDark}>
                    <boxGeometry args={[0.04, 0.36, 0.02]} />
                </mesh>
                {/* roof + eaves + ridge cap */}
                <mesh position={[0, 0.52, 0]} rotation={[0, Math.PI / 4, 0]} material={MM.wood}>
                    <boxGeometry args={[0.58, 0.05, 0.58]} />
                </mesh>
                <mesh position={[0, 0.74, 0]} rotation={[0, Math.PI / 4, 0]} material={MM.terracotta} castShadow>
                    <coneGeometry args={[0.44, 0.42, 4]} />
                </mesh>
                <mesh position={[0, 0.95, 0]} material={MM.woodDark}>
                    <boxGeometry args={[0.07, 0.05, 0.07]} />
                </mesh>
                {/* chimney + smoke */}
                <mesh position={[0.18, 0.78, -0.1]} material={MM.stoneDark}>
                    <boxGeometry args={[0.09, 0.3, 0.09]} />
                </mesh>
                <mesh position={[0.18, 0.99, -0.1]} material={MM.smoke}>
                    <sphereGeometry args={[0.05, 6, 6]} />
                </mesh>
                <mesh position={[0.22, 1.07, -0.08]} material={MM.smoke}>
                    <sphereGeometry args={[0.035, 6, 6]} />
                </mesh>
                {/* door with lintel + windows */}
                <mesh position={[0, 0.24, 0.232]} material={MM.woodDark}>
                    <boxGeometry args={[0.13, 0.22, 0.02]} />
                </mesh>
                <mesh position={[0, 0.37, 0.235]} material={MM.wood}>
                    <boxGeometry args={[0.17, 0.04, 0.02]} />
                </mesh>
                <mesh position={[-0.15, 0.38, 0.232]} material={MM.clothBlue}>
                    <boxGeometry args={[0.08, 0.08, 0.02]} />
                </mesh>
                <mesh position={[0.15, 0.38, 0.232]} material={MM.clothBlue}>
                    <boxGeometry args={[0.08, 0.08, 0.02]} />
                </mesh>
                {/* stepping stones */}
                <mesh position={[0, 0.015, 0.36]} material={MM.stone}>
                    <cylinderGeometry args={[0.05, 0.05, 0.03, 6]} />
                </mesh>
                <mesh position={[0.07, 0.015, 0.46]} material={MM.stone}>
                    <cylinderGeometry args={[0.04, 0.04, 0.03, 6]} />
                </mesh>
            </group>
        </group>
    );
};


interface Wall3DProps {
    position: [number, number, number];
    // Optional neighbor-connection hints (legacy); current design is
    // orientation-agnostic so these are accepted and ignored.
    connections?: string[];
}

export const Wall3D: React.FC<Wall3DProps> = ({ position, connections = [] }) => {
    // Fortified gate segment: crenellated curtain wall, arched gateway,
    // two round towers with conical roofs and banners.
    void connections; // orientation-agnostic design
    return (
        <group position={position}>
            <GroundShadow r={0.95} />
            <group position={[0, 0.3, 0]} scale={[0.9, 0.9, 0.9]}>
                <mesh position={[0, 0.2, 0]} material={MM.stone} castShadow receiveShadow>
                    <boxGeometry args={[0.85, 0.36, 0.2]} />
                </mesh>
                {/* crenellations */}
                {[-0.3, -0.1, 0.1, 0.3].map((x, i) => (
                    <mesh key={i} position={[x, 0.43, 0]} material={MM.stoneDark}>
                        <boxGeometry args={[0.09, 0.1, 0.2]} />
                    </mesh>
                ))}
                {/* gate arch */}
                <mesh position={[0, 0.14, 0.105]} material={MM.woodDark}>
                    <boxGeometry args={[0.18, 0.24, 0.02]} />
                </mesh>
                <mesh position={[0, 0.28, 0.105]} rotation={[Math.PI / 2, 0, 0]} material={MM.stoneDark}>
                    <cylinderGeometry args={[0.09, 0.09, 0.02, 12, 1, false, 0, Math.PI]} />
                </mesh>
                {/* towers + roofs + banners */}
                <mesh position={[-0.42, 0.3, 0]} material={MM.stoneDark} castShadow>
                    <cylinderGeometry args={[0.13, 0.15, 0.6, 8]} />
                </mesh>
                <mesh position={[0.42, 0.3, 0]} material={MM.stoneDark} castShadow>
                    <cylinderGeometry args={[0.13, 0.15, 0.6, 8]} />
                </mesh>
                <mesh position={[-0.42, 0.68, 0]} material={MM.terracotta}>
                    <coneGeometry args={[0.16, 0.18, 8]} />
                </mesh>
                <mesh position={[0.42, 0.68, 0]} material={MM.terracotta}>
                    <coneGeometry args={[0.16, 0.18, 8]} />
                </mesh>
                <mesh position={[-0.42, 0.84, 0]} material={MM.wood}>
                    <cylinderGeometry args={[0.01, 0.01, 0.14, 4]} />
                </mesh>
                <mesh position={[-0.38, 0.87, 0]} material={MM.clothRed}>
                    <boxGeometry args={[0.07, 0.05, 0.01]} />
                </mesh>
            </group>
        </group>
    );
};


export const Temple3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    // Classical temple: two-step podium, colonnade, entablature, pediment,
    // and a burning altar out front flanked by votive statues.
    return (
        <group position={position}>
            <GroundShadow r={0.95} />
            <group position={[0, 0.3, 0]} scale={[0.9, 0.9, 0.9]}>
                <mesh position={[0, 0.045, 0]} material={MM.marbleDim} receiveShadow>
                    <boxGeometry args={[0.72, 0.09, 0.58]} />
                </mesh>
                <mesh position={[0, 0.115, 0]} material={MM.marble}>
                    <boxGeometry args={[0.62, 0.06, 0.5]} />
                </mesh>
                {/* cella */}
                <mesh position={[0, 0.34, -0.05]} material={MM.marbleDim} castShadow>
                    <boxGeometry args={[0.4, 0.38, 0.32]} />
                </mesh>
                {/* colonnade */}
                {[-0.22, -0.075, 0.075, 0.22].map((x, i) => (
                    <mesh key={i} position={[x, 0.32, 0.19]} material={MM.marble}>
                        <cylinderGeometry args={[0.035, 0.04, 0.36, 8]} />
                    </mesh>
                ))}
                {[-0.24, 0.24].map((x, i) => (
                    <mesh key={'s' + i} position={[x, 0.32, 0]} material={MM.marble}>
                        <cylinderGeometry args={[0.035, 0.04, 0.36, 8]} />
                    </mesh>
                ))}
                {/* entablature + pediment */}
                <mesh position={[0, 0.545, 0]} material={MM.marble} castShadow>
                    <boxGeometry args={[0.66, 0.07, 0.52]} />
                </mesh>
                <mesh position={[0, 0.65, 0]} rotation={[0, 0, 0]} material={MM.marbleDim}>
                    <cylinderGeometry args={[0.3, 0.3, 0.5, 3, 1]} />
                </mesh>
                <mesh position={[0, 0.86, 0]} material={MM.gold}>
                    <sphereGeometry args={[0.045, 8, 8]} />
                </mesh>
                {/* altar + flame + statues */}
                <mesh position={[0, 0.08, 0.42]} material={MM.stoneDark}>
                    <boxGeometry args={[0.12, 0.12, 0.12]} />
                </mesh>
                <mesh position={[0, 0.2, 0.42]} material={MM.flame}>
                    <coneGeometry args={[0.045, 0.12, 6]} />
                </mesh>
                <mesh position={[-0.28, 0.13, 0.38]} material={MM.marbleDim}>
                    <cylinderGeometry args={[0.03, 0.04, 0.16, 6]} />
                </mesh>
                <mesh position={[0.28, 0.13, 0.38]} material={MM.marbleDim}>
                    <cylinderGeometry args={[0.03, 0.04, 0.16, 6]} />
                </mesh>
            </group>
        </group>
    );
};


export const Amphitheatre3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    // Greek theater: three tiers of semicircular seating carved around an
    // orchestra floor, a skene (stage building), and torch-lit entrances.
    const tiers = [
        { r: 0.42, h: 0.1, y: 0.05 },
        { r: 0.33, h: 0.1, y: 0.15 },
        { r: 0.24, h: 0.1, y: 0.25 },
    ];
    return (
        <group position={position}>
            <GroundShadow r={0.95} />
            <group position={[0, 0.3, 0]} scale={[0.9, 0.9, 0.9]}>
                {tiers.map((t, i) => (
                    <mesh key={i} position={[0, t.y, -0.05]} material={i % 2 ? MM.marbleDim : MM.stone} castShadow={i === 0} receiveShadow>
                        <cylinderGeometry args={[t.r, t.r + 0.03, t.h, 20, 1, false, 0, Math.PI]} />
                    </mesh>
                ))}
                {/* orchestra floor */}
                <mesh position={[0, 0.02, -0.05]} material={MM.sand}>
                    <cylinderGeometry args={[0.2, 0.2, 0.04, 20, 1, false, 0, Math.PI]} />
                </mesh>
                {/* skene stage building */}
                <mesh position={[0, 0.12, 0.22]} material={MM.stucco} castShadow>
                    <boxGeometry args={[0.5, 0.22, 0.14]} />
                </mesh>
                <mesh position={[0, 0.26, 0.22]} material={MM.terracotta}>
                    <boxGeometry args={[0.54, 0.05, 0.18]} />
                </mesh>
                {/* stage columns */}
                {[-0.18, 0, 0.18].map((x, i) => (
                    <mesh key={'c' + i} position={[x, 0.1, 0.31]} material={MM.marble}>
                        <cylinderGeometry args={[0.02, 0.02, 0.18, 6]} />
                    </mesh>
                ))}
                {/* torches at the entrances */}
                <mesh position={[-0.46, 0.12, 0.1]} material={MM.wood}>
                    <cylinderGeometry args={[0.015, 0.015, 0.2, 4]} />
                </mesh>
                <mesh position={[-0.46, 0.24, 0.1]} material={MM.flame}>
                    <sphereGeometry args={[0.03, 6, 6]} />
                </mesh>
                <mesh position={[0.46, 0.12, 0.1]} material={MM.wood}>
                    <cylinderGeometry args={[0.015, 0.015, 0.2, 4]} />
                </mesh>
                <mesh position={[0.46, 0.24, 0.1]} material={MM.flame}>
                    <sphereGeometry args={[0.03, 6, 6]} />
                </mesh>
            </group>
        </group>
    );
};


export const Farm3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    // Working farmstead: tilled plot with crop rows, post-and-rail fence,
    // a small barn with loft door, hay bales, and a water trough.
    return (
        <group position={position}>
            <GroundShadow r={0.95} />
            <group position={[0, 0.3, 0]} scale={[0.9, 0.9, 0.9]}>
                {/* tilled plot + crop rows */}
                <mesh position={[-0.15, 0.02, 0.1]} material={MM.soil} receiveShadow>
                    <boxGeometry args={[0.5, 0.045, 0.55]} />
                </mesh>
                {[-0.32, -0.21, -0.1, 0.01].map((x, i) => (
                    <mesh key={i} position={[x, 0.055, 0.1]} material={i % 2 ? MM.leaf : MM.leafDark}>
                        <boxGeometry args={[0.055, 0.05, 0.5]} />
                    </mesh>
                ))}
                {/* wheat tufts */}
                {[[-0.3, 0.32], [-0.12, 0.3], [-0.22, -0.1]].map(([x, z], i) => (
                    <mesh key={'w' + i} position={[x, 0.1, z]} material={MM.thatch}>
                        <coneGeometry args={[0.03, 0.1, 5]} />
                    </mesh>
                ))}
                {/* barn */}
                <mesh position={[0.28, 0.16, -0.18]} material={MM.wood} castShadow>
                    <boxGeometry args={[0.32, 0.28, 0.3]} />
                </mesh>
                <mesh position={[0.28, 0.38, -0.18]} rotation={[0, Math.PI / 4, 0]} material={MM.terracotta} castShadow>
                    <coneGeometry args={[0.27, 0.22, 4]} />
                </mesh>
                <mesh position={[0.28, 0.2, -0.025]} material={MM.woodDark}>
                    <boxGeometry args={[0.1, 0.12, 0.02]} />
                </mesh>
                {/* fence around plot */}
                {[[-0.42, 0.38], [-0.42, 0.1], [-0.42, -0.18], [0.12, 0.38], [0.12, -0.18]].map(([x, z], i) => (
                    <mesh key={'p' + i} position={[x, 0.08, z]} material={MM.woodDark}>
                        <cylinderGeometry args={[0.015, 0.015, 0.14, 4]} />
                    </mesh>
                ))}
                <mesh position={[-0.42, 0.11, 0.1]} material={MM.wood}>
                    <boxGeometry args={[0.02, 0.02, 0.56]} />
                </mesh>
                <mesh position={[-0.15, 0.11, 0.38]} material={MM.wood}>
                    <boxGeometry args={[0.56, 0.02, 0.02]} />
                </mesh>
                {/* hay + trough */}
                <mesh position={[0.34, 0.07, 0.16]} rotation={[0, 0.5, 0]} material={MM.thatch}>
                    <cylinderGeometry args={[0.07, 0.07, 0.12, 8]} />
                </mesh>
                <mesh position={[0.16, 0.05, 0.3]} material={MM.woodDark}>
                    <boxGeometry args={[0.16, 0.06, 0.08]} />
                </mesh>
                <mesh position={[0.16, 0.075, 0.3]} material={MM.water}>
                    <boxGeometry args={[0.13, 0.02, 0.05]} />
                </mesh>
            </group>
        </group>
    );
};


export const Workshop3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    // Smithy: stone workshop with shed roof, glowing forge chimney, anvil
    // on a stump, workbench, barrel, crate, and a log pile.
    return (
        <group position={position}>
            <GroundShadow r={0.9} />
            <group position={[0, 0.3, 0]} scale={[0.9, 0.9, 0.9]}>
                <mesh position={[-0.08, 0.06, 0]} material={MM.stoneDark} receiveShadow>
                    <boxGeometry args={[0.6, 0.12, 0.52]} />
                </mesh>
                <mesh position={[-0.08, 0.3, -0.05]} material={MM.stone} castShadow>
                    <boxGeometry args={[0.5, 0.36, 0.4]} />
                </mesh>
                {/* shed roof (single slope) */}
                <mesh position={[-0.08, 0.52, -0.02]} rotation={[0.28, 0, 0]} material={MM.wood} castShadow>
                    <boxGeometry args={[0.58, 0.05, 0.5]} />
                </mesh>
                {/* forge chimney with ember glow + smoke */}
                <mesh position={[-0.28, 0.62, -0.15]} material={MM.stoneDark}>
                    <boxGeometry args={[0.12, 0.42, 0.12]} />
                </mesh>
                <mesh position={[-0.28, 0.84, -0.15]} material={MM.flame}>
                    <boxGeometry args={[0.08, 0.03, 0.08]} />
                </mesh>
                <mesh position={[-0.28, 0.95, -0.13]} material={MM.smoke}>
                    <sphereGeometry args={[0.05, 6, 6]} />
                </mesh>
                <mesh position={[-0.24, 1.04, -0.1]} material={MM.smoke}>
                    <sphereGeometry args={[0.035, 6, 6]} />
                </mesh>
                {/* anvil on stump */}
                <mesh position={[0.22, 0.08, 0.18]} material={MM.woodDark}>
                    <cylinderGeometry args={[0.05, 0.06, 0.12, 6]} />
                </mesh>
                <mesh position={[0.22, 0.17, 0.18]} material={MM.iron}>
                    <boxGeometry args={[0.14, 0.05, 0.05]} />
                </mesh>
                {/* workbench + tools */}
                <mesh position={[0.24, 0.12, -0.12]} material={MM.wood}>
                    <boxGeometry args={[0.18, 0.04, 0.3]} />
                </mesh>
                <mesh position={[0.24, 0.16, -0.2]} material={MM.iron}>
                    <boxGeometry args={[0.1, 0.02, 0.03]} />
                </mesh>
                {/* barrel + crate + logs */}
                <mesh position={[0.05, 0.09, 0.32]} material={MM.wood}>
                    <cylinderGeometry args={[0.055, 0.055, 0.14, 8]} />
                </mesh>
                <mesh position={[-0.15, 0.07, 0.34]} material={MM.woodDark}>
                    <boxGeometry args={[0.1, 0.1, 0.1]} />
                </mesh>
                <mesh position={[-0.35, 0.05, 0.28]} rotation={[0, 0, Math.PI / 2]} material={MM.woodDark}>
                    <cylinderGeometry args={[0.03, 0.03, 0.16, 5]} />
                </mesh>
                <mesh position={[-0.35, 0.1, 0.28]} rotation={[0, 0, Math.PI / 2]} material={MM.wood}>
                    <cylinderGeometry args={[0.03, 0.03, 0.16, 5]} />
                </mesh>
            </group>
        </group>
    );
};


export const Library3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    // Scholars' hall: stepped entrance, columned porch, low dome with gold
    // finial, and a scroll rack by the door.
    return (
        <group position={position}>
            <GroundShadow r={0.9} />
            <group position={[0, 0.3, 0]} scale={[0.9, 0.9, 0.9]}>
                <mesh position={[0, 0.04, 0.1]} material={MM.marbleDim} receiveShadow>
                    <boxGeometry args={[0.66, 0.08, 0.6]} />
                </mesh>
                <mesh position={[0, 0.1, 0.16]} material={MM.marble}>
                    <boxGeometry args={[0.56, 0.05, 0.44]} />
                </mesh>
                {/* main hall */}
                <mesh position={[0, 0.31, -0.05]} material={MM.stucco} castShadow>
                    <boxGeometry args={[0.52, 0.34, 0.4]} />
                </mesh>
                {/* porch columns + lintel */}
                {[-0.19, -0.065, 0.065, 0.19].map((x, i) => (
                    <mesh key={i} position={[x, 0.28, 0.24]} material={MM.marble}>
                        <cylinderGeometry args={[0.026, 0.03, 0.3, 8]} />
                    </mesh>
                ))}
                <mesh position={[0, 0.46, 0.22]} material={MM.marble}>
                    <boxGeometry args={[0.5, 0.05, 0.12]} />
                </mesh>
                {/* dome + finial */}
                <mesh position={[0, 0.52, -0.05]} material={MM.clothBlue} castShadow>
                    <sphereGeometry args={[0.22, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
                </mesh>
                <mesh position={[0, 0.76, -0.05]} material={MM.gold}>
                    <sphereGeometry args={[0.035, 8, 8]} />
                </mesh>
                {/* doorway */}
                <mesh position={[0, 0.24, 0.155]} material={MM.woodDark}>
                    <boxGeometry args={[0.12, 0.2, 0.02]} />
                </mesh>
                {/* scroll rack: frame + scroll ends */}
                <mesh position={[0.3, 0.14, 0.3]} material={MM.wood}>
                    <boxGeometry args={[0.12, 0.16, 0.08]} />
                </mesh>
                {[[0.27, 0.18], [0.33, 0.18], [0.27, 0.11], [0.33, 0.11]].map(([x, y], i) => (
                    <mesh key={'s' + i} position={[x, y, 0.345]} rotation={[Math.PI / 2, 0, 0]} material={MM.marble}>
                        <cylinderGeometry args={[0.018, 0.018, 0.02, 6]} />
                    </mesh>
                ))}
            </group>
        </group>
    );
};


export const Barracks3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    // Military post: fortified hall, watchtower with lookout roof, war
    // banner, shield wall, spear rack, and a training dummy.
    return (
        <group position={position}>
            <GroundShadow r={0.95} />
            <group position={[0, 0.3, 0]} scale={[0.9, 0.9, 0.9]}>
                <mesh position={[-0.05, 0.06, 0]} material={MM.stoneDark} receiveShadow>
                    <boxGeometry args={[0.64, 0.12, 0.5]} />
                </mesh>
                <mesh position={[-0.05, 0.28, 0]} material={MM.stone} castShadow>
                    <boxGeometry args={[0.54, 0.32, 0.4]} />
                </mesh>
                <mesh position={[-0.05, 0.49, 0]} rotation={[0, 0, 0]} material={MM.woodDark} castShadow>
                    <boxGeometry args={[0.6, 0.06, 0.46]} />
                </mesh>
                {/* shields on the wall */}
                {[-0.22, -0.05, 0.12].map((x, i) => (
                    <mesh key={i} position={[x, 0.32, 0.205]} rotation={[Math.PI / 2, 0, 0]} material={i % 2 ? MM.clothRed : MM.iron}>
                        <cylinderGeometry args={[0.05, 0.05, 0.02, 8]} />
                    </mesh>
                ))}
                {/* watchtower */}
                <mesh position={[0.32, 0.35, -0.12]} material={MM.wood} castShadow>
                    <boxGeometry args={[0.14, 0.66, 0.14]} />
                </mesh>
                <mesh position={[0.32, 0.72, -0.12]} material={MM.woodDark}>
                    <boxGeometry args={[0.2, 0.05, 0.2]} />
                </mesh>
                <mesh position={[0.32, 0.84, -0.12]} material={MM.terracotta}>
                    <coneGeometry args={[0.14, 0.16, 4]} />
                </mesh>
                {/* banner pole + flag */}
                <mesh position={[0.32, 1.0, -0.12]} material={MM.wood}>
                    <cylinderGeometry args={[0.012, 0.012, 0.18, 4]} />
                </mesh>
                <mesh position={[0.38, 1.04, -0.12]} material={MM.clothRed}>
                    <boxGeometry args={[0.1, 0.06, 0.01]} />
                </mesh>
                {/* spear rack */}
                <mesh position={[-0.36, 0.1, 0.26]} material={MM.wood}>
                    <boxGeometry args={[0.16, 0.03, 0.03]} />
                </mesh>
                {[-0.41, -0.36, -0.31].map((x, i) => (
                    <mesh key={'sp' + i} position={[x, 0.2, 0.26]} rotation={[0, 0, 0.12 * (i - 1)]} material={MM.wood}>
                        <cylinderGeometry args={[0.008, 0.008, 0.26, 4]} />
                    </mesh>
                ))}
                {/* training dummy */}
                <mesh position={[0.2, 0.12, 0.3]} material={MM.woodDark}>
                    <cylinderGeometry args={[0.02, 0.02, 0.2, 4]} />
                </mesh>
                <mesh position={[0.2, 0.19, 0.3]} rotation={[0, 0, Math.PI / 2]} material={MM.wood}>
                    <cylinderGeometry args={[0.015, 0.015, 0.16, 4]} />
                </mesh>
                <mesh position={[0.2, 0.26, 0.3]} material={MM.thatch}>
                    <sphereGeometry args={[0.035, 6, 6]} />
                </mesh>
            </group>
        </group>
    );
};


const WonderPyramid: React.FC = () => (
    // Giza: stepped limestone courses, smooth cap, gold capstone, causeway
    // and two flanking mastaba blocks.
    <group position={[0, 0.3, 0]} scale={[0.9, 0.9, 0.9]}>
        <GroundShadow r={1.05} />
        {[
            { s: 0.95, y: 0.06, h: 0.12 },
            { s: 0.78, y: 0.17, h: 0.11 },
            { s: 0.62, y: 0.27, h: 0.1 },
            { s: 0.46, y: 0.36, h: 0.09 },
        ].map((c, i) => (
            <mesh key={i} position={[0, c.y, 0]} material={i % 2 ? MM.sand : MM.stone} castShadow={i === 0} receiveShadow>
                <boxGeometry args={[c.s, c.h, c.s]} />
            </mesh>
        ))}
        <mesh position={[0, 0.52, 0]} rotation={[0, Math.PI / 4, 0]} material={MM.stone} castShadow>
            <coneGeometry args={[0.33, 0.24, 4]} />
        </mesh>
        <mesh position={[0, 0.66, 0]} rotation={[0, Math.PI / 4, 0]} material={MM.gold}>
            <coneGeometry args={[0.07, 0.08, 4]} />
        </mesh>
        <mesh position={[0, 0.02, 0.42]} material={MM.sand}>
            <boxGeometry args={[0.14, 0.04, 0.32]} />
        </mesh>
        <mesh position={[-0.38, 0.05, 0.34]} material={MM.stoneDark}>
            <boxGeometry args={[0.12, 0.1, 0.1]} />
        </mesh>
        <mesh position={[0.38, 0.05, 0.34]} material={MM.stoneDark}>
            <boxGeometry args={[0.12, 0.1, 0.1]} />
        </mesh>
    </group>
);


const WonderStonehenge: React.FC = () => {
    // True trilithons: paired uprights with separate lintels, a central
    // altar stone, and two fallen sarsens in the grass.
    const trilithons = Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2 + 0.3;
        return { a, x: Math.cos(a) * 0.32, z: Math.sin(a) * 0.32 };
    });
    return (
        <group position={[0, 0.3, 0]} scale={[0.9, 0.9, 0.9]}>
            <GroundShadow r={1.0} />
            {trilithons.map((t, i) => (
                <group key={i} position={[t.x, 0, t.z]} rotation={[0, -t.a + Math.PI / 2, 0]}>
                    <mesh position={[-0.07, 0.2, 0]} material={MM.stoneDark} castShadow={i < 2}>
                        <boxGeometry args={[0.09, 0.4, 0.09]} />
                    </mesh>
                    <mesh position={[0.07, 0.2, 0]} material={MM.stone}>
                        <boxGeometry args={[0.09, 0.4, 0.09]} />
                    </mesh>
                    <mesh position={[0, 0.44, 0]} material={MM.stoneDark}>
                        <boxGeometry args={[0.26, 0.08, 0.1]} />
                    </mesh>
                </group>
            ))}
            <mesh position={[0, 0.05, 0]} material={MM.stone}>
                <boxGeometry args={[0.16, 0.1, 0.1]} />
            </mesh>
            <mesh position={[0.14, 0.03, -0.5]} rotation={[0, 0.4, Math.PI / 2]} material={MM.stoneDark}>
                <boxGeometry args={[0.08, 0.3, 0.08]} />
            </mesh>
            <mesh position={[-0.5, 0.03, 0.14]} rotation={[Math.PI / 2, 0, 0.8]} material={MM.stone}>
                <boxGeometry args={[0.08, 0.26, 0.08]} />
            </mesh>
        </group>
    );
};


const WonderParthenon: React.FC = () => {
    // Athens: three-step crepidoma, full peristyle suggestion (10 visible
    // columns), entablature, twin pediments and inner cella.
    return (
        <group position={[0, 0.3, 0]} scale={[0.9, 0.9, 0.9]}>
            <GroundShadow r={1.05} />
            {[0.98, 0.9, 0.82].map((s, i) => (
                <mesh key={i} position={[0, 0.035 + i * 0.05, 0]} material={MM.marbleDim} receiveShadow>
                    <boxGeometry args={[s, 0.05, s * 0.64]} />
                </mesh>
            ))}
            <mesh position={[0, 0.34, 0]} material={MM.marbleDim} castShadow>
                <boxGeometry args={[0.5, 0.3, 0.28]} />
            </mesh>
            {[-0.34, -0.204, -0.068, 0.068, 0.204, 0.34].map((x, i) => (
                <group key={i}>
                    <mesh position={[x, 0.33, 0.21]} material={MM.marble}>
                        <cylinderGeometry args={[0.032, 0.038, 0.34, 8]} />
                    </mesh>
                    <mesh position={[x, 0.33, -0.21]} material={MM.marble}>
                        <cylinderGeometry args={[0.032, 0.038, 0.34, 8]} />
                    </mesh>
                </group>
            ))}
            {[-0.34, 0.34].map((x, i) => (
                <mesh key={'s' + i} position={[x, 0.33, 0]} material={MM.marble}>
                    <cylinderGeometry args={[0.032, 0.038, 0.34, 8]} />
                </mesh>
            ))}
            <mesh position={[0, 0.535, 0]} material={MM.marble} castShadow>
                <boxGeometry args={[0.8, 0.07, 0.5]} />
            </mesh>
            <mesh position={[0, 0.63, 0]} rotation={[0, 0, Math.PI / 2]} material={MM.marbleDim}>
                <cylinderGeometry args={[0.12, 0.12, 0.78, 3, 1]} />
            </mesh>
            <mesh position={[0, 0.4, 0]} material={MM.gold}>
                <boxGeometry args={[0.06, 0.14, 0.06]} />
            </mesh>
        </group>
    );
};


const WonderHangingGardens: React.FC = () => {
    // Babylon: arched terraces dripping with greenery, a water channel
    // cascading down the front, palms on the crown.
    return (
        <group position={[0, 0.3, 0]} scale={[0.9, 0.9, 0.9]}>
            <GroundShadow r={1.0} />
            {[
                { s: 0.9, y: 0.09, h: 0.18 },
                { s: 0.66, y: 0.27, h: 0.16 },
                { s: 0.44, y: 0.43, h: 0.14 },
            ].map((t, i) => (
                <mesh key={i} position={[0, t.y, 0]} material={i % 2 ? MM.sand : MM.stone} castShadow={i === 0} receiveShadow>
                    <boxGeometry args={[t.s, t.h, t.s]} />
                </mesh>
            ))}
            {/* arch piers on the bottom terrace */}
            {[-0.3, -0.1, 0.1, 0.3].map((x, i) => (
                <mesh key={'p' + i} position={[x, 0.07, 0.46]} material={MM.stoneDark}>
                    <boxGeometry args={[0.07, 0.14, 0.03]} />
                </mesh>
            ))}
            {/* cascading greenery on every ledge */}
            {[[-0.42, 0.2, 0.34], [0.42, 0.2, -0.3], [0.3, 0.37, 0.28], [-0.3, 0.37, -0.26], [0.18, 0.52, 0.18], [-0.18, 0.52, -0.16]].map(([x, y, z], i) => (
                <mesh key={'g' + i} position={[x, y, z]} material={i % 2 ? MM.leaf : MM.leafDark}>
                    <sphereGeometry args={[0.09, 7, 6]} />
                </mesh>
            ))}
            {/* water channel down the front + basin */}
            <mesh position={[0, 0.3, 0.36]} rotation={[0.5, 0, 0]} material={MM.water}>
                <boxGeometry args={[0.08, 0.5, 0.02]} />
            </mesh>
            <mesh position={[0, 0.03, 0.52]} material={MM.water}>
                <cylinderGeometry args={[0.09, 0.09, 0.04, 10]} />
            </mesh>
            {/* crown palms */}
            {[[-0.08, 0.06], [0.1, -0.04]].map(([x, z], i) => (
                <group key={'t' + i} position={[x, 0.5, z]}>
                    <mesh position={[0, 0.08, 0]} material={MM.woodDark}>
                        <cylinderGeometry args={[0.015, 0.02, 0.16, 5]} />
                    </mesh>
                    <mesh position={[0, 0.18, 0]} material={MM.leaf}>
                        <coneGeometry args={[0.08, 0.1, 6]} />
                    </mesh>
                </group>
            ))}
        </group>
    );
};


const WonderGreatWall: React.FC = () => {
    // A snaking run of wall with two double-roofed watchtowers, full
    // crenellation and a war banner.
    return (
        <group position={[0, 0.3, 0]} scale={[0.9, 0.9, 0.9]}>
            <GroundShadow r={1.05} />
            <mesh position={[-0.28, 0.16, 0.1]} rotation={[0, 0.5, 0]} material={MM.stone} castShadow receiveShadow>
                <boxGeometry args={[0.5, 0.3, 0.18]} />
            </mesh>
            <mesh position={[0.24, 0.16, -0.08]} rotation={[0, -0.35, 0]} material={MM.stone} castShadow>
                <boxGeometry args={[0.5, 0.3, 0.18]} />
            </mesh>
            {/* crenellations along both runs */}
            {[-0.44, -0.3, -0.16].map((x, i) => (
                <mesh key={i} position={[x, 0.35, 0.19 - (x + 0.3) * 0.55]} rotation={[0, 0.5, 0]} material={MM.stoneDark}>
                    <boxGeometry args={[0.08, 0.08, 0.18]} />
                </mesh>
            ))}
            {[0.1, 0.24, 0.38].map((x, i) => (
                <mesh key={'c' + i} position={[x, 0.35, -0.03 - (x - 0.24) * -0.35]} rotation={[0, -0.35, 0]} material={MM.stoneDark}>
                    <boxGeometry args={[0.08, 0.08, 0.18]} />
                </mesh>
            ))}
            {/* watchtowers with double pagoda roofs */}
            {[[-0.02, 0.02], [0.48, -0.16]].map(([x, z], i) => (
                <group key={'t' + i} position={[x, 0, z]}>
                    <mesh position={[0, 0.28, 0]} material={MM.stoneDark} castShadow>
                        <boxGeometry args={[0.22, 0.5, 0.22]} />
                    </mesh>
                    <mesh position={[0, 0.56, 0]} material={MM.terracotta}>
                        <boxGeometry args={[0.28, 0.05, 0.28]} />
                    </mesh>
                    <mesh position={[0, 0.66, 0]} material={MM.stone}>
                        <boxGeometry args={[0.16, 0.14, 0.16]} />
                    </mesh>
                    <mesh position={[0, 0.76, 0]} rotation={[0, Math.PI / 4, 0]} material={MM.terracotta}>
                        <coneGeometry args={[0.16, 0.12, 4]} />
                    </mesh>
                </group>
            ))}
            <mesh position={[-0.02, 0.9, 0.02]} material={MM.wood}>
                <cylinderGeometry args={[0.01, 0.01, 0.16, 4]} />
            </mesh>
            <mesh position={[0.03, 0.94, 0.02]} material={MM.clothRed}>
                <boxGeometry args={[0.09, 0.05, 0.01]} />
            </mesh>
        </group>
    );
};


const WonderColosseum: React.FC = () => {
    // Rome: three arcaded tiers (pillar rings suggest the arches), sand
    // arena floor and the ring of awning masts on the top rim.
    const ringPillars = (r: number, n: number, y: number, h: number) =>
        Array.from({ length: n }, (_, i) => {
            const a = (i / n) * Math.PI * 2;
            return { x: Math.cos(a) * r, z: Math.sin(a) * r, y, h, key: `${r}-${i}` };
        });
    return (
        <group position={[0, 0.3, 0]} scale={[0.9, 0.9, 0.9]}>
            <GroundShadow r={1.05} />
            <mesh position={[0, 0.1, 0]} material={MM.stone} castShadow receiveShadow>
                <cylinderGeometry args={[0.48, 0.52, 0.2, 18, 1, true]} />
            </mesh>
            <mesh position={[0, 0.28, 0]} material={MM.sand} castShadow>
                <cylinderGeometry args={[0.43, 0.47, 0.16, 18, 1, true]} />
            </mesh>
            <mesh position={[0, 0.42, 0]} material={MM.stone}>
                <cylinderGeometry args={[0.38, 0.42, 0.12, 18, 1, true]} />
            </mesh>
            {/* arch pillars around the base tier */}
            {ringPillars(0.5, 10, 0.1, 0.18).map((p) => (
                <mesh key={p.key} position={[p.x, p.y, p.z]} material={MM.stoneDark}>
                    <boxGeometry args={[0.05, p.h, 0.05]} />
                </mesh>
            ))}
            {/* arena floor */}
            <mesh position={[0, 0.05, 0]} material={MM.sand}>
                <cylinderGeometry args={[0.34, 0.34, 0.06, 16]} />
            </mesh>
            <mesh position={[0, 0.06, 0]} material={MM.soil}>
                <boxGeometry args={[0.3, 0.055, 0.05]} />
            </mesh>
            {/* awning masts */}
            {ringPillars(0.4, 8, 0.54, 0.12).map((p) => (
                <mesh key={'m' + p.key} position={[p.x, p.y, p.z]} material={MM.wood}>
                    <cylinderGeometry args={[0.01, 0.01, 0.12, 4]} />
                </mesh>
            ))}
        </group>
    );
};


const WonderLighthouse: React.FC = () => {
    // Pharos of Alexandria: square base with corner pinnacles, octagonal
    // mid-stage, round lantern with live flame, statue on the crown.
    return (
        <group position={[0, 0.3, 0]} scale={[0.9, 0.9, 0.9]}>
            <GroundShadow r={0.9} />
            <mesh position={[0, 0.13, 0]} material={MM.stone} castShadow receiveShadow>
                <boxGeometry args={[0.52, 0.26, 0.52]} />
            </mesh>
            {[[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]].map(([x, z], i) => (
                <mesh key={i} position={[x, 0.3, z]} material={MM.stoneDark}>
                    <coneGeometry args={[0.035, 0.09, 4]} />
                </mesh>
            ))}
            <mesh position={[0, 0.46, 0]} material={MM.stucco} castShadow>
                <cylinderGeometry args={[0.15, 0.2, 0.4, 8]} />
            </mesh>
            <mesh position={[0, 0.72, 0]} material={MM.stone}>
                <cylinderGeometry args={[0.1, 0.13, 0.16, 10]} />
            </mesh>
            {/* lantern colonnettes + fire */}
            {[0, 1, 2, 3].map((i) => {
                const a = (i / 4) * Math.PI * 2;
                return (
                    <mesh key={'c' + i} position={[Math.cos(a) * 0.08, 0.84, Math.sin(a) * 0.08]} material={MM.marble}>
                        <cylinderGeometry args={[0.012, 0.012, 0.1, 4]} />
                    </mesh>
                );
            })}
            <mesh position={[0, 0.85, 0]} material={MM.flame}>
                <coneGeometry args={[0.05, 0.12, 6]} />
            </mesh>
            <mesh position={[0, 0.95, 0.02]} material={MM.smoke}>
                <sphereGeometry args={[0.035, 6, 6]} />
            </mesh>
            <mesh position={[0, 0.93, 0]} material={MM.terracotta}>
                <coneGeometry args={[0.09, 0.07, 8]} />
            </mesh>
            <mesh position={[0, 1.0, 0]} material={MM.gold}>
                <boxGeometry args={[0.03, 0.08, 0.03]} />
            </mesh>
        </group>
    );
};


const WonderColossus: React.FC = () => {
    // Rhodes: the bronze giant astride the harbor mouth, torch raised,
    // ships' berth of blue water between the twin pedestals.
    return (
        <group position={[0, 0.3, 0]} scale={[0.9, 0.9, 0.9]}>
            <GroundShadow r={0.9} />
            <mesh position={[-0.16, 0.08, 0]} material={MM.stone} castShadow receiveShadow>
                <boxGeometry args={[0.18, 0.16, 0.24]} />
            </mesh>
            <mesh position={[0.16, 0.08, 0]} material={MM.stone} castShadow>
                <boxGeometry args={[0.18, 0.16, 0.24]} />
            </mesh>
            <mesh position={[0, 0.03, 0]} material={MM.water}>
                <boxGeometry args={[0.5, 0.05, 0.2]} />
            </mesh>
            {/* legs astride */}
            <mesh position={[-0.12, 0.32, 0]} rotation={[0, 0, 0.18]} material={MM.gold} castShadow>
                <cylinderGeometry args={[0.035, 0.045, 0.34, 6]} />
            </mesh>
            <mesh position={[0.12, 0.32, 0]} rotation={[0, 0, -0.18]} material={MM.gold}>
                <cylinderGeometry args={[0.035, 0.045, 0.34, 6]} />
            </mesh>
            {/* torso + arms */}
            <mesh position={[0, 0.56, 0]} material={MM.gold} castShadow>
                <boxGeometry args={[0.16, 0.22, 0.1]} />
            </mesh>
            <mesh position={[-0.11, 0.6, 0]} rotation={[0, 0, 0.5]} material={MM.gold}>
                <cylinderGeometry args={[0.02, 0.025, 0.18, 5]} />
            </mesh>
            <mesh position={[0.13, 0.72, 0]} rotation={[0, 0, -0.35]} material={MM.gold}>
                <cylinderGeometry args={[0.02, 0.025, 0.2, 5]} />
            </mesh>
            {/* head + crown + torch */}
            <mesh position={[0, 0.74, 0]} material={MM.gold}>
                <sphereGeometry args={[0.06, 8, 8]} />
            </mesh>
            {[0, 1, 2, 3, 4].map((i) => {
                const a = (i / 5) * Math.PI - Math.PI * 0.0;
                return (
                    <mesh key={i} position={[Math.cos(a) * 0.06, 0.78 + Math.sin(a) * 0.03, 0]} rotation={[0, 0, -a + Math.PI / 2]} material={MM.gold}>
                        <coneGeometry args={[0.012, 0.05, 4]} />
                    </mesh>
                );
            })}
            <mesh position={[0.19, 0.84, 0]} material={MM.flame}>
                <coneGeometry args={[0.035, 0.08, 6]} />
            </mesh>
        </group>
    );
};


const WonderGreatLibrary: React.FC = () => {
    // Alexandria: monumental steps, five-column facade, twin wings and a
    // grand blue dome; a scroll cart waits by the entrance.
    return (
        <group position={[0, 0.3, 0]} scale={[0.9, 0.9, 0.9]}>
            <GroundShadow r={1.0} />
            {[0.9, 0.8].map((s, i) => (
                <mesh key={i} position={[0, 0.04 + i * 0.06, 0.1]} material={MM.marbleDim} receiveShadow>
                    <boxGeometry args={[s, 0.06, s * 0.6]} />
                </mesh>
            ))}
            <mesh position={[0, 0.32, -0.06]} material={MM.stucco} castShadow>
                <boxGeometry args={[0.56, 0.34, 0.36]} />
            </mesh>
            {/* side wings */}
            <mesh position={[-0.38, 0.22, -0.04]} material={MM.marbleDim} castShadow>
                <boxGeometry args={[0.2, 0.22, 0.3]} />
            </mesh>
            <mesh position={[0.38, 0.22, -0.04]} material={MM.marbleDim}>
                <boxGeometry args={[0.2, 0.22, 0.3]} />
            </mesh>
            {/* facade columns */}
            {[-0.22, -0.11, 0, 0.11, 0.22].map((x, i) => (
                <mesh key={i} position={[x, 0.3, 0.2]} material={MM.marble}>
                    <cylinderGeometry args={[0.025, 0.03, 0.3, 8]} />
                </mesh>
            ))}
            <mesh position={[0, 0.47, 0.18]} material={MM.marble}>
                <boxGeometry args={[0.54, 0.05, 0.1]} />
            </mesh>
            {/* dome + finial */}
            <mesh position={[0, 0.5, -0.06]} material={MM.clothBlue} castShadow>
                <sphereGeometry args={[0.24, 14, 9, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
            <mesh position={[0, 0.77, -0.06]} material={MM.gold}>
                <sphereGeometry args={[0.04, 8, 8]} />
            </mesh>
            {/* scroll cart */}
            <mesh position={[0.32, 0.1, 0.34]} material={MM.wood}>
                <boxGeometry args={[0.14, 0.08, 0.1]} />
            </mesh>
            {[[0.29, 0.16], [0.35, 0.16]].map(([x, y], i) => (
                <mesh key={'s' + i} position={[x, y, 0.34]} rotation={[Math.PI / 2, 0, 0]} material={MM.marble}>
                    <cylinderGeometry args={[0.02, 0.02, 0.08, 6]} />
                </mesh>
            ))}
        </group>
    );
};


const WonderOracle: React.FC = () => {
    // Delphi: round tholos on a three-step base, ring of columns, conical
    // roof, the sacred gold tripod and laurel bushes.
    return (
        <group position={[0, 0.3, 0]} scale={[0.9, 0.9, 0.9]}>
            <GroundShadow r={0.9} />
            {[0.5, 0.44, 0.38].map((r, i) => (
                <mesh key={i} position={[0, 0.03 + i * 0.04, 0]} material={MM.marbleDim} receiveShadow>
                    <cylinderGeometry args={[r, r + 0.02, 0.05, 16]} />
                </mesh>
            ))}
            {Array.from({ length: 9 }, (_, i) => {
                const a = (i / 9) * Math.PI * 2;
                return (
                    <mesh key={i} position={[Math.cos(a) * 0.28, 0.3, Math.sin(a) * 0.28]} material={MM.marble}>
                        <cylinderGeometry args={[0.028, 0.032, 0.34, 8]} />
                    </mesh>
                );
            })}
            <mesh position={[0, 0.5, 0]} material={MM.marble}>
                <cylinderGeometry args={[0.34, 0.34, 0.05, 16]} />
            </mesh>
            <mesh position={[0, 0.62, 0]} material={MM.terracotta} castShadow>
                <coneGeometry args={[0.36, 0.2, 16]} />
            </mesh>
            <mesh position={[0, 0.75, 0]} material={MM.gold}>
                <sphereGeometry args={[0.03, 8, 8]} />
            </mesh>
            {/* sacred tripod + smoke of the Pythia */}
            <mesh position={[0, 0.14, 0]} material={MM.gold}>
                <cylinderGeometry args={[0.05, 0.03, 0.12, 6]} />
            </mesh>
            <mesh position={[0, 0.24, 0]} material={MM.smoke}>
                <sphereGeometry args={[0.035, 6, 6]} />
            </mesh>
            {/* laurels */}
            {[[0.44, 0.3], [-0.42, -0.28], [0.1, -0.48]].map(([x, z], i) => (
                <mesh key={'l' + i} position={[x, 0.08, z]} material={i % 2 ? MM.leaf : MM.leafDark}>
                    <sphereGeometry args={[0.06, 7, 6]} />
                </mesh>
            ))}
        </group>
    );
};


const WonderZiggurat: React.FC = () => (
    // Ur: three mud-brick terraces, the long frontal stair ramp, crowning
    // shrine with gold ornament, date palms at the base.
    <group position={[0, 0.3, 0]} scale={[0.9, 0.9, 0.9]}>
        <GroundShadow r={1.0} />
        {[
            { s: 0.9, y: 0.09, h: 0.18, m: MM.terracotta },
            { s: 0.64, y: 0.26, h: 0.15, m: MM.sand },
            { s: 0.42, y: 0.41, h: 0.13, m: MM.terracotta },
        ].map((t, i) => (
            <mesh key={i} position={[0, t.y, 0]} material={t.m} castShadow={i === 0} receiveShadow>
                <boxGeometry args={[t.s, t.h, t.s]} />
            </mesh>
        ))}
        {/* grand stair ramp */}
        <mesh position={[0, 0.2, 0.4]} rotation={[0.63, 0, 0]} material={MM.sand}>
            <boxGeometry args={[0.14, 0.62, 0.05]} />
        </mesh>
        {/* shrine + gold */}
        <mesh position={[0, 0.55, 0]} material={MM.clothBlue} castShadow>
            <boxGeometry args={[0.2, 0.16, 0.2]} />
        </mesh>
        <mesh position={[0, 0.68, 0]} material={MM.gold}>
            <sphereGeometry args={[0.05, 8, 8]} />
        </mesh>
        {/* date palms */}
        {[[0.42, 0.34], [-0.44, 0.28]].map(([x, z], i) => (
            <group key={i} position={[x, 0, z]}>
                <mesh position={[0, 0.09, 0]} material={MM.woodDark}>
                    <cylinderGeometry args={[0.015, 0.025, 0.18, 5]} />
                </mesh>
                <mesh position={[0, 0.2, 0]} material={MM.leaf}>
                    <coneGeometry args={[0.09, 0.1, 6]} />
                </mesh>
            </group>
        ))}
    </group>
);


export const Wonder3D: React.FC<{
    position: [number, number, number];
    wonderId?: string;
}> = ({ position, wonderId }) => {
    let inner: React.ReactNode;
    switch (wonderId) {
        case 'pyramids':       inner = <WonderPyramid />;       break;
        case 'stonehenge':     inner = <WonderStonehenge />;    break;
        case 'parthenon':      inner = <WonderParthenon />;     break;
        case 'gardens':        inner = <WonderHangingGardens />; break;
        case 'wall':           inner = <WonderGreatWall />;     break;
        case 'colosseum':      inner = <WonderColosseum />;     break;
        case 'lighthouse':     inner = <WonderLighthouse />;    break;
        case 'colossus':       inner = <WonderColossus />;      break;
        case 'library':        inner = <WonderGreatLibrary />;  break;
        case 'oracle':         inner = <WonderOracle />;        break;
        case 'artemis':        inner = <WonderParthenon />;     break;  // Greek temple
        case 'mausoleum':      inner = <WonderParthenon />;     break;  // Tomb-temple
        case 'pantheon':       inner = <WonderGreatLibrary />;  break;  // Domed
        case 'hagia':          inner = <WonderGreatLibrary />;  break;  // Domed
        case 'olympic':        inner = <WonderColosseum />;     break;  // Stadium
        case 'hippodrome':     inner = <WonderColosseum />;     break;  // Stadium
        case 'karnak':         inner = <WonderParthenon />;     break;  // Columns
        case 'great_bath':     inner = <WonderHangingGardens />; break;  // Tiered
        case 'petra':          inner = <WonderParthenon />;     break;  // Carved temple
        case 'zeus':           inner = <WonderColossus />;      break;  // Statue
        case 'ishtar':         inner = <WonderGreatWall />;     break;  // Gate
        case 'justinian':      inner = <WonderGreatWall />;     break;  // Walls
        case 'ziggurat':
        default:               inner = <WonderZiggurat />;      break;
    }
    return <group position={position}>{inner}</group>;
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
