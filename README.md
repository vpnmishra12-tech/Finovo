
# SmartKharcha AI - Login Fixes 📱

Agar aapko login mein problem aa rahi hai, toh neeche diye gaye solution ko follow karein:

## 🚀 Solution 1: Guest Mode (Fastest)
Aap landing page par **"Try Guest Mode"** button ka use karke bina OTP ke app mein enter kar sakte hain. Ye sabse asaan tareeka hai app ko check karne ka.

## 🛠 Solution 2: Fix Phone Auth (Billing Issue)
Agar aapko `auth/billing-not-enabled` error aa raha hai, toh iska matlab hai ki aapke Firebase Project par **"Blaze Plan"** enabled nahi hai. SMS bhejne ke liye Firebase billing mangta hai.

**Steps to Fix:**
1. [Firebase Console](https://console.firebase.google.com/project/_/usage/details) par jayein.
2. "Modify Plan" par click karke use **Blaze** par switch karein.
3. Iske baad OTP SMS aana shuru ho jayega.

## ⚠️ OTP Nahi Aa Raha?
1. Hamesha `+91` laga kar apna 10-digit number daalein.
2. Check karein ki Firebase Console mein "Phone" provider **Enabled** hai aur niche **Save** button click kiya gaya hai.

---
*SmartKharcha AI - Track your expenses with the power of AI.*
