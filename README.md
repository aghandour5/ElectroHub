# ElectroHub E-Commerce Platform

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Version](https://img.shields.io/github/package-json/v/aghandour5/electrohub-ecommerce)](https://github.com/aghandour5/electrohub-ecommerce)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D18.0.0-brightgreen)](https://nodejs.org/)

ElectroHub is a full-stack electronics store built with Node.js, Express, PostgreSQL/Supabase, and a responsive HTML/CSS/Bootstrap frontend. It includes product browsing, session cart management, checkout, order history, admin operations, newsletter sending, Slack contact alerts, coupons, product reviews, and in-app notifications.

## Features

- Secure registration, login, logout, password reset, profile update, and password change flows.
- Session-backed cart with server-side product price and stock validation.
- Transactional checkout with order and order item records.
- Coupon validation through the database-backed `/api/cart/apply-coupon` endpoint.
- Customer order history and product review eligibility.
- Admin dashboard for users, orders, product stock, product creation, and newsletter broadcasts.
- In-app notifications for account welcome, order placement, and order status updates.
- Contact form persistence with optional Slack webhook alerts.
- Supabase Storage image uploads with Sharp-based WebP optimization.
- Compression, Helmet security headers, rate limiting, and secure session cookie settings.

## Tech Stack

Frontend:
- HTML5, CSS3, Bootstrap 5, jQuery 3.7, Chart.js, Swiper

Backend:
- Node.js, Express 5, PostgreSQL via `pg`, Supabase Storage, `express-session`, `bcryptjs`, `helmet`, `compression`, `express-rate-limit`, `multer`, `sharp`, `resend`

Database:
- PostgreSQL hosted locally or through Supabase.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Create your environment file:

```bash
cp .env.example .env
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

3. Fill the required values in `.env`:

```env
SUPABASE_DB_URL=postgresql://...
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SESSION_SECRET=replace_with_a_long_random_secret
SESSION_COOKIE_SECURE=false
RESEND_API_KEY=re_your_resend_api_key
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

Use `SESSION_COOKIE_SECURE=true` only when the app is served over HTTPS. In production, `SESSION_SECRET` is required and the app will fail fast if it is missing.

4. Initialize the database:

```bash
node database/scripts/init_db.js
```

This creates the schema, applies compatibility columns for existing databases, seeds base categories, coupons, testimonials, and optionally creates an admin account.

5. Optional admin bootstrap:

```env
DEFAULT_ADMIN_NAME=ElectroHub Admin
DEFAULT_ADMIN_EMAIL=admin@example.com
DEFAULT_ADMIN_PASSWORD=replace_with_a_strong_admin_password
```

Run `node database/scripts/init_db.js` after setting these values. The script will create the account or promote the matching email to admin.

6. Optional full product catalog seed:

```bash
node database/scripts/seed.js
```

7. Start the app:

```bash
npm start
```

Open `http://localhost:3000`.

## Database Export

Submission schema export:

```text
database/electrohub_schema.sql
```

You can run this file in the Supabase SQL editor or with `psql` to recreate the schema and baseline lookup data.

## API Endpoints

Authentication:
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `PUT /api/auth/profile`
- `PUT /api/auth/change-password`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/orders`

Products:
- `GET /api/products`
- `GET /api/products/:id`
- `GET /api/products/categories/all`
- `GET /api/products/testimonials/all`
- `GET /api/products/:id/review-eligibility`
- `POST /api/products/:id/review`

Cart and checkout:
- `GET /api/cart`
- `POST /api/cart/add`
- `POST /api/cart/update`
- `POST /api/cart/remove`
- `DELETE /api/cart/remove/:id`
- `POST /api/cart/apply-coupon`
- `POST /api/cart/checkout`

Notifications:
- `GET /api/notifications`
- `PUT /api/notifications/:id/read`
- `PUT /api/notifications/read-all`

Admin:
- `GET /api/admin/dashboard`
- `GET /api/admin/users`
- `GET /api/admin/orders`
- `GET /api/admin/categories`
- `POST /api/admin/products`
- `PUT /api/admin/products/:id`
- `PUT /api/admin/products/:id/stock`
- `DELETE /api/admin/products/:id`
- `PUT /api/admin/orders/:id`
- `GET /api/admin/orders/:id/items`
- `PUT /api/admin/users/:id/role`
- `DELETE /api/admin/users/:id`

Newsletter and messages:
- `POST /api/newsletter/subscribe`
- `POST /api/newsletter/send`
- `GET /api/newsletter/unsubscribe`
- `POST /api/messages/send`
- `GET /api/messages`

## Manual Verification Checklist

- Register and log in as a customer.
- Add products to the cart, update quantities, remove products, and apply a coupon.
- Complete checkout from `checkout.html` and confirm the order appears in `profile.html`.
- Confirm notifications appear in the profile notifications tab.
- Log in as admin, update order status, and confirm the customer receives a notification.
- Create a product with an uploaded image and confirm it is stored as optimized WebP.
- Subscribe to the newsletter and send a broadcast as admin.
- Submit the contact form and confirm the message is stored. If configured, confirm the Slack alert is sent.

## Project Structure

```text
config/
  db.js
  emailTemplates.js
  session.js
database/
  electrohub_schema.sql
  scripts/init_db.js
  scripts/seed.js
public/
  css/style.css
  js/app.js
  *.html
routes/
  admin.js
  auth.js
  cart.js
  messages.js
  newsletter.js
  notifications.js
  products.js
server.js
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

Ali Sallam Ghandour

## License

MIT. See `LICENSE`.
