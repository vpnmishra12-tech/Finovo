
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
3. Aapke phone par ek 6-digit ka SMS aayega (Recaptcha verification ke liye 1-2 second lag sakte hain).
4. Code daalein aur **"Verify & Login"** click karein.

## ⚠️ Troubleshooting

- **Error: auth/operation-not-allowed?** Iska matlab hai ki aapne Step 1 (Phone Auth enable karna) nahi kiya hai. 
- **Recaptcha Error?** Page ko refresh karein.
- **OTP nahi aa raha?** Check karein ki number sahi format mein hai (+91...).
