const express = require('express'); // Express framework for building the server
const session = require('express-session'); // Session management for shopping cart and authentication state
const cors = require('cors'); // CORS middleware to allow cross-origin requests from the frontend
const path = require('path'); // Path module for handling file paths
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.static(path.join(__dirname, 'public'))); // Serve HTML/CSS/JS

// Session Config (For Shopping Cart and Authentication State)
app.use(session({
  secret: process.env.SESSION_SECRET || 'electrohub_secret_key_123', 
  resave: false, // Don't save session if unmodified
  saveUninitialized: true,
  cookie: {
    secure: false, // Set to true if using HTTPS
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// API Route Providers
const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const cartRoutes = require('./routes/cart');
const adminRoutes = require('./routes/admin');
const newsletterRoutes = require('./routes/newsletter');
const messageRoutes = require('./routes/messages');

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/messages', messageRoutes);

// Catch-all route to redirect cleanly to home page
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html')); // any route that is not an API route will serve the frontend's index.html, allowing React Router to handle the routing on the client side
});

// Boot Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ElectroHub Backend Server successfully started on http://localhost:${PORT}`);
});
