# 🌳 FamilyVault — Family Memory Organizer

A full-stack web app to store, organize, and relive your family's most precious memories.

## Features

- 📷 **Upload & view** photos and videos
- 👨‍👩‍👧‍👦 **Family member profiles** with avatars and bios
- 📅 **Timeline view** — memories grouped and browseable by year
- 🏷️ **Tags & search** — filter memories by keyword, tag, or family member
- 🏡 **Dashboard** — stats overview and recent memories

---

## Project Structure

```
family-memory-organizer/
├── backend/
│   ├── server.js        ← Express API
│   ├── package.json
│   └── uploads/         ← auto-created on first run
│
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.jsx
    │   ├── App.css
    │   ├── index.js
    │   └── components/
    │       ├── Dashboard.jsx
    │       ├── MemoriesPage.jsx
    │       ├── MembersPage.jsx
    │       └── TimelinePage.jsx
    └── package.json
```

---

## Setup & Run

### 1. Backend

```bash
cd backend
npm install
npm start
# API runs at http://localhost:5000
```

For development with auto-reload:
```bash
npm run dev
```

### 2. Frontend

```bash
cd frontend
npm install
npm start
# App runs at http://localhost:3000
```

---

## API Reference

### Members
| Method | Endpoint            | Description              |
|--------|---------------------|--------------------------|
| GET    | /api/members        | List all members         |
| POST   | /api/members        | Create member + avatar   |
| PUT    | /api/members/:id    | Update member            |
| DELETE | /api/members/:id    | Delete member            |

### Memories
| Method | Endpoint                              | Description                       |
|--------|---------------------------------------|-----------------------------------|
| GET    | /api/memories                         | List all (supports ?search=, ?tag=, ?member=, ?year=) |
| GET    | /api/memories/:id                     | Get one memory                    |
| POST   | /api/memories                         | Create memory + file upload       |
| PUT    | /api/memories/:id                     | Update memory                     |
| DELETE | /api/memories/:id                     | Delete memory + file              |

### Tags
| Method | Endpoint      | Description    |
|--------|---------------|----------------|
| GET    | /api/tags     | List all tags  |
| POST   | /api/tags     | Create tag     |
| DELETE | /api/tags/:id | Delete tag     |

### Stats
| Method | Endpoint    | Description        |
|--------|-------------|--------------------|
| GET    | /api/stats  | Dashboard counters |

---

## Tech Stack

**Frontend:** React 18, CSS (no UI library)  
**Backend:** Node.js, Express.js  
**Database:** SQLite via `better-sqlite3`  
**File storage:** Local disk (`/backend/uploads/`)  
**File uploads:** Multer (images + videos up to 100MB)