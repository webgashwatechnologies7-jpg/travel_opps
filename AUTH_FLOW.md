# Login / Logout – Auth Flow (JWT nahi, Laravel Sanctum)

## Kya use ho raha hai?

**JWT (JSON Web Token) use nahi ho raha.**  
Auth **Laravel Sanctum** se chal raha hai – **API token** (plain token), JWT nahi.

---

## Flow in short

| Step | Kya hota hai |
|------|----------------|
| **Login** | Frontend `POST /api/auth/login` (email, password) bhejta hai. Backend **Sanctum** se `$user->createToken('auth-token')->plainTextToken` banata hai aur woh token + user object response mein bhejta hai. |
| **Token store** | Frontend response se `token` aur `user` leta hai, **localStorage** mein save karta hai: `auth_token` aur `user`. |
| **Har API call** | Frontend har request mein header bhejta hai: `Authorization: Bearer <auth_token>`. |
| **Backend auth** | Routes par `auth:sanctum` lagta hai. Sanctum is token ko **database** (`personal_access_tokens` table) se verify karta hai – JWT decode nahi hota. |
| **Logout** | Frontend `POST /api/auth/logout` call karta hai (Bearer token ke saath). Backend current token revoke karta hai. Phir frontend `localStorage` se `auth_token` aur `user` hata deta hai. |

---

## Code references

- **Backend token create:** `AuthController@login` → `$user->createToken('auth-token')->plainTextToken`
- **Backend model:** `User` model mein `HasApiTokens` (Sanctum) use hota hai
- **Frontend token save:** `AuthContext.jsx` → `localStorage.setItem('auth_token', token)`
- **Frontend token bhejna:** `api.js` → `config.headers.Authorization = 'Bearer ' + token`
- **Protected routes:** `ProtectedRoute.jsx` → `user` nahi hai to `/login` par redirect

---

## Seda login page par kyon pohonch sakte ho?

1. **localStorage empty** – Incognito / naya browser / clear storage → token nahi milta → `user` null → redirect to login.
2. **Token expire / revoke** – Backend ne token delete kar diya ya invalid ho gaya → koi API call 401 dega → frontend `auth_token` + `user` clear karke login par bhej deta hai (`api.js` interceptor).
3. **429 Too Many Attempts** – Pehle rate limit 60/min tha; dashboard par kaafi requests lagte hain → 429 aata tha. Ab 180/min kar diya hai taaki normal use mein 429 na aaye.

---

## Summary

| Cheez | Is project mein |
|-------|------------------|
| **Token type** | Laravel Sanctum API token (database token), **not JWT** |
| **Token kahan** | `localStorage` → `auth_token` |
| **Header** | `Authorization: Bearer <auth_token>` |
| **Login redirect** | `user` nahi (localStorage se) ya API 401 → `/login` |
