# GitHub Setup Instructions

## Steps to Push Code to Your GitHub Repository

### Step 1: Authorize GitHub in Sandbox

1. Click on the **#github** tab in your code sandbox
2. Click **"Authorize GitHub"** or **"Connect GitHub"**
3. Follow the authentication prompts
4. Grant necessary permissions for repository access

### Step 2: Create or Select Repository

After authorization, you have two options:

#### Option A: Create New Repository
1. In the GitHub tab, click **"Create New Repository"**
2. Name it: `through-history-simulation`
3. Description: `A World History simulation game for high school students (50,000 BCE - 362 CE)`
4. Choose: **Public** (recommended for educational projects)
5. Click **"Create Repository"**

#### Option B: Use Existing Repository
1. If you already have a repository named "Through History: A World History Simulation"
2. In the GitHub tab, select it from your repository list
3. Confirm selection

### Step 3: Push Code (Automated)

Once GitHub is authorized and repository is selected, run:

```bash
cd /home/user/webapp
# The setup_github_environment tool will configure git credentials
# Then push to GitHub
git push -u origin main
```

If this is a new repository with no commits:
```bash
git push -f origin main
```

### Step 4: Verify

1. Go to your GitHub repository page
2. You should see all project files
3. Check the README.md displays correctly
4. Verify the following structure:
   ```
   through-history-simulation/
   ├── src/
   ├── public/
   ├── migrations/
   ├── README.md
   ├── ARCHITECTURE.md
   ├── TEACHER_GUIDE.md
   └── package.json
   ```

## What Gets Pushed

The following will be pushed to GitHub:

✅ **Backend Code**:
- `src/index.tsx` - Main application
- `src/routes/` - All API routes
- `src/types.ts` - TypeScript definitions
- `src/db.ts` - Database utilities
- `src/game-logic.ts` - Game mechanics
- `src/timeline.ts` - Historical events

✅ **Frontend Code**:
- `public/static/auth.js`
- `public/static/teacher-dashboard.js`
- `public/static/student-game.js`

✅ **Database**:
- `migrations/0001_initial_schema.sql`
- `seed.sql`

✅ **Configuration**:
- `package.json`
- `wrangler.jsonc`
- `tsconfig.json`
- `vite.config.ts`
- `ecosystem.config.cjs`

✅ **Documentation**:
- `README.md`
- `ARCHITECTURE.md`
- `TEACHER_GUIDE.md`
- `GITHUB_SETUP.md`

❌ **What's Excluded** (via .gitignore):
- `node_modules/`
- `.env`
- `.wrangler/`
- `dist/`
- Build artifacts

## Troubleshooting

### "Permission denied"
- Ensure GitHub authorization is complete
- Check that you have write access to the repository
- Try re-authorizing in the #github tab

### "Repository not found"
- Verify the repository exists on GitHub
- Check the repository name matches exactly
- Ensure it's under your GitHub account

### "Authentication failed"
- Re-run `setup_github_environment` tool
- Check token expiration in #github tab
- Re-authorize if needed

## After Pushing to GitHub

### Enable GitHub Pages (Optional)
1. Go to repository Settings → Pages
2. Source: **GitHub Actions** or **Branch: main**
3. Your README will be visible at: `https://yourusername.github.io/through-history-simulation`

### Add Repository Topics
Add these topics for discoverability:
- `education`
- `history`
- `game`
- `simulation`
- `cloudflare-pages`
- `typescript`
- `world-history`

### Update README.md Production URL
After deploying to Cloudflare Pages:
1. Update the sandbox URL in README.md
2. Replace with: `https://worldhistorysim.pages.dev`
3. Commit and push changes

## Repository Description

Suggested GitHub repository description:

```
A comprehensive multiplayer web-based civilization management game for 
high school World History classes. Students build and manage civilizations 
from 50,000 BCE to 362 CE, experiencing 27 major historical events. Built 
with Hono, Cloudflare Pages, and D1 database.
```

## License Recommendation

This is an educational project. Consider adding an MIT License or similar open-source license to allow other teachers to use and adapt the game.

To add a license:
1. Go to your GitHub repository
2. Click "Add file" → "Create new file"
3. Name it `LICENSE`
4. GitHub will offer license templates
5. Choose **MIT License** (recommended for educational projects)
6. Fill in your name and year
7. Commit

## Next Steps After GitHub Push

1. ✅ Code is on GitHub
2. 🚀 Deploy to Cloudflare Pages (see README.md)
3. 📚 Share with other teachers
4. 🎓 Use in classroom
5. 🌟 Star your own repository (it's allowed!)

---

**Questions?** Check the main README.md for comprehensive documentation.
