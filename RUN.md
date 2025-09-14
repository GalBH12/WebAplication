# How to run

## Prerequisites
- Node.js 18+
- MongoDB running locally on `mongodb://127.0.0.1:27017/map-app` (or set `MONGO_URI` in `.env`)

## 1) Install
```bash
cd WebAplication-main-updated
npm install
cd react
npm install
```

## 2) Start backend (port 4000)
Create a `.env` in the server root (`WebAplication-main-updated/.env`) with:
```
PORT=4000
JWT_SECRET=dev-secret
FRONTEND_ORIGIN=http://localhost:5173
MONGO_URI=mongodb://127.0.0.1:27017/map-app
SMTP_HOST=
SMTP_PORT=
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=
```
Then run:
```bash
cd WebAplication-main-updated
node server/index.js
```

## 3) Start frontend (port 5173)
```bash
cd WebAplication-main-updated/react
npm run dev
```

Open http://localhost:5173

### Notes
- Clicking **Chat** in the sidebar opens an in-app chat drawer (no navigation), showing *online users* (based on active socket connections). You can send a message to **All** or switch to a specific user for a direct message.
- A floating **Back** button appears at the top-left on every page and won’t overlap important UI.
- Login and Register screens are visually polished.
