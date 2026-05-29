# InSession Marketplace

Full-stack course marketplace built with dependency-free Node.js, HTML, CSS, and vanilla JavaScript.

## Run

```bash
npm start
```

Open `http://localhost:4173`.

## Features

- Course catalog API with search, filters, sorting, and facets
- Learner sign-in using email-based local sessions
- Saved courses and cart synchronization for signed-in learners
- Checkout API with persisted orders and enrollment history
- Admin metrics API for users, revenue, orders, enrollments, and top courses
- Static production serving from the same Node process
- Postgres persistence when `DATABASE_URL` or `POSTGRES_URL` is configured
- Local JSON fallback in `data/store.json`

## API

- `GET /api/health`
- `GET /api/catalog`
- `GET /api/courses/:id`
- `POST /api/auth/start`
- `GET /api/me`
- `PUT /api/me/saved`
- `PUT /api/cart`
- `POST /api/orders`
- `GET /api/admin/metrics`

## Storage

Production should use a Vercel Marketplace Postgres integration such as Neon. The server automatically uses Postgres when `DATABASE_URL` or `POSTGRES_URL` exists. Without those variables, it falls back to local JSON persistence.
