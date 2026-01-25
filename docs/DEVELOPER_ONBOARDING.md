# BeTourist Backend — Developer Onboarding

This guide is for a new developer to get productive quickly (local + production basics).

---

## 1) Requirements

- Node.js 20+ (project uses Node 22 in Docker)
- Yarn (v1.x)
- Docker + Docker Compose
- Railway CLI (for production ops)

---

## 2) Local setup

```bash
cd /Users/macbook/Desktop/Projects/betourist-backend
yarn install
```

### Run local (recommended)
Starts **API + Postgres + PostGIS**:

```bash
docker compose up -d --build --remove-orphans
```

Local URLs:
- API: `http://localhost:3000/api/v1`
- Swagger: `http://localhost:3000/docs`
- DB: `localhost:5433` (user/pass/db: `betourist`)

Stop:
```bash
docker compose down
```

---

## 3) Environment variables

For **production**, env vars are set in Railway. For local docker, env is in `docker-compose.yml`.

Reference template:
- `docs/env.example`

Key envs:
- `DATABASE_URL`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `JWT_ACCESS_EXPIRES_IN` (default `15m`)
- `JWT_REFRESH_EXPIRES_IN` (default `30d`)
- `NODE_ENV`
- `BASE_URL`
- `CORS_ORIGINS`
- `THROTTLE_TTL_SECONDS`
- `THROTTLE_LIMIT`
- `TRUST_PROXY`

---

## 4) Prisma & DB

### Local Prisma Studio (docker DB)
```bash
yarn prisma:studio:docker
```

### Migrations
- Dev (creates + applies):
```bash
yarn prisma:migrate:dev
```

- Production (apply only):
```bash
yarn prisma:migrate:deploy
```

---

## 5) Seeding data

Local (docker DB):
```bash
DATABASE_URL="postgresql://betourist:betourist@localhost:5433/betourist?schema=public" \
  yarn seed:prod
```

Production (Railway):
```bash
npx --yes @railway/cli run yarn seed:prod
```

---

## 6) Auth + roles (quick ops)

### Register + login
`POST /api/v1/auth/register`  
`POST /api/v1/auth/login`

### Promote a user to admin (local)
```bash
DATABASE_URL="postgresql://betourist:betourist@localhost:5433/betourist?schema=public" \
  yarn dev:promote-user someone@example.com platform_admin
```

### Promote in production (Railway)
```bash
npx --yes @railway/cli run yarn dev:promote-user someone@example.com platform_admin
```

---

## 7) MVP workflow (partner → admin → tourist)

### Partner (role=partner)
1. `POST /api/v1/partner/profile`
2. `POST /api/v1/partner/experiences` (creates draft)
3. `POST /api/v1/partner/experiences/:id/submit`

### Admin (role=platform_admin)
1. `GET /api/v1/admin/experiences/pending`
2. `POST /api/v1/admin/experiences/:id/approve`

### Public (tourist/guest)
1. `GET /api/v1/categories`
2. `GET /api/v1/experiences`
3. `GET /api/v1/experiences/:id`

---

## 8) Home screen API contract (frontend)

Spec file:
- `API_SPECIFICATION_HOMESCREEN.md`

Notes:
- `/experiences` now returns both:
  - `items/page/limit/total` (legacy)
  - `data/pagination` (frontend contract)
- `/experiences/:id` includes alias fields:
  - `imageUrl`, `subtitle`, `coordinates`, `price`, `gallery` (string[])
- `/categories` includes `icon` (mapped from slug)

---

## 9) Production (Railway) quick checks

```bash
BASE="https://betourist-backend-production.up.railway.app/api/v1"
curl -sS "$BASE/health"
curl -sS "$BASE/health/ready"
```

Prisma Studio (prod DB):
```bash
npx --yes @railway/cli run yarn prisma:studio
```

---

## 10) Useful scripts

From `package.json`:

- `yarn build`
- `yarn start:dev`
- `yarn prisma:migrate:deploy`
- `yarn prisma:studio:docker`
- `yarn seed:prod`
- `yarn dev:promote-user`

---

## 11) Notes

- PostGIS is required for geo features (`cities.location`).
- `Place` now uses a lifecycle status:
  - `draft → pending_review → published`
- `isPublished` remains for backward compatibility; keep it in sync with `status`.


