
# SmartKharcha AI - Installation & Configuration Guide 📱

Your app is ready! Follow these steps to fix the login issues and share your app.

## 🛠 CRITICAL: Fix "Login Issue" (One-time Setup)
Firebase blocks requests from unknown domains for security. You must authorize your current development domain.

### 1. Find the "Add Domain" Button
1. Copy the URL of your app from the browser address bar (e.g., `9002-firebase-studio...cloudworkstations.dev`).
2. Click this link: [Firebase Console Authentication Settings](https://console.firebase.google.com/project/studio-4253837572-72734/authentication/settings).
3. **Navigation Path**:
   - Look at the top center of the page. You will see three tabs: `Users`, `Sign-in method`, and **Settings**.
   - Click on the **Settings** tab.
   - Now look at the left-hand sidebar (under the word 'Settings').
   - Click on **Authorized domains**.
   - Now, on the main part of the screen, you will see a list of domains and an **"Add domain"** button on the right side.

### 2. Add Your URL
1. Click **"Add domain"**.
2. Paste your URL (e.g., `9002-firebase-studio-123.cluster-xyz.cloudworkstations.dev`).
3. **IMPORTANT**: Remove `https://` and anything after `.dev`. It should look exactly like the example above.

### 3. Allow Popups (Important!)
Even if you allowed popups in browser settings, browsers often block them for new sites.
- When you click Login, look at the **right side of your address bar** (where you type URLs).
- Look for a small icon with a red 'X' or a "Popup Blocked" icon.
- Click it and select **"Always allow popups from..."** then click Done.
- **Refresh the page** and try Login again.

## 🔗 How to get your Public Link
To get a link for everyone else (Production):
1. Click the **"Deploy"** button in the Firebase Studio sidebar.
2. Once finished, you will get a **Production URL** (e.g., `https://your-app.web.app`).
3. **Important**: You must also add this Production URL to the "Authorized Domains" list mentioned above!

## 🚀 How to Install as an App (FREE)
1. Open your **Production URL** in your phone's browser (Chrome for Android, Safari for iOS).
2. Tap the menu/share button and select **"Add to Home Screen"**.
3. The app will now appear on your home screen with its own icon. No APK required!
