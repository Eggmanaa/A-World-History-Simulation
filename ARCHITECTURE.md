# Through History - Technical Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLOUDFLARE PAGES                             │
│                   (Edge Network Deployment)                      │
└─────────────────────────────────────────────────────────────────┘
                              ▲
                              │
                              │ HTTP/HTTPS
                              │
┌─────────────────────────────┴─────────────────────────────┐
│                    HONO WEB FRAMEWORK                      │
│                  (Cloudflare Workers Runtime)              │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   Auth      │  │   Teacher    │  │   Student    │    │
│  │   Routes    │  │   Routes     │  │   Routes     │    │
│  │             │  │              │  │              │    │
│  │ • Login     │  │ • Periods    │  │ • Civs       │    │
│  │ • Register  │  │ • Timeline   │  │ • Actions    │    │
│  │             │  │ • Overview   │  │ • Stats      │    │
│  └─────────────┘  └──────────────┘  └──────────────┘    │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │              Game Routes                            │  │
│  │  • Wars         • Alliances      • Buildings       │  │
│  │  • Religions    • Wonders        • Events          │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
│  ┌─────────────────────────────────────────────────────┐  │
│  │          Core Game Logic Layer                      │  │
│  │  • game-logic.ts    (traits, growth, war)          │  │
│  │  • timeline.ts      (27 historical events)         │  │
│  │  • db.ts            (utilities, parsing)           │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                            │
└────────────────────────┬───────────────────────────────────┘
                         │
                         │ SQL Queries
                         │
┌────────────────────────▼───────────────────────────────────┐
│                 CLOUDFLARE D1 DATABASE                     │
│                   (SQLite on Edge)                         │
├────────────────────────────────────────────────────────────┤
│                                                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │  teachers    │  │  periods     │  │  students    │    │
│  │              │  │              │  │              │    │
│  │ • id         │  │ • id         │  │ • id         │    │
│  │ • email      │  │ • name       │  │ • email      │    │
│  │ • password   │  │ • invite_code│  │ • name       │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                            │
│  ┌──────────────┐  ┌──────────────────────────────────┐   │
│  │ simulations  │  │    civilizations                 │   │
│  │              │  │                                  │   │
│  │ • id         │  │ • id          • houses          │   │
│  │ • current_yr │  │ • student_id  • population      │   │
│  │ • timeline_i │  │ • martial     • defense         │   │
│  │ • paused     │  │ • culture     • faith           │   │
│  └──────────────┘  │ • science     • diplomacy       │   │
│                    │ • traits      • regions         │   │
│  ┌──────────────┐  │ • buildings   • religion        │   │
│  │  alliances   │  │ • conquered   • wonder          │   │
│  │  wars        │  └──────────────────────────────────┘   │
│  │  event_log   │                                         │
│  │  civ_presets │                                         │
│  └──────────────┘                                         │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

## Request Flow

### Teacher Creates Period
```
1. Teacher → POST /api/teacher/periods
2. Hono validates teacherId and period name
3. Generate unique invite code (e.g., "ABC123")
4. Insert into periods table
5. Create linked simulation (year: -50000, index: 0)
6. Return period info with invite code
```

### Student Joins & Creates Civilization
```
1. Student → POST /api/auth/student/register
   - Provides: email, password, name, inviteCode
2. Validate invite code against periods table
3. Create student account linked to period
4. Return success

5. Student → POST /api/student/civilization
   - Choose preset (e.g., "Ancient Egypt") OR custom
6. Load preset stats from civ_presets table
7. Apply trait modifiers (e.g., Industrious: 2× Industry)
8. Insert into civilizations table
9. Return civilization data
```

### Teacher Advances Timeline
```
1. Teacher → POST /api/teacher/simulation/:id/advance
2. Get current simulation (year: -50000, index: 0)
3. Fetch next timeline event (index: 1)
   - Example: Year -8500, "Mesolithic Period"
4. Update simulation: year = -8500, index = 1
5. Log event to event_log table

6. IF event.data.growth == true:
   a. Query all civilizations in simulation
   b. FOR EACH civilization:
      - Add fertility to houses (capped at capacity)
      - Calculate population (houses × 1 or × 2)
      - Update civilization record
   
7. Apply region-specific effects:
   - Example: Egypt gets +30% Industry at 4500 BCE
   - Check civilization.regions array
   - Apply bonuses to matching civilizations

8. Return event data and affected civilizations
```

