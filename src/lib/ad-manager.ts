
/**
 * @fileOverview Manages AdMob logic for Interstitial and Rewarded ads.
 * Real integration using @capacitor-community/admob.
 */

import { AdMob, BannerAdOptions, BannerAdSize, BannerAdPosition, InterstitialAdOptions, RewardAdOptions } from '@capacitor-community/admob';
import { Capacitor } from '@capacitor/core';

const LAST_INTERSTITIAL_KEY = 'finovo_last_interstitial';
const INTERSTITIAL_COOLDOWN = 5 * 60 * 1000;

export const AD_IDS = {
  BANNER: 'ca-app-pub-9915809769396833/6222984996',
  INTERSTITIAL: 'ca-app-pub-9915809769396833/9966585626',
  REWARDED: 'ca-app-pub-9915809769396833/7887420455',
};

/**
 * Initializes AdMob when the app starts.
 */
export async function initializeAdMob() {
  if (Capacitor.isNativePlatform()) {
    try {
      // Ensure AdMob initialization doesn't block the main thread
      await AdMob.initialize();
    } catch (e) {
      console.warn('AdMob init failed', e);
    }
  }
}

/**
 * Shows a banner ad.
 */
export async function showBannerAd() {
  if (!Capacitor.isNativePlatform()) return;

  const options: BannerAdOptions = {
    adId: AD_IDS.BANNER,
    adSize: BannerAdSize.BANNER,
    position: BannerAdPosition.BOTTOM_CENTER,
    margin: 0,
    isTesting: false // User provided real IDs
  };

  try {
    await AdMob.showBanner(options);
  } catch (e) {
    console.warn('Banner failed', e);
  }
}

/**
 * Checks if we can show an interstitial ad based on frequency capping.
 */
export function canShowInterstitial(): boolean {
  if (typeof window === 'undefined') return false;
  const lastTime = localStorage.getItem(LAST_INTERSTITIAL_KEY);
  if (!lastTime) return true;
  return Date.now() - parseInt(lastTime) > INTERSTITIAL_COOLDOWN;
}

/**
 * Shows an Interstitial Ad.
 */
export async function showInterstitialAd(): Promise<void> {
  if (!Capacitor.isNativePlatform() || !canShowInterstitial()) return;

  const options: InterstitialAdOptions = {
    adId: AD_IDS.INTERSTITIAL,
  };

  try {
    await AdMob.prepareInterstitial(options);
    await AdMob.showInterstitial();
    localStorage.setItem(LAST_INTERSTITIAL_KEY, Date.now().toString());
  } catch (e) {
    console.warn('Interstitial failed', e);
  }
}

/**
 * Triggers a Rewarded Ad and returns a boolean if the reward was granted.
 */
export async function showRewardedAd(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) return true; // Simulation for web

  const options: RewardAdOptions = {
    adId: AD_IDS.REWARDED,
  };

  try {
    await AdMob.prepareRewardVideoAd(options);
    const reward = await AdMob.showRewardVideoAd();
    return !!reward;
  } catch (e) {
    console.warn('Rewarded failed', e);
    return false;
  }
}
