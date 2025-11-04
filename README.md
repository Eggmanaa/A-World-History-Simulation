# Through History - World History Simulation

A comprehensive multiplayer web-based civilization management game for high school World History classes. Students build and manage civilizations from 50,000 BCE to 362 CE while learning about ancient history.

## 🌍 Project Overview

**Through History** is an educational game where:
- **Teachers** create class periods, control the timeline, and observe student progress
- **Students** create civilizations, manage resources, declare wars, form alliances, and compete for survival
- **Timeline** progresses through 27 historical events with automatic growth phases and region-specific effects

## 🚀 Live Demo

**🚀 PRODUCTION (Live):** https://worldhistorysim.pages.dev  
**Latest Deployment:** https://a7d8b398.worldhistorysim.pages.dev

**GitHub Repository:** https://github.com/Eggmanaa/A-World-History-Simulation

## ✨ Key Features

### For Teachers
- ✅ Create and manage multiple class periods
- ✅ Generate unique invite codes for students
- ✅ Control timeline advancement (forward/backward)
- ✅ View all civilizations and their stats in summary table
- ✅ **NEW:** Click any civilization to see comprehensive individual stats
- ✅ **NEW:** Detailed modal shows ALL student data organized by category:
  - Basic Info: Cultural stage, regions, traits, advance count
  - Population & Resources: Population, houses, fertility, capacity, industry
  - Military: Martial, defense, maps conquered, battles survived
  - Cultural & Scientific: Culture, science, faith, diplomacy, writing system
  - Buildings: All building counts with icons
  - Wonders: List of all wonders and culture buildings
  - Religion: Name, tenets, followers count
  - Cultural Bonuses: All unlocked bonuses
  - Achievements: All earned achievements with descriptions
  - Student Info: Student name and email
- ✅ Pause/resume simulations
- ✅ Monitor wars, alliances, and student actions
- ✅ Track wonders, religions, achievements, and cultural bonuses

### For Students
- ✅ Choose from 18 historical civilization presets or create custom civilizations
- ✅ Manage core stats: Houses, Population, Fertility, Industry, Martial, Defense, Science, Culture, Faith, Diplomacy
- ✅ **NEW: Terrain System** - Region-based hex map generation with terrain bonuses
  - 🌊 Water resources determine population capacity (4-15 houses)
  - ⛰️ Mountains provide defense (+10) and industry (+4)
  - 🌲 Forests boost lumber production (+3 industry, +1 defense)
  - 🏜️ Deserts provide defensive advantage (+4 defense)
  - 🏝️ Island civilizations get +7 defense bonus
- ✅ **NEW: Hex Grid Map** - Interactive territory visualization
  - Click hexes to place buildings
  - Hover to see terrain bonuses
  - Terrain legend showing all types
  - Visual terrain icons (mountains, forests, rivers, etc.)
- ✅ Build structures: Temples, Amphitheaters, Walls, Archimedes Towers
- ✅ **NEW:** Build Wonders - 15 ancient wonders (Pyramids, Colosseum, Library, etc.)
- ✅ **NEW:** Culture-specific buildings (Ziggurat, Cothon, Roman Fort, etc.)
- ✅ **NEW:** Found religions with faith competition (top 3 only, after 1000 BCE)
- ✅ **NEW:** Select religion tenets (2-3 tenets, Israel gets bonus)
- ✅ **NEW:** Spread religion to other civilizations
- ✅ **NEW:** Unlock cultural bonuses based on year and civilization
- ✅ **NEW:** Track achievements (Glory to Rome, Test of Time, Ozymandias, etc.)
- ✅ Declare wars (after 670 BCE) and resolve combat automatically
- ✅ Form alliances (requires Diplomacy ≥ 1)
- ✅ Progress through cultural stages: Barbarism → Classical → Imperial → Decline
- ✅ Automatic growth phase calculations each turn
- ✅ Historical events affect civilizations based on regions

## 🎮 Game Mechanics

### Core Stats
- **Houses/Population**: Base of civilization size (population = houses × 1, or × 2 after 480 BCE)
- **Population Capacity**: Maximum houses determined by water resource type (4-15)
- **Fertility**: Houses gained per growth phase
- **Industry**: Points spent on buildings each turn (boosted by terrain)
- **Martial/Defense**: Combat strength for wars (terrain provides defense bonuses)
- **Science/Culture/Faith**: Cultural development and religion
- **Diplomacy**: Enables alliances

