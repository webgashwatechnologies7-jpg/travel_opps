# Mail / Send Test Mail – Debug Guide

Jab **Send Test Mail** pe "Server Error" ya koi error aaye, ye steps follow karein.

---

## 1. Popup / UI mein actual error dekhen

- Ab test fail hone par **popup** mein backend ka **actual error message** aana chahiye (e.g. SMTP connection failed, certificate error, etc.).
- Agar ab bhi sirf "Server Error" dikhe to neeche wale steps se debug karein.

---

## 2. Laravel log check karein

Backend server pe:

```bash
cd backend
tail -100 storage/logs/laravel.log
```

Ya latest log file open karein: `backend/storage/logs/laravel.log`.  
Mail test ke time jo exception aati hai, uski full message aur stack trace yahan hoti hai.

---

## 3. Temporary: APP_DEBUG=true (sirf debug ke liye)

`.env` mein:

```env
APP_DEBUG=true
```

Phir **Send Test Mail** dubara chalaen. Browser **Network** tab → **test** request → **Preview/Response** mein ab full error + stack trace dikh sakta hai.  
Debug ho jane ke baad **APP_DEBUG=false** kar dena.

---

## 4. Common errors

| Error | Meaning | Fix |
|-------|--------|-----|
| `Target class [tenant] does not exist` | Tenant not bound | Already fixed – ensure `AppServiceProvider` registers `tenant`. |
| `Peer certificate CN ... did not match` | SSL/TLS certificate mismatch | `.env` mein `MAIL_VERIFY_PEER=false` set karein (live pe). |
| `SMTP connection failed` | Host/port unreachable | Firewall, host/port (e.g. smtp.gmail.com:587), TLS check karein. |
| `Authentication failed` / 535 | Wrong username/password | Gmail ke liye **App Password** use karein, normal password nahi. |
| `Server Error` (generic) | Koi uncaught exception | Step 2 (logs) ya Step 3 (APP_DEBUG) se exact error dekhen. |

---

## 5. Backend ab error return karta hai

`CompanyMailSettingsController::test()` ab **saari exceptions** catch karke response mein **actual error message** bhejta hai.  
Isse frontend popup mein real reason dikhna chahiye; agar nahi dikhe to Laravel log (Step 2) zaroor dekhen.
