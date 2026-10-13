# WeatherNow Backend — Deployment

The API runs on the Coolify server (**Mozahid VPS**) as the `WeatherNow` project:

| Resource         | What it is                                                      |
| ---------------- | --------------------------------------------------------------- |
| `weathernow-db`  | PostgreSQL (internal only, not exposed to the internet)         |
| `weathernow-api` | This NestJS app, built from `backend/Dockerfile`                |

Live URL: `https://weather-api.194.233.85.160.sslip.io/api` (Swagger docs at `/api/docs`).

## Auto-deploy

A GitHub webhook on `Mozahid-AIUB/Weather_App` notifies Coolify on every push to `main`.
Coolify redeploys **only when files under `backend/` change** (watch path `backend/**`),
so app-only commits don't rebuild the server. Deploys are rolling: the new container must
pass the `/api/health` check before the old one is removed.

To deploy manually, open the app in Coolify and press **Redeploy**.

## Environment variables (set in Coolify, runtime only)

| Key               | Notes                                                        |
| ----------------- | ------------------------------------------------------------ |
| `PORT`            | `3001`                                                       |
| `NODE_ENV`        | `production`                                                 |
| `DB_HOST`         | Internal hostname of `weathernow-db` (its Coolify uuid)      |
| `DB_PORT` / `DB_NAME` / `DB_USER` / `DB_PASSWORD` | PostgreSQL connection         |
| `DB_SYNC`         | `false`. Set `true` once to create tables, then back to `false` |
| `DB_SSL`          | `false` for the same-server database                         |
| `ADMIN_API_KEY`   | Required as the `x-admin-key` header for admin-only routes    |
| `ALLOWED_ORIGINS` | CORS origins, `*` by default                                 |

Keep these as **runtime only** in Coolify. If they are also available at build time,
`NODE_ENV=production` skips the dev dependencies the build needs and secrets end up in
build arguments.

## Admin-only routes

Reading or deleting stored data needs `x-admin-key: <ADMIN_API_KEY>`:
`GET /api/search-history`, `DELETE /api/search-history/:id`, `DELETE /api/search-history/clear`,
`GET /api/analytics/top`, `GET /api/analytics/stats`.

Public routes used by the app: `POST /api/search-history`, `POST /api/analytics/view`,
`POST /api/devices`, `POST /api/devices/unregister`, `GET /api/health`.

## Running locally

```bash
cp .env.example .env   # point DB_* at a local PostgreSQL, DB_SYNC=true the first time
npm install
npm run start:dev
```
