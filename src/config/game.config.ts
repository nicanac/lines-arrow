export const GameConfig = {
  lives: {
    default: 3,
    max: 3,
  },
  grid: {
    baseCellSize: 44,
    minCellSize: 26,
    maxCellSize: 68,
    lineWidthRatio: 0.16, // Proportional stroke thickness (~6-9px)
    arrowHeadSize: 11,
  },
  animation: {
    exitDuration: 0.55,
    exitDistance: 1600,
    bumpDuration: 0.08,
    bumpReturnDuration: 0.16,
    bumpDistance: 8,
    hintPulseDuration: 0.18,
    hintPulseRepeats: 2,
    screenShakeDuration: 0.22,
  },
  colors: {
    background: 0xffffff,       // Clean white as in screenshot
    headerBg: 0xffffff,
    divider: 0xe2e8f0,          // Slate 200 divider line
    titleText: 0x243356,        // Deep slate-navy
    lineDefault: 0x2c384e,      // Dark charcoal line color as in screenshot
    lineSelected: 0x0091ff,     // Electric blue as in screenshot
    lineSuccess: 0x0091ff,
    lineError: 0xef4444,        // Red collision color
    lineHint: 0xf59e0b,         // Golden amber hint
    heartRed: 0xef4444,
  },
  audio: {
    sfxVolume: 0.85,
    bgmVolume: 0.4,
  },
  ads: {
    interstitialFrequency: 3,
    testAdMobBanner: 'ca-app-pub-3940256099942544/6300978111',
    testAdMobInterstitial: 'ca-app-pub-3940256099942544/1033173712',
    testAdMobReward: 'ca-app-pub-3940256099942544/5224354917',
  }
} as const;
