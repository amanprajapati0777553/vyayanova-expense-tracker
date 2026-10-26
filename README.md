# VyayaNova — MERN Expense Tracker

A responsive full-stack expense tracker built with React, Vite, Express, MongoDB and JWT authentication.

## Project naming
- App name: `VyayaNova`
- GitHub repository: `vyayanova-expense-tracker`
- Backend folder: `backend`
- Frontend folder: `frontend`
- MongoDB database: `vyayanova_db`
- Server deployment: `vyayanova-api`

## Features
- Register/login with bcrypt password hashing and JWT-protected API routes
- Create, edit, delete and list income/expense transactions
- Dashboard totals for income, expenses and balance
- Search by title; filter by type, category and date range
- Expense category donut chart
- Per-user data isolation on transaction reads, edits and deletes
- Responsive desktop and mobile interface

## Requirements
- Node.js 18+ (20+ recommended)
- MongoDB local instance or MongoDB Atlas database

## Setup

### 1. Start the backend
```bash
cd backend
npm install
```
Copy `.env.example` to `.env`, then configure `MONGODB_URI` and a strong, random `JWT_SECRET`. The local database name is `vyayanova_db`.

```bash
npm run dev
```
API runs at `http://localhost:5000`. Health check: `http://localhost:5000/api/health`.

### 2. Start the frontend (new terminal)
```bash
cd frontend
npm install
```
Copy `.env.example` to `.env` (default API URL is `http://localhost:5000/api`), then:
```bash
npm run dev
```
Open the Vite URL, normally `http://localhost:5173`.

## Deploy on Render

The repository includes [`render.yaml`](./render.yaml) for deploying the API and frontend
as separate Render services:

- API service: `vyayanova-api`
- Static frontend service: `vyayanova`

In MongoDB Atlas, create the `vyayanova_db` database, allow the Render service to connect,
and copy the generated connection string into the API service's `MONGODB_URI` environment
variable. Set `JWT_SECRET` to a long random value and set `CLIENT_URL` to the deployed
frontend URL. Set the frontend's `VITE_API_URL` to the deployed API URL followed by `/api`,
for example `https://vyayanova-api.onrender.com/api`.

## API endpoints
All transaction endpoints require `Authorization: Bearer <JWT>`.

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Register account |
| POST | `/api/auth/login` | Log in |
| GET | `/api/auth/me` | Current user |
| GET | `/api/transactions` | List/filter transactions |
| POST | `/api/transactions` | Create transaction |
| PATCH | `/api/transactions/:id` | Update transaction |
| DELETE | `/api/transactions/:id` | Delete transaction |
| GET | `/api/transactions/summary` | Income, expenses, balance and category totals |

Optional list/summary query parameters: `from=YYYY-MM-DD`, `to=YYYY-MM-DD`; list additionally accepts `type=income|expense`, `category=Food`, and `search=salary`.

## Security notes before production
- Use HTTPS and a strong secret stored in your hosting provider's environment settings.
- For production, consider moving JWT storage from localStorage to secure, HttpOnly cookies with CSRF protections.
- Add rate limiting, request logging, stricter validation and automated tests before public launch.
- Configure CORS to the exact deployed frontend origin. Never commit `.env` files.

## Suggested manual test checklist
- [ ] Register and log out, then log in again
- [ ] Add income and an expense; verify balance = income − expenses
- [ ] Edit and delete a transaction
- [ ] Search and filter by type, category and dates
- [ ] Register a second account and verify it cannot see the first account's transactions
- [ ] Refresh the page and verify session behavior
- [ ] Check mobile layout at 375px width
