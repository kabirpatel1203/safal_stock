# Veneer Inventory Management System

A mobile-first web application for managing veneer stock in godowns (warehouses). Built with React, Node.js, Express, and MongoDB.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)

## Features

- **Mobile-First Design**: Optimized for phone browsers with touch-friendly UI
- **Hierarchical Organization**: Categories → SubCategories → Products
- **Smart Search**: Search across categories, subcategories, and products
- **Quantity Filtering**: Filter products by quantity ranges
- **Auto-Calculated Rakam**: Automatically calculates billing × price
- **Image Support**: Upload images or provide URLs for products
- **JWT Authentication**: Secure login with token-based auth
- **Offline Indicator**: Shows when connection is lost
- **Skeleton Loaders**: Smooth loading states throughout

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, React Router
- **Backend**: Node.js, Express, MongoDB, Mongoose
- **Authentication**: JWT (JSON Web Tokens)
- **Styling**: Tailwind CSS with mobile-first approach

## Quick Start

### Prerequisites

- Node.js 18+ installed
- MongoDB instance (local or MongoDB Atlas)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd veneer-inventory
   ```

2. **Install all dependencies**
   ```bash
   npm run install-all
   ```

3. **Configure environment variables**
   ```bash
   # Create .env file in backend folder
   cp backend/.env.example backend/.env
   ```
   
   Edit `backend/.env`:
   ```env
   MONGODB_URI=mongodb://localhost:27017/veneer-inventory
   JWT_SECRET=your-super-secret-key-change-this
   NODE_ENV=development
   PORT=5000
   ```

4. **Seed the database (optional)**
   ```bash
   npm run seed
   ```
   This creates:
   - Admin user: `admin` / `admin123`
   - Sample categories, subcategories, and products

5. **Start development servers**
   ```bash
   npm run dev
   ```
   - Frontend: http://localhost:5173
   - Backend: http://localhost:5000

### Production Build

```bash
npm run build
npm start
```

## Project Structure

```
veneer-inventory/
├── backend/
│   ├── config/
│   │   └── db.js              # MongoDB connection
│   ├── middleware/
│   │   └── auth.js            # JWT authentication
│   ├── models/
│   │   ├── User.js            # User model
│   │   ├── Category.js        # Category model
│   │   ├── SubCategory.js     # SubCategory model
│   │   └── Product.js         # Product model
│   ├── routes/
│   │   ├── auth.js            # Auth endpoints
│   │   ├── categories.js      # Category CRUD
│   │   ├── subcategories.js   # SubCategory CRUD
│   │   └── products.js        # Product CRUD
│   ├── server.js              # Express server
│   ├── seed.js                # Database seeder
│   └── package.json
├── frontend/
│   ├── public/
│   │   └── vite.svg
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx          # Login page
│   │   │   ├── Dashboard.jsx      # Main dashboard
│   │   │   ├── CategoryView.jsx   # Category detail
│   │   │   ├── SubCategoryView.jsx # Product list
│   │   │   ├── ProductModal.jsx   # Add/Edit product
│   │   │   ├── ImageModal.jsx     # Full-size image
│   │   │   ├── SearchFilter.jsx   # Search component
│   │   │   └── QuantityFilter.jsx # Qty filter dropdown
│   │   ├── utils/
│   │   │   └── api.js         # Axios API client
│   │   ├── App.jsx            # Main app with routing
│   │   ├── main.jsx           # Entry point
│   │   └── index.css          # Tailwind styles
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   └── package.json
├── Procfile                   # Heroku configuration
├── package.json               # Root package.json
└── README.md
```

## API Documentation

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Login with username/password |
| GET | `/api/auth/verify` | Verify JWT token |
| POST | `/api/auth/register` | Register new user |

### Categories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/categories` | Get all categories |
| GET | `/api/categories/:id` | Get single category |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

### SubCategories

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/subcategories` | Get subcategories (optionally filter by categoryId) |
| GET | `/api/subcategories/:id` | Get single subcategory |
| POST | `/api/subcategories` | Create subcategory |
| PUT | `/api/subcategories/:id` | Update subcategory |
| DELETE | `/api/subcategories/:id` | Delete subcategory |

### Products

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | Get products (with filters) |
| GET | `/api/products/search` | Search products globally |
| GET | `/api/products/:id` | Get single product |
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

**Query Parameters for Products:**
- `subCategoryId` - Filter by subcategory
- `categoryId` - Filter by category
- `search` - Search by name
- `qtyMin` - Minimum quantity
- `qtyMax` - Maximum quantity
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

## Deployment to Heroku

1. **Create Heroku app**
   ```bash
   heroku create your-app-name
   ```

2. **Set environment variables**
   ```bash
   heroku config:set MONGODB_URI=mongodb+srv://...
   heroku config:set JWT_SECRET=your-production-secret
   heroku config:set NODE_ENV=production
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

4. **Seed database (optional)**
   ```bash
   heroku run npm run seed
   ```

## Database Schema

### User
```javascript
{
  username: String (required, unique),
  password: String (hashed),
  createdAt: Date
}
```

### Category
```javascript
{
  name: String (required, unique),
  createdAt: Date,
  subCategoriesCount: Virtual
}
```

### SubCategory
```javascript
{
  name: String (required),
  categoryId: ObjectId (ref: Category),
  createdAt: Date,
  productsCount: Virtual
}
```

### Product
```javascript
{
  name: String (required),
  subCategoryId: ObjectId (ref: SubCategory),
  qty: Number (default: 0),
  price: Number (default: 0),
  billing: Number (default: 0),
  rakam: Virtual (billing × price),
  image: String (URL or base64),
  sampleLocation: String,
  ghodaLocation: String,
  createdAt: Date,
  updatedAt: Date
}
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `MONGODB_URI` | MongoDB connection string | - |
| `JWT_SECRET` | Secret for JWT signing | - |
| `NODE_ENV` | Environment (development/production) | development |
| `PORT` | Server port | 5000 |
| `FRONTEND_URL` | Frontend URL for CORS | http://localhost:5173 |

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start both frontend and backend in development |
| `npm run server` | Start backend only (with nodemon) |
| `npm run client` | Start frontend only |
| `npm run build` | Build frontend for production |
| `npm start` | Start production server |
| `npm run seed` | Seed database with sample data |
| `npm run install-all` | Install all dependencies |

## Default Login Credentials

After running `npm run seed`:
- **Username**: `admin`
- **Password**: `admin123`

## Security Features

- Password hashing with bcrypt
- JWT token authentication
- Helmet.js for HTTP headers
- Rate limiting (100 requests per 15 minutes)
- CORS configuration
- Input validation with express-validator

## License

MIT License - feel free to use this project for any purpose.

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