### Terrain System (NEW!)
- **Water Resources** - Determines population capacity:
  - 🌊 River (Freshwater): 15 houses maximum (Egypt, Mesopotamia)
  - 💧 Lake (Freshwater): 10 houses (Greece, Persia)
  - 💧 Lake (Brackish): 6 houses (Some coastal regions)
  - 💧 Marsh (Brackish): 7 houses (Swamp regions)
  - 🌊 Ocean (Saltwater): 5 houses (Island regions)
  - 🚰 Wells: 4 houses (Desert civilizations)

- **Terrain Types** - Provide defense and industry bonuses:
  - ⛰️ Mountains: +10 defense, +4 industry (stone, minerals)
  - 🏔️ High Mountains: +15 defense, +2 industry (extreme peaks)
  - 🌲 Forest: +1 defense, +3 industry (lumber)
  - 🏜️ Desert: +4 defense (harsh terrain)
  - 💧 Marsh: -2 defense (swampy ground)
  - 🌊 River: +1 defense (water barrier)
  - 🌾 Plains/Grassland: No bonuses (farmland)
  
- **Geography Bonuses**:
  - 🏝️ Island civilizations: +7 defense (Greece, Crete)

### Traits (Choose 1-2 at start)
- **Industrious**: 2× Industry
- **Intelligence**: 2× Science
- **Strength**: 2× Martial
- **Health**: +2 Fertility
- **Creativity**: 2× Culture
- **Wisdom**: 2× Faith
- **Beauty**: +1 Diplomacy

### Buildings
- **Temple** (10 Industry): +2 Faith
- **Amphitheater** (10 Industry): +3 Culture, -1 Faith
- **Wall** (10 Industry): +1 Defense
- **Archimedes Tower** (20 Industry, requires Science ≥ 30): +20 Defense

### Cultural Stages
1. **Barbarism**: Choose +50% Martial OR +50% Fertility each turn
2. **Classical**: Choose +50% Science OR +50% Faith each turn
3. **Imperial**: Choose +50% Industry OR +50% Martial each turn
4. **Decline**: All stats halved (triggered by events or low Culture)

### Timeline Events (27 total)
Examples:
- **50,000 BCE**: Paleolithic Era - Starting point
- **4500 BCE**: Agricultural Revolution - Egypt gets +30% Industry, Fertile Crescent +2 Fertility
- **2250 BCE**: Bronze Age - Writing introduced, Great Flood, Paektu eruption
- **1300 BCE**: Late Bronze Age - Wonders assigned (Great Wall, Colossus, Pyramids, etc.)
- **670 BCE**: War unlocked between civilizations
- **480 BCE**: Classical Period - Houses now support 2 population
- **1000 BCE**: Religions can be founded
- **362 CE**: End of Ancient Era

## 🛠️ Tech Stack

### Backend
- **Hono** - Lightweight web framework for Cloudflare Workers
- **Cloudflare Pages** - Edge deployment platform
- **Cloudflare D1** - SQLite database for persistent storage
- **TypeScript** - Type-safe backend code

### Frontend
- **Vanilla JavaScript** - No heavy frameworks for fast loading
- **Tailwind CSS** (CDN) - Responsive styling
- **Font Awesome** (CDN) - Icons
- **Axios** (CDN) - HTTP requests

### Database Schema
- `teachers` - Teacher accounts
- `periods` - Class periods with invite codes
- `students` - Student accounts linked to periods
- `simulations` - One per period, tracks timeline state
- `civilizations` - Student civilizations with all stats
- `alliances` - Diplomatic relationships
- `wars` - Combat history
- `event_log` - Historical event records
- `civ_presets` - 18 preset civilizations

## 📦 Project Structure

