
# SmartKharcha AI - Expense Tracker

A production-ready, AI-powered expense tracker built with Next.js, Firebase, and Gemini.

## 🚀 Getting Started

To launch your production environment, follow these final steps:

1. **Enable Google Sign-In**: 
   - Go to [Firebase Console](https://console.firebase.google.com/).
   - Section: **Authentication** > **Sign-in method**.
   - Enable **Google**.

2. **Authorize Your Domain**:
   - In Firebase Auth settings, go to **Settings** > **Authorized Domains**.
   - Add your current workstation URL (e.g., `*.cloudworkstations.dev`) or your custom domain.

3. **Enjoy AI-Driven Finance**:
   - **Text Entry**: "Spent 500 for lunch".
   - **Voice Entry**: "Petrol 2000 rupees".
   - **Bill Scan**: Upload any receipt and let Gemini handle the rest.

## 📦 Tech Stack
- **Next.js 15** (App Router)
- **Firebase Firestore** & **Auth**
- **Genkit** with **Google Gemini 1.5 Flash**
- **ShadCN UI** & **Tailwind CSS**
