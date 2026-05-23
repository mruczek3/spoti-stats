# 🚀 GitHub Pages Deployment - Complete Setup Guide

## ✅ What You Have

A complete static Spotify Stats Dashboard with:
- ✅ All 8 tabs with full content (No more blank sections!)
- ✅ PKCE OAuth 2.0 flow working
- ✅ Mock data for offline testing
- ✅ Dark glassmorphism UI
- ✅ Fully responsive design
- ✅ NO server required (pure static HTML/CSS/JS)

## 🔄 File Structure

```
/
├── index.html              ← Login page
├── dashboard.html          ← Main app with all 8 tabs
├── callback.html           ← OAuth callback handler
├── assets/
│   ├── style.css          ← All styles
│   └── app.js             ← All JavaScript logic
└── README.md
```

## 🎯 Step 1: Test Locally First

### Option A: Using Python (Easiest)
```bash
# Windows: Open PowerShell in project folder, then:
python -m http.server 8000

# Then visit: http://localhost:8000
```

### Option B: Using Node.js
```bash
npm install -g http-server
http-server

# Then visit: http://localhost:8080
```

### Option C: Using VS Code Live Server
- Install "Live Server" extension
- Right-click index.html → "Open with Live Server"

**Test the flow:**
1. Click "👀 View Demo" to see all tabs with mock data
2. Click "🎧 Connect with Spotify" (will fail with redirect URI error - that's expected)

---

## 🐙 Step 2: Create GitHub Repository

### 2a. Create repo on GitHub
1. Go to https://github.com/new
2. **Repository name:** `spotify-stats` (or your choice)
3. **Description:** "Spotify listening statistics dashboard"
4. **Public** (needed for GitHub Pages)
5. **DO NOT** add README, .gitignore, or license
6. Click **Create repository**

### 2b. Copy your repo URL
After creation, you'll see:
```
https://github.com/YOUR_USERNAME/spotify-stats.git
```
Save this!

---

## 📤 Step 3: Push Code to GitHub

Open PowerShell in your project folder (`c:\Users\hirob\Documents\ahsah`) and run:

```powershell
# Initialize git
git init

# Add all files
git add .

# Create initial commit
git commit -m "Initial Spotify stats dashboard"

# Change main branch name
git branch -M main

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/spotify-stats.git

# Push to GitHub
git push -u origin main
```

**Replace `YOUR_USERNAME`** with your actual GitHub username!

---

## 🌐 Step 4: Enable GitHub Pages

1. Go to: https://github.com/YOUR_USERNAME/spotify-stats
2. Click **Settings** (top right)
3. Click **Pages** (left sidebar)
4. Under "Build and deployment":
   - **Source:** Select "Deploy from a branch"
   - **Branch:** Select "main" and "/ (root)"
   - Click **Save**
5. Wait 1-2 minutes for deployment
6. Your live URL will appear at the top: **https://YOUR_USERNAME.github.io/spotify-stats/**

---

## 🎵 Step 5: Register OAuth Callback URI in Spotify

Your live redirect URI is:
```
https://YOUR_USERNAME.github.io/spotify-stats/callback.html
```

**Register it:**
1. Go to https://developer.spotify.com/dashboard
2. Click your app
3. Click **Edit Settings**
4. Find **Redirect URIs** section
5. Paste this (with your GitHub username):
   ```
   https://YOUR_USERNAME.github.io/spotify-stats/callback.html
   ```
6. Click **Add**
7. Click **Save**

---

## 🧪 Step 6: Test Live

1. Visit: **https://YOUR_USERNAME.github.io/spotify-stats/**
2. Click "👀 View Demo" → ✅ All tabs load with mock data
3. Click "🎧 Connect with Spotify" → Should redirect to Spotify login
4. After granting permissions → ✅ Redirected back with real data!

---

## 📋 Final Checklist

- [ ] Repository created on GitHub
- [ ] Files pushed to GitHub (`git push`)
- [ ] GitHub Pages enabled in Settings → Pages
- [ ] Live URL working: `https://YOUR_USERNAME.github.io/spotify-stats/`
- [ ] Redirect URI added to Spotify Developer Dashboard:
      `https://YOUR_USERNAME.github.io/spotify-stats/callback.html`
- [ ] Scopes enabled in Spotify app:
      - user-read-private ✓
      - user-read-email ✓
      - user-top-read ✓
      - user-read-recently-played ✓
      - user-read-playback-state ✓
      - user-read-currently-playing ✓
- [ ] Tested with demo data ✓
- [ ] Tested with real Spotify login ✓

---

## 🎯 Your Personal Redirect URI

**Copy this exactly for your Spotify Dashboard:**

```
https://YOUR_USERNAME.github.io/spotify-stats/callback.html
```

Replace `YOUR_USERNAME` with your GitHub username!

---

## 📝 Example (Replace YOUR_USERNAME)

If your GitHub username is `hirob`:
- **Live URL:** https://hirob.github.io/spotify-stats/
- **Redirect URI:** https://hirob.github.io/spotify-stats/callback.html

---

## ❓ Troubleshooting

### "Page not found"
- Wait 2-3 minutes for GitHub to deploy
- Check URL has correct username and repo name
- Make sure GitHub Pages is enabled

### "Redirect URI mismatch" error on Spotify login
- Copy your exact live URL from browser
- Add `/callback.html` at the end
- Register exactly that in Spotify Dashboard
- Make sure it's HTTPS (GitHub Pages always uses HTTPS)

### "Demo data button doesn't work"
- Open browser DevTools (F12)
- Check Console for errors
- Make sure localStorage is enabled

### Changes not appearing live
- Hard refresh: `Ctrl+Shift+R` (Windows) or `Cmd+Shift+R` (Mac)
- Wait for GitHub Pages rebuild (watch the Actions tab)

---

## 🚀 Updates & Changes

After making changes:

```powershell
# Stage changes
git add .

# Commit
git commit -m "Update description"

# Push to GitHub
git push

# Wait 1-2 minutes for live update
```

---

## 📚 What Each File Does

| File | Purpose |
|------|---------|
| `index.html` | Login page with Spotify connect button |
| `dashboard.html` | Main app - all 8 tabs with content |
| `callback.html` | OAuth callback page (Spotify redirects here) |
| `assets/style.css` | All styling (dark theme, glassmorphism) |
| `assets/app.js` | OAuth PKCE flow + all JavaScript |

---

## 🔐 Security Notes

✅ **PKCE** - Code verifier never exposed  
✅ **No Client Secret** - Never transmitted from frontend  
✅ **HTTPS** - GitHub Pages always uses HTTPS  
✅ **localStorage** - Token stored in user's browser only  
✅ **No Backend** - Pure static site, no server  

---

## 🎉 You're Done!

Your Spotify Stats Dashboard is live on GitHub Pages with working OAuth!

**Share your link:** https://YOUR_USERNAME.github.io/spotify-stats/

---

**Questions?** Check the console (F12) for errors or review `assets/app.js` for implementation details.
