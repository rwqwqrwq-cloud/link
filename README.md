# linkr — Profile Link Page System

guns.lol-style profile page builder. Built with Node.js + Express + SQLite.

## Features
- Register/Login with email & password
- Customizable profile (name, bio, avatar, banner color)
- Add/remove unlimited links with icons
- Link click tracking & profile view counter
- Public profile page at `yourdomain.com/:username`
- Fully responsive, dark theme

## Local Development

```bash
npm install
cp .env.example .env
# Edit .env and set SESSION_SECRET
npm run dev
# Visit http://localhost:3000
```

## Deploy to Render.com (Free)

1. Push this folder to a GitHub repo
2. Go to https://render.com → New → Web Service
3. Connect your GitHub repo
4. Render will auto-detect `render.yaml`
5. Set env var `SESSION_SECRET` to a random 32+ char string
6. Click **Deploy** — done!

> **Note:** Free Render tier spins down after 15 min of inactivity (first request takes ~30s to wake up). Upgrade to Starter ($7/mo) for always-on.

## File Structure
```
linkr/
├── server.js          # Entry point
├── render.yaml        # Render deploy config
├── db/
│   └── database.js    # SQLite schema + connection
├── routes/
│   ├── auth.js        # Register / Login / Logout
│   ├── dashboard.js   # Profile editor (protected)
│   └── profile.js     # Public profile + click tracking
├── middleware/
│   └── auth.js        # requireAuth / requireGuest
├── views/             # EJS templates
│   ├── home.ejs
│   ├── login.ejs
│   ├── register.ejs
│   ├── dashboard.ejs
│   ├── profile.ejs
│   ├── 404.ejs
│   └── partials/nav.ejs
├── public/
│   ├── css/main.css
│   └── uploads/       # User avatar images
└── data/              # SQLite db files (auto-created)
```
