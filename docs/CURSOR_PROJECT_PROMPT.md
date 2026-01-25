You are a Cursor coding agent for the BeTourist backend (NestJS + Prisma + Postgres/PostGIS). Your goal is to be productive immediately with the existing architecture and MVP flows.

High-level architecture
- Framework: NestJS (modular)
- ORM: Prisma
- DB: Postgres + PostGIS
- Auth: JWT access + refresh, argon2 for password hashing, refresh token rotation (hashed in DB)
- RBAC: role-based guard only (no permissions table yet)
- API prefix: `/api/v1` with URI versioning
- Swagger: `/docs` or `/api/docs`
- Local: Docker Compose runs API + PostGIS DB (API on :3000, DB on :5433)

Key modules
- Auth (`/auth`): register, login, refresh, logout
- Users (`/users`): `GET /me`, `PATCH /me/onboarding` (selected city)
- Admin users (`/admin/users`): list, suspend/unsuspend, role update (super_admin only)
- Locations: countries + cities (with PostGIS, includes `GET /cities/near`)
- Content: categories + places (admin CRUD, publish/unpublish)
- Experiences (public read model): experiences are Places
- Partner (MVP): partner profile + partner experiences
- Admin experiences: pending list + approve/reject
- Health: `/health` + `/health/ready`

MVP flow (current focus)
Partner → create experience → submit → Admin approve → Tourist sees on Home:
- Partner (role=partner)
  - `POST /partner/profile`
  - `POST /partner/experiences` (draft)
  - `POST /partner/experiences/:id/submit` (draft → pending_review)
- Admin (role=platform_admin/super_admin)
  - `GET /admin/experiences/pending`
  - `POST /admin/experiences/:id/approve`
  - `POST /admin/experiences/:id/reject`
- Public (tourist/guest)
  - `GET /categories`
  - `GET /experiences` (published only, featured default)
  - `GET /experiences/:id`

Experience lifecycle
- status enum: `draft`, `pending_review`, `published`, `unpublished`
- `isPublished` remains for backward compatibility; keep in sync with `status`
- Admin approve sets `status=published`, `publishedAt`, `isPublished=true`, `isFeatured=true`

Frontend contract adjustments (already implemented)
- `GET /categories`: includes `icon` (mapped from slug)
- `GET /experiences`: returns both
  - legacy: `items/page/limit/total`
  - contract: `data/pagination { total, limit, offset, hasMore }`
  - item aliases: `subtitle`, `imageUrl`, `categoryId`, `cityId`, `rating`, `reviewCount`, `price`
- `GET /experiences/:id`:
  - `gallery` is string[]
  - alias fields: `imageUrl`, `subtitle`, `coordinates`, `price`, `rating`, `reviewCount`
  - unsupported fields return null/empty arrays

Schema highlights (Prisma)
- User: `role`, `verificationStatus`, `selectedCityId`, `partnerId`
- Partner: `ownerId` (unique), `name`
- Place: `status`, `isPublished`, `isFeatured`, `partnerId`, `cityId`, `categoryId`
- PlaceMedia: ordered via `sortOrder`

Indexes (important)
- `places`: indexes on `status`, `isFeatured`, `cityId`, `categoryId`, `partnerId`
- compound indexes for hot queries: `(status,isFeatured,updatedAt)`, `(status,cityId,isFeatured,updatedAt)`, `(partnerId,status,updatedAt)`
- `place_media`: `(placeId, sortOrder)`
- `cities.location` has GiST index

Local dev commands
- `docker compose up -d --build`
- `yarn prisma:studio:docker`
- `yarn seed:prod` (local with DB override)

Production (Railway) ops
- `npx --yes @railway/cli run yarn prisma:migrate:deploy`
- `npx --yes @railway/cli run yarn seed:prod`
- `npx --yes @railway/cli run yarn dev:promote-user <email> platform_admin`
- Prisma Studio prod: `npx --yes @railway/cli run yarn prisma:studio`

Important constraints / behaviors
- Auth checks (active/suspended/deleted) happen in JWT strategy validation.
- Partner can edit only in draft.
- Submit only from draft.
- Admin approve/reject only from pending_review (atomic update).
- Public endpoints are open; partner/admin endpoints require JWT + Roles.

What not to add yet (post-MVP)
- Permissions tables / @RequiresPermissions
- Bookings, reviews, favorites, analytics
- Partner managers / moderators

If you make changes:
- Prefer additive changes (avoid breaking API consumers).
- Keep `isPublished` and `status` in sync.
- Run `read_lints` on touched files.

