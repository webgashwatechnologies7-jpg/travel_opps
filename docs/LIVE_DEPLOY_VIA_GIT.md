# Live Deploy via Git (Local → Git → Live VPS)

Yeh flow use karein: pehle local code Git pe push, phir live server pe pull. Live ka **.env** aur **permissions** replace nahi honge.

---

## Step 1: Local se Git pe push

Apne **local machine** (Windows) pe project folder mein:

```bash
cd c:\wamp64\www\latest_crm\travel_opps

# Status check
git status

# Saari changes add karein (jo .gitignore mein nahi hain)
git add .

# Commit
git commit -m "Latest code: cleanup, fixes, ready for live"

# Remote check (pehli baar agar add nahi kiya to)
# git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git

# Push (branch name apna dekhein: main ya master)
git push origin main
```

Agar aapka branch `master` hai to: `git push origin master`

---

## Step 2: Live server pe SSH

Hostinger VPS pe connect karein:

```bash
ssh root@145.223.23.45
```

Password ya SSH key se login hoga.

---

## Step 3: Live pe deploy (pull + build, .env safe)

Server pe project ka path pehle se pata karein (jaise `/var/www/html/travel_opps` ya `/var/www/crm_project`). Phir wahi path pe jaake ye script run karein.

**Option A – Script use karein (recommended)**

1. Local se script server pe copy karein ya server pe direct banao.
2. Server pe script run karein (neeche `deploy-live-pull.sh` diya hai).

**Option B – Commands manually chalayein**

Project folder mein jaake:

```bash
cd /var/www/html/travel_opps   # ya jahan app hai woh path

# .env backup (safety)
cp backend/.env backend/.env.backup.$(date +%Y%m%d)

# Git pull (sirf code update, .env git mein hota hi nahi)
git pull origin main

# Backend
cd backend
composer install --no-dev --optimize-autoloader
# .env mat chhedo – pehle se set hai
php artisan config:cache
php artisan route:cache
cd ..

# Frontend build
cd frontend
npm ci
npm run build
cd ..

# Permissions (Laravel storage + cache)
chown -R www-data:www-data .
chmod -R 775 backend/storage backend/bootstrap/cache
```

Is se:
- Sirf code update hoga (Git se).
- **.env replace nahi hoga** (git mein hota hi nahi, aur aap overwrite nahi kar rahe).
- **Permissions** dobara set ho jayenge (storage/cache writable rahenge).

---

## Important points

| Cheez          | Kya karein |
|----------------|------------|
| **.env**       | Git pull se change nahi hota (.env gitignore mein hai). Server pe jo .env hai wahi rahegi. Sirf zarurat ho to manually edit karein. |
| **Permissions**| Deploy ke baad `chmod 775 backend/storage backend/bootstrap/cache` aur `chown www-data:www-data` run karein (jaise upar diya). |
| **Removed code**| Jo bhi cleanup local pe kiya hai, woh Git push mein jaata hai; live pe pull karoge to wahi latest code aayega. |

---

## Agar pehli baar server pe clone karna ho

Agar abhi server pe repo clone nahi hai:

```bash
cd /var/www/html
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git travel_opps
cd travel_opps
# Ab backend/.env manually banao (live DB, APP_KEY, etc.) ya server pe pehle se bani copy karke rakh do
# Phir upar wale backend/frontend + permissions wale steps run karein
```

---

## Short checklist

1. Local: `git add .` → `git commit -m "..."` → `git push origin main`
2. Live: SSH → project folder → run `deploy-live-pull.sh` **ya** manually wale commands
3. .env: kuch mat karo, wahi rahegi
4. Permissions: script/commands se set ho jayenge
