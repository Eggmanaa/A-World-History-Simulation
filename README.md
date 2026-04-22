# Ancient World Simulation

## Project Overview
- **Name**: Ancient World Simulation
- **Goal**: Classroom civilization game for high school world history. Students lead an ancient civilization from the first settlements through the Fall of Rome (3000 BCE - 476 CE), making strategic and historical decisions across 24 turns.
- **Audience**: Built for Bishop Diego High School world history classes; reusable in any 9-12 ancient/world history course
- **New Features**: Professional landing page, dual-role authentication system, teacher/student dashboards

## 🌐 Live URLs
- **Production**: https://worldhistorysimulation.pages.dev
- **Latest Deployment**: https://0733ae5a.worldhistorysimulation.pages.dev

## ✨ NEW FEATURES (Phase 1 Complete)

### Landing Page
✅ **Professional Hero Section**
- Animated globe and clock icons
- "Through History" branding with amber accent
- Compelling tagline and description
- Responsive design with glassmorphism effects

✅ **Dual Role System**
- **Teachers Portal**: Login, registration, period management
- **Students Portal**: Login, join with invite code
- Clear call-to-action buttons with role-specific styling

✅ **Statistics Showcase**
- 30,362 Years of History (animated counter)
- 18+ Historical Civilizations
- ∞ Strategic Possibilities
- Interactive feature cards

### Authentication System
✅ **Backend API (Hono + D1)**
- RESTful API endpoints for authentication
- JWT-based session management
- Role-based access control middleware
- Secure password hashing with Web Crypto API

✅ **Database Schema (Cloudflare D1)**
- Teachers table (name, email, password_hash)
- Students table (username, name, password_hash, teacher_id, period_id)
- Periods table (teacher_id, name, start_year, end_year, current_year)
- Invite codes table (code, teacher_id, period_id, uses_remaining)
- Game sessions table (student_id, civilization_id, progress_data)

✅ **Authentication Flows**
- Teacher registration and login
- Student login and join with invite code
- Invite code generation and validation
- Session token management

## 🎮 Game Features (Existing)
- Interactive 3D hex-based world map
- 16 playable historical civilizations
- Resource management (food, production, gold, science, culture, faith)
- Building construction (houses, farms, temples, walls, wonders)
- Timeline events from 50,000 BCE to 362 CE
- Religion and diplomacy systems
- Wonder construction (Pyramids, Hanging Gardens, etc.)

## 🛠️ Tech Stack
- **Frontend**: React 19.2.0 + TypeScript + React Router
- **3D Graphics**: Three.js + React Three Fiber
- **Backend**: Hono (Cloudflare Workers)
- **Database**: Cloudflare D1 (SQLite)
- **Build**: Custom esbuild pipeline
- **Deployment**: Cloudflare Pages
- **Styling**: TailwindCSS (CDN)
- **Icons**: Lucide React

## 📂 Project Structure
```
webapp/
├── api/
│   ├── routes/           # API route handlers
│   │   ├── auth.ts       # Authentication endpoints
│   │   ├── teacher.ts    # Teacher dashboard endpoints
│   │   └── student.ts    # Student dashboard endpoints
│   ├── middleware/       # Authentication middleware
│   └── utils/            # Crypto utilities (hashing, JWT)
├── components/
│   ├── auth/             # Authentication components
│   │   ├── TeacherLogin.tsx
│   │   ├── TeacherRegister.tsx
│   │   ├── StudentLogin.tsx
│   │   └── StudentJoin.tsx
│   ├── MapScene.jsx      # 3D map component
│   └── Models.jsx        # 3D model components
├── pages/
│   ├── LandingPage.tsx   # Landing page with hero & portals
│   └── GamePage.tsx      # Game wrapper
├── migrations/
│   └── 0001_initial_schema.sql  # Database schema
├── src/
│   └── index.ts          # Backend API entry point
├── App.tsx               # Main router component
├── GameApp.tsx           # Game application logic
├── constants.ts          # Game constants & civilizations
├── types.ts              # TypeScript type definitions
├── wrangler.jsonc        # Cloudflare configuration
└── build.mjs             # Custom build script
```

## 🚀 API Endpoints

### Authentication
- `POST /api/auth/teacher/register` - Teacher registration
- `POST /api/auth/teacher/login` - Teacher login
- `POST /api/auth/student/login` - Student login
- `POST /api/auth/student/join` - Student join with invite code

### Teacher Dashboard
- `GET /api/teacher/dashboard` - Get teacher dashboard data
- `POST /api/teacher/periods` - Create new period
- `POST /api/teacher/invite-codes` - Generate invite code
- `GET /api/teacher/periods/:periodId/students` - Get students in period
- `PATCH /api/teacher/periods/:periodId/timeline` - Update timeline year

### Student Dashboard
- `GET /api/student/dashboard` - Get student dashboard data
- `GET /api/student/civilizations` - Get available civilizations
- `POST /api/student/game-session` - Create/update game session
- `PUT /api/student/game-session/progress` - Save game progress

## 🗄️ Database Schema

### Teachers
| Column        | Type    | Description                |
|---------------|---------|----------------------------|
| id            | INTEGER | Primary key                |
| name          | TEXT    | Teacher full name          |
| email         | TEXT    | Unique email address       |
| password_hash | TEXT    | Hashed password            |
| created_at    | DATETIME| Registration timestamp     |

