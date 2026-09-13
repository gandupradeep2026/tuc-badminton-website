# 🏸 TU Chemnitz Badminton Community Portal (v2.0 Decoupled Architecture)

A high-performance, athletic web application for the **Technische Universität Chemnitz (TUC)** Badminton Community & Hochschulsport (USZ).

---

## 🏛️ Architecture Overview

The system is decoupled into a static frontend designed for continuous deployment to GitHub Pages and a self-contained home server backend running on the owner's laptop:

```
                                  ┌────────────────────────────────────────┐
                                  │             GitHub Pages               │
                                  │   https://gandupradeep2026.github.io   │
                                  │        /tuc-badminton-website/         │
                                  └───────────────────┬────────────────────┘
                                                      │
                                    Outbound Secure   │ REST API &
                                    Tunnel (HTTPS)    │ Media Requests
                                                      ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                      Laptop Home Server (Port 5000)                      │
│                                                                          │
│   • Node.js & Express API (backend/server.js)                            │
│   • SQLite Database (backend/data/badminton_community.db)                │
│   • Media & Tournament PDF Storage (backend/uploads/)                    │
│   • Tunnel integration: Cloudflare Tunnel (cloudflared) or localtunnel   │
│   • Strict Admin Security: Salted Scrypt + 6-digit OTP Approval Codes   │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 🔒 Security Hardening: Admin Password Reset Workflow

1. **No Client-Side Token Leakage**:
   - `/api/admin/forgot-password` **never** returns reset tokens or reset links in the HTTP response.
2. **Two-Step Approval Required**:
   - When a password reset is requested for `gandupradeep2026@gmail.com`, a cryptographically secure **6-digit numeric OTP** (`approval_code`) is generated with a strict 15-minute expiration.
   - The code is dispatched to the admin's email via Nodemailer (if SMTP is configured) and simultaneously printed in bold to the **laptop's secure server console**.
   - No one on the internet can change the admin password without this 6-digit code!
3. **Master Emergency Recovery Key**:
   - The owner can use `ADMIN_MASTER_RECOVERY_KEY` (configured in `backend/.env`) in the reset modal as a failsafe code.
4. **Session Invalidation**:
   - Resetting the password automatically invalidates all previous reset tokens and revokes all active admin JWT/Bearer sessions.

---

## 🚀 Laptop Home Server Quick Start (1-Click)

### Windows
Simply double-click:
```cmd
start-server.bat
```
This launcher gives you three modes:
- **[1] Standard**: Runs the backend on `http://localhost:5000`.
- **[2] Cloudflare Quick Tunnel**: Starts the backend and automatically generates a secure, free public HTTPS URL (`https://*.trycloudflare.com`).
- **[3] localtunnel**: Starts the backend and exposes it via `npx localtunnel --port 5000`.

### Linux / macOS
```bash
chmod +x start-server.sh
./start-server.sh
```

---

## 🌐 Connecting GitHub Pages to your Laptop Server

1. Run `start-server.bat` on your laptop and choose Option **[2]** (Cloudflare Tunnel) or Option **[3]** (localtunnel).
2. Copy the generated public HTTPS address (e.g. `https://badminton-tuc-xyz.trycloudflare.com`).
3. Open your live website on GitHub Pages:
   - Look at the top bar next to the TU Chemnitz logo: click the **Server Status Badge** (`🟢 Live Server` / `🔴 Server Offline`).
   - Paste your tunnel URL into the pop-up modal and click **Save**.
   - The entire website instantly connects to your laptop's live SQLite database and media files!

---

## 🤖 GitHub Actions Automated Deployment

The repository includes `.github/workflows/deploy.yml`:
- On every `git push` to `main`, GitHub Actions automatically:
  1. Installs frontend dependencies (`npm install` inside `frontend/`).
  2. Builds the optimized production SPA (`npm run build` inside `frontend/`).
  3. Deploys the static bundle from `frontend/dist` to GitHub Pages.

To enable GitHub Pages in your repository:
1. Go to **Settings** > **Pages** in your GitHub repository.
2. Under **Build and deployment** > **Source**, select **GitHub Actions**.

---

## 🛠️ Local Development

### Run Both Backend & Frontend Concurrently
From the root repository directory:
```bash
# Start backend (port 5000) and frontend Vite dev server (port 5173)
npm run dev
```

### Run Separately
```bash
# Start Backend
npm run backend

# Start Frontend
npm run frontend
```

---

## 📂 Repository Directory Structure

```
TUC_BADMINTON_WEBSITE/
├── .github/
│   └── workflows/
│       └── deploy.yml              # Automated GitHub Pages CI/CD workflow
├── frontend/                       # Static React 18 + Vite 5 SPA (for GitHub Pages)
│   ├── public/
│   │   └── uploads/                # Bundled tournament photos & official PDFs
│   ├── src/
│   │   ├── api/
│   │   │   ├── client.js           # Centralized API resolver & fetch interceptor
│   │   │   └── serverStatus.js     # Reactive /api/health monitoring
│   │   ├── components/
│   │   │   ├── ServerStatusBadge.jsx # "Server Online / Connecting..." indicator
│   │   │   ├── ForgotPasswordModal.jsx # 2-step OTP approval modal
│   │   │   ├── StadiumCarousel.jsx   # 10-slide 5s auto-rotating carousel
│   │   │   └── ...
│   │   ├── pages/
│   │   │   ├── HomePage.jsx
│   │   │   ├── TournamentsPage.jsx
│   │   │   ├── GalleryPage.jsx
│   │   │   ├── RegistrationPage.jsx
│   │   │   ├── TrainersPage.jsx
│   │   │   ├── PlayersPage.jsx
│   │   │   └── AdminPage.jsx
│   │   └── ...
│   ├── .env.development           # VITE_API_BASE_URL=http://localhost:5000
│   ├── .env.production
│   ├── vite.config.js              # Base './' for subpath resilience
│   └── package.json
├── backend/                        # Node.js + Express API on Laptop Home Server
│   ├── data/
│   │   └── badminton_community.db  # SQLite database with WAL mode
│   ├── uploads/                    # Local storage for photos and tournament PDFs
│   ├── server.js                   # Express server with CORS & security headers
│   ├── db.js                       # SQLite queries & hardened OTP generation
│   ├── mailer.js                   # Nodemailer dispatch with console fallback
│   ├── ecosystem.config.cjs        # PM2 process configuration
│   ├── .env.example
│   ├── .env                        # Local port & secrets
│   └── package.json
├── start-server.bat                # Windows 1-click launcher with tunnel options
├── start-server.sh                 # Linux/macOS launcher
├── package.json                    # Root convenience scripts
└── README.md
```

---

## 🏸 Venue & Training Details
- **Main Venue**: Universitäts-Sporthalle Thüringer Weg 11, 09126 Chemnitz
- **Capacity**: 12 Badminton-Spielfelder (Courts 1–12) with tournament sprung floor.
- **Admin Recovery Contact**: `gandupradeep2026@gmail.com`
