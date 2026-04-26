# ElectroHub E-Commerce Platform 🛒

[![Node.js Version](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-blue)](https://www.postgresql.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

ElectroHub is a modern, full-stack e-commerce platform built for selling premium electronics. It combines an elegant, responsive UI with a robust backend featuring secure authentication, real-time AJAX interactions, and comprehensive admin capabilities.

## ✨ Features

- **🔐 Secure Authentication**: Encrypted user registration and login with bcrypt hashing
- **🛒 Dynamic Shopping Cart**: AJAX-powered cart management without page reloads
- **📊 PostgreSQL Database**: Structured relational data for users, products, orders, and categories
- **💳 Secure Checkout**: Transactional order processing with stock validation
- **👨‍💼 Admin Dashboard**: Restricted admin area with user/order insights and full product CRUD
- **🎨 Modern UI/UX**: Glassmorphism design with smooth AOS animations
- **📱 Responsive Design**: Mobile-first approach with Bootstrap 5
- **📧 Real-time Notifications**: Slack integration for contact form submissions

## 🛠️ Tech Stack

### Frontend
- **HTML5** - Semantic markup
- **CSS3** - Custom styling with glassmorphism effects
- **Bootstrap 5** - Responsive framework
- **jQuery 3.7** - AJAX operations and DOM manipulation
- **AOS (Animate On Scroll)** - Smooth scroll animations

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **PostgreSQL** - Primary database
- **Supabase** - Cloud database hosting
- **express-session** - Session management
- **bcryptjs** - Password hashing

### Development Tools
- **pg** - PostgreSQL client
- **dotenv** - Environment variable management

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (>= 16.0.0)
- **PostgreSQL** (>= 15.0)
- **npm** or **yarn**
- **Git**

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/electrohub.git
cd electrohub
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=your_postgres_password
SUPABASE_DB_URL=your_supabase_connection_string

# Session Configuration
SESSION_SECRET=your_super_secret_session_key

# Slack Notifications (Optional)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
```

### 4. Database Setup

#### Option A: Local PostgreSQL
1. Ensure PostgreSQL is running on your system
2. Update `.env` with your local database credentials

#### Option B: Supabase (Recommended)
1. Create a [Supabase](https://supabase.com) account
2. Create a new project
3. Copy the connection string to `SUPABASE_DB_URL` in `.env`

### 5. Initialize Database

Run the database initialization script:

```bash
node database/scripts/init_db.js
```

This will:
- Create all necessary tables (users, categories, products, orders, etc.)
- Set up relationships and constraints
- Seed initial categories and featured products

### 6. Seed Additional Data (Optional)

For a fuller product catalog:

```bash
node database/scripts/seed.js
```

### 7. Start the Application

```bash
npm start
# or for development
npm run dev
```

The application will be available at `http://localhost:3000`

## 🧪 Testing

### Test Credentials

After setup, register a new user account. To test admin features:

1. Register normally
2. Use a database tool to update the user's role:
   ```sql
   UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
   ```

### Manual Testing

- **User Flow**: Register → Browse Products → Add to Cart → Checkout
- **Admin Flow**: Login as admin → Access `/admin.html` → Manage products
- **API Testing**: Use tools like Postman to test endpoints

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/check` - Check current session

### Products
- `GET /api/products` - Get all products (with optional filters)
- `GET /api/products/:id` - Get single product details
- `GET /api/products/categories/all` - Get all categories
- `GET /api/products/testimonials/all` - Get testimonials
- `GET /api/products/:id/review-eligibility` - Check review eligibility
- `POST /api/products/:id/review` - Submit product review

### Cart & Orders
- `GET /api/cart` - Get user's cart
- `POST /api/cart/add` - Add item to cart
- `POST /api/cart/update` - Update cart item quantity
- `DELETE /api/cart/remove/:id` - Remove item from cart
- `POST /api/cart/checkout` - Process checkout

### Admin (Protected)
- `GET /api/admin/stats` - Get dashboard statistics
- `GET /api/admin/products` - Get all products for management
- `POST /api/admin/products` - Create new product
- `PUT /api/admin/products/:id` - Update product
- `DELETE /api/admin/products/:id` - Delete product

### Messages
- `POST /api/messages/contact` - Send contact form message

## 📁 Project Structure

```
electrohub/
├── config/
│   ├── db.js                 # Database connection configuration
│   └── emailTemplates.js     # Email template configurations
├── database/
│   └── scripts/
│       ├── init_db.js        # Database initialization
│       └── seed.js           # Data seeding
├── public/
│   ├── css/
│   │   └── style.css         # Main stylesheet
│   ├── js/
│   │   └── app.js            # Frontend JavaScript
│   ├── images/               # Product images
│   ├── index.html            # Home page
│   ├── shop.html             # Product listing
│   ├── product.html          # Product details
│   ├── cart.html             # Shopping cart
│   ├── checkout.html         # Checkout process
│   ├── login.html            # Authentication
│   ├── profile.html          # User profile
│   ├── admin.html            # Admin dashboard
│   └── contact.html          # Contact form
├── routes/
│   ├── auth.js               # Authentication routes
│   ├── products.js           # Product management
│   ├── cart.js               # Cart operations
│   ├── admin.js              # Admin functionality
│   ├── messages.js           # Contact/message handling
│   └── newsletter.js         # Newsletter subscriptions
├── server.js                 # Main application entry point
├── package.json              # Dependencies and scripts
├── .env                      # Environment variables (gitignored)
└── README.md                 # This file
```

## 🔧 Development

### Available Scripts

```bash
npm start          # Start production server
npm run dev        # Start development server with auto-reload
npm test           # Run tests (if implemented)
npm run lint       # Lint code (if configured)
```

### Code Style

- Use consistent indentation (2 spaces)
- Follow JavaScript ES6+ standards
- Use meaningful variable and function names
- Add JSDoc comments for complex functions

## 🚀 Deployment

### Environment Variables for Production

Ensure these are set in your production environment:

```env
NODE_ENV=production
SESSION_SECRET=your_production_secret
SUPABASE_DB_URL=your_production_db_url
SLACK_WEBHOOK_URL=your_slack_webhook
```

### Recommended Hosting

- **Frontend**: Vercel, Netlify, or any static hosting
- **Backend**: Heroku, Railway, or DigitalOcean App Platform
- **Database**: Supabase, PlanetScale, or AWS RDS

### Build Process

1. Ensure all dependencies are installed
2. Run database migrations if needed
3. Set production environment variables
4. Start the server with `npm start`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature-name`
3. Commit your changes: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature-name`
5. Open a Pull Request

### Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Bootstrap for the responsive framework
- AOS for smooth animations
- PostgreSQL for reliable data storage
- Supabase for cloud database hosting

## 📞 Support

If you have any questions or need help:

- Open an issue on GitHub
- Check the documentation
- Contact the maintainers

---

**Happy Shopping! 🛍️**