```
webapp/
├── src/
│   ├── index.tsx           # Main application entry + HTML pages
│   ├── types.ts            # TypeScript type definitions
│   ├── db.ts               # Database utilities (ID generation, hashing, parsing)
│   ├── game-logic.ts       # Game mechanics (traits, growth, war, saves)
│   ├── terrain-system.ts   # Terrain generation, hex math, bonuses (NEW!)
│   ├── timeline.ts         # 27 historical events with descriptions
│   └── routes/
│       ├── auth.ts         # Teacher/student login & registration
│       ├── teacher.ts      # Period management, timeline control
│       ├── student.ts      # Civilization creation, stats viewing
│       └── game.ts         # Wars, alliances, buildings, religions
├── public/static/
│   ├── auth.js             # Frontend authentication handler
│   ├── student-game.js     # Student game interface with hex map
│   ├── teacher-dashboard.js # Teacher dashboard with terrain display
│   ├── hex-map.js          # Hex grid rendering engine (NEW!)
│   ├── historical-contexts.js # Educational content (NEW!)
│   └── notifications.js    # Toast notification system
├── migrations/
│   ├── 0001_initial_schema.sql  # Database schema
│   ├── 0002_add_game_features.sql # Wonders, religions, achievements
│   └── 0003_add_terrain_system.sql # Terrain fields (NEW!)
├── seed.sql                # Civilization presets data
├── ecosystem.config.cjs    # PM2 configuration for development
├── wrangler.jsonc          # Cloudflare configuration
├── package.json            # Dependencies and scripts
└── README.md               # This file
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+
- Cloudflare account (for deployment)
- Wrangler CLI

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Apply database migrations:**
   ```bash
   npm run db:migrate:local
   ```

3. **Seed civilization presets:**
   ```bash
   npm run db:seed
   ```

4. **Build the project:**
   ```bash
   npm run build
   ```

5. **Start development server:**
   ```bash
   pm2 start ecosystem.config.cjs
   ```

6. **Access the app:**
   - Local: http://localhost:3000
   - Sandbox: https://3000-i7ap02lrimuuo467n72j3-5634da27.sandbox.novita.ai

### Available Scripts

```bash
npm run dev              # Vite dev server (for local development outside sandbox)
npm run dev:sandbox      # Wrangler Pages dev with D1
npm run build            # Build for production
npm run deploy           # Build and deploy to Cloudflare Pages
npm run db:migrate:local # Apply migrations locally
npm run db:migrate:prod  # Apply migrations to production
npm run db:seed          # Seed local database
npm run db:reset         # Reset local database
npm run clean-port       # Kill processes on port 3000
npm run test             # Test server with curl
```

## 🌐 Deployment to Cloudflare Pages

### Prerequisites
1. Set up Cloudflare API token:
   ```bash
   # Call setup_cloudflare_api_key in sandbox OR
   # Set CLOUDFLARE_API_TOKEN environment variable
   ```

2. Manage project name with meta_info tool (for sandbox deployment)

### Deployment Steps

1. **Create production D1 database:**
   ```bash
   npx wrangler d1 create webapp-production
   # Copy the database_id to wrangler.jsonc
   ```

2. **Update wrangler.jsonc with database_id**

3. **Apply migrations to production:**
   ```bash
   npm run db:migrate:prod
   ```

4. **Seed production database:**
   ```bash
   npx wrangler d1 execute webapp-production --file=./seed.sql
   ```

5. **Create Cloudflare Pages project:**
   ```bash
   npx wrangler pages project create worldhistorysim \
     --production-branch main \
     --compatibility-date 2025-11-03
   ```

6. **Deploy:**
   ```bash
   npm run deploy:prod
   ```

7. **Access production:**
   - URL: https://worldhistorysim.pages.dev

## 📊 Data Architecture

### Database Models
- **Teachers**: Email authentication, creates periods
- **Periods**: Class groups with unique invite codes
- **Students**: Join periods via invite code, create one civilization
- **Simulations**: One per period, tracks current year and timeline index
- **Civilizations**: Full stat tracking, buildings, traits, regions
- **Alliances**: Many-to-many relationships between civilizations
- **Wars**: Combat history with winner/loser tracking
- **Event Log**: Audit trail of all timeline events

### Game Flow
```
Teacher Creates Period → Generates Invite Code
  ↓
Students Join Period → Create Civilizations
  ↓
Teacher Starts Simulation (50,000 BCE)
  ↓
Teacher Advances Timeline → Growth Phase Triggers
  ↓
All Civilizations: Fertility → Houses → Population → Stats Update
  ↓
Students Take Actions: Build, War, Alliance, Religion
  ↓
