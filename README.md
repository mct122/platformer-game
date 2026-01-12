# Super Retro Platformer

A Mario-style platformer game built with Vanilla JS, Vite, and PWA capabilities.
Playable offline on mobile devices!

## 🎮 How to Play on Mobile (Smartphone)

This game is a Progressive Web App (PWA). You can install it on your phone to play offline and in full screen.

**Public URL**: `https://mct122.github.io/platformer-game/`  
*(Note: Please ensure GitHub Pages is enabled in your repository settings)*

### 📱 Installation Steps

**iPhone / iPad (iOS - Safari):**
1. Open the game URL in **Safari**.
2. Tap the **Share** button (rectangle with arrow pointing up) at the bottom.
3. Scroll down and tap **"Add to Home Screen"**.
4. Tap "Add".
5. Launch the game from the new icon on your home screen!

**Android (Chrome):**
1. Open the game URL in **Chrome**.
2. Tap the **Menu** button (3 dots) at the top right.
3. Tap **"Install App"** or **"Add to Home Screen"**.
4. Confirm installation.
5. Launch the game from the icon on your home screen!

### 🕹️ Controls
- **Touch**: Use the on-screen buttons to Move and Jump.
- **Keyboard**: Arrow keys to Move, Space/Up to Jump.

---

## 🛠️ Development

### Prerequisites
- Node.js installed

### Setup
```bash
# Install dependencies
npm install
```

### Run Locally
```bash
# Start dev server
npm run dev

# Network play (LAN)
npm run dev -- --host
```

### Build & Deploy
This project is configured for GitHub Pages (`base: '/platformer-game/'`).

1. Push your changes to GitHub.
2. Go to Repository **Settings** -> **Pages**.
3. Set **Source** to `GitHub Actions` or `Deploy from Branch` (usually `gh-pages` branch if you run a build script, or main if using actions).

Enjoy!
