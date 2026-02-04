# Push Notifications Setup (FCM)

Push notifications use **Firebase Cloud Messaging (FCM)**. New Firebase projects require the **HTTP v1 API** (legacy server key is deprecated).

## 1. Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/) and select your project (or create one).
2. **Project Settings** (gear) → **General** → under "Your apps" add a **Web app** if not already added. Note:
   - **Project ID**
   - **App ID**
   - **API Key** (optional for backend; needed for frontend)
   - **Messaging sender ID** (for frontend)
3. **Project Settings** → **Service Accounts** → **Generate new private key**. Download the JSON file. This is used by the **backend** for FCM v1.
4. **Project Settings** → **Cloud Messaging** (or **Cloud Messaging API (Legacy)** for old key). For **Web Push**, you need a **Web Push certificate** (VAPID key pair). Firebase sometimes shows it under "Web configuration" or you can generate one (e.g. with `web-push generate-vapid-keys` or in Cloud Messaging → Web Push certificates). Put the **public** VAPID key in the frontend.

## 2. Backend (.env)

Add to `backend/.env`:

```env
# FCM HTTP v1 (recommended for new projects)
FCM_PROJECT_ID=your-firebase-project-id
FCM_SERVICE_ACCOUNT_JSON_PATH=/absolute/path/to/your-service-account.json

# Optional: Legacy FCM (only if your project still has a server key)
# FCM_SERVER_KEY=your-legacy-server-key
```

- `FCM_SERVICE_ACCOUNT_JSON_PATH` must be the **absolute path** to the JSON file you downloaded (e.g. `C:\path\to\firebase-service-account.json` or `/var/www/credentials/firebase.json`).
- Do **not** commit the JSON file or `.env` to git.

## 3. Frontend (.env)

Add to `frontend/.env`:

```env
# Firebase config (from Firebase Console → Project Settings → Your apps → Web app)
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id

# Required for web push (from Firebase Cloud Messaging → Web Push certificates, or generate VAPID key pair)
VITE_FIREBASE_VAPID_KEY=your-vapid-public-key
```

- All `VITE_` variables are embedded in the frontend build; they are **public** (not secret). The secret is only the backend service account JSON.

## 4. Enable Cloud Messaging API

In [Google Cloud Console](https://console.cloud.google.com/) for the same project:

- **APIs & Services** → **Enable APIs** → enable **Firebase Cloud Messaging API** (or "Cloud Messaging API").

## 5. Test

1. Log in to the CRM in the browser and allow notifications when prompted.
2. Go to **Settings** and click **Send test notification**. You should receive a push (check system tray or browser when tab is in background).
3. Assign a lead to another user (who has allowed notifications); they should get a "New lead assigned to you" push.

## 6. Troubleshooting

- **"FCM not configured"**  
  Backend: set `FCM_PROJECT_ID` and `FCM_SERVICE_ACCOUNT_JSON_PATH` and ensure the JSON file path is correct and readable.

- **"missing_vapid_key"** (frontend)  
  Add `VITE_FIREBASE_VAPID_KEY` to `frontend/.env` and rebuild. Generate a key with:  
  `npx web-push generate-vapid-keys` (install with `npm i -g web-push` if needed). Use the **public** key.

- **No notification when tab is closed**  
  The service worker (`firebase-messaging-sw.js`) must be at the site root and HTTPS (or localhost). Check browser DevTools → Application → Service Workers.

- **Legacy FCM (server key) not working**  
  New Firebase projects often don’t have a legacy server key. Use FCM v1 with the service account JSON as above.
