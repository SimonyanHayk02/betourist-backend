<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## BeTourist Backend (NestJS + Prisma + PostGIS)

Backend-first RBAC-driven API for BeTourist.

### API conventions

- **Base path**: `/api/v1`
- **Swagger**:
  - `/docs`
  - `/api/docs`

## Project setup (local)

```bash
yarn install
```

## Run locally (Docker, recommended)

This runs **Postgres + PostGIS** and the API.

```bash
docker compose up -d --build --remove-orphans
```

- **API**: `http://localhost:3000/api/v1`
- **Swagger**: `http://localhost:3000/docs`
- **DB**: `localhost:5433` (user/pass/db: `betourist`)

Stop:

```bash
docker compose down
```

## Environment variables

Local docker uses `docker-compose.yml` env for the API container.
For deployments, set these in your platform (Railway, etc):

- **DATABASE_URL**: Postgres connection string
- **JWT_ACCESS_SECRET**
- **JWT_REFRESH_SECRET**
- **JWT_ACCESS_EXPIRES_IN** (default: `15m`)
- **JWT_REFRESH_EXPIRES_IN** (default: `30d`)
- **NODE_ENV**: `production` in production
- **BASE_URL**: public base URL used for Swagger server listing (e.g. `https://...`)
- **SWAGGER_ENABLED**: set `true` to force-enable Swagger in production
- **CORS_ORIGINS**: comma-separated browser origins allowed to call the API (e.g. `http://localhost:5173,https://your-frontend.app`)

## Prisma

### Migrations

- **Apply migrations**:

```bash
yarn prisma:migrate:deploy
```

### Prisma Studio (local docker DB)

If your `.env` points to Railway (or any remote DB), Prisma Studio will open that database.
To inspect the **local docker DB** on `localhost:5433`:

```bash
yarn prisma:studio:docker
```

## Auth (Phase 2)

Endpoints:

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/refresh` (refresh token in body)
- `POST /api/v1/auth/logout` (requires Bearer access token)

Notes:

- Passwords hashed using **argon2**
- Refresh token stored **hashed** in DB and rotated on refresh

## Location foundation (Phase 3)

Endpoints:

- `GET /api/v1/countries` (public)
- `POST /api/v1/countries` (**admin-only**)
- `GET /api/v1/cities` (public)
- `GET /api/v1/cities/near?lat=&lng=&radiusMeters=&limit=` (public)
- `POST /api/v1/cities` (**admin-only**, optional WKT location)

WKT location format:

- `POINT(lon lat)` (SRID 4326 assumed), example: `POINT(44.5126 40.1772)`

## RBAC

Write endpoints for location data are protected with:

- `JwtAuthGuard` + `RolesGuard`
- allowed roles: `platform_admin`, `super_admin`

## Dev utilities

Promote a user to an admin role (local docker DB):

```bash
DATABASE_URL="postgresql://betourist:betourist@localhost:5433/betourist?schema=public" \
  yarn dev:promote-user someone@example.com platform_admin
```

## Run tests

```bash
yarn test
yarn test:e2e
```

## Deployment (Railway quick notes)

- Ensure backend service has `DATABASE_URL` set (from the Postgres plugin)
- Ensure these are set (at minimum):
  - `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`
  - `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`
  - `NODE_ENV=production`
  - Optional: `SWAGGER_ENABLED=true` if you want Swagger in prod
- Run migrations on deploy (Docker CMD already runs this, but you can run manually too):

```bash
yarn prisma:migrate:deploy
```

After deploy, verify:

- `GET /api/v1/health` (liveness)
- `GET /api/v1/health/ready` (readiness + DB ping)

## Seeding (production)

Run an idempotent seed (countries/cities/categories) in the Railway backend service:

```bash
npx --yes @railway/cli run yarn seed:prod
```

---

## Compile and run the project (legacy)

```bash
# development
$ yarn run start

# watch mode
$ yarn run start:dev

# production mode
$ yarn run start:prod
```

## Run tests

```bash
# unit tests
$ yarn run test

# e2e tests
$ yarn run test:e2e

# test coverage
$ yarn run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ yarn install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).
