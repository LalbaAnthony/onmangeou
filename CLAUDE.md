# onmangeou — project context

Express 4 + TypeScript (CommonJS) app to vote for a place to eat. No database:
state lives in JSON files on disk. Static frontend (vanilla HTML/CSS/JS) served
by the same Express process.

---

## Layout

```
src/
  server.ts                 entry point — dotenv, listen(), calls initData()
  app.ts                    Express instance, static files, routes, 404, error handler
  routes/ controllers/ services/ models/
  crons/restaurants.cron.ts node-cron, daily 06:00 truncate (container timezone!)
  utils/json-store.utils.ts flat-file JSON persistence
  types/
public/                     static frontend, served by express.static
data/                       runtime JSON state (gitignored, volume-mounted in prod)
dist/                       tsc output (gitignored)
apache.conf                 reference-only vhost, manually applied on the server
```

### Path contract — do not break it

Runtime paths are resolved from `__dirname` and must hold for **both** `src/` (dev,
ts-node-dev) and `dist/` (prod, compiled):

| Code                                 | Dev resolves to | Prod resolves to       |
| ------------------------------------ | --------------- | ---------------------- |
| `app.ts` → `../public`               | `<root>/public` | `/app/public`          |
| `json-store.utils.ts` → `../../data` | `<root>/data`   | `/app/data`            |
| `server.ts` → `../.env`              | `<root>/.env`   | `/app/.env` (optional) |

Both Dockerfiles preserve this. Moving a file one directory deeper breaks it silently.

---

## Commands

```sh
npm run dev         # ts-node-dev, hot reload
npm run build       # tsc -> dist/
npm start           # node dist/server.js
npm run type-check  # tsc --noEmit
npm run lint        # eslint src
npm test            # placeholder, always exits 0 — no test suite yet
```

TypeScript is in full strict mode (`exactOptionalPropertyTypes`,
`noUncheckedIndexedAccess`, `noUnusedLocals`…). Do not loosen `tsconfig.json` to
make code compile.

---

## Docker

Three files: `Dockerfile.dev`, `Dockerfile.prod`, `docker-compose.yml`.
Nothing starts without an explicit profile.

```sh
# Development — hot reload, sources bind-mounted
docker compose --profile development up --build

# Production, locally (builds Dockerfile.prod instead of pulling)
docker compose --profile production up --build

# Production, on the server (image is pulled, never built there)
export COMPOSE_PROJECT_NAME=<folder> IMAGE=docker.io/lalbaanthony/onmangeou:main
docker compose --profile production pull
docker compose --profile production up -d --remove-orphans
```

|                | `app-dev`                      | `app-prod`                            |
| -------------- | ------------------------------ | ------------------------------------- |
| Dockerfile     | `Dockerfile.dev`               | `Dockerfile.prod` (4-stage)           |
| Image          | built locally, `onmangeou:dev` | `${IMAGE}`, pulled from Docker Hub    |
| Sources        | bind-mounted, hot reload       | compiled into `dist/`, baked in       |
| `node_modules` | full tree                      | `--omit=dev` only                     |
| User           | root (bind-mount write access) | `node` (unprivileged)                 |
| Port binding   | `${PORT}:3000`                 | `127.0.0.1:${PORT}:3000`              |
| `data/`        | host bind mount                | named volume `onmangeou-data`         |
| Healthcheck    | none                           | `GET /health` via Node global `fetch` |

Conventions:

- **Never publish `app-prod` on `0.0.0.0`.** Apache terminates TLS and proxies to
  `127.0.0.1:4567`; the container port must stay on loopback.
- The container always listens on **3000** internally; `PORT` is the *host* port only.
  It **must match** the `ProxyPass` target in `apache.conf` (4567).
  06:00 job fires at 06:00 UTC.
- The `data/` volume is what makes state survive `down` + redeploy. Do not replace it
  with a bind mount to a path inside the deploy folder unless you also handle ownership
  for uid 1000 (`node`).
- Secrets never enter an image layer: `.env` is in `.dockerignore` and injected at runtime.

---

## Deployment

`.github/workflows/deploy.flow.yml`, on push to `main`, monthly cron, or manual dispatch.

1. `docker` job — buildx builds `Dockerfile.prod`, pushes `:main` and `:<sha>` to
   Docker Hub. Pull requests build but **do not** push.
2. `deploy` job — `production` environment; SSH; writes `.env` from secrets; scp's
   `docker-compose.yml` + `.env`; then `down` → `pull` → `up -d` → `container prune`;
   finally polls `/health` on the server and dumps container logs on failure.

Only `docker-compose.yml` and `.env` reach the server. The server never sees the
source tree or the Dockerfiles — the prod image must therefore be fully self-contained.

The monthly cron redeploy exists to pick up base-image security patches; keep the
`node:24-alpine` tag floating (do not pin to a digest) or it becomes a no-op.

---

## Middleware order — load-bearing

All middleware lives in `app.ts` and its order is deliberate. It previously sat in
`server.ts`, i.e. *after* `app.ts` had already mounted the routes and the catch-all
redirect, which made it unreachable: the app ran with no security headers, no access
log and no rate limiting.

```
trust proxy → helmet → cors → cookieParser → static → body parsers
            → GET / → GET /health → rate limiter → /api routes
            → catch-all redirect → error handler (4 args)
```

Three constraints on that order:

- `/health` is mounted **before** the rate limiter. The container healthcheck polls it
  every 30s and must never be throttled.
- The rate limiter is scoped to `/api`, not global. One page load pulls ~10 static files
  and would otherwise consume the entire window.
- The error handler **must** keep its 4th parameter (`_next`). Express identifies error
  handlers by arity; with three parameters it is silently registered as ordinary
  middleware and never runs.

`app.set('trust proxy', 1)` is required because Apache is the only entry point — without
it `req.ip` is the proxy address and every client shares a single rate-limit bucket.
Note that `fingerprint.utils.ts` reads the `x-forwarded-for` header directly and is
unaffected by this setting.

### CSP

`helmet`'s default CSP is overridden in `app.ts` because the defaults break the frontend:

| Default directive | Why it breaks | Current value |
|---|---|---|
| `script-src-attr 'none'` | `onclick=""` in `index.html` and `renderRestaurants()` | `'unsafe-inline'` |
| `style-src 'self' https:` | Google Fonts stylesheet | pinned to `fonts.googleapis.com` |
| `font-src 'self' https:` | Google Fonts files | pinned to `fonts.gstatic.com` |

Replacing the two inline `onclick` handlers with event delegation would let
`script-src-attr` go back to `'none'`. That is the only thing standing in the way.

`apache.conf` also sets `Strict-Transport-Security`, `X-Content-Type-Options`,
`X-Frame-Options` and `Referrer-Policy`. Apache's `Header always set` wins, so those
four are defined in two places — change both or neither.

---

## Known issues (unfixed, deliberately)

- **`cors({ origin: true, credentials: true })`** reflects any origin with credentials.
  The frontend is served by this same process, so the `cors` middleware could simply be
  removed rather than configured.
- **The error handler always answers 500**, ignoring `err.status`. Malformed JSON, which
  body-parser reports as a 400, is returned to the client as a 500.
- **XSS in `renderRestaurants()`** (`public/script.js`): `restaurant.name` goes into
  `innerHTML` unescaped, and `create` accepts any string. The CSP does not stop this.
- **Unknown paths redirect to `/` with a 200 HTML body**, including missing assets —
  `index.html` references a non-existent `script.css` and gets HTML back.
- **No test suite.** `npm test` is a placeholder that always succeeds; CI proves nothing.