Repeat until 362 CE (End of Timeline)
```

## 🎯 Completed Features

### Phase 1: Backend Systems (✅ Complete)
- [x] Authentication system (teachers & students)
- [x] Period management with invite codes
- [x] Civilization creation (preset & custom)
- [x] Timeline system with 27 historical events
- [x] Automatic growth phase calculations
- [x] War resolution system
- [x] Alliance system
- [x] Building construction
- [x] Religion founding with tenants
- [x] Event logging
- [x] D1 database schema
- [x] 18 civilization presets
- [x] **NEW:** Wonder building API (15 wonders + 8 culture buildings)
- [x] **NEW:** Religion founding/spreading API with faith leaderboard
- [x] **NEW:** Cultural bonuses system (30+ bonuses from 4500 BC to 14 AD)
- [x] **NEW:** Writing systems (7 types with science bonuses)
- [x] **NEW:** Science effects (15 levels with unlockable abilities)
- [x] **NEW:** Achievement tracking infrastructure

### Phase 2: Student UI (✅ Complete)
- [x] Landing page with teacher/student portals
- [x] Login/registration pages
- [x] Authentication handler
- [x] Student game interface with map system
- [x] Civilization setup wizard with presets
- [x] **NEW:** Wonder building modal with categories (Ancient, Classical, Late)
- [x] **NEW:** Religion founding modal with faith leaderboard
- [x] **NEW:** Religion spreading interface
- [x] **NEW:** Enhanced stats panel (wonders, religion, bonuses, achievements)
- [x] **NEW:** Territory map (10x10 grid) with building placement
- [x] **NEW:** Real-time validation and backend integration
- [x] Stats display panels
- [x] Action buttons (war, alliance, build, wonder, religion)
- [x] Timeline year display

### Phase 3: Auto-Apply Systems (✅ Complete)
- [x] Cultural bonuses auto-unlock on timeline advance
- [x] Science effects auto-apply during growth phase
- [x] Writing system auto-adoption based on regions
- [x] Achievement tracking in war system
- [x] Achievement auto-checking during growth phase

### Phase 4: Teacher Dashboard Enhancements (✅ Complete)
- [x] Wonder tracking in civilization table
- [x] Religion overview tab with tenets and followers
- [x] Wonders tab showing all builds by civilization
- [x] Achievements tab with leaderboard
- [x] Cultural bonuses tab per civilization
- [x] **NEW:** Comprehensive individual student stat tracking
- [x] **NEW:** Detailed civilization modal with ALL stats organized by category
- [x] **NEW:** Student information display (name, email) in detail view
- [x] **NEW:** Terrain & Water Resources section in detail view
- [x] **NEW:** Terrain composition and bonuses display

### Phase 5: Polish Features (✅ Complete)
- [x] Toast notification system (7 types)
- [x] Loading states for async operations
- [x] Enhanced achievements with auto-tracking
- [x] Mobile responsive design
- [x] **NEW:** Educational historical context pop-ups with primary sources
- [x] **NEW:** Clickable year display with timeline event information
- [ ] Real-time updates (optional WebSockets)
- [ ] Analytics dashboard for teachers
- [ ] Export game data (CSV for grading)

### Phase 6: Terrain System (✅ Complete)
- [x] Backend terrain generation algorithms
- [x] Hex coordinate system (cube coordinates)
- [x] 12 region-specific terrain templates
- [x] Water resource assignment by region
- [x] Population capacity determined by water type (4-15)
- [x] Terrain defense bonuses in combat
- [x] Terrain industry bonuses in growth phase
- [x] Island detection and bonus (+7 defense)
- [x] Hex grid rendering engine with canvas
- [x] Interactive hex map with click/hover
- [x] Terrain colors and icons
- [x] Building placement on hexes
- [x] Terrain legend and tooltips
- [x] Water resource display in UI
- [x] Terrain bonuses panel (defense, industry)
- [x] Teacher dashboard terrain data display

## 🔮 Next Steps & Future Enhancements

### Phase 6: Advanced Features (Optional)
1. **Real-time updates** - WebSocket integration for live gameplay
2. **Analytics dashboard** - Charts and graphs for teachers
3. **Export game data** - CSV export for grading
4. **Historical context cards** - Educational pop-ups with history lessons
5. **Visual enhancements** - More wonder icons, religion symbols
6. **Sound effects** - Audio feedback for actions
7. **Dark mode** - Alternative theme option
8. **Multi-language support** - Internationalization

## 📚 Educational Value

### Learning Objectives
- **Geography**: Understand ancient regions and civilizations
- **History**: Experience timeline of major historical events
- **Economics**: Resource management and trade-offs
- **Diplomacy**: Alliance formation and negotiation
- **Military Strategy**: War planning and defense
- **Cultural Development**: Religion, science, and art
- **Critical Thinking**: Long-term planning and adaptation

### Curriculum Alignment
- Aligned with World History standards (Ancient Civilizations)
- Covers 50,000 BCE to 362 CE period
- Includes major civilizations: Egypt, Greece, Rome, China, India, Persia, etc.
- Historical events tied to real-world occurrences

## 🤝 Contributing

This is an educational project developed for high school World History classes. Contributions welcome!

### How to Contribute
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is open-source for educational purposes.

## 🙏 Acknowledgments

- Based on classroom simulation game by World History teacher
- Original Python implementation: Honors World History Civilization Simulation Database
- Game mechanics inspired by Civilization series and historical board games
- Built with modern edge computing technology (Cloudflare Workers/Pages)

## 📞 Support

For questions or issues:
- GitHub Issues: [Create an issue]
- Documentation: See `docs/` folder (when created)
- Teacher Guide: See uploaded PDFs for game rules

## 🎓 About the Project

**Through History** transforms a pen-and-paper classroom simulation into a fully digital, multiplayer web application. It preserves the educational value of the original while adding:
- Real-time collaboration
- Automatic calculations
- Persistent data storage
- Beautiful user interface
- Scalability for multiple classes

Built with ❤️ for history teachers and students everywhere.

---

## 📋 Game Data Summary

### Wonders Available (15 Unique + 8 Culture-Specific)
**Ancient Wonders:** Great Pyramids, Hanging Gardens, Great Wall, Temple of Artemis, Mausoleum  
**Classical Wonders:** Colosseum, Library of Alexandria, Lighthouse, Statue of Zeus, Parthenon  
**Late Wonders:** Hagia Sophia, Great Stupa, Petra, Machu Picchu, Angkor Wat

**Culture Buildings:** Ziggurat (Mesopotamia), Cothon (Carthage), Roman Fort (Rome), Oracle (Greece), Terraces (Inca), Steppe Camp (Mongolia), Pagoda (China/India), Pyramid (Maya)

### Religion Tenets (10 Available)
- Holy War (+2 martial per map converted)
- Polytheism (+2 faith per temple)
- Holy Scriptures (2x faith)
- Monotheism (-1 faith per temple, -1 faith per amphitheater, +2 faith per house)
- Philosophy (Convert faith to science)
- Asceticism (Reduce population capacity for faith)
- Pilgrimage (+1 faith per civilization following you)
- Divine Right (+1 martial for religious founder)
- Sacred Texts (+2 culture for religious founder)
- Proselytism (Easier religion spreading)

### Cultural Bonuses (30+ Unlockable)
**Egypt:** Monument Builders, Nile Flooding, Hieroglyphic Mastery  
**Greece:** Olympic Games, Delphic Oracle, Athenian Democracy  
**Rome:** Roman Engineering, Pax Romana, Imperial Roads  
**Sparta:** Spartan Training, Agoge System  
**Persia:** Royal Road, Zoroastrianism  
**China:** Mandate of Heaven, Great Wall, Silk Road  
**And 20+ more across different eras**

### Achievements (8 Trackable)
- **Glory to Rome:** Conquer 10 civilizations
- **Test of Time:** Survive 20 battles
- **Ozymandias:** Be the first defeated
- **Cultural Victory:** Highest culture at game end
- **Scientific Achievement:** Reach science level 30
- **Religious Dominance:** Convert 5+ civilizations
- **Economic Powerhouse:** Have 200+ industry
- **Military Supremacy:** 100+ martial

---

**Current Status**: ✅ All Core Phases Complete (1-6) | 🚀 Ready for Deployment | 🎉 Terrain System Integrated!

**Implemented Features**:
✅ Phase 1: Backend Systems (Authentication, Timeline, Wars, Alliances, Buildings, Religions)
✅ Phase 2: Student UI (Game Interface, Hex Map System, Wonder Building, Religion Founding)
✅ Phase 3: Auto-Apply Systems (Cultural Bonuses, Science Effects, Writing, Achievements)
✅ Phase 4: Teacher Dashboard (Wonders Tab, Religions Tab, Achievements Tab, Individual Stats)
✅ Phase 5: Polish Features (Notifications, Loading States, Historical Context, Mobile Responsive)
✅ Phase 6: Terrain System (Hex Grids, Water Resources, Terrain Bonuses, Region Templates) **NEW!**

**Latest Additions (Phase 6 - Terrain System)**:
- 🗺️ Hex-based map system with interactive terrain
- 🌊 Water resource types affecting population capacity (4-15 houses)
- ⛰️ Terrain bonuses for defense and industry
- 🏝️ Island geography detection with bonus defense
- 🎨 Visual terrain representation with colors and icons
- 📊 Teacher dashboard terrain analytics
- 🎓 Educational terrain tooltips

**Optional Enhancements**: Real-time updates, Analytics dashboard, CSV export, Sound effects
