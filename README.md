# Through History - World History Simulation

A comprehensive multiplayer web-based civilization management game for high school World History classes. Students build and manage civilizations from 50,000 BCE to 362 CE while learning about ancient history.

## 🌍 Project Overview

**Through History** is an educational game where:
- **Teachers** create class periods, control the timeline, and observe student progress
- **Students** create civilizations, manage resources, declare wars, form alliances, and compete for survival
- **Timeline** progresses through 27 historical events with automatic growth phases and region-specific effects

## 🚀 Live Demo

**Sandbox Environment:** https://3000-i7ap02lrimuuo467n72j3-5634da27.sandbox.novita.ai

*(This is a development sandbox URL - will be replaced with production URL after deployment)*

## ✨ Key Features

### For Teachers
- ✅ Create and manage multiple class periods
- ✅ Generate unique invite codes for students
- ✅ Control timeline advancement (forward/backward)
- ✅ View all civilizations and their stats
- ✅ Pause/resume simulations
- ✅ Assign wonders to top civilizations
- ✅ Monitor wars, alliances, and student actions

### For Students
- ✅ Choose from 18 historical civilization presets or create custom civilizations
- ✅ Manage core stats: Houses, Population, Fertility, Industry, Martial, Defense, Science, Culture, Faith, Diplomacy
- ✅ Build structures: Temples, Amphitheaters, Walls, Archimedes Towers
- ✅ Declare wars (after 670 BCE) and resolve combat automatically
- ✅ Form alliances (requires Diplomacy ≥ 1)
- ✅ Found religions (after 1000 BCE) with customizable tenants
- ✅ Progress through cultural stages: Barbarism → Classical → Imperial → Decline
- ✅ Automatic growth phase calculations each turn
- ✅ Historical events affect civilizations based on regions

## 🎮 Game Mechanics

### Core Stats
- **Houses/Population**: Base of civilization size (population = houses × 1, or × 2 after 480 BCE)
- **Fertility**: Houses gained per growth phase
- **Industry**: Points spent on buildings each turn
- **Martial/Defense**: Combat strength for wars
- **Science/Culture/Faith**: Cultural development and religion
- **Diplomacy**: Enables alliances

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
│   ├── timeline.ts         # 27 historical events with descriptions
│   └── routes/
│       ├── auth.ts         # Teacher/student login & registration
│       ├── teacher.ts      # Period management, timeline control
│       ├── student.ts      # Civilization creation, stats viewing
│       └── game.ts         # Wars, alliances, buildings, religions
├── public/static/
│   └── auth.js             # Frontend authentication handler
├── migrations/
│   └── 0001_initial_schema.sql  # Database schema
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

### Backend (✅ Complete)
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

### Frontend (⚠️ Partially Complete)
- [x] Landing page with teacher/student portals
- [x] Login/registration pages
- [x] Authentication handler (JavaScript)
- [ ] Teacher dashboard (HTML structure exists, needs JavaScript)
- [ ] Student game interface (HTML structure exists, needs JavaScript)
- [ ] Civilization setup wizard
- [ ] Timeline progress visualization
- [ ] Stats display panels
- [ ] Action buttons (war, alliance, build)
- [ ] Real-time updates (optional WebSockets)

## 🔮 Future Enhancements

### Phase 2 (Recommended Next Steps)
1. **Interactive hex map** for territory visualization
2. **Teacher dashboard JavaScript** - Live civilization overview
3. **Student dashboard JavaScript** - Interactive stats and actions
4. **Wonder assignment modal** - Visual interface for teachers
5. **Combat animations** - Visual war resolution
6. **Alliance network diagram** - Graphical relationship view
7. **Mobile responsive design** - Tablet/phone support

### Phase 3 (Advanced Features)
8. **Real-time WebSockets** - Live synchronization across students
9. **Fog of war** on map - Limited visibility
10. **Achievement system** - Student milestones
11. **Analytics dashboard** for teachers - Charts and graphs
12. **Export game data** - CSV for grading
13. **Historical context panels** - Rich educational content

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

**Current Status**: ✅ Backend Complete | ⚠️ Frontend In Progress | 🚀 Ready for Local Testing

**Next Steps**:
1. Create teacher dashboard JavaScript for period management
2. Create student game interface JavaScript for civilization control
3. Deploy to Cloudflare Pages production
4. Test with real classroom scenarios
