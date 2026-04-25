# ElectroHub E-Commerce Platform

ElectroHub is a polished, full-stack, competition-ready e-commerce platform designed for selling premium electronics. It focuses heavily on extremely elegant UI/UX design fused with a robust, functional backend capable of secure session handling and real-time AJAX operations.

## Features
*   **Dual Authentication**: Encrypted registration and login flows using `bcryptjs`.
*   **Dynamic AJAX Cart**: Users can seamlessly add and remove products without page reloads.
*   **PostgreSQL Persistence**: Fully structured relational SQL tables storing users, categories, products, and checkout orders.
*   **Secure Checkout Loop**: Simulates a safe and fluid stock-checked transactional environment.
*   **Admin Dashboard**: Restricted `admin` area providing immediate insights (total users/orders) and allowing full CRUD (Create, Read, Update, Delete) capability for the product inventory.
*   **AOS Animations & Glassmorphism**: Provides buttery-smooth visuals across all HTML5 views.

## Technologies Used
- **Frontend**: HTML5, Vanilla CSS3, Bootstrap 5, jQuery 3.7 (AJAX)
- **Backend Architecture**: Node.js, Express.js
- **Database**: PostgreSQL (via `pg` pool connector)
- **Security**: `express-session` (Memory store), `bcryptjs` (Password hashing)

## Installation & Local Execution

### 1. Database & Notifications Configuration
1. Open your native PostgreSQL console (or pgAdmin) and ensure the PostgreSQL service is active.
2. The automatic setup script uses `793079` as the postgres password. Adjust credentials in `.env`.
3. **Slack Feedback (Optional)**: If you want to receive real-time notifications for contact form submissions, create an "Incoming Webhook" on Slack and add it to your `.env` file:
   `SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T0000/B0000/XXXX`

### 2. Scaffold Database & Seed
Move to the directory and run the initialization script to scaffold the schemas automatically:
```bash
node database/scripts/init_db.js
```
*This will create the necessary tables and pre-load 4 high-end featured products into the database.*

To load the full product catalog:
```bash
node database/scripts/seed.js
```

### 3. Launch the API Server
Start the Express application:
```bash
npm install
node server.js
```

### 4. Exploring the Platform
Open your browser and navigate to:
`http://localhost:3000`

## Test Credentials
Because `init_db.js` doesn't enforce a hardcoded admin user on setup, you will need to register an account first.
- **To test Admin**: Register a user normally. Then, use a database tool (or the provided admin promotion logic) to set `role = 'admin'` for your user.

## Project Structure Overview
```text
/public/             # Static Assets & Frontend Interface
   ├── css/          # Core styling configurations
   ├── js/app.js     # Master AJAX logic bridging DOM to Backend
   ├── index.html    # Shop discovery landing page
   ├── cart.html     # Cart & Checkout interaction page
   ├── login.html    # Authentication mechanisms
   └── admin.html    # Operator CRUD & Insights Dashboard
/routes/             # Express API Endpoints
   ├── auth.js       # Register, Login, Logout, Session check
   ├── products.js   # Dynamic DB product retrieval mappings
   ├── cart.js       # Session-bound Cart & checkout transaction
   ├── admin.js      # Protected CRUD middleware paths
   └── messages.js   # Real-time contact form submission handling
/config/             # Configuration files
   └── db.js         # PostgreSQL configuration pool connector
/database/scripts/   # Database initialization and seeding
   ├── init_db.js    # Automation script mapping the PG schema
   └── seed.js       # Standardized product seeding script
/server.js           # Origin of Express instance & Server boot
```
