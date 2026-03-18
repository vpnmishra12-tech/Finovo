
# SmartKharcha AI - Phone Login Instructions 📱

Humne login ko **Phone Number (OTP)** par shift kar diya hai. Agar aapko `auth/operation-not-allowed` error aa raha hai, toh iska matlab hai ki configuration incomplete hai.

## 🛠 Step 1: Firebase Console mein Activation (Zaroori)

1. [Firebase Console](https://console.firebase.google.com/project/studio-4253837572-72734/authentication/providers) par "Phone" provider ko edit karein.
2. Toggle ko **ON** karein.
3. **IMP:** Screen par sabse niche ek blue color ka **"Save"** ya **"Done"** button hoga. Agar nahi dikh raha, toh browser ko full-screen karein ya card ko niche scroll karein. Us button ko click karna **zaroori** hai.
4. Bina Save kiye Phone Auth kaam nahi karega.

## 📱 Step 2: App mein Login Kaise Karein

1. App ke landing page par apna number daalein.
2. **Format:** Hamesha `+91` laga hona chahiye (Jaise: `+91 9876543210`). Bina prefix ke OTP nahi jayega.
3. **"Send OTP"** par click karein.
4. Aapke phone par ek 6-digit ka SMS aayega.
5. Code daalein aur **"Verify & Login"** click karein.

## ⚠️ Troubleshooting

- **Error: Operation Not Allowed?** Iska matlab Step 1 (Save button) miss ho gaya hai. Dobara check karein.
- **Recaptcha?** Mobile par OTP bhejne se pehle browser ek chhota sa "I am not a robot" check kar sakta hai, use tick karein.
- **OTP nahi aa raha?** Phone number bilkul sahi country code (+91) ke saath daalein.
