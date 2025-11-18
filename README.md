# World History Simulation

## Project Overview
- **Name**: Through History - A World History Simulation
- **Goal**: Interactive 3D civilization-building simulation through historical eras
- **Features**: 
  - Interactive 3D hex-based world map with terrain variety (mountains, plains, rivers, forests, islands)
  - Civilization management with multiple preset civilizations (Rome, Egypt, Greece, Persia, etc.)
  - Resource management (food, production, gold, science, culture, faith)
  - Building construction (houses, farms, quarries, temples, walls, wonders)
  - Timeline-based historical events with consequences
  - Religion system with customizable tenets
  - Diplomacy with neighboring civilizations
  - Wonder construction (Pyramids, Hanging Gardens, Colossus, etc.)

## URLs
- **Production**: https://worldhistorysimulation.pages.dev
- **Latest Deployment**: https://e325950b.worldhistorysimulation.pages.dev

## Tech Stack
- **Frontend**: React 19.2.0 with TypeScript
- **3D Graphics**: Three.js + React Three Fiber + React Three Drei
- **Build Tool**: Custom esbuild pipeline (ESM with importmaps)
- **Deployment**: Cloudflare Pages
- **Icons**: Lucide React
- **Styling**: TailwindCSS (CDN)

## Data Architecture
- **Storage**: Client-side state management with React hooks
- **Platform**: Cloudflare Pages (edge deployment)
- **Build System**: Custom esbuild-based transpilation preserving ESM importmaps

## User Guide
This is an interactive ancient world civilization simulation game where you:
1. **Choose Your Civilization**: Select from historical civilizations like Rome, Egypt, Greece, or create your own
2. **Manage Resources**: Balance food, production, gold, science, culture, and faith
3. **Build Your Empire**: Construct buildings on hex tiles to develop your civilization
4. **Navigate History**: Experience timeline events that shape your civilization's destiny
5. **Compete & Cooperate**: Interact with neighboring civilizations through diplomacy or conflict
6. **Construct Wonders**: Build legendary structures that provide powerful bonuses

### Game Controls
- **Left Panel**: View civilization stats, resources, and available actions
- **Center**: Interactive 3D map - click tiles to build or view information
- **Right Panel**: Timeline events, neighboring civilizations, and religion management
- **Bottom**: Building menu and wonder construction options

## Local Development
1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server (Vite):
   ```bash
   npm run dev
   ```

3. Build for production:
   ```bash
   npm run build
   ```

## Deployment
- **Platform**: Cloudflare Pages
- **Status**: ✅ Active
- **Project Name**: worldhistorysimulation
- **Last Deployed**: November 18, 2025
- **Build Command**: `npm run build` (custom esbuild pipeline)
- **Output Directory**: `dist`

### Deploy Updates
```bash
npm run deploy
```

Or manually:
```bash
npm run build
npx wrangler pages deploy dist --project-name worldhistorysimulation
```

## Build System
This project uses a custom esbuild-based build system (`build.mjs`) that:
- Transpiles TypeScript/TSX to JavaScript while preserving ESM imports
- Maintains compatibility with browser import maps for CDN dependencies
- Automatically adds .js extensions to relative imports
- Avoids bundling external dependencies (React, Three.js, etc. loaded from CDN)

This approach keeps the bundle size minimal and leverages browser-native ESM with import maps.

## AI Studio
Original project from AI Studio: https://ai.studio/apps/drive/1dETL334UrouKBp6dFJid4P8Txg8XRtOP
