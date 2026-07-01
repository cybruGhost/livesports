# 🏟️ CubeSports — Real-Time Football Stats & Highlights Web App

[🌐 Live SITE](https://thecub4.vercel.app/Cubesports)

CubeSports is a modern football web application built with **Next.js** that delivers real-time football **data** — live scores, fixtures, standings, club statistics, and match highlights — in a fast, clean, responsive interface.

> ℹ️ **CubeSports does not stream or rebroadcast live match video.** It is a scores-and-stats companion app: real-time data updates, post-match highlight clips, and league information sourced from public football data APIs. For full match broadcasts, please use an official licensed broadcaster in your region.

<img width="641" height="311" alt="Screenshot 2026-07-01 203454" src="https://github.com/user-attachments/assets/f86df4eb-3f2a-4314-b14a-2b882a268b1c" />

Designed for both desktop and mobile users, CubeSports keeps football fans connected with clean navigation, smooth performance, and up-to-the-minute match data.

---

📝 *Note: the code in this repo isn't yet what's on the live link — I'll be updating it soon.*

---

## ⚡ Features

- 📊 **Live Score Updates** — Real-time score and match-event data (not video).
- 🎬 **Highlights** — Key match moments and clips after games conclude.
- 🗓️ **Fixtures** — Upcoming matches by league and date.
- 🏆 **League Standings** — Premier League, La Liga, Serie A, and more.
- 🧑‍🤝‍🧑 **Team Insights** — Club information and stats.
- 📱 **Responsive Design** — Optimized for mobile and desktop.
- ⚡ **Fast Navigation** — Built using the Next.js App Router.

---

## 🧱 Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js |
| Language | JavaScript |
| Styling | Custom CSS |
| Data Source | Football data API (scores, fixtures, standings, highlights metadata) |
| Deployment | Vercel |

---

## 📁 Project Structure

```bash
livesports/
├── app/
│   ├── matches/
│   ├── standings/
│   └── teams/
├── components/
├── public/
├── styles/
├── utils/
└── README.md
```

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/cybruGhost/livesports.git
cd livesports
```

### 2️⃣ Install Dependencies
```bash
npm install --legacy-peer-deps
```

### 3️⃣ Run Development Server
```bash
npm run dev
```

Open:
```bash
http://localhost:3000
```

---

## 🔧 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server |

---

## ⚙️ package.json Scripts

```json
"scripts": {
  "dev": "next dev",
  "build": "next build",
  "start": "next start"
}
```

---

## ✅ Improvements & Fixes

- ✔️ Improved loading speed
- ✔️ Better API fetching performance
- ✔️ Responsive layout fixes
- ✔️ Optimized navigation and rendering
- ✔️ Production deployment fixes

---

## 🔒 Data & API

CubeSports uses third-party football data APIs to provide:

- Real-time score updates
- Fixtures and schedules
- League standings
- Team information
- Post-match highlight clips (where made available by the data provider)

CubeSports does **not** host, proxy, or rebroadcast live video streams of matches. All video/highlight content displayed is sourced from and hosted by third-party providers via their APIs; CubeSports only surfaces metadata and embeds/links provided by those services.

No sensitive user data is exposed on the frontend.

---

## ❤️ Support The Cube

If you enjoy the project and want to support development:

☕[https://cyberghost-shop.fourthwall.com](https://cyberghost-shop.fourthwall.com)

Every contribution helps improve CubeSports 🚀

---

## 📮 Contributing

Contributions are welcome.

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Open a pull request

---

## 📜 License

This project is licensed under the MIT License.
