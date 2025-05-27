# 🏟️ CubeSports - Live Football Updates Web App

[![Page Views](https://komarev.com/ghpvc/?username=cybruGhost&repo=livesports&color=blue)](https://github.com/cybruGhost/livesports)

**CubeSports** is a responsive web application for displaying football match data — including live scores, fixtures, and basic stats. It is built with **Next.js**, aiming to serve as a foundational platform that can later be extended with real-time APIs.

🌐 **Live site**: [https://livesports-six.vercel.app](https://livesports-six.vercel.app)

---

## ⚽ Features

- ✅ Match listings with teams and scores
- ✅ Fixtures and results
- ✅ Basic team and match info
- ✅ Mobile-friendly layout
- ❌ No live API yet (uses static or sample JSON)
- ❌ No user login or notifications (for now)

---

## 🧱 Tech Stack

| Layer       | Technology          |
|-------------|----------------------|
| Framework   | Next.js (React 18/19)|
| Styling     | Custom CSS           |
| Data        | Static JSON (sample) |
| Deployment  | Vercel               |

> ❗ *Tailwind is not installed. Styling is done with regular CSS.*

---

## 📁 Folder Structure

livesports/
├── app/ # App routes (Next.js)
│ ├── matches/ # Matches page
│ └── home/ # Homepage
├── components/ # Reusable components (e.g., MatchCard)
├── public/ # Static assets
├── styles/ # Global CSS
├── data/ # Static JSON files
└── README.md


---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/cybruGhost/livesports.git
cd livesports

2. Install dependencies

npm install --legacy-peer-deps

3. Run in development mode

npm run dev

Visit http://localhost:3000
🔧 Scripts
Command	Description
npm run dev	Run the app in development mode
npm run build	Build the production version (if available)
npm start	Start production server

    Add "build": "next build" to your package.json if missing.

📊 Example Match Data (data/matches.json)

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

📌 Known Issues

    Some CSS may break in deployment due to missing styles or invalid build steps.

    React 19 may cause conflicts with some packages (e.g., vaul).

    Deployment without next build causes runtime errors.

📦 Deployment Tips

If deploying to Vercel:

    Ensure you have a build script in package.json:

    "scripts": {
      "dev": "next dev",
      "start": "next start",
      "build": "next build"
    }

    Ensure .next/ is not deleted before building.

📮 Contributing

Pull requests are welcome. Please open an issue first to discuss what you would like to change.
📜 License

MIT
