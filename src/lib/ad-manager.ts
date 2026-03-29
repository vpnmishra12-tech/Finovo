/**
 * @fileOverview Manages AdMob logic for Interstitial and Rewarded ads.
 * Bridges web simulation and native APK behavior.
 */

const LAST_INTERSTITIAL_KEY = 'finovo_last_interstitial';
const INTERSTITIAL_COOLDOWN = 5 * 60 * 1000; // 5 minutes frequency cap

export const AD_IDS = {
  APP_ID: 'ca-app-pub-9915809769396833~2579253457',
  BANNER: 'ca-app-pub-9915809769396833/6222984996',
  INTERSTITIAL: 'ca-app-pub-9915809769396833/9966585626',
  REWARDED: 'ca-app-pub-9915809769396833/7887420455',
};

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
 * Simulates or triggers an Interstitial Ad.
 */
export async function showInterstitialAd(): Promise<void> {
  if (!canShowInterstitial()) return;

  console.log("Triggering Interstitial Ad:", AD_IDS.INTERSTITIAL);
  if (typeof window !== 'undefined') {
    localStorage.setItem(LAST_INTERSTITIAL_KEY, Date.now().toString());
  }
  
  // In a native APK (Capacitor), this would call the bridge.
  return new Promise((resolve) => {
    setTimeout(resolve, 500);
  });
}

/**
 * Triggers a Rewarded Ad and returns a boolean if the reward was granted.
 */
export async function showRewardedAd(): Promise<boolean> {
  console.log("Triggering Rewarded Ad:", AD_IDS.REWARDED);
  
  return new Promise((resolve) => {
    // Simulated delay for ad watching
    setTimeout(() => resolve(true), 1000);
  });
}