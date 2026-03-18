
# SmartKharcha AI - Expense Tracker

This is a fully functional, AI-powered expense tracker built with Next.js, Firebase, and Genkit.

## 🚀 Key Features

- **Smart Dashboard**: Real-time spending visualization with Recharts.
- **AI Text Entry**: Type natural sentences and Gemini will extract details.
- **Voice Commands**: Integrated speech recognition with AI parsing.
- **Bill Scanning**: Vision-powered receipt extraction using Gemini 1.5 Flash.
- **Bilingual**: Full support for English and Hindi.

## 🛠️ Next Steps for Development

### 1. Enable Real Google Sign-In
Currently, the app is in **Demo Mode** for preview. To enable real security:
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Enable **Google Auth Provider**.
3. Add your current preview domain (e.g., `*.cloudworkstations.dev`) to **Authorized Domains** in Auth Settings.
4. Remove the `"demo-user-id"` fallback in `src/app/page.tsx`.

### 2. Testing the AI
To test the bill scan:
1. Click the `+` button in the preview.
2. Go to the **Camera** tab.
3. Upload a sample receipt image (JPEG/PNG).
4. Watch Gemini extract the merchant name, amount, and category.

### 3. Deployment
This app is ready for **Firebase App Hosting**. 
- Push your code to a GitHub repository.
- Connect the repository to Firebase App Hosting in the console.
- It will automatically build and deploy your Next.js 15 app.

## 📦 Tech Stack
- **Framework**: Next.js 15 (App Router)
- **Database**: Firebase Firestore
- **Auth**: Firebase Authentication
- **AI**: Genkit with Google Gemini 1.5 Flash
- **UI**: ShadCN UI + Tailwind CSS
