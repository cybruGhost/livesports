```markdown
# 🏟️ LiveSports Web App

**LiveSports** is a dynamic, mobile-first sports web application built using **React Native Web** and **Next.js**. Inspired by the static prototype at [CubeSports](https://cubesports.netlify.app), this app is designed to deliver real-time match data, live scores, fixtures, team news, and stats to fans across devices.

---

## ⚽ Core Features

- 📊 Display live scores & match stats
- 🗓️ Fixtures by league/date
- 🏆 Browse teams and player profiles
- 🔔 Notifications for favorite teams (optional)
- 📱 Mobile-friendly design using React Native Web

---

## 🧰 Tech Stack

| Layer       | Technology         |
|------------|--------------------|
| Frontend    | React Native + Next.js |
| Routing     | Next.js Pages API |
| Styling     | Tailwind CSS / Styled Components |
| Data        | Static JSON (for now) or integrate with API (e.g., SportsDB, API-Football) |
| Hosting     | Netlify / Vercel |

---

## 🚀 Getting Started

### 1. Clone the repo

```bash
git clone https://github.com/yourusername/livesports.git
cd livesports
```

### 2. Install dependencies

```bash
npm install
```

### 3. Run in development

```bash
npm run dev
```

Open your browser to `http://localhost:3000`

---

## 📂 Folder Structure

```
livesports/
├── components/         # Reusable UI elements (ScoreCard, TeamList, etc.)
├── pages/              # Next.js routes
│   ├── index.js        # Home page
│   ├── fixtures.js     # Match fixtures
│   └── teams.js        # Team profiles
├── public/             # Images, icons
├── styles/             # Tailwind or global CSS
├── data/               # Static data (sample matches, teams)
├── .env.local          # Env variables if using APIs
└── README.md
```

---

## 🧪 Sample Data Structure (JSON)

```json
[
  {
    "id": 1,
    "homeTeam": "Arsenal",
    "awayTeam": "Man United",
    "score": "2 - 1",
    "status": "FT",
    "date": "2025-04-25"
  }
]
```

---

## 🔌 Future Enhancements

- Live API integration (e.g., API-Football)
- Push notifications
- User login and favorite team tracking
- Dark mode toggle
- Progressive Web App (PWA) support

---

## ✨ Deployment

Deploy easily on [Vercel](https://vercel.com/) or [Netlify](https://netlify.com).

---

