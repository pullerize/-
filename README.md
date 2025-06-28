# Agency Web App

This repository contains a basic skeleton of a web application for an agency.
It features a FastAPI backend and a React + TypeScript frontend.

## Backend

The backend is located in `agency_backend`. It uses FastAPI, SQLAlchemy and JWT
for authentication. To run the development server:


```bash
pip install -r agency_backend/requirements.txt
uvicorn agency_backend.app.main:app --reload --port 8000
```

Start the backend before launching the frontend so the API is reachable.

This will start the API on `http://localhost:8000`. The API exposes endpoints
for authentication, user management and task CRUD that
can be consumed by a Telegram bot.

A default administrator user is created automatically with the following
credentials:

- **username:** `admin`
- **password:** `admin123`

Use this account to log in and test the application.

## Frontend

The frontend resides in `agency_frontend` and is bootstrapped with Vite. It
uses TailwindCSS for styling. Basic pages for login, tasks, calendar, finance
and reports are included.

```bash
cd agency_frontend
npm install
npm run dev
```

This starts the development server on port 3000. The frontend expects the
backend to run on `http://localhost:8000` by default. Copy
`agency_frontend/.env.example` to `.env` and adjust it if your backend runs on a
different URL:

```bash
VITE_API_URL=http://your-backend:port
```

Then restart the dev server so the API URL is picked up.
