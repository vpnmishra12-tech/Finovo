
# SmartKharcha AI - Installation & Configuration Guide 📱

Your app is ready! To fix the login issue, you MUST perform this one-time security configuration in the Firebase Console.

## 🛠 CRITICAL: Fix "Login Issue" (One-time Setup)

Firebase blocks requests from unknown domains for security. You must authorize your current development domain.

### 1. Copy your App URL
Look at your browser's address bar. Your URL looks like this:
`https://9002-firebase-studio-123.cluster-abc.cloudworkstations.dev/`

**Copy ONLY this part**: `9002-firebase-studio-123.cluster-abc.cloudworkstations.dev`
(Remove `https://` and anything after `.dev`)

### 2. Add it to Firebase Console
1. Click this direct link: [Authorized Domains Settings](https://console.firebase.google.com/project/studio-4253837572-72734/authentication/settings)
2. **Navigation Path**:
   - Make sure you are on the **Settings** tab.
   - Click **"Authorized domains"** in the left sidebar menu.
   - Click the **"Add domain"** button.
3. **Paste the URL** you copied in Step 1.
4. Click **"Add"**.

### 3. Restart the App
Go back to your app tab, **Refresh the page**, and click **Login**. It will now work!

---

## 🚀 How to Install as an App (FREE)
1. Open your **Preview URL** in your phone's browser (Chrome for Android, Safari for iOS).
2. Tap the menu/share button and select **"Add to Home Screen"**.
3. The app will now appear on your home screen with its own icon. No APK required!

## 🔗 Getting a Public Link
1. Click the **"Deploy"** button in the Firebase Studio sidebar.
2. Once finished, you will get a **Production URL**.
3. **Remember**: You must also add this Production URL to the "Authorized Domains" list mentioned above!