### Student Declares War
```
1. Student → POST /api/game/war/declare
   - Provides: attackerId, defenderId
2. Fetch both civilizations from database
3. Check prerequisites:
   - Same simulation?
   - Not allied?
   - War unlocked? (current_year >= -670)
4. Resolve combat:
   - Attacker total = attacker.martial
   - Defender total = defender.martial + defender.defense
   - Winner = higher total
5. Mark loser as conquered
6. Insert war record into wars table
7. Log event to event_log
8. Return result (winner, loser, totals)
```

## Data Flow: Growth Phase

```
Timeline Advance (with growth: true)
          │
          ▼
┌─────────────────────────┐
│  Get All Civilizations  │
│  WHERE conquered=FALSE  │
└───────────┬─────────────┘
            │
            ▼
    ┌───────────────┐
    │ FOR EACH CIV  │
    └───────┬───────┘
            │
            ▼
┌───────────────────────────────────┐
│ 1. Add fertility to houses        │
│    new_houses = min(              │
│      houses + fertility,          │
│      population_capacity          │
│    )                              │
└───────────┬───────────────────────┘
            │
            ▼
┌───────────────────────────────────┐
│ 2. Update population              │
│    IF year >= -480:               │
│      population = houses × 2      │
│    ELSE:                          │
│      population = houses × 1      │
└───────────┬───────────────────────┘
            │
            ▼
┌───────────────────────────────────┐
│ 3. Calculate base stats           │
│    industry = population ÷ 5      │
│    base_stat = population ÷ 10    │
└───────────┬───────────────────────┘
            │
            ▼
┌───────────────────────────────────┐
│ 4. Add building bonuses           │
│    faith += temples × 2           │
│    culture += amphitheaters × 3   │
│    defense += walls × 1           │
│    defense += archimedes × 20     │
└───────────┬───────────────────────┘
            │
            ▼
┌───────────────────────────────────┐
│ 5. Apply cultural stage bonus     │
│    Barbarism: +50% martial/fert   │
│    Classical: +50% science/faith  │
│    Imperial: +50% industry/mart   │
│    Decline: halve all stats       │
└───────────┬───────────────────────┘
            │
            ▼
┌───────────────────────────────────┐
│ 6. Apply region-specific effects  │
│    Example: Egypt gets +30% ind   │
│    at year -4500                  │
└───────────┬───────────────────────┘
            │
            ▼
┌───────────────────────────────────┐
│ 7. UPDATE civilizations SET ...   │
│    WHERE id = civ.id              │
└───────────────────────────────────┘
```

## Timeline Event Examples

### Event Structure
```typescript
{
  year: -4500,
  data: {
    growth: true,
    egypt_industry_pct: 30,
    egypt_regions: ['egypt'],
    fertile_crescent_fertility: 2,
    fertile_crescent_regions: ['fertile crescent', 'mesopotamia'],
    description: 'Agricultural Revolution...'
  }
}
```

### Processing Logic
```javascript
if (event.data.growth) {
  applyGrowthToAllCivilizations()
}

if (event.data.egypt_industry_pct) {
  civilizations
    .filter(civ => regionMatch(civ, event.data.egypt_regions))
    .forEach(civ => {
      civ.industry += civ.industry * (event.data.egypt_industry_pct / 100)
    })
}

if (event.data.great_flood_regions) {
  civilizations
    .filter(civ => regionMatch(civ, event.data.great_flood_regions))
    .forEach(civ => {
      if (!savingThrow(10, 'industrious', civ)) {
        civ.houses = Math.floor(civ.houses / 2)
      }
    })
}
```

## Authentication Flow

### Password Hashing (Web Crypto API)
```typescript
async function hashPassword(password: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(password)
  const hash = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(hash))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}
```

### Login Flow
```
1. User submits email + password
2. Query user from database (teacher or student)
3. Hash submitted password
4. Compare with stored password_hash
5. If match:
   - Return user data (without password)
   - Frontend stores in sessionStorage
6. If no match:
   - Return 401 Unauthorized
```

### Invite Code System
```
1. Teacher creates period
2. Generate 6-character code (e.g., "ABC123")
   - Uppercase alphanumeric
   - Excludes confusing characters (0, O, I, 1)
3. Store in periods table (unique constraint)
4. Teacher shares code with students
5. Student enters code during registration
6. Validate code:
   - EXISTS in periods table?
   - NOT archived?
7. Link student to period
```

## Deployment Architecture

