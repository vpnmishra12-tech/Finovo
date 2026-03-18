
# SmartKharcha AI - Installation & Configuration Guide 📱

Your app is ready! Follow these steps to fix the login issues and share your app.

## 🛠 CRITICAL: Fix "Login Issue" (One-time Setup)
Firebase blocks requests from unknown domains for security. You must authorize your current development domain.

### 1. Authorize Your Domain
1. Copy the URL of your app from the browser address bar (e.g., `9002-firebase-studio...cloudworkstations.dev`).
2. Go to the [Firebase Console Settings](https://console.firebase.google.com/project/studio-4253837572-72734/authentication/settings).
3. **Navigation Path**: Build > Authentication > **Settings (Tab)** > **Authorized domains (Left Menu)**.
4. Click **"Add domain"** and paste your URL.
5. **IMPORTANT**: Remove `https://` and anything after `.dev`. It should look like: `9002-firebase-studio-123.cluster-xyz.cloudworkstations.dev`.

### 2. Allow Popups
**Important**: Cloud Workstations block popups by default. 
- Look for a "blocked popup" icon in your browser's address bar (usually on the far right).
- Click it and select **"Always allow popups from..."**.

## 🔗 How to get your Public Link
To get a link for everyone else (Production):
1. Click the **"Deploy"** button in the Firebase Studio sidebar.
2. Once finished, you will get a **Production URL** (e.g., `https://your-app.web.app`).
3. **Important**: You must also add this Production URL to the "Authorized Domains" list mentioned above!

## 🚀 How to Install as an App (FREE)
1. Open your **Production URL** in your phone's browser (Chrome for Android, Safari for iOS).
2. Tap the menu/share button and select **"Add to Home Screen"**.
3. The app will now appear on your home screen with its own icon. No APK required!
