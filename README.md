# Node.js TypeScript MySQL Auth API

A RESTful authentication API built with Node.js, TypeScript, Express, Sequelize, and MySQL.

## Live URLs
- **Backend API:** https://your-backend.onrender.com
- **Swagger Docs:** https://your-backend.onrender.com/api-docs
- **Frontend:** https://your-frontend.onrender.com

> Update the URLs above after deployment.

## Features
- JWT authentication with refresh tokens (HttpOnly cookies)
- Email verification on registration
- Forgot password / reset password flow
- Role-based access control (Admin & User)
- Swagger/OpenAPI documentation
- MySQL via Sequelize ORM

## Local Setup

### Prerequisites
- Node.js 18+
- MySQL running locally

### Install & Run
```bash
npm install
```

Create a `config.json` in the root (this file is gitignored — never commit it):
```json
{
  "database": {
    "host": "localhost",
    "port": 3306,
    "user": "root",
    "password": "your-password",
    "database": "node_boilerplate"
  },
  "secret": "your-jwt-secret-key",
  "emailFrom": "noreply@example.com",
  "smtpOptions": {
    "host": "smtp.ethereal.email",
    "port": 587,
    "auth": {
      "user": "your-ethereal-user",
      "pass": "your-ethereal-pass"
    }
  }
}
```

```bash
npm run dev
```

API runs at `http://localhost:4000`
Swagger docs at `http://localhost:4000/api-docs`

## Production Environment Variables (Render)

| Variable | Description |
|---|---|
| `NODE_ENV` | Set to `production` |
| `JWT_SECRET` | Strong random secret key |
| `DB_HOST` | MySQL host |
| `DB_PORT` | MySQL port (default 3306) |
| `DB_USER` | MySQL username |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | Database name |
| `DB_SSL` | Set to `true` for managed DB hosts |
| `CORS_ORIGIN` | Exact frontend URL e.g. `https://your-frontend.onrender.com` |
| `COOKIE_SECURE` | Set to `true` in production |
| `EMAIL_FROM` | Sender email address |
| `SMTP_HOST` | SMTP server host |
| `SMTP_PORT` | SMTP port |
| `SMTP_USER` | SMTP username |
| `SMTP_PASS` | SMTP password |

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | /accounts/authenticate | Login |
| POST | /accounts/refresh-token | Refresh JWT |
| POST | /accounts/revoke-token | Logout |
| POST | /accounts/register | Register |
| POST | /accounts/verify-email | Verify email |
| POST | /accounts/forgot-password | Request password reset |
| POST | /accounts/validate-reset-token | Validate reset token |
| POST | /accounts/reset-password | Reset password |
| GET | /accounts | Get all accounts (Admin) |
| GET | /accounts/:id | Get account by ID |
| POST | /accounts | Create account (Admin) |
| PUT | /accounts/:id | Update account |
| DELETE | /accounts/:id | Delete account |
