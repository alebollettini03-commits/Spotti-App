# CityLive Affluenza Locali

CityLive helps people discover places with atmosphere in Torino, browse events, and save their plans.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/citylive/src/App.tsx` — map, events, authentication, booking flows, and user-facing routes.
- `artifacts/citylive/src/lib/firebase.ts` — Firebase Auth and Firestore client setup.
- `artifacts/citylive/src/index.css` — CityLive visual language and Leaflet presentation overrides.
- `attached_assets/` — original product brief.

## Architecture decisions

- Leaflet and OpenStreetMap power the discovery map; venue coordinates are kept in the local demo catalog so the first view is useful without an admin surface.
- Google sign-in and booking persistence use the provided Firebase project; Firestore bookings are scoped by the authenticated user's UID.
- Expired bookings are deleted when the user's bookings are loaded, keeping the personal plan list current without a scheduled job.

## Product

- Full-screen Torino map with venue categories, search, marker popups, directions, and selected venue details.
- Event discovery by date, event details, Google-authenticated booking, and personal booking history.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
