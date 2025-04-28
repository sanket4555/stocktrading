# Stock Trading Application

A full-stack web application for simulating stock trading activities, portfolio management, and financial analysis.

## Overview

This stock trading platform allows users to:
- Create and manage their accounts
- View real-time and historical stock data
- Buy and sell stocks
- Track transaction history
- Manage and analyze their investment portfolio

## Technology Stack

### Backend
- **Node.js** with **Express.js** framework
- **MongoDB** for database
- **JWT** for authentication
- **RESTful API** architecture

### Frontend
- **HTML/CSS/JavaScript** static files
- Responsive design for desktop and mobile devices

## Project Structure

```
stock-trading-app/
├── .env                    # Environment variables
├── package.json            # Project configuration and dependencies
├── backend/                # Server-side code
│   ├── config/             # Configuration files
│   ├── controllers/        # Request handlers
│   ├── middleware/         # Custom middleware
│   ├── models/             # Database models
│   │   ├── User.js         # User model
│   │   ├── Stock.js        # Stock model
│   │   ├── Transaction.js  # Transaction model
│   │   └── Portfolio.js    # Portfolio model
│   ├── routes/             # API routes
│   └── server.js           # Main server file
└── frontend/               # Client-side code
    └── public/             # Static files
        ├── css/            # Stylesheets
        ├── js/             # JavaScript files
        └── *.html          # HTML pages
```

## Installation

### Prerequisites
- Node.js (v14 or higher)
- MongoDB (v4 or higher)

### Steps

1. Clone the repository
   ```
   git clone <repository-url>
   cd stock-trading-app
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Configure environment variables
   Create a `.env` file in the root directory with the following variables:
   ```
   PORT=5000
   MONGO_URI=mongodb://localhost:27017/stock-trading-app
   JWT_SECRET=your_jwt_secret
   NODE_ENV=development
   ```

4. Start the application
   - For development (with hot reloading):
     ```
     npm run dev
     ```
   - For backend only:
     ```
     npm run server
     ```

## API Endpoints

### User Routes
- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Authenticate a user
- `GET /api/users/profile` - Get user profile (protected)
- `PUT /api/users/profile` - Update user profile (protected)

### Stock Routes
- `GET /api/stocks` - Get all stocks
- `GET /api/stocks/:id` - Get stock details
- `GET /api/stocks/search/:query` - Search for stocks

### Transaction Routes
- `POST /api/transactions` - Create a new transaction (buy/sell)
- `GET /api/transactions` - Get user's transaction history
- `GET /api/transactions/:id` - Get transaction details

### Portfolio Routes
- `GET /api/portfolio` - Get user's portfolio summary
- `GET /api/portfolio/performance` - Get portfolio performance metrics

## Features

- **User Authentication**: Secure login and registration system
- **Stock Data**: Access to stock information and historical data
- **Trading Simulation**: Buy and sell stocks with virtual currency
- **Portfolio Management**: Track and analyze investment portfolio
- **Transaction History**: Complete record of all trading activities

## Development

### Seeding Data
To populate the database with initial data:
```
npm run seed
```

To remove all seeded data:
```
npm run seed:destroy
```

## Accessing the Application

Once the server is running:
- **Frontend**: http://localhost:5000
- **API**: http://localhost:5000/api/test

## License

ISC

## Author

[SANKET]
