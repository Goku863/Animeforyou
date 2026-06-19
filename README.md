# AnimeVault — Modern Anime Streaming Site

A fully responsive anime streaming website with admin panel, built with Flask + SQLite backend and GSAP animations.

## Features

- **Browse Anime** — Search, filter by category/audio type, A-Z list, random pick
- **Admin Panel** — Full CRUD for managing anime (add/edit/delete)
- **GSAP Animations** — Hero parallax, card stagger, scroll-triggered reveals
- **Responsive Design** — Works on mobile, tablet, and desktop
- **SQLite Database** — Persistent data storage with 12 seed entries
- **Dark Theme** — Modern dark UI with orange accent

## Tech Stack

- **Frontend:** HTML, CSS, JavaScript, GSAP
- **Backend:** Python 3.13, Flask, Flask-CORS
- **Database:** SQLite3

## Quick Start

### 1. Install dependencies

```bash
pip install flask flask-cors
```

### 2. Run the server

```bash
cd backend
python3.13 server.py
```

### 3. Open in browser

- Main site: `http://localhost:5000`
- Admin panel: `http://localhost:5000/admin.html`

## Project Structure

```
modern-landing/
├── index.html          # Main frontend SPA
├── admin.html          # Admin CRUD panel
├── style.css           # Shared stylesheet
├── api.js              # Shared REST API client
├── requirements.txt    # Python dependencies
├── backend/
│   ├── server.py       # Flask server (port 5000)
│   ├── database.py     # SQLite schema + CRUD
│   └── animevault.db   # SQLite database (auto-created)
└── .gitignore
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/anime` | Get all anime (supports `?q=`, `?category=`, `?audio=`) |
| GET | `/api/anime/:id` | Get single anime |
| POST | `/api/anime` | Create new anime |
| PUT | `/api/anime/:id` | Update anime |
| DELETE | `/api/anime/:id` | Delete anime |
| GET | `/api/stats` | Get statistics |

## License

Demonstration project — not for production use.
