export const GameConfig = {
  lives: {
    default: 3,
    max: 3,
  },
  grid: {
    baseCellSize: 64,
    minCellSize: 44,
    maxCellSize: 76,
    cellPadding: 6,
    borderRadius: 12,
  },
  animation: {
    exitDuration: 0.35,
    exitDistance: 1500,
    bumpDuration: 0.08,
    bumpReturnDuration: 0.16,
    bumpDistance: 12,
    hintPulseDuration: 0.18,
    hintPulseRepeats: 2,
    screenShakeDuration: 0.25,
  },
  colors: {
    background: 0x0f172a,       // Slate 900
    gridBackground: 0x1e293b,   // Slate 800
    gridBorder: 0x334155,       // Slate 700
    arrowDefault: 0x3b82f6,     // Blue 500
    arrowAccent1: 0x6366f1,     // Indigo 500
    arrowAccent2: 0x8b5cf6,     // Violet 500
    arrowAccent3: 0x06b6d4,     // Cyan 500
    arrowSuccess: 0x10b981,     // Emerald 500
    arrowError: 0xef4444,       // Red 500
    arrowHint: 0xfacc15,        // Yellow 400
    glyphWhite: 0xffffff,
  },
  audio: {
    sfxVolume: 0.8,
    bgmVolume: 0.4,
  },
  ads: {
    interstitialFrequency: 3, // Show interstitial every 3 levels
    testAdMobBanner: 'ca-app-pub-3940256099942544/6300978111',
    testAdMobInterstitial: 'ca-app-pub-3940256099942544/1033173712',
    testAdMobReward: 'ca-app-pub-3940256099942544/5224354917',
  }
} as const;