### Local Development
```
Developer Machine
  │
  ├─ Vite Dev Server (port 5173)
  │  └─ Hot Module Replacement
  │
  └─ Wrangler Pages Dev (port 3000)
     ├─ Local D1 Database (.wrangler/state/v3/d1)
     ├─ Cloudflare Workers Runtime
     └─ Hono Application
```

### Production (Cloudflare Pages)
```
Cloudflare Global Network
  │
  ├─ Edge Locations (300+ cities)
  │  └─ Cloudflare Workers Runtime
  │     └─ Hono Application (_worker.js)
  │
  └─ Cloudflare D1 (SQLite)
     ├─ Primary Database
     └─ Read Replicas (auto-distributed)
```

## Security Considerations

### Authentication
- ✅ Passwords hashed with SHA-256
- ✅ No plain-text passwords stored
- ✅ Session data in sessionStorage (client-side)
- ⚠️ No JWT tokens yet (future enhancement)
- ⚠️ No rate limiting on login (future enhancement)

### Database Access
- ✅ D1 binding prevents direct SQL injection
- ✅ Prepared statements for all queries
- ✅ Input validation on all routes
- ✅ Foreign key constraints enforced

### Invite Codes
- ✅ Unique constraint prevents duplicates
- ✅ 6-character alphanumeric (36^6 = 2.1 billion combinations)
- ✅ Case-insensitive matching (normalized to uppercase)

### CORS
- ✅ Enabled only for /api/* routes
- ✅ Static assets served without CORS

## Performance Optimizations

### Database
- ✅ Indexes on foreign keys
- ✅ Indexes on frequently queried columns
- ✅ Composite index on (simulation_id, year) for event_log

### Edge Computing
- ✅ Cloudflare Workers run at edge (low latency)
- ✅ D1 read replicas distributed globally
- ✅ Static assets cached at edge

### Caching Strategy (Future)
- ⏳ Cache civilization presets (rarely change)
- ⏳ Cache timeline events (static data)
- ⏳ Use stale-while-revalidate for stats

## Scalability

### Current Capacity
- **Teachers**: Unlimited (limited by D1 storage)
- **Periods**: Unlimited per teacher
- **Students**: 100-200 per period (recommended)
- **Civilizations**: 1 per student
- **Timeline Events**: 27 fixed events
- **Database Size**: D1 free tier = 5 GB

### Scaling Considerations
- **Horizontal**: Cloudflare Workers auto-scale
- **Database**: D1 supports up to 10 GB (paid plan)
- **Concurrency**: Workers handle 1000+ req/sec
- **Cold Starts**: ~10ms (Cloudflare Workers are fast)

## Testing Strategy

### Manual Testing (Current)
- ✅ Registration flows (teacher & student)
- ✅ Login authentication
- ✅ Period creation
- ✅ Civilization creation
- ✅ Timeline advancement
- ✅ Growth phase calculations

### Automated Testing (Future)
- ⏳ Unit tests for game logic
- ⏳ Integration tests for API routes
- ⏳ End-to-end tests with Playwright
- ⏳ Load testing with k6

## Monitoring & Observability

### Current
- ✅ PM2 logs for local development
- ✅ Wrangler logs during deployment
- ✅ Event log table for audit trail

### Future Enhancements
- ⏳ Cloudflare Analytics (requests, latency)
- ⏳ Custom metrics (civilizations created, wars declared)
- ⏳ Error tracking (Sentry or similar)
- ⏳ Teacher analytics dashboard

## Technology Choices Rationale

### Why Hono?
- ✅ Lightweight (3KB bundle size)
- ✅ Fast routing (faster than Express)
- ✅ Native Cloudflare Workers support
- ✅ TypeScript-first design
- ✅ Minimal overhead on edge runtime

### Why Cloudflare D1?
- ✅ SQLite on edge (familiar SQL)
- ✅ Automatic global replication
- ✅ Zero-config setup
- ✅ Generous free tier (5 GB)
- ✅ Built-in migrations

### Why Cloudflare Pages?
- ✅ Free hosting with custom domains
- ✅ Automatic HTTPS and CDN
- ✅ Git integration (deploy on push)
- ✅ Preview deployments for PRs
- ✅ Workers integration (full-stack)

### Why Vanilla JavaScript Frontend?
- ✅ Fast page loads (no framework overhead)
- ✅ Simple for students to understand
- ✅ No build step for HTML pages
- ✅ CDN libraries cached by browser
- ✅ Easy to maintain and extend

---

This architecture provides a solid foundation for a multiplayer educational game that can scale to hundreds of students while maintaining low latency and high reliability.
