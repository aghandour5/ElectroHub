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

### 1. Database Configuration
1. Open your native PostgreSQL console (or pgAdmin) and ensure the PostgreSQL service is active in the background.
2. The automatic setup script uses `793079` as the postgres password. You can adjust the credentials by modifying `.env` or `db.js`.

### 2. Scaffold Database & Seed
Move to the directory and run the initialization script to scaffold the schemas automatically:
```bash
node init_db.js
```
*This will create the `auratech_db`, inject all necessary tables, and pre-load 4 high-end featured products into the database.*

### 3. Launch the API Server
Start the Express application manually:
```bash
node server.js
```

### 4. Exploring the Platform
Open your browser and navigate to:
`http://localhost:3000`

## Test Credentials
Because `init_db.js` doesn't enforce a hardcoded admin user on setup (so it doesn't accidentally expose credentials strictly in code), you will need to register an account first.
- **To test Admin**: Register a user normally. Then, open your PostgreSQL tool and run:
`UPDATE users SET role = 'admin' WHERE email = 'your_email@example.com';`

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
   └── admin.js      # Protected CRUD middleware paths
/server.js           # Origin of Express instance & Server boot
/init_db.js          # Automation script mapping the PG schema
/db.js               # PostgreSQL configuration pool connector
```
