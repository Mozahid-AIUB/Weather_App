# ================================================
# WeatherNow - NestJS Backend
# VPS Deployment Guide
# ================================================

## Prerequisites on VPS
- Node.js 20+ installed
- PostgreSQL 15+ installed and running
- PM2 (process manager) installed globally

## Step 1: PostgreSQL Setup on VPS

```bash
# Login to PostgreSQL
sudo -u postgres psql

# Create database and user
CREATE DATABASE weathernow;
CREATE USER weathernow_user WITH ENCRYPTED PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE weathernow TO weathernow_user;
\q
```

## Step 2: Upload Backend to VPS

```bash
# From your local machine
scp -r ./backend user@YOUR_VPS_IP:/home/user/weathernow-backend
```

## Step 3: Configure Environment

```bash
cd /home/user/weathernow-backend
cp .env.example .env
nano .env  # Fill in your actual values
```

## Step 4: Install & Build

```bash
npm install
npm run build
```

## Step 5: Database Auto-Sync (First time only)
In .env, temporarily set:
```
DB_SYNC=true
```
Then start the server once to create tables, then set back to `false`.

## Step 6: Start with PM2

```bash
# Install PM2 globally (if not already)
npm install -g pm2

# Start the app
pm2 start dist/src/main.js --name weathernow-backend

# Auto-restart on reboot
pm2 startup
pm2 save
```

## Step 7: Nginx Reverse Proxy (Optional but recommended)

```nginx
server {
    listen 80;
    server_name YOUR_DOMAIN_OR_IP;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## API Endpoints

| Method | URL | Description |
|--------|-----|-------------|
| GET    | /health | Server & DB health check |
| GET    | /api/search-history | Get last 20 searches |
| POST   | /api/search-history | Save a city search |
| DELETE | /api/search-history/:id | Delete one entry |
| DELETE | /api/search-history/clear | Clear all history |
| POST   | /api/analytics/view | Log a weather view |
| GET    | /api/analytics/top | Top 10 cities |
| GET    | /api/analytics/stats | Overall stats |
| GET    | /docs | Swagger API docs |
