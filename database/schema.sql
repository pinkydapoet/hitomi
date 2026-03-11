-- ============================================================
--  Hitomi Sneakers — MySQL Schema & Seed Data
--  Run: mysql -u root -p < database/schema.sql
-- ============================================================

CREATE DATABASE IF NOT EXISTS hitomi_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hitomi_db;

-- ─────────────────────────────────────────
--  USERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  first_name  VARCHAR(100) NOT NULL,
  last_name   VARCHAR(100) NOT NULL DEFAULT '',
  email       VARCHAR(255) NOT NULL UNIQUE,
  password    VARCHAR(255) NOT NULL,
  phone       VARCHAR(30)  DEFAULT NULL,
  dob         DATE         DEFAULT NULL,
  role        ENUM('user','admin') NOT NULL DEFAULT 'user',
  created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- ─────────────────────────────────────────
--  ADDRESSES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS addresses (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  street      VARCHAR(255) DEFAULT '',
  city        VARCHAR(100) DEFAULT '',
  zip         VARCHAR(20)  DEFAULT '',
  country     VARCHAR(100) DEFAULT '',
  is_default  TINYINT(1)   DEFAULT 1,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ─────────────────────────────────────────
--  CATEGORIES
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id    INT AUTO_INCREMENT PRIMARY KEY,
  name  VARCHAR(100) NOT NULL,
  slug  VARCHAR(100) NOT NULL UNIQUE
);

-- ─────────────────────────────────────────
--  PRODUCTS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS products (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  description   TEXT,
  price         DECIMAL(10,2) NOT NULL,
  original_price DECIMAL(10,2) DEFAULT NULL,
  image_url     VARCHAR(500)  DEFAULT '',
  category_id   INT NOT NULL,
  brand         VARCHAR(100)  DEFAULT '',
  rating        DECIMAL(3,1)  DEFAULT 4.5,
  stock         INT           DEFAULT 100,
  is_active     TINYINT(1)    DEFAULT 1,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- ─────────────────────────────────────────
--  COUPONS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS coupons (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  code            VARCHAR(50) NOT NULL UNIQUE,
  discount_type   ENUM('percent','fixed') NOT NULL DEFAULT 'percent',
  discount_value  DECIMAL(10,2) NOT NULL,
  min_order_amt   DECIMAL(10,2) DEFAULT 0,
  max_uses        INT DEFAULT 1000,
  used_count      INT DEFAULT 0,
  expires_at      DATETIME DEFAULT NULL,
  is_active       TINYINT(1) DEFAULT 1
);

-- ─────────────────────────────────────────
--  CART
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS cart_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  product_id  INT NOT NULL,
  quantity    INT NOT NULL DEFAULT 1,
  size        VARCHAR(10) DEFAULT 'US 8',
  added_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_cart_item (user_id, product_id, size)
);

-- ─────────────────────────────────────────
--  WISHLIST
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS wishlist_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  user_id     INT NOT NULL,
  product_id  INT NOT NULL,
  added_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE,
  UNIQUE KEY unique_wish (user_id, product_id)
);

-- ─────────────────────────────────────────
--  ORDERS
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  user_id       INT NOT NULL,
  subtotal      DECIMAL(10,2) NOT NULL,
  shipping      DECIMAL(10,2) NOT NULL DEFAULT 40.00,
  import_charges DECIMAL(10,2) NOT NULL DEFAULT 128.00,
  discount      DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total         DECIMAL(10,2) NOT NULL,
  coupon_code   VARCHAR(50) DEFAULT NULL,
  status        ENUM('processing','shipped','delivered','cancelled') DEFAULT 'processing',
  shipping_address TEXT DEFAULT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS order_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT NOT NULL,
  product_id  INT NOT NULL,
  quantity    INT NOT NULL,
  size        VARCHAR(10) DEFAULT 'US 8',
  price       DECIMAL(10,2) NOT NULL,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- ============================================================
--  SEED DATA
-- ============================================================

-- Categories
INSERT INTO categories (name, slug) VALUES
  ('Men''s Shoes', 'men'),
  ('Women''s Shoes', 'women'),
  ('Sale', 'sale')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Products
INSERT INTO products (name, description, price, original_price, image_url, category_id, brand, rating) VALUES
  ('Air Jordan 1 University Gold',
   'Classic Jordan 1 in University Gold and Light Bordeaux colorway. Perfect for streetwear.',
   170.00, NULL,
   'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=400&q=80',
   1, 'Jordan', 4.8),

  ('Air Jordan 1 Mid Paris',
   'Limited edition Air Jordan 1 Mid inspired by the city of Paris. Sleek and stylish.',
   130.00, NULL,
   'https://images.unsplash.com/photo-1539185441755-769473a23570?w=400&q=80',
   1, 'Jordan', 4.7),

  ('Air Jordan 1 Mid SE',
   'Special Edition Jordan 1 with premium materials and unique detailing.',
   135.00, NULL,
   'https://images.unsplash.com/photo-1612902456551-b6a38da5d4a5?w=400&q=80',
   1, 'Jordan', 4.6),

  ('Jordan 6-17-23',
   'Retro Jordan silhouette blending heritage and modern style.',
   150.00, NULL,
   'https://images.unsplash.com/photo-1515955656352-a1fa3ffcd111?w=400&q=80',
   1, 'Jordan', 4.5),

  ('Nike Air Zoom Pegasus 36 Miami',
   'Miami colorway Nike Air Zoom Pegasus 36. Engineered for speed and comfort.',
   299.00, NULL,
   'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&q=80',
   2, 'Nike', 4.9),

  ('ZIG Kinetica Shoes',
   'Reebok ZIG Kinetica with energy-return ZIG technology for everyday performance.',
   160.00, NULL,
   'https://images.unsplash.com/photo-1465453869711-7e174808ace9?w=400&q=80',
   2, 'Reebok', 5.0),

  ('Reebok NANO X Shoes',
   'The most versatile trainer in the game. Perfect for gym and street.',
   140.00, NULL,
   'https://images.unsplash.com/photo-1511556532299-8f662fc26c06?w=400&q=80',
   2, 'Reebok', 4.9),

  ('Nike Dunk Low Pink',
   'Pastel pink Nike Dunk Low — a fan-favorite with retro basketball heritage.',
   120.00, NULL,
   'https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=400&q=80',
   2, 'Nike', 4.8),

  ('Adidas Superstar White',
   'Classic Adidas Superstar with shell toe. Iconic streetwear staple.',
   90.00, 180.00,
   'https://images.unsplash.com/photo-1607522370275-f14206abe5d3?w=400&q=80',
   3, 'Adidas', 4.8),

  ('New Balance 990v5',
   'Made in USA New Balance 990v5. The ultimate grey sneaker.',
   155.00, 310.00,
   'https://images.unsplash.com/photo-1562183241-840b8af0721e?w=400&q=80',
   3, 'New Balance', 4.7),

  ('Vans Old Skool Pro',
   'Skate-ready Vans Old Skool with reinforced toe cap.',
   65.00, 130.00,
   'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?w=400&q=80',
   3, 'Vans', 4.6);

-- Coupons
INSERT INTO coupons (code, discount_type, discount_value, min_order_amt) VALUES
  ('HITOMI10',  'percent', 10.00, 0),
  ('WELCOME20', 'percent', 20.00, 0),
  ('SALE50',    'percent', 50.00, 100)
ON DUPLICATE KEY UPDATE discount_value=VALUES(discount_value);