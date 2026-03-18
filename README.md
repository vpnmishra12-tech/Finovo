
# SmartKharcha AI - Phone Login Instructions 📱

Humne login ko **Phone Number (OTP)** par shift kar diya hai taaki Google login ke cookie/popup issues se peecha chhuta ja sake.

## 🛠 Step 1: Phone Auth Enable Karein (Zaroori)

App tabhi kaam karegi jab aap Firebase Console mein ise enable karenge:

1. [Firebase Console](https://console.firebase.google.com/project/studio-4253837572-72734/authentication/providers) par jaiye.
2. **"Add new provider"** par click karein.
3. **"Phone"** select karein.
4. Top right mein **"Enable"** toggle ko ON karein.
5. **Save** par click karein.

## 📱 Step 2: Login Kaise Karein

1. App ke landing page par apna mobile number daalein (Jaise: `+91 9876543210`).
2. **"Send OTP"** par click karein.
3. Aapke phone par ek 6-digit ka SMS aayega (Kabhi kabhi Invisible Recaptcha verification ke liye ek-do second lagte hain).
4. Code daalein aur **"Verify & Login"** click karein.

## ⚠️ Troubleshooting

- **OTP nahi aa raha?** Check karein ki aapne Firebase mein Phone Auth enable kiya hai (Step 1).
- **Recaptcha Error?** Page ko refresh karein aur check karein ki aapka internet sahi chal raha hai.
- **Unauthorized Domain?** Check karein ki aapka domain `Authorized domains` list mein added hai (pichhle steps ki tarah).
