
import React from 'react';
import { TerrainType, TERRAIN_COLORS, ClimateZone } from '../types';
import * as THREE from 'three';

// ============================================================
// HEX GEOMETRY — SINGLE CYLINDER WITH TRANSPARENT SIDES
// ============================================================
// CylinderGeometry(1,1,0.5,6) scaled to ~1.04 closes all seam gaps.
// The flickering was caused by overlapping side faces Z-fighting.
// Fix: make the SIDE material fully transparent so only the top cap
// and bottom cap render.  No side faces visible = no seam artifacts.
// CylinderGeometry has 3 material groups: 0=sides, 1=top, 2=bottom.
//
// Pointy-top orientation via rotateY(30°) to match the axial grid
// math: x = sqrt(3)*(q + r/2), z = 1.5*r.

const hexGeometry = new THREE.CylinderGeometry(1, 1, 0.5, 6);
hexGeometry.rotateY(Math.PI / 6);

// Invisible material for the cylinder side faces.
const HEX_SIDE_MATERIAL = new THREE.MeshBasicMaterial({
  transparent: true,
  opacity: 0,
  depthWrite: false,
});

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
      <mesh position={[0, 0.55, 0]} castShadow>
        <sphereGeometry args={[0.35, 10, 8]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0.1, 0.7, 0.1]} castShadow>
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
      <mesh position={[0, 0.5 * tall, 0]} castShadow>
        <coneGeometry args={[0.3, 0.55 * tall, 8]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.85 * tall, 0]} castShadow>
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
      <mesh position={[0, 0.7, 0]} castShadow>
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
      <mesh position={[0, 0.55 * tall, 0]} castShadow>
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
      <mesh position={[0, 0.35, 0]} castShadow>
        <sphereGeometry args={[0.28, 10, 6]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0.15, 0.42, 0.05]} castShadow>
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
      <mesh position={[0, 0.7, 0]} castShadow>
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
          <mesh key={i} rotation={[Math.PI / 2.6, (i * Math.PI * 2) / 7, 0]} castShadow>
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
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.35, 0.15, 0.12, 10]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0.08, 0.62, 0.02]} castShadow>
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
      <mesh position={[0, 0.55, 0]} castShadow>
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
          <mesh key={i} rotation={[Math.PI / 2.8, (i * Math.PI * 2) / 9, 0]} castShadow>
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
      <mesh position={[0, 0.5, 0]} castShadow>
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
      <mesh position={[0, 0.55 * tall, 0]} castShadow>
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
    <mesh position={[pos[0], 0, pos[1]]} castShadow rotation={[0.2, rng(pos[0] + pos[1]) * 6, 0.1]}>
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
    <mesh position={[0, 0.15, 0]} castShadow>
      <cylinderGeometry args={[0.06, 0.08, 0.3, 6]} />
      <meshStandardMaterial color="#15803d" roughness={0.85} />
    </mesh>
    <mesh position={[0.1, 0.18, 0]} rotation={[0, 0, -0.4]} castShadow>
      <cylinderGeometry args={[0.04, 0.05, 0.15, 5]} />
      <meshStandardMaterial color="#15803d" roughness={0.85} />
    </mesh>
    <mesh position={[-0.08, 0.2, 0]} rotation={[0, 0, 0.3]} castShadow>
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
    <mesh position={[0, 0.05, 0]} castShadow>
      <coneGeometry args={[0.13, 0.1, 5]} />
      <meshStandardMaterial color="#78716c" roughness={0.95} flatShading />
    </mesh>
    <mesh position={[0.08, 0.14, 0.03]} rotation={[0.3, 0.4, 0]} castShadow>
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
  }), [isHovered, terrainColor, matRoughness, matMetalness, matEmissive, matEmissiveIntensity]);

  const bottomMat = React.useMemo(() => new THREE.MeshStandardMaterial({
    color: isHovered ? '#d1d5db' : terrainColor,
    roughness: 1,
    metalness: 0,
  }), [isHovered, terrainColor]);

  const materials = React.useMemo(
    () => [HEX_SIDE_MATERIAL, topMat, bottomMat],
    [topMat, bottomMat],
  );

  return (
    <group position={[x, yPos, z]}>
      {/* Single hex cylinder with transparent sides.  Scaled ~4% wider
          so top faces overlap neighbours — but because the side material
          is invisible, no side-face Z-fighting occurs.  Only the flat
          top caps compete at boundaries, and polygonOffset resolves that. */}
      <mesh
        geometry={hexGeometry}
        material={materials}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        scale={[1.04, height, 1.04]}
        receiveShadow
        castShadow
      />

      {/* Selection Ring */}
      {isHovered && (
         <mesh position={[0, height/2 + 0.02, 0]} rotation={[-Math.PI/2, 0, 0]}>
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

export const Farm3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    // Ancient farm with thatched-roof barn, plowed field rows, and grain storage
    const thatchColor = "#B8A060"; // Dry straw/thatch
    const woodColor = "#6B4226"; // Rough timber
    const soilColor = "#5C4033"; // Dark plowed earth
    const cropColor = "#7B9E3A"; // Green crop shoots
    const stoneColor = "#9B8B7A"; // Foundation stone

    return (
        <group position={position}>
            <group position={[0, 0.3, 0]} scale={[0.9, 0.9, 0.9]}>
                {/* Plowed field rows */}
                {[-0.25, -0.15, -0.05, 0.05, 0.15, 0.25].map((z, i) => (
                    <mesh key={`row-${i}`} position={[-0.25, 0.02, z]} receiveShadow>
                        <boxGeometry args={[0.35, 0.03, 0.06]} />
                        <meshStandardMaterial color={soilColor} roughness={0.95} flatShading />
                    </mesh>
                ))}

                {/* Crop shoots on alternating rows */}
                {[-0.25, -0.05, 0.15].map((z, i) => (
                    <group key={`crops-${i}`}>
                        {[-0.38, -0.3, -0.22, -0.14].map((x, j) => (
                            <mesh key={j} position={[x, 0.06, z]} castShadow>
                                <boxGeometry args={[0.02, 0.06, 0.02]} />
                                <meshStandardMaterial color={cropColor} roughness={0.8} flatShading />
                            </mesh>
                        ))}
                    </group>
                ))}

                {/* Barn - stone foundation */}
                <mesh position={[0.22, 0.06, 0]} receiveShadow castShadow>
                    <boxGeometry args={[0.35, 0.12, 0.4]} />
                    <meshStandardMaterial color={stoneColor} roughness={0.9} flatShading />
                </mesh>

                {/* Barn - wooden walls */}
                <mesh position={[0.22, 0.22, 0]} castShadow>
                    <boxGeometry args={[0.3, 0.2, 0.35]} />
                    <meshStandardMaterial color={woodColor} roughness={0.85} flatShading />
                </mesh>

                {/* Barn - thatched roof */}
                <mesh position={[0.22, 0.42, 0]} rotation={[0, 0, 0]} castShadow>
                    <coneGeometry args={[0.3, 0.25, 4]} />
                    <meshStandardMaterial color={thatchColor} roughness={0.95} flatShading />
                </mesh>

                {/* Barn door */}
                <mesh position={[0.22, 0.18, 0.18]} castShadow>
                    <boxGeometry args={[0.12, 0.16, 0.02]} />
                    <meshStandardMaterial color="#3D2817" roughness={0.8} />
                </mesh>

                {/* Grain storage pot */}
                <mesh position={[0.42, 0.1, -0.15]} castShadow>
                    <cylinderGeometry args={[0.04, 0.06, 0.12, 8]} />
                    <meshStandardMaterial color="#A0522D" roughness={0.8} flatShading />
                </mesh>

                {/* Wooden fence posts */}
                {[-0.42, -0.42, -0.42].map((x, i) => (
                    <mesh key={`fence-${i}`} position={[x, 0.08, -0.2 + i * 0.2]} castShadow>
                        <boxGeometry args={[0.03, 0.12, 0.03]} />
                        <meshStandardMaterial color={woodColor} roughness={0.9} flatShading />
                    </mesh>
                ))}

                {/* Fence rail */}
                <mesh position={[-0.42, 0.1, 0]} castShadow>
                    <boxGeometry args={[0.02, 0.02, 0.4]} />
                    <meshStandardMaterial color={woodColor} roughness={0.9} />
                </mesh>
            </group>
        </group>
    );
};

export const Workshop3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    // Ancient blacksmith/craftsman workshop with forge, anvil, and chimney
    const stoneColor = "#8B8178"; // Rough grey stone
    const darkStone = "#5C534A"; // Dark stone for forge
    const woodColor = "#5D4E37"; // Timber frame
    const metalColor = "#696969"; // Iron/steel grey
    const fireColor = "#FF6B35"; // Forge glow
    const roofColor = "#6B4226"; // Dark wood roof

    return (
        <group position={position}>
            <group position={[0, 0.3, 0]} scale={[0.9, 0.9, 0.9]}>
                {/* Stone foundation */}
                <mesh position={[0, 0.06, 0]} receiveShadow castShadow>
                    <boxGeometry args={[0.7, 0.12, 0.55]} />
                    <meshStandardMaterial color={stoneColor} roughness={0.9} flatShading />
                </mesh>

                {/* Main workshop walls */}
                <mesh position={[0, 0.28, 0]} castShadow>
                    <boxGeometry args={[0.6, 0.32, 0.45]} />
                    <meshStandardMaterial color={stoneColor} roughness={0.85} flatShading />
                </mesh>

                {/* Timber frame beams (cross-hatched) */}
                <mesh position={[0, 0.35, 0.23]} castShadow>
                    <boxGeometry args={[0.55, 0.04, 0.02]} />
                    <meshStandardMaterial color={woodColor} roughness={0.7} />
                </mesh>
                <mesh position={[-0.15, 0.28, 0.23]} castShadow>
                    <boxGeometry args={[0.04, 0.28, 0.02]} />
                    <meshStandardMaterial color={woodColor} roughness={0.7} />
                </mesh>
                <mesh position={[0.15, 0.28, 0.23]} castShadow>
                    <boxGeometry args={[0.04, 0.28, 0.02]} />
                    <meshStandardMaterial color={woodColor} roughness={0.7} />
                </mesh>

                {/* Sloped roof */}
                <mesh position={[0, 0.52, 0]} rotation={[0, 0, 0]} castShadow>
                    <coneGeometry args={[0.48, 0.3, 4]} />
                    <meshStandardMaterial color={roofColor} roughness={0.85} flatShading />
                </mesh>

                {/* Stone chimney */}
                <mesh position={[0.2, 0.65, -0.1]} castShadow>
                    <boxGeometry args={[0.1, 0.35, 0.1]} />
                    <meshStandardMaterial color={darkStone} roughness={0.9} flatShading />
                </mesh>

                {/* Chimney cap */}
                <mesh position={[0.2, 0.84, -0.1]} castShadow>
                    <boxGeometry args={[0.14, 0.04, 0.14]} />
                    <meshStandardMaterial color={darkStone} roughness={0.85} flatShading />
                </mesh>

                {/* Forge opening (glowing) */}
                <mesh position={[-0.22, 0.2, 0.23]} castShadow>
                    <boxGeometry args={[0.15, 0.12, 0.02]} />
                    <meshStandardMaterial color={fireColor} roughness={0.3} emissive={fireColor} emissiveIntensity={0.6} />
                </mesh>

                {/* Anvil outside */}
                <mesh position={[-0.35, 0.08, 0.2]} castShadow>
                    <boxGeometry args={[0.08, 0.04, 0.05]} />
                    <meshStandardMaterial color={metalColor} roughness={0.4} metalness={0.6} flatShading />
                </mesh>
                {/* Anvil top */}
                <mesh position={[-0.35, 0.12, 0.2]} castShadow>
                    <boxGeometry args={[0.12, 0.03, 0.06]} />
                    <meshStandardMaterial color={metalColor} roughness={0.4} metalness={0.6} flatShading />
                </mesh>

                {/* Workshop door */}
                <mesh position={[0.05, 0.2, 0.23]} castShadow>
                    <boxGeometry args={[0.14, 0.24, 0.02]} />
                    <meshStandardMaterial color="#3D2817" roughness={0.8} />
                </mesh>
            </group>
        </group>
    );
};

export const Library3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    // Ancient library/scriptorium with columns, scroll alcoves, and domed roof
    const marbleColor = "#E0D8C8"; // Warm marble
    const columnColor = "#D4CAB8"; // Column marble
    const roofColor = "#7B6B5A"; // Terracotta/stone roof
    const scrollColor = "#DEB887"; // Papyrus scroll color
    const baseColor = "#B8A88A"; // Stone base

    return (
        <group position={position}>
            <group position={[0, 0.3, 0]} scale={[0.85, 0.85, 0.85]}>
                {/* Stepped base platform */}
                <mesh position={[0, 0.04, 0]} receiveShadow castShadow>
                    <boxGeometry args={[0.85, 0.08, 0.65]} />
                    <meshStandardMaterial color={baseColor} roughness={0.85} flatShading />
                </mesh>
                <mesh position={[0, 0.12, 0]} receiveShadow castShadow>
                    <boxGeometry args={[0.75, 0.08, 0.55]} />
                    <meshStandardMaterial color={marbleColor} roughness={0.8} flatShading />
                </mesh>

                {/* Main building body */}
                <mesh position={[0, 0.32, 0]} castShadow>
                    <boxGeometry args={[0.65, 0.32, 0.45]} />
                    <meshStandardMaterial color={marbleColor} roughness={0.75} flatShading />
                </mesh>

                {/* Front columns (4 columns) */}
                {[-0.24, -0.08, 0.08, 0.24].map((x, i) => (
                    <group key={`col-${i}`} position={[x, 0.36, 0.26]}>
                        <mesh castShadow>
                            <cylinderGeometry args={[0.035, 0.045, 0.36, 8]} />
                            <meshStandardMaterial color={columnColor} roughness={0.7} flatShading />
                        </mesh>
                        {/* Column capital */}
                        <mesh position={[0, 0.2, 0]} castShadow>
                            <boxGeometry args={[0.08, 0.04, 0.08]} />
                            <meshStandardMaterial color={marbleColor} roughness={0.6} flatShading />
                        </mesh>
                    </group>
                ))}

                {/* Triangular pediment (like a classical library facade) */}
                <mesh position={[0, 0.56, 0.22]} rotation={[Math.PI/2, 0, 0]} castShadow>
                    <coneGeometry args={[0.36, 0.18, 3]} />
                    <meshStandardMaterial color={roofColor} roughness={0.8} flatShading />
                </mesh>

                {/* Main flat roof */}
                <mesh position={[0, 0.5, 0]} castShadow>
                    <boxGeometry args={[0.7, 0.04, 0.5]} />
                    <meshStandardMaterial color={roofColor} roughness={0.8} flatShading />
                </mesh>

                {/* Small dome on top (knowledge/wisdom symbol) */}
                <mesh position={[0, 0.6, -0.05]} castShadow>
                    <sphereGeometry args={[0.12, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2]} />
                    <meshStandardMaterial color={roofColor} roughness={0.7} flatShading />
                </mesh>

                {/* Scroll alcoves on side wall (3 niches) */}
                {[-0.12, 0, 0.12].map((z, i) => (
                    <group key={`alcove-${i}`} position={[0.33, 0.32, z]}>
                        {/* Niche shadow */}
                        <mesh castShadow>
                            <boxGeometry args={[0.02, 0.1, 0.08]} />
                            <meshStandardMaterial color="#4A4035" roughness={0.9} />
                        </mesh>
                        {/* Scroll inside */}
                        <mesh position={[0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
                            <cylinderGeometry args={[0.02, 0.02, 0.07, 6]} />
                            <meshStandardMaterial color={scrollColor} roughness={0.7} flatShading />
                        </mesh>
                    </group>
                ))}

                {/* Entrance doorway */}
                <mesh position={[0, 0.25, 0.23]} castShadow>
                    <boxGeometry args={[0.14, 0.22, 0.02]} />
                    <meshStandardMaterial color="#2D2817" roughness={0.8} />
                </mesh>
            </group>
        </group>
    );
};

export const Barracks3D: React.FC<{ position: [number, number, number] }> = ({ position }) => {
    // Military barracks with training yard, weapon racks, and watchtower
    const stoneColor = "#9B8B7A"; // Rough stone
    const darkStone = "#6B5D4F"; // Dark accent stone
    const woodColor = "#5D4E37"; // Dark timber
    const roofColor = "#4A3728"; // Dark thatched/wood roof
    const metalColor = "#808080"; // Iron weapons
    const bannerColor = "#8B0000"; // Dark red military banner

    return (
        <group position={position}>
            <group position={[0, 0.3, 0]} scale={[0.9, 0.9, 0.9]}>
                {/* Stone foundation platform */}
                <mesh position={[0, 0.04, 0]} receiveShadow castShadow>
                    <boxGeometry args={[0.8, 0.08, 0.6]} />
                    <meshStandardMaterial color={darkStone} roughness={0.9} flatShading />
                </mesh>

                {/* Main barracks building */}
                <mesh position={[-0.1, 0.24, -0.05]} castShadow>
                    <boxGeometry args={[0.5, 0.32, 0.4]} />
                    <meshStandardMaterial color={stoneColor} roughness={0.85} flatShading />
                </mesh>

                {/* Barracks flat/sloped roof */}
                <mesh position={[-0.1, 0.44, -0.05]} castShadow>
                    <boxGeometry args={[0.55, 0.06, 0.45]} />
                    <meshStandardMaterial color={roofColor} roughness={0.9} flatShading />
                </mesh>
                {/* Roof ridge */}
                <mesh position={[-0.1, 0.52, -0.05]} castShadow>
                    <coneGeometry args={[0.32, 0.15, 4]} />
                    <meshStandardMaterial color={roofColor} roughness={0.9} flatShading />
                </mesh>

                {/* Watchtower on corner */}
                <mesh position={[0.28, 0.4, 0.18]} castShadow>
                    <boxGeometry args={[0.15, 0.55, 0.15]} />
                    <meshStandardMaterial color={stoneColor} roughness={0.85} flatShading />
                </mesh>
                {/* Watchtower top */}
                <mesh position={[0.28, 0.72, 0.18]} castShadow>
                    <boxGeometry args={[0.2, 0.06, 0.2]} />
                    <meshStandardMaterial color={darkStone} roughness={0.85} flatShading />
                </mesh>
                {/* Watchtower pointed roof */}
                <mesh position={[0.28, 0.82, 0.18]} castShadow>
                    <coneGeometry args={[0.12, 0.15, 4]} />
                    <meshStandardMaterial color={roofColor} roughness={0.9} flatShading />
                </mesh>

                {/* Weapon rack */}
                <group position={[0.32, 0.12, -0.15]}>
                    {/* Rack frame */}
                    <mesh castShadow>
                        <boxGeometry args={[0.04, 0.2, 0.15]} />
                        <meshStandardMaterial color={woodColor} roughness={0.8} flatShading />
                    </mesh>
                    {/* Spears/weapons on rack */}
                    {[-0.04, 0, 0.04].map((z, i) => (
                        <mesh key={i} position={[0.03, 0.05, z]} castShadow>
                            <cylinderGeometry args={[0.008, 0.008, 0.25, 4]} />
                            <meshStandardMaterial color={metalColor} roughness={0.5} metalness={0.4} />
                        </mesh>
                    ))}
                </group>

                {/* Training dummy */}
                <group position={[-0.38, 0.12, 0.2]}>
                    {/* Post */}
                    <mesh castShadow>
                        <cylinderGeometry args={[0.02, 0.02, 0.2, 6]} />
                        <meshStandardMaterial color={woodColor} roughness={0.8} />
                    </mesh>
                    {/* Crossbar */}
                    <mesh position={[0, 0.08, 0]} castShadow>
                        <boxGeometry args={[0.15, 0.03, 0.03]} />
                        <meshStandardMaterial color={woodColor} roughness={0.8} />
                    </mesh>
                </group>

                {/* Military banner on watchtower */}
                <mesh position={[0.28, 0.9, 0.18]} castShadow>
                    <cylinderGeometry args={[0.008, 0.008, 0.18, 4]} />
                    <meshStandardMaterial color={woodColor} roughness={0.8} />
                </mesh>
                <mesh position={[0.32, 0.92, 0.18]} castShadow>
                    <boxGeometry args={[0.08, 0.1, 0.01]} />
                    <meshStandardMaterial color={bannerColor} roughness={0.7} flatShading />
                </mesh>

                {/* Barracks door */}
                <mesh position={[-0.1, 0.18, 0.16]} castShadow>
                    <boxGeometry args={[0.14, 0.22, 0.02]} />
                    <meshStandardMaterial color="#2D2817" roughness={0.8} />
                </mesh>

                {/* Window slits */}
                {[-0.25, 0.05].map((x, i) => (
                    <mesh key={i} position={[x, 0.32, 0.16]} castShadow>
                        <boxGeometry args={[0.04, 0.1, 0.02]} />
                        <meshStandardMaterial color="#1A1A1A" roughness={0.9} />
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
