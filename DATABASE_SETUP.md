# Database Setup Guide

This document explains how to set up and seed the database for the Through History game.

## Problem

Students were getting "failure to load game" errors because the `civ_presets` table was empty. Without civilization presets, students cannot create their civilizations.

## Solution

The database needs to be seeded with the 18 historical civilization presets.

## Setup Instructions

### Local Development Database

```bash
# Apply migrations (if not done already)
npm run db:migrate:local

# Seed the database with civilization presets
npm run db:seed

# Or reset and re-seed everything
npm run db:reset
```

### Production Database (Cloudflare)

```bash
# Apply migrations to production
npm run db:migrate:prod

# Seed production database with civilization presets
npm run db:seed:prod
```

## Available Civilizations

The seed file includes 18 historical civilizations:

1. **Ancient Egypt** - Industrious, Wisdom
2. **Ancient Greece** - Intelligence, Beauty
3. **Roman Empire** - Strength, Industrious
4. **Ancient China** - Industrious, Intelligence
5. **Ancient India** - Wisdom, Creativity
6. **Mesopotamia** - Intelligence, Industrious
7. **Persian Empire** - Strength, Beauty
8. **Phoenicia** - Beauty, Creativity
9. **Ancient Israel** - Wisdom, Faith
10. **Sparta** - Strength, Health
11. **Anatolia** - Strength, Industrious
12. **Minoan Crete** - Beauty, Creativity
13. **Gaul** - Strength, Health
14. **Germania** - Strength, Health
15. **Carthage** - Beauty, Strength
16. **Macedonia** - Strength, Beauty
17. **Assyrian Empire** - Strength, Industrious
18. **Kingdom of Kush** - Strength, Health

## Verification

To verify the database is properly seeded:

### Local
```bash
npx wrangler d1 execute webapp-production --local --command="SELECT COUNT(*) FROM civ_presets"
```

### Production
```bash
npx wrangler d1 execute webapp-production --remote --command="SELECT COUNT(*) FROM civ_presets"
```

Both should return `count: 18`.

## Database Schema

The game uses Cloudflare D1 (SQLite) with the following main tables:
- `teachers` - Teacher accounts
- `students` - Student accounts
- `periods` - Class periods/games
- `simulations` - Game state for each period
- `civilizations` - Player civilizations
- `civ_presets` - Historical civilization templates (MUST BE SEEDED)
- `alliances` - Diplomatic alliances between players
- `wars` - War history
- `event_log` - Historical events timeline

## Troubleshooting

### "Failure to load game" error
- **Cause**: Database not seeded
- **Solution**: Run `npm run db:seed` (local) or `npm run db:seed:prod` (production)

### "No civilizations to choose from"
- **Cause**: `civ_presets` table is empty
- **Solution**: Run seed command as above

### Database reset needed
```bash
# WARNING: This deletes all local data
npm run db:reset
```

For production, you need to manually run migrations and seed:
```bash
npm run db:migrate:prod
npm run db:seed:prod
```

## Status

✅ Local database seeded (18 civilizations)
✅ Production database seeded (18 civilizations)
✅ Both databases operational