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
- JSON persistence in `data/store.json`

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
