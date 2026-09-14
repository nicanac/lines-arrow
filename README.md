# Lines Arrow (Arrow Escape)

A sleek, tactile 2D puzzle game built with **TypeScript**, **PixiJS v8**, **GSAP**, and **Capacitor**. Players clear a discrete grid of arrows by identifying unblocked exit paths without colliding with obstacles.

## Features

- **Pure Discrete Board Traversal**: Raycasting directional unit vectors along cardinal and diagonal lines.
- **Guaranteed Solvable Reverse Level Generator**: Reverse procedural generation and solver simulation ensuring 100% solvable boards.
- **Modern PixiJS v8 + GSAP Rendering**: High-performance WebGL graphics, dynamic scaling, particle burst feedback, and elastic collision bump animations.
- **Audio & Haptic Feedback**: Procedural Web Audio API sound synthesis with Howler.js pooling and Capacitor Haptics integration.
- **Cross-Platform Mobile Ready**: Configured for Android via Capacitor 6 with AdMob mediation support (Rewarded ads & interstitials).
- **Persistent Progress**: Automatically saves level progression and user preferences using Capacitor Preferences with LocalStorage fallback.

---

## Directory Structure

```text
├── android/                        # Capacitor-generated native Android project
├── src/
│   ├── assets/                     # Sprites, audio assets, icons
│   ├── config/
│   │   └── game.config.ts          # Display, lives, colors, timing constants
│   ├── core/
│   │   ├── AudioManager.ts         # Audio pooling & procedural sound synthesizer
│   │   ├── BoardEngine.ts          # Discrete grid raycasting & path validation
│   │   ├── LevelGenerator.ts       # Reverse procedural level builder & solver
│   │   └── StateMachine.ts         # Finite state machine (Input & turn lifecycle)
│   ├── rendering/
│   │   ├── ArrowView.ts            # PixiJS Container entity with GSAP tweens
│   │   └── StageManager.ts         # Viewport scaling, responsive grid, screen shake
│   ├── services/
│   │   ├── AdService.ts            # Capacitor AdMob mediation wrapper
│   │   ├── HapticService.ts        # Capacitor Haptics integration
│   │   └── StorageService.ts       # Capacitor Preferences / LocalStorage
│   ├── types/
│   │   └── game.types.ts           # Direction, grid, and level interfaces
│   ├── ui/
│   │   ├── HUD.ts                  # Canvas / DOM HUD (Lives, hints, level counter)
│   │   └── ModalManager.ts         # Win / Loss modals, rewarded ad triggers
│   └── main.ts                     # Game loop orchestration & bootstrap
├── capacitor.config.ts             # Capacitor configuration
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Quickstart

### 1. Install Dependencies

```bash
npm install
```

### 2. Development Server

Run the web version locally with instant Hot Module Replacement:

```bash
npm run dev
```

### 3. Production Build

Compile TypeScript and build the optimized distribution bundle:

```bash
npm run build
```

### 4. Capacitor & Android

Sync web assets into the Android native project:

```bash
npm run cap:sync
```

Open in Android Studio for testing, keystore signing, and APK/AAB export:

```bash
npx cap open android
```
