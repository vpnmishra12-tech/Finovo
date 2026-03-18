
# SmartKharcha AI - Play Store Publishing Guide

A production-ready, AI-powered expense tracker built with Next.js, Firebase, and Gemini.

## 🚀 How to Publish to Google Play Store

Follow these steps to convert this web app into an Android App (.aab) for the Play Store:

1. **Deploy the App**: 
   - Deploy your app to a public URL (e.g., using Firebase App Hosting).
   - Ensure your domain is HTTPS.

2. **Use PWABuilder**:
   - Go to [PWABuilder.com](https://www.pwabuilder.com/).
   - Enter your deployed URL.
   - Click "Package for Stores" and select **Android**.
   - This will generate a `.aab` (Android App Bundle) file.

3. **Google Play Console**:
   - Create a developer account on [Google Play Console](https://play.google.com/console).
   - Create a new app and upload the `.aab` file generated in step 2.

4. **Digital Asset Links**:
   - To remove the browser address bar in your app, you must link your website and app.
   - Follow the instructions in PWABuilder to generate the `assetlinks.json` file.
   - Place this file at `public/.well-known/assetlinks.json`.

## 📱 Mobile Installation (PWA)
If you don't want to use the Play Store, users can still install it:
1. Open the app link in **Chrome** (Android).
2. Tap the 3 dots menu > **"Install App"**.

## 📦 Tech Stack
- **Next.js 15** (App Router)
- **Firebase Firestore** & **Auth**
- **Genkit** with **Google Gemini 1.5 Flash**
- **ShadCN UI** & **Tailwind CSS**
