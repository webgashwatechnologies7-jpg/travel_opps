# Firebase Push Notification – Step by Step Fix

## Aap abhi kahan ho
Firebase Console → CRMTravel project → Project Overview / Home page.

---

## Step 1: Cloud Messaging kholna (VAPID key ke liye)

1. **Left sidebar** mein neeche dekho – **"Build"** section hona chahiye (icon ke saath).
2. **"Build"** par **click** karo – dropdown open hoga.
3. List mein **"Cloud Messaging"** ya **"Messaging"** par click karo.
4. Neeche scroll karo – **"Web configuration"** ya **"Web Push certificates"** section dhundo.
5. **"Generate key pair"** (ya "Create certificate") click karo.
6. Jo **public key** dikhe (lambi string) – use **Copy** karo.
7. Ye key **frontend** ke liye hai (next step mein use karenge).

**Agar "Build" left side nahi dikh raha:**  
- Top-right **gear icon** ⚙️ click karo → **Project settings**.  
- **"Cloud Messaging"** tab ya **"General"** tab mein "Your apps" ke paas koi "Web Push" / certificate option ho to wahan bhi key mil sakti hai.

---

## Step 2: Service Account key (backend ke liye)

1. Top-right **gear icon** ⚙️ click karo → **Project settings**.
2. Upar **"Service accounts"** tab par jao.
3. Neeche **"Generate new private key"** button → click karo → **"Generate key"** confirm karo.
4. Ek **JSON file** download hogi – ise save karo, e.g.  
   `c:\wamp64\www\latest_crm\travel_opps\backend\storage\app\crmtravel-firebase-key.json`
5. Ye file **backend** ke liye hai (Step 4 mein path use karenge).

---

## Step 3: Frontend .env fix karo

1. Project mein **`frontend/.env`** file kholo.
2. Neeche diye lines add karo ya update karo (apni values se):

```env
# API (jo pehle se hai)
VITE_API_URL=http://127.0.0.1:8000/api

# Firebase – Web app config (Firebase Console se)
VITE_FIREBASE_API_KEY=AIzaSyB-lsEmete8rxzDOnldT_CjnPpwhaPWwq4
VITE_FIREBASE_AUTH_DOMAIN=crmtravel-f2647.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=crmtravel-f2647
VITE_FIREBASE_STORAGE_BUCKET=crmtravel-f2647.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=109537255789
VITE_FIREBASE_APP_ID=1:109537255789:web:df16fb58cad067fd743a64

# Step 1 mein jo public key copy ki – yahan paste karo (bina spaces)
VITE_FIREBASE_VAPID_KEY=BHxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

3. **Save** karo.  
4. **VAPID key** bilkul wahi paste karo jo Step 1 mein copy ki thi.

---

## Step 4: Backend .env fix karo

1. **`backend/.env`** file kholo.
2. Neeche diye lines add karo (JSON file ka path apne hisaab se change karo):

```env
# FCM – Push notifications (Step 2 ki JSON file ka full path)
FCM_PROJECT_ID=crmtravel-f2647
FCM_SERVICE_ACCOUNT_JSON_PATH=c:\wamp64\www\latest_crm\travel_opps\backend\storage\app\crmtravel-firebase-key.json
```

3. **Path check karo:** `crmtravel-firebase-key.json` jahan save ki, wahi path `FCM_SERVICE_ACCOUNT_JSON_PATH` mein hona chahiye.
4. **Save** karo.

---

## Step 5: Cloud Messaging API enable karo (Google Cloud)

1. Browser mein ye link kholo: https://console.cloud.google.com/
2. Upar **project dropdown** se **"CRMTravel"** / **crmtravel-f2647** select karo.
3. Left menu → **APIs & Services** → **Library**.
4. Search: **"Firebase Cloud Messaging API"**.
5. **Enable** click karo (agar pehle se enabled hai to skip karo).

---

## Step 6: App restart + test

1. **Frontend** terminal mein:
   - Server band karo (Ctrl+C).
   - Phir: `npm run dev`
2. **Backend** chal raha ho (e.g. `php artisan serve` on port 8000).
3. Browser mein app kholo: `http://gashwa.localhost:3000` (ya jo URL use karte ho).
4. **Logout** karo (agar login ho).
5. Dubara **Login** karo.
6. Jab **"Allow" notifications** ka prompt aaye → **Allow** click karo.
7. **Settings** page par jao → **"Send test notification"** click karo.

Ab push aani chahiye; agar response mein phir bhi **"No push tokens available"** aaye to browser console (F12 → Console) check karo – koi error dikhe to usko bhej dena.

---

## Quick checklist

| Step | Kya kiya        | Done? |
|------|-----------------|-------|
| 1    | VAPID key copy  | ☐     |
| 2    | Service Account JSON download | ☐     |
| 3    | Frontend .env (VAPID + Firebase config) | ☐     |
| 4    | Backend .env (FCM_PROJECT_ID + JSON path) | ☐     |
| 5    | FCM API enable (Google Cloud) | ☐     |
| 6    | Restart + logout/login + Allow + Test  | ☐     |

---

## Agar "Build" / "Cloud Messaging" nahi dikhe

- **Engage** section check karo → andar **Messaging** / **Campaigns** hota hai.
- Ya **Project settings** (gear) → **General** tab → neeche "Your apps" → apni **Web app (Travel CRM)** select karo – wahan bhi Cloud Messaging / Web Push link ho sakta hai.
