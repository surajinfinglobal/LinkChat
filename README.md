# LinkChat

LinkChat is a real-time chat application with a React/Vite frontend, an Express
and Socket.IO backend, and MongoDB for persistent data.

## Prerequisites

- Node.js 20.19 or newer (Node.js 22 LTS recommended) and npm
- MongoDB, either running locally or hosted (for example, MongoDB Atlas)
- An SMTP account if you want password-reset OTP emails to work
- Redis is optional. Without `REDIS_URL`, the backend skips Redis and loads
  messages from MongoDB without caching them.

## Install

From the project root, install each app's dependencies in its own folder:

```bash
cd backend
npm ci
cd ../frontend
npm ci
```

## Configure the backend

Create `backend/.env` and add the values for your environment:

```dotenv
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/linkchat
JWT_SECRET=replace-with-a-long-random-secret

# Required for sending password-reset OTP emails
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password-or-app-password

# Optional: omit this to disable Redis caching
# REDIS_URL=redis://127.0.0.1:6379
```

Replace the example values; do not commit real credentials. For MongoDB Atlas,
use the connection URI provided by Atlas and allow the machine running the
backend in the Atlas network access settings. Use an SMTP provider's app
password/API credential where required rather than your normal account
password.

The backend serves uploaded files from `backend/uploads`. Ensure this directory
is writable by the backend process in deployments.

## Run locally

Start MongoDB first. Then run the backend and frontend in separate terminals
from the project root:

```bash
cd backend
npm start
```

```bash
cd frontend
npm run dev
```

Open the Vite URL printed in the frontend terminal (normally
`http://localhost:5173`). The backend defaults to `http://localhost:5000`; its
health route is `http://localhost:5000/`.

## Build the frontend

```bash
cd frontend
npm run build
npm run preview
```

## Main dependencies

Dependencies are declared in `backend/package.json` and
`frontend/package.json`; install them with the commands above.

- **Frontend:** React, React DOM, React Router, Vite, Axios, Socket.IO Client,
  Lucide React, and Emoji Picker React.
- **Backend:** Express, Mongoose, Socket.IO, bcryptjs, jsonwebtoken, Nodemailer,
  Multer, cors, and dotenv. The Redis client is used for optional message
  caching.

## Notes for running on another machine

The current frontend uses `http://localhost:5000` for API requests, sockets,
and uploaded images, and the Socket.IO server allows `http://localhost:5173`.
These defaults work when the browser and backend run on the same machine. For
LAN or production deployments, update those frontend backend URLs and the
Socket.IO allowed origin to match the address/domain where the backend and
frontend are actually served. Ensure the backend port is reachable and configure
HTTPS/WSS when serving the app over HTTPS.

## Troubleshooting

- **MongoDB connection fails:** confirm MongoDB is running and `MONGO_URI` is
  correct and reachable.
- **Password-reset OTP email is not sent:** check all `SMTP_*` settings,
  provider authentication requirements, and SMTP network access.
- **Redis connection message:** Redis is optional. Leave `REDIS_URL` unset to
  run without Redis caching; messages will be fetched from MongoDB.
- **Frontend cannot reach the backend on another device:** replace the current
  `localhost` URLs with the backend's LAN/public URL and update the Socket.IO
  allowed origin.