### Students
| Column        | Type    | Description                |
|---------------|---------|----------------------------|
| id            | INTEGER | Primary key                |
| name          | TEXT    | Student full name          |
| username      | TEXT    | Unique username            |
| password_hash | TEXT    | Hashed password            |
| teacher_id    | INTEGER | Foreign key to teachers    |
| period_id     | INTEGER | Foreign key to periods     |
| created_at    | DATETIME| Registration timestamp     |

### Periods
| Column       | Type    | Description                |
|--------------|---------|----------------------------|
| id           | INTEGER | Primary key                |
| teacher_id   | INTEGER | Foreign key to teachers    |
| name         | TEXT    | Period name                |
| start_year   | INTEGER | Starting year              |
| end_year     | INTEGER | Ending year                |
| current_year | INTEGER | Current simulation year    |
| created_at   | DATETIME| Creation timestamp         |

### Invite Codes
| Column         | Type    | Description                |
|----------------|---------|----------------------------|
| id             | INTEGER | Primary key                |
| code           | TEXT    | 6-character unique code    |
| teacher_id     | INTEGER | Foreign key to teachers    |
| period_id      | INTEGER | Foreign key to periods     |
| max_uses       | INTEGER | Maximum number of uses     |
| uses_remaining | INTEGER | Remaining uses             |
| created_at     | DATETIME| Creation timestamp         |

### Game Sessions
| Column         | Type    | Description                |
|----------------|---------|----------------------------|
| id             | INTEGER | Primary key                |
| student_id     | INTEGER | Foreign key to students    |
| civilization_id| TEXT    | Selected civilization      |
| progress_data  | TEXT    | JSON game state            |
| last_played    | DATETIME| Last play timestamp        |
| created_at     | DATETIME| Creation timestamp         |

## 💻 Local Development

### Setup
```bash
# Install dependencies
npm install

# Create and apply D1 database migrations (local)
npx wrangler d1 create worldhistorysimulation-db
npx wrangler d1 migrations apply worldhistorysimulation-db --local

# Build project
npm run build

# Test locally (development server)
npm run dev
```

### Development Scripts
```bash
# Build frontend and backend
npm run build

# Deploy to Cloudflare Pages
npm run deploy

# Database operations
npx wrangler d1 migrations apply worldhistorysimulation-db --local   # Local DB
npx wrangler d1 migrations apply worldhistorysimulation-db --remote  # Production DB
npx wrangler d1 execute worldhistorysimulation-db --local --command="SELECT * FROM teachers"
```

## 🚀 Deployment Status
- **Platform**: Cloudflare Pages with D1 Database
- **Status**: ✅ Deployed and Working (Backend & Frontend)
- **Database**: ✅ Migrations Applied
- **Last Updated**: November 20, 2025

## ✅ Recent Fixes (November 20, 2025)
- ✅ **React Router Compatibility Issue RESOLVED**
  - Fixed "Cannot read properties of null (reading 'useRef')" error
  - React Router is now bundled with the application instead of loaded from CDN
  - Landing page now displays correctly
  - Navigation between pages working properly
  - Build process updated to use `build-new.mjs` script

## ⚠️ Next Steps

### Phase 2 - To Be Implemented
- [ ] Build full Teacher Dashboard with:
  - Period creation and management
  - Student roster view
  - Timeline control interface
  - Invite code generation
  - Student progress monitoring
- [ ] Build full Student Dashboard with:
  - Civilization selection interface
  - Game session management
  - Progress tracking
  - Class leaderboard
- [ ] Integrate game with authentication system
- [ ] Add session persistence and auto-login
- [ ] Implement game progress saving to D1
- [ ] Add real-time collaboration features
- [ ] Email notifications for invite codes

## 📚 Documentation

### Authentication Flow
1. **Teacher Registration** → Email/Password → JWT Token → Teacher Dashboard
2. **Student Join** → Invite Code → Username/Password → JWT Token → Student Dashboard
3. **Login** → Credentials → JWT Token Validation → Role-Based Redirect

### Security Features
- ✅ Password hashing with SHA-256
- ✅ JWT token-based sessions (7-day expiration)
- ✅ Role-based access control (Teacher/Student)
- ✅ Invite code validation with use limits
- ✅ CORS enabled for API access
- ⚠️ HTTPS required (Cloudflare Pages provides SSL)

### Database Migrations
Migrations are stored in `migrations/` and applied using Wrangler CLI:
```bash
# Local development
npx wrangler d1 migrations apply worldhistorysimulation-db --local

# Production deployment
npx wrangler d1 migrations apply worldhistorysimulation-db --remote
```

## 🎓 Educational Value
This simulation helps high school students:
- Understand historical civilizations and their development
- Learn resource management and strategic thinking
- Experience cause-and-effect relationships in history
- Develop critical thinking through decision-making
- Compete and collaborate with classmates

## 📞 Support
For issues or questions:
- Check the database schema in `migrations/0001_initial_schema.sql`
- Review API endpoints in `api/routes/`
- Examine authentication logic in `api/middleware/auth.ts`

## 📄 License
Educational project for Bishop Garcia Diego High School

---

**Built with ❤️ for education | Powered by Cloudflare Pages & Workers**
