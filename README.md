
# SmartKharcha AI - Installation & Configuration Guide 📱

Your app is ready! Follow these steps to fix the login issues and share your app.

## 🛠 CRITICAL: Fix "Login Issue" (One-time Setup)
If you see a login error, it is because Firebase blocks requests from unknown domains.
1. Copy the URL of your app (e.g., `https://9002-firebase-studio...cloudworkstations.dev`).
2. Go to the [Firebase Console](https://console.firebase.google.com/).
3. Select your project: **studio-4253837572-72734**.
4. Go to **Build > Authentication > Settings > Authorized Domains**.
5. Click **"Add Domain"** and paste your URL (remove everything after `.dev`).
6. Also, go to the **Sign-in method** tab and ensure **Google** is enabled.

## 🔗 How to get your Public Link
The current link is a **Private Preview Link**. To get a link for everyone else:
1. Click the **"Deploy"** button in the Firebase Studio sidebar.
2. Once finished, you will get a **Production URL** (e.g., `https://your-app.web.app`).
3. **Important**: You must also add this Production URL to the "Authorized Domains" list mentioned above!

## 🚀 How to Install as an App (FREE)
1. Open your **Production URL** in your phone's browser (Chrome for Android, Safari for iOS).
2. Tap the menu/share button and select **"Add to Home Screen"**.
3. The app will now appear on your home screen with its own icon.

## ✨ Features
- **AI Text Entry**: "Spent 500 on dinner".
- **AI Voice Entry**: Speak your expenses naturally.
- **Bill Scanning**: Upload a photo of any receipt.
- **Budget Tracking**: Set and monitor monthly limits.
