
# SmartKharcha AI - Installation & Configuration Guide 📱

Your app is ready! Follow these steps to fix the login issues and share your app.

## 🛠 CRITICAL: Fix "Login Issue" (One-time Setup)
Firebase blocks requests from unknown domains for security. You must authorize your current development domain.

### 1. Find the "Add Domain" Button
1. Copy the URL of your app from the browser address bar (e.g., `9002-firebase-studio...cloudworkstations.dev`).
2. Click this link: [Firebase Console Authentication Settings](https://console.firebase.google.com/project/studio-4253837572-72734/authentication/settings).
3. **Navigation Path**:
   - Go to the **Settings** tab.
   - Click on **Authorized domains** in the left menu.
   - Click the **"Add domain"** button.

### 2. Add Your URL
1. Click **"Add domain"**.
2. Paste your URL (e.g., `9002-firebase-studio-123.cluster-xyz.cloudworkstations.dev`).
3. **IMPORTANT**: Remove `https://` and anything after `.dev`. It should look exactly like the example above.

## 🚀 How to Install as an App (FREE)
1. Open your **Preview URL** in your phone's browser (Chrome for Android, Safari for iOS).
2. Tap the menu/share button and select **"Add to Home Screen"**.
3. The app will now appear on your home screen with its own icon. No APK required!

## 🔗 Getting a Public Link
1. Click the **"Deploy"** button in the Firebase Studio sidebar.
2. Once finished, you will get a **Production URL**.
3. **Remember**: You must also add this Production URL to the "Authorized Domains" list mentioned above!
