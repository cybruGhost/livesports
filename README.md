# 🏟️ CubeSports - Real-Time Football Web App

#SOON TO FIX
---

[CUBE SPORTS LINK](https://thecub4.vercel.app/Cubesports)
## ❤️ Support The Cube

If you enjoy our work and want to support development, you can buy us a coffee ☕  

👉 **[ko-fi.com/anonghost40418](https://ko-fi.com/anonghost40418)**

Every bit of support helps keep The Cube growing 🚀  

---
[![Page Views](https://komarev.com/ghpvc/?username=cybruGhost&repo=livesports&color=brightgreen)](https://github.com/cybruGhost/livesports)

**CubeSports** is a responsive web application built with **Next.js** for delivering **real-time football data**, including live scores, match fixtures, league standings, and more. Designed for both desktop and mobile users, it offers a clean, intuitive interface to stay up to date with the football world.
## ⚽Will FIX- LOADING TYM AND FETCHING

🌐 **Live site**: [https://thecub4.vercel.app/Cubesports](https://thecub4.vercel.app/Cubesports)



---


## ⚽ Live Features

- 📺 **Live Scores** — Get updated match results in real time.
- 🗓️ **Fixtures** — View upcoming matches by date or league.
- 🧮 **Standings** — Access current league tables (Premier League, La Liga, etc).
- 🧑‍🤝‍🧑 **Teams** — Explore club details and stats.
- 💡 **Responsive UI** — Optimized for both desktop and mobile users.

---

## 🧱 Tech Stack

| Layer        | Technology         |
|--------------|--------------------|
| Framework    | Next.js (App Router) |
| Data Source  | External Football API |
| Styling      | Custom CSS (No Tailwind) |
| Hosting      | Vercel              |

---

## 📁 Folder Structure

livesports/
├── app/ # App routes (matches, home, etc.)
│ ├── matches/ # Live match data views
│ └── standings/ # League standings pages
├── components/ # UI components (e.g., MatchCard, NavBar)
├── public/ # Images, icons
├── styles/ # CSS files
├── data/ # Local fallback (optional)
└── README.md


---

## 🚀 Getting Started

### 1. Clone the repository

git clone https://github.com/cybruGhost/livesports.git
cd livesports

2. Install dependencies

npm install --legacy-peer-deps

3. Run in development mode

npm run dev

Then visit: http://localhost:3000
🔧 Scripts
Command	Description
npm run dev	Start dev server
npm run build	Build the app for production
npm start	Start the production server

    Note: Ensure build script exists in your package.json:

"scripts": {
  "dev": "next dev",
  "start": "next start",
  "build": "next build"
}

📌 Known Issues

    Ensure all stylesheets are loaded properly in production. CSS bugs may occur if imports are missed.

    If using React 19, some external packages (e.g. vaul) may not yet support it fully.

    Always test styling after deploying to Vercel; production may behave differently from local dev.

🔒 Data & API

    The app pulls live football data using a backend API service ().

    No sensitive data is exposed on the frontend.

    Can be extended to support authenticated user actions and preferences.

📮 Contributing

Got improvements? Fork, branch, and make a pull request.
Make sure your edits align with the current structure and style.
📜 License

This project is open source — MIT License
