
# SmartKharcha AI - Phone Login Instructions 📱

Humne login ko **Phone Number (OTP)** par shift kar diya hai taaki Google login ke cookie/popup issues se peecha chhuta ja sake.

## 🛠 Step 1: Firebase Console mein Save karein (Zaroori)

Aapne toggle ON kar diya hai, ab use save karna zaroori hai:

1. [Firebase Console](https://console.firebase.google.com/project/studio-4253837572-72734/authentication/providers) par "Phone" provider ke andar niche jaakar **"Save"** button dabayein.
2. Bina Save kiye Phone Auth kaam nahi karega.

## 📱 Step 2: Login Kaise Karein

1. App ke landing page par apna mobile number daalein.
2. **Format:** Hamesha `+91` lagayein (Jaise: `+91 9876543210`).
3. **"Send OTP"** par click karein.
4. Aapke phone par ek 6-digit ka SMS aayega.
5. Code daalein aur **"Verify & Login"** click karein.

## ⚠️ Troubleshooting

- **Error: auth/operation-not-allowed?** Iska matlab hai ki aapne Step 1 mein "Save" button nahi dabaya hai. 
- **Recaptcha Verification?** Mobile par OTP bhejne se pehle ek chhota sa box (I am not a robot) dikh sakta hai, use tick karein.
- **OTP nahi aa raha?** Check karein ki phone number bilkul sahi hai aur network full hai.
