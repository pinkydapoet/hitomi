# 👟 Hitomi Sneakers — Full-Stack MVC App

## Tech Stack
- **Backend**: Node.js + Express.js
- **Database**: MySQL
- **Frontend**: Vanilla JS + HTML/CSS (served by Express)
- **Auth**: JWT (JSON Web Tokens) + bcrypt
- **Architecture**: MVC (Model-View-Controller)

## Project Structure
```
hitomi/
├── backend/
│   ├── config/
│   │   └── db.js              # MySQL connection pool
│   ├── controllers/
│   │   ├── authController.js   # Register, Login, Logout
│   │   ├── productController.js# CRUD products, search, filter
│   │   ├── cartController.js   # Cart add/remove/update
│   │   ├── wishlistController.js
│   │   ├── orderController.js  # Checkout, order history
│   │   └── userController.js   # Profile, address, password
│   ├── models/
│   │   ├── User.js
│   │   ├── Product.js
│   │   ├── Cart.js
│   │   ├── Wishlist.js
│   │   └── Order.js
│   ├── routes/
│   │   ├── authRoutes.js
│   │   ├── productRoutes.js
│   │   ├── cartRoutes.js
│   │   ├── wishlistRoutes.js
│   │   ├── orderRoutes.js
│   │   └── userRoutes.js
│   ├── middleware/
│   │   ├── auth.js            # JWT verification middleware
│   │   └── errorHandler.js
│   └── server.js              # Express app entry point
├── frontend/
│   ├── public/
│   │   ├── css/style.css
│   │   └── js/app.js          # All frontend logic
│   └── views/
│       └── index.html         # Main SPA shell
├── database/
│   └── schema.sql             # Full DB schema + seed data
├── .env.example
└── package.json
```

## Setup Instructions

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env
# Edit .env with your MySQL credentials
```

### 3. Create the database
```bash
mysql -u root -p < database/schema.sql
```

### 4. Start the server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

### 5. Open in browser
```
http://localhost:3000
```

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/register | Register new user |
| POST | /api/auth/login | Login, returns JWT |
| POST | /api/auth/logout | Logout |

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/products | Get all products |
| GET | /api/products?cat=men&sort=price-asc&q=jordan | Filter/search/sort |
| GET | /api/products/:id | Get single product |

### Cart (🔒 Auth required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/cart | Get user's cart |
| POST | /api/cart | Add item to cart |
| PUT | /api/cart/:id | Update quantity |
| DELETE | /api/cart/:id | Remove item |
| DELETE | /api/cart | Clear cart |

### Wishlist (🔒 Auth required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/wishlist | Get wishlist |
| POST | /api/wishlist | Add to wishlist |
| DELETE | /api/wishlist/:productId | Remove from wishlist |

### Orders (🔒 Auth required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/orders | Get order history |
| POST | /api/orders | Place order (checkout) |
| GET | /api/orders/:id | Get order detail |

### User (🔒 Auth required)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/user/profile | Get profile |
| PUT | /api/user/profile | Update profile |
| PUT | /api/user/password | Change password |

## Default Test Accounts
- **Admin**: admin@hitomi.com / admin123
- **User**: user@hitomi.com / user123

## Coupon Codes
- `HITOMI10` — 10% off
- `WELCOME20` — 20% off (new users)
- `SALE50` — 50% off sale items
