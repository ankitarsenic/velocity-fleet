# TransitOps

Enterprise transport operations platform built with React, Flask and MySQL.

## Start

Copy .env.example to .env, then run docker compose up --build. Seed the database with docker compose exec backend python seed.py. Sign in at http://localhost:5173 with admin@transitops.local / ChangeMe123!.

## Operations

The API implements JWT login/refresh, RBAC, vehicle and driver registries, trip dispatch/completion, maintenance lifecycle, fuel logs, expenses and executive KPIs. Dispatch validates availability, license expiry and capacity before atomically moving both vehicle and driver to ON_TRIP. See docs/API.md for routes.
