
/**
 * @fileOverview Manages AdMob logic for Interstitial and Rewarded ads.
 * Bridges web simulation and native APK behavior.
 */

const LAST_INTERSTITIAL_KEY = 'finovo_last_interstitial';
const INTERSTITIAL_COOLDOWN = 5 * 60 * 1000; // 5 minutes frequency cap

export const AD_IDS = {
  APP_ID: process.env.NEXT_PUBLIC_ADMOB_APP_ID || 'ca-app-pub-3940256099942544~3347511713',
  BANNER: process.env.NEXT_PUBLIC_ADMOB_BANNER_ID || 'ca-app-pub-3940256099942544/6300978111',
  INTERSTITIAL: process.env.NEXT_PUBLIC_ADMOB_INTERSTITIAL_ID || 'ca-app-pub-3940256099942544/1033173712',
  REWARDED: process.env.NEXT_PUBLIC_ADMOB_REWARDED_ID || 'ca-app-pub-3940256099942544/5224354917',
};

/**
 * Checks if we can show an interstitial ad based on frequency capping.
 */
export function canShowInterstitial(): boolean {
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
  localStorage.setItem(LAST_INTERSTITIAL_KEY, Date.now().toString());
  
  // In a native APK (Capacitor), this would call the bridge.
  // For web development, we return a promise.
  return new Promise((resolve) => {
    // Simulated delay for "loading" the ad
    setTimeout(resolve, 500);
  });
}

/**
 * Triggers a Rewarded Ad and returns a boolean if the reward was granted.
 */
export async function showRewardedAd(): Promise<boolean> {
  console.log("Triggering Rewarded Ad:", AD_IDS.REWARDED);
  
  // In a real APK, this would wait for the video to finish.
  // Here we simulate the process for the web shell.
  return new Promise((resolve) => {
    // In production APK, this returns true if user finishes the video
    setTimeout(() => resolve(true), 1000);
  });
}
