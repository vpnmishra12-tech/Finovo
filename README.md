# SmartKharcha AI - Expense Tracker

This is a fully functional, AI-powered expense tracker built with Next.js, Firebase, and Genkit.

## How to Enable Real Google Sign-In

Currently, the app is in **Demo Mode** to allow immediate preview. To enable real Google Authentication, follow these steps:

1. **Enable Google Provider**:
   - Go to the [Firebase Console](https://console.firebase.google.com/).
   - Select your project.
   - Go to **Build > Authentication > Sign-in method**.
   - Click **Add new provider** and select **Google**. Enable it and save.

2. **Authorize the Workstation Domain**:
   - In the same **Authentication** section, click on the **Settings** tab.
   - Click on **Authorized domains**.
   - Add the domain of your current preview (e.g., `*.cloudworkstations.dev`).

3. **Re-enable Login Check**:
   - In `src/app/page.tsx`, you can remove the `demo-user-id` fallback logic to force users to sign in.

## Features

- **AI Text Entry**: Type "Lunch for 500" and let Gemini categorize it.
- **Voice Commands**: Tap the mic and speak your expense.
- **Bill Scanning**: Take a photo of a receipt to extract the merchant and amount automatically.
- **Monthly Budgeting**: Set a goal and track your progress in real-time.
