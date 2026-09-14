import { AdMob, RewardAdPluginEvents } from '@capacitor-community/admob';
import { GameConfig } from '../config/game.config';

export class AdService {
  private static instance: AdService;
  private isInitialized = false;

  private constructor() {}

  public static getInstance(): AdService {
    if (!this.instance) this.instance = new AdService();
    return this.instance;
  }

  public async initialize(): Promise<void> {
    if (this.isInitialized) return;
    try {
      await AdMob.initialize({});
      this.isInitialized = true;
    } catch (err) {
      console.info('[AdService] Native AdMob skipped (web/dev mode):', err);
    }
  }

  public async showInterstitial(): Promise<void> {
    try {
      await AdMob.prepareInterstitial({
        adId: GameConfig.ads.testAdMobInterstitial,
        isTesting: true,
      });
      await AdMob.showInterstitial();
    } catch (err) {
      console.info('[AdService] Interstitial skipped:', err);
    }
  }

  public async showRewardAd(onRewarded: () => void): Promise<void> {
    try {
      await AdMob.prepareRewardVideoAd({
        adId: GameConfig.ads.testAdMobReward,
        isTesting: true,
      });

      const handle = await AdMob.addListener(RewardAdPluginEvents.Rewarded, () => {
        onRewarded();
        handle.remove();
      });

      await AdMob.showRewardVideoAd();
    } catch (err) {
      console.info('[AdService] Rewarded ad fallback (simulated reward):', err);
      onRewarded();
    }
  }
}
