# Deploying the security update to the Oracle VM

Run these on the server (`ssh ubuntu@130.61.242.26`). Each step prints what it changes. Stop and check if any output looks wrong.

## 1. Find the app and the web root

```bash
sudo grep -RnE "root |proxy_pass" /etc/nginx/sites-enabled/
pm2 describe tuc-badminton-api | grep -E "exec cwd|script path"
```

Note two paths: the backend folder (`exec cwd`, e.g. `~/tuc-badminton-website/backend`) and the Nginx `root` (the built frontend). Below they are `APP=~/tuc-badminton-website` and `WEB_ROOT=/var/www/tuc-badminton`. Replace them with your paths.

## 2. Back up the live database

The commit removes the database from git. Without a backup, `git pull` would delete the live database.

```bash
APP=~/tuc-badminton-website
mkdir -p ~/backups
cp "$APP/backend/data/badminton_community.db" ~/backups/badminton_community_$(date +%F_%H%M).db
ls -la ~/backups
```

## 3. Update the code and put the database back

```bash
cd "$APP"
git status --short            # should list only the .db files; anything else, stop and check first
git fetch origin
git reset --hard origin/main  # takes the new code; this removes the tracked .db file
cp "$(ls -t ~/backups/badminton_community_*.db | head -1)" backend/data/badminton_community.db
git status --short            # the .db is now ignored and must not show up
```

## 4. Clean up backend/.env

```bash
nano "$APP/backend/.env"
```

- Delete the line `ADMIN_MASTER_RECOVERY_KEY=TUC-MASTER-ADMIN-KEY-2026` (that key is public). The code now rejects it anyway. If you want a recovery key, generate a new one: `node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"`.
- Set `ALLOWED_ORIGINS=https://gandupradeep2026.github.io` (or leave it out: same-origin requests always work).

## 5. Build the frontend and restart the backend

```bash
cd "$APP/backend" && npm ci --omit=dev
cd "$APP/frontend" && npm ci && npm run build
sudo rsync -a --delete "$APP/frontend/dist/" /var/www/tuc-badminton/
pm2 restart tuc-badminton-api --update-env
```

## 6. Nginx: compression, security headers, real 404s

```bash
sudo cp /etc/nginx/sites-enabled/* ~/backups/                       # keep the old config
sudo cp "$APP/deploy/nginx/tuc-security-headers.conf" /etc/nginx/snippets/
sudo cp "$APP/deploy/nginx/tuc-badminton.conf" /etc/nginx/sites-available/tuc-badminton
sudo nano /etc/nginx/sites-available/tuc-badminton               # set root to your WEB_ROOT, check the certificate paths
sudo rm /etc/nginx/sites-enabled/*                                   # remove the old site link(s)
sudo ln -s /etc/nginx/sites-available/tuc-badminton /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

If `nginx -t` fails, restore the old config from `~/backups` and reload.

## 7. Change the admin password at once

The old admin password hash was public in the repository. Log in at `#admin` and change the password in the settings tab to a new one you have never used.

## 8. Check

```bash
U=https://130-61-242-26.sslip.io
curl -sI $U/ | grep -iE "strict-transport|content-security|x-frame|server:"
curl -sI -H "Accept-Encoding: gzip" $U/assets/$(ls /var/www/tuc-badminton/assets | grep -m1 '^vendor-.*\.js$') | grep -i content-encoding
curl -s -o /dev/null -w "%{http_code}\n" $U/does-not-exist                                    # 404
curl -s -o /dev/null -w "%{http_code}\n" -H "x-admin-token: tuc-admin-session-1" $U/api/admin/registrations   # 401
curl -s -o /dev/null -w "%{http_code}\n" $U/api/registrations                                 # 401
```
