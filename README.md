# 🏸 TU Chemnitz Badminton Portal

A modern, high-performance web application for the **Technische Universität Chemnitz (TUC)** Badminton community & Hochschulsport. Built to replace outdated university portals with a responsive, athletic design.

---

## 🚀 Tech Stack

- **Frontend**: React 18, Vite 5, Tailwind CSS, Lucide Icons, responsive mobile-first UI with Dark/Light mode.
- **Backend**: Express.js REST API with automatic Vite proxying in dev.
- **Database**: Local SQLite stored in `data/badminton.sqlite`, powered by Node.js 24's native `DatabaseSync` engine (`node:sqlite`) for zero native C++ build hassles on Windows.
- **Styling**: TU Chemnitz athletic palette (Deep Forest Green `#005842`, Mint `#10B981`, Dark Slate `#0B1120`, and Gold shuttlecock accents).

---

## 🌟 Key Features

1. **Hero Banner**:
   - Dynamic headline, energetic branding, community metrics strip.
   - Quick CTAs: *Register for Trial Session*, *Training Schedule*, *Find Gyms*.
   - Next upcoming weekly session highlight card.

2. **Training & Schedule Matrix**:
   - Filter by **Day of Week** (Monday, Wednesday, Friday, Sunday) and **Skill Level** (Beginner, Intermediate, Advanced, All Levels).
   - Real-time text search for coaches, venues, or shuttle types.
   - Dual-view toggle: **Interactive Cards** or **Structured Matrix Table**.
   - One-click "Join This Session" button that pre-populates the registration form.

3. **Interactive Sports Halls & Venues**:
   - **Sporthalle Thüringer Weg 11** (6 courts, competition sprung parquet floor, Tram 3 TU Campus).
   - **CPS Sporthalle Reichenhainer Str. 90** (4 courts, point-elastic flooring, Bus 51).
   - Direct Google Maps routing links.
   - Prominent hall rules alert: *Strictly non-marking indoor shoes only (Hallenschuhe)*, padlock reminder, drinking water stations.

4. **Player Registration & Contact Modal**:
   - Dedicated tabs for **Trial Session Booking**, **Tournament Entry**, and **General Inquiries**.
   - Directly writes to the local SQLite database.
   - Confirmation receipt with unique database record ID.

5. **Guidelines & FAQ Accordion**:
   - Equipment and loaner racket policy (8 loaner rackets on-site at Thüringer Weg).
   - Shuttlecock guide: Yonex Mavis 350 nylon vs Victor Champion / Yonex AS-30 feather.
   - Membership and Hochschulsport semester pass fee breakdown (€15 students / €25 staff / €45 guests).
   - 15-minute doubles pegboard rotation system during peak sessions.

6. **Live SQLite Database Explorer**:
   - In-app live inspector modal accessible directly from the navigation bar and footer.
   - View real-time rows from `registrations` and `inquiries`.
   - Real-time refresh and record deletion.

---

## 🛠️ Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Both Backend & Frontend
```bash
npm run dev
```
- Frontend UI: `http://localhost:5173`
- Backend API & SQLite: `http://localhost:3001`
- Proxied API calls (`/api/*`) are routed seamlessly by Vite to port 3001.

### 3. Production Build & Run
```bash
npm run build
npm run server
```
The Express server will automatically serve both the API and the compiled React production bundle on `http://localhost:3001`.

---

## 📂 Project Structure

```
TUC_BADMINTON_WEBSITE/
├── data/
│   └── badminton.sqlite      # Local SQLite database
├── server/
│   ├── db.js                 # SQLite schema, queries, and automatic seeds
│   └── index.js              # Express REST API routes
├── src/
│   ├── components/
│   │   ├── DbInspectorModal.jsx   # Live SQLite records viewer
│   │   ├── FaqSection.jsx         # Accordion & equipment policy
│   │   ├── Footer.jsx             # University sports footer
│   │   ├── Hero.jsx               # Athletic hero & metrics
│   │   ├── Navbar.jsx             # Top bar, dark mode, quick links
│   │   ├── RegistrationModal.jsx  # Trial & tournament form (writes to SQLite)
│   │   ├── ScheduleMatrix.jsx     # Filterable schedule (Cards & Table)
│   │   └── VenuesSection.jsx      # Gym cards, Google Maps, transit
│   ├── data/
│   │   └── mockData.js       # Schedule, venue, and FAQ reference data
│   ├── App.jsx               # Main state & dark mode manager
│   ├── index.css             # Tailwind base & custom athletic styling
│   └── main.jsx              # React DOM root
├── index.html                # HTML entry point with Outfit & Inter typography
├── package.json
├── tailwind.config.js
└── vite.config.js
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Service health and SQLite status |
| `GET` | `/api/stats` | Aggregate counts of registrations, halls, courts |
| `GET` | `/api/registrations` | Fetch all player registrations |
| `POST` | `/api/registrations` | Add new trial session or tournament entry |
| `DELETE` | `/api/registrations/:id` | Remove a registration by ID |
| `GET` | `/api/inquiries` | Fetch all inquiries |
| `POST` | `/api/inquiries` | Add new community inquiry |
