import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "supersecret_ordely_key";

const db = new Database("ordely.db");

// Initialize Database Schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT CHECK(role IN ('customer', 'vendor', 'admin')) NOT NULL,
    phone TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    business_name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    address TEXT,
    phone TEXT,
    tax_id TEXT,
    website TEXT,
    facebook_url TEXT,
    instagram_url TEXT,
    linkedin_url TEXT,
    enable_loyalty INTEGER DEFAULT 0,
    loyalty_points_per_dollar REAL DEFAULT 1,
    loyalty_points_per_discount REAL DEFAULT 100,
    promo_code TEXT DEFAULT '',
    promo_discount_percent REAL DEFAULT 0,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendor_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    vat_percent REAL DEFAULT 15,
    discount_percent REAL DEFAULT 0,
    image_url TEXT,
    sku TEXT,
    stock_quantity INTEGER DEFAULT 0,
    FOREIGN KEY(vendor_id) REFERENCES vendors(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    vendor_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    total REAL NOT NULL,
    vat_total REAL NOT NULL,
    discount_percent REAL DEFAULT 0,
    discount_amount REAL DEFAULT 0,
    points_earned REAL DEFAULT 0,
    points_redeemed REAL DEFAULT 0,
    payment_method TEXT,
    payment_status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(customer_id) REFERENCES users(id),
    FOREIGN KEY(vendor_id) REFERENCES vendors(id)
  );

  CREATE TABLE IF NOT EXISTS order_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    order_id INTEGER NOT NULL,
    product_id INTEGER NOT NULL,
    product_name TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    price REAL NOT NULL,
    vat_percent REAL NOT NULL,
    discount_percent REAL DEFAULT 0,
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    sender_id INTEGER NOT NULL,
    receiver_id INTEGER NOT NULL,
    order_id INTEGER,
    message TEXT NOT NULL,
    is_read INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(sender_id) REFERENCES users(id),
    FOREIGN KEY(receiver_id) REFERENCES users(id),
    FOREIGN KEY(order_id) REFERENCES orders(id)
  );

  CREATE TABLE IF NOT EXISTS customer_loyalty (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    vendor_id INTEGER NOT NULL,
    points REAL DEFAULT 0,
    UNIQUE(customer_id, vendor_id),
    FOREIGN KEY(customer_id) REFERENCES users(id),
    FOREIGN KEY(vendor_id) REFERENCES vendors(id)
  );
`);

// Migrations for existing databases
try { db.exec("ALTER TABLE products ADD COLUMN sku TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE products ADD COLUMN stock_quantity INTEGER DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE products ADD COLUMN discount_percent REAL DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE vendors ADD COLUMN address TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE vendors ADD COLUMN phone TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE vendors ADD COLUMN tax_id TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE vendors ADD COLUMN website TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE vendors ADD COLUMN facebook_url TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE vendors ADD COLUMN instagram_url TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE vendors ADD COLUMN linkedin_url TEXT;"); } catch (e) {}
try { db.exec("ALTER TABLE vendors ADD COLUMN enable_loyalty INTEGER DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE vendors ADD COLUMN loyalty_points_per_dollar REAL DEFAULT 1;"); } catch (e) {}
try { db.exec("ALTER TABLE vendors ADD COLUMN loyalty_points_per_discount REAL DEFAULT 100;"); } catch (e) {}
try { db.exec("ALTER TABLE vendors ADD COLUMN promo_code TEXT DEFAULT '';"); } catch (e) {}
try { db.exec("ALTER TABLE vendors ADD COLUMN promo_discount_percent REAL DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE orders ADD COLUMN discount_percent REAL DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE orders ADD COLUMN discount_amount REAL DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE orders ADD COLUMN points_earned REAL DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE orders ADD COLUMN points_redeemed REAL DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE order_items ADD COLUMN discount_percent REAL DEFAULT 0;"); } catch (e) {}
try { db.exec("ALTER TABLE users ADD COLUMN phone TEXT;"); } catch (e) {}

// Seed Database Function for Simulated Data
async function seedDatabase() {
  const userCount = (db.prepare("SELECT COUNT(*) as count FROM users").get() as any).count;
  if (userCount > 0) {
    return; // Already initialized
  }

  console.log("Seeding simulated database with sample vendors, products, and orders...");

  const hash = await bcrypt.hash("password123", 10);

  // 1. Create Users
  const insertUser = db.prepare("INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)");
  
  const v1User = insertUser.run("Maria St. Clair", "vendor@islandspices.com", hash, "vendor", "+1 (758) 452-1234").lastInsertRowid;
  const v2User = insertUser.run("Marcus Augustin", "contact@caribbeancrafts.com", hash, "vendor", "+1 (758) 458-9900").lastInsertRowid;
  const v3User = insertUser.run("David Chen", "info@techhubcaribbean.com", hash, "vendor", "+1 (758) 454-3322").lastInsertRowid;

  const c1User = insertUser.run("Alex Morgan", "customer@ordely.com", hash, "customer", "+1 (758) 714-8890").lastInsertRowid;
  const c2User = insertUser.run("Samantha Reid", "samantha@example.com", hash, "customer", "+1 (758) 722-3344").lastInsertRowid;

  // 2. Create Vendor Profiles
  const insertVendor = db.prepare("INSERT INTO vendors (user_id, business_name, description, logo_url, address, phone, tax_id, website, facebook_url, instagram_url, linkedin_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  
  const v1Id = insertVendor.run(
    v1User,
    "Island Spices & Gourmet",
    "Authentic Caribbean spices, artisanal hot sauces, and organic cocoa teas handcrafted in St. Lucia.",
    "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=300&auto=format&fit=crop&q=80",
    "12 Marina Way, Castries, St. Lucia",
    "+1 (758) 452-1234",
    "TAX-SLU-8821",
    "https://islandspicesgourmet.com",
    "https://facebook.com/islandspicesgourmet",
    "https://instagram.com/islandspicesgourmet",
    "https://linkedin.com/company/islandspicesgourmet"
  ).lastInsertRowid;

  const v2Id = insertVendor.run(
    v2User,
    "Caribbean Craft & Living",
    "Handcrafted home decor, calabash baskets, coconut shell candles, and eco-friendly tropical tote bags.",
    "https://images.unsplash.com/photo-1513519245088-0e12902e5a38?w=300&auto=format&fit=crop&q=80",
    "45 Heritage Plaza, Rodney Bay, St. Lucia",
    "+1 (758) 458-9900",
    "TAX-SLU-9902",
    "https://caribbeancraftliving.com",
    "https://facebook.com/caribbeancraftliving",
    "https://instagram.com/caribbeancraftliving",
    ""
  ).lastInsertRowid;

  const v3Id = insertVendor.run(
    v3User,
    "TechHub Electronics",
    "Premium consumer electronics, portable audio gear, smart accessories, and power solutions with local warranty.",
    "https://images.unsplash.com/photo-1550009158-9ebf69173e03?w=300&auto=format&fit=crop&q=80",
    "88 Commercial Blvd, Vieux Fort, St. Lucia",
    "+1 (758) 454-3322",
    "TAX-SLU-4410",
    "https://techhubcaribbean.com",
    "https://facebook.com/techhubcaribbean",
    "https://instagram.com/techhubcaribbean",
    "https://linkedin.com/company/techhubcaribbean"
  ).lastInsertRowid;

  // 3. Create Products
  const insertProduct = db.prepare("INSERT INTO products (vendor_id, name, description, price, vat_percent, image_url, sku, stock_quantity) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

  // Vendor 1
  const p1 = insertProduct.run(v1Id, "St. Lucian Hot Pepper Sauce (250ml)", "Signature Scotch Bonnet pepper blend with local mustard and tropical fruit infusion.", 22.50, 12.5, "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=600&auto=format&fit=crop&q=80", "ISP-HPS-250", 45).lastInsertRowid;
  const p2 = insertProduct.run(v1Id, "Organic Cocoa Tea Sticks (Pack of 5)", "Traditional pure cocoa sticks for rich, authentic Caribbean breakfast cocoa tea.", 35.00, 12.5, "https://images.unsplash.com/photo-1544787219-7f47ccb76574?w=600&auto=format&fit=crop&q=80", "ISP-CTS-500", 30).lastInsertRowid;
  const p3 = insertProduct.run(v1Id, "Raw Wildflower Island Honey (350ml)", "100% pure unprocessed wildflower honey harvested from tropical rainforest hives.", 28.00, 12.5, "https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=600&auto=format&fit=crop&q=80", "ISP-RWH-350", 20).lastInsertRowid;
  const p4 = insertProduct.run(v1Id, "Island Nutmeg & Cinnamon Spice Mix (100g)", "Aromatic blend perfect for baking, rum punch, and savory Caribbean curries.", 15.00, 12.5, "https://images.unsplash.com/photo-1509358271058-acd02cc93898?w=600&auto=format&fit=crop&q=80", "ISP-NCS-100", 60).lastInsertRowid;

  // Vendor 2
  const p5 = insertProduct.run(v2Id, "Handwoven Calabash Fruit Basket", "Sustainably harvested calabash dried and hand-carved with intricate tropical motifs.", 65.00, 15.0, "https://images.unsplash.com/photo-1590736704728-f4730bb30770?w=600&auto=format&fit=crop&q=80", "CCL-CFB-01", 12).lastInsertRowid;
  const p6 = insertProduct.run(v2Id, "Handcrafted Coconut Shell Soy Candle", "Vanilla-scented natural soy wax poured into polished organic coconut shells.", 40.00, 15.0, "https://images.unsplash.com/photo-1603006905003-be475563bc59?w=600&auto=format&fit=crop&q=80", "CCL-CSC-02", 25).lastInsertRowid;
  const p7 = insertProduct.run(v2Id, "Tropical Palm Print Linen Tote Bag", "Durable eco-friendly linen shoulder bag featuring hand-printed palm leaf artwork.", 50.00, 15.0, "https://images.unsplash.com/photo-1544816155-12df9643f363?w=600&auto=format&fit=crop&q=80", "CCL-PLT-03", 18).lastInsertRowid;

  // Vendor 3
  const p8 = insertProduct.run(v3Id, "Wireless Bluetooth Outdoor Speaker", "Waterproof IPX7 portable speaker with 20h battery life and deep bass enhancement.", 180.00, 15.0, "https://images.unsplash.com/photo-1545454675-3531b543be5d?w=600&auto=format&fit=crop&q=80", "THE-WBS-01", 15).lastInsertRowid;
  const p9 = insertProduct.run(v3Id, "Fast-Charging Power Bank 20,000mAh", "Dual USB-C fast charging battery pack suitable for smartphones and laptops.", 120.00, 15.0, "https://images.unsplash.com/photo-1609592424109-dd9892f1b177?w=600&auto=format&fit=crop&q=80", "THE-PWB-20K", 30).lastInsertRowid;

  // 4. Create Simulated Orders
  const insertOrder = db.prepare("INSERT INTO orders (customer_id, vendor_id, status, total, vat_total, payment_method, payment_status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  const insertOrderItem = db.prepare("INSERT INTO order_items (order_id, product_id, product_name, quantity, price, vat_percent) VALUES (?, ?, ?, ?, ?, ?)");

  const o1Id = insertOrder.run(c1User, v1Id, "completed", 82.13, 9.13, "Online", "paid", "2026-02-20 14:30:00").lastInsertRowid;
  insertOrderItem.run(o1Id, p1, "St. Lucian Hot Pepper Sauce (250ml)", 2, 22.50, 12.5);
  insertOrderItem.run(o1Id, p3, "Raw Wildflower Island Honey (350ml)", 1, 28.00, 12.5);

  const o2Id = insertOrder.run(c2User, v2Id, "processing", 46.00, 6.00, "COD", "pending", "2026-02-24 09:15:00").lastInsertRowid;
  insertOrderItem.run(o2Id, p6, "Handcrafted Coconut Shell Soy Candle", 1, 40.00, 15.0);

  const o3Id = insertOrder.run(c1User, v3Id, "pending", 207.00, 27.00, "COD", "pending", "2026-02-25 16:45:00").lastInsertRowid;
  insertOrderItem.run(o3Id, p8, "Wireless Bluetooth Outdoor Speaker", 1, 180.00, 15.0);

  console.log("Database successfully seeded with demo data!");
}

async function startServer() {
  await seedDatabase();
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- Auth Middleware ---
  const authenticate = (req: any, res: any, next: any) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: "No token provided" });
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid token" });
    }
  };

  // --- API Routes ---

  // Auth
  app.post("/api/auth/register", async (req, res) => {
    const { name, email, password, role, business_name, phone } = req.body;
    try {
      const hash = await bcrypt.hash(password, 10);
      const insertUser = db.prepare("INSERT INTO users (name, email, password_hash, role, phone) VALUES (?, ?, ?, ?, ?)");
      const info = insertUser.run(name, email, hash, role, phone || null);
      const userId = info.lastInsertRowid;

      if (role === "vendor" && business_name) {
        db.prepare("INSERT INTO vendors (user_id, business_name) VALUES (?, ?)").run(userId, business_name);
      }

      const token = jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: "7d" });
      res.json({ token, user: { id: userId, name, email, role, phone: phone || null } });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE email = ?").get(email) as any;
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, phone: user.phone } });
  });

  app.get("/api/auth/me", authenticate, (req: any, res) => {
    const user = db.prepare("SELECT id, name, email, phone, role FROM users WHERE id = ?").get(req.user.id);
    res.json({ user });
  });

  app.put("/api/users/profile", authenticate, (req: any, res) => {
    const { name, email, phone } = req.body;
    try {
      db.prepare("UPDATE users SET name = ?, email = ?, phone = ? WHERE id = ?")
        .run(name, email, phone, req.user.id);
      const user = db.prepare("SELECT id, name, email, phone, role FROM users WHERE id = ?").get(req.user.id);
      res.json({ success: true, user });
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  // Vendors
  app.get("/api/vendors", (req, res) => {
    const vendors = db.prepare("SELECT v.*, u.name as owner_name FROM vendors v JOIN users u ON v.user_id = u.id").all();
    res.json(vendors);
  });

  app.get("/api/vendors/:id", (req, res) => {
    const vendor = db.prepare("SELECT v.*, u.name as owner_name FROM vendors v JOIN users u ON v.user_id = u.id WHERE v.id = ?").get(req.params.id);
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });
    res.json(vendor);
  });

  app.put("/api/vendors/profile", authenticate, (req: any, res) => {
    if (req.user.role !== "vendor") return res.status(403).json({ error: "Only vendors can update profile" });
    const {
      business_name, description, logo_url, address, phone, tax_id, website,
      facebook_url, instagram_url, linkedin_url,
      enable_loyalty, loyalty_points_per_dollar, loyalty_points_per_discount,
      promo_code, promo_discount_percent
    } = req.body;

    db.prepare(`
      UPDATE vendors SET
        business_name = ?, description = ?, logo_url = ?, address = ?, phone = ?, tax_id = ?,
        website = ?, facebook_url = ?, instagram_url = ?, linkedin_url = ?,
        enable_loyalty = ?, loyalty_points_per_dollar = ?, loyalty_points_per_discount = ?,
        promo_code = ?, promo_discount_percent = ?
      WHERE user_id = ?
    `).run(
      business_name, description, logo_url, address, phone, tax_id,
      website || '', facebook_url || '', instagram_url || '', linkedin_url || '',
      enable_loyalty ? 1 : 0,
      Number(loyalty_points_per_dollar) || 1,
      Number(loyalty_points_per_discount) || 100,
      (promo_code || '').trim().toUpperCase(),
      Number(promo_discount_percent) || 0,
      req.user.id
    );
    res.json({ success: true });
  });

  // Products
  app.get("/api/vendors/:id/products", (req, res) => {
    const products = db.prepare("SELECT * FROM products WHERE vendor_id = ?").all(req.params.id);
    res.json(products);
  });

  app.post("/api/products", authenticate, (req: any, res) => {
    if (req.user.role !== "vendor") return res.status(403).json({ error: "Only vendors can add products" });
    const vendor = db.prepare("SELECT id FROM vendors WHERE user_id = ?").get(req.user.id) as any;
    if (!vendor) return res.status(400).json({ error: "Vendor profile not found" });

    const { name, description, price, vat_percent, discount_percent, image_url, sku, stock_quantity } = req.body;
    const info = db.prepare(`
      INSERT INTO products (vendor_id, name, description, price, vat_percent, discount_percent, image_url, sku, stock_quantity)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      vendor.id, name, description, Number(price), Number(vat_percent) || 15, Number(discount_percent) || 0, image_url, sku, Number(stock_quantity) || 0
    );
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/products/:id", authenticate, (req: any, res) => {
    if (req.user.role !== "vendor") return res.status(403).json({ error: "Only vendors can update products" });
    const vendor = db.prepare("SELECT id FROM vendors WHERE user_id = ?").get(req.user.id) as any;
    if (!vendor) return res.status(400).json({ error: "Vendor profile not found" });

    const { name, description, price, vat_percent, discount_percent, image_url, sku, stock_quantity } = req.body;
    const result = db.prepare(`
      UPDATE products SET
        name = ?, description = ?, price = ?, vat_percent = ?, discount_percent = ?, image_url = ?, sku = ?, stock_quantity = ?
      WHERE id = ? AND vendor_id = ?
    `).run(
      name, description, Number(price), Number(vat_percent), Number(discount_percent) || 0, image_url, sku, Number(stock_quantity), req.params.id, vendor.id
    );

    if (result.changes === 0) {
      return res.status(404).json({ error: "Product not found or unauthorized" });
    }

    res.json({ success: true });
  });

  app.delete("/api/products/:id", authenticate, (req: any, res) => {
    if (req.user.role !== "vendor") return res.status(403).json({ error: "Only vendors can delete products" });
    const vendor = db.prepare("SELECT id FROM vendors WHERE user_id = ?").get(req.user.id) as any;
    if (!vendor) return res.status(400).json({ error: "Vendor profile not found" });

    const result = db.prepare("DELETE FROM products WHERE id = ? AND vendor_id = ?").run(req.params.id, vendor.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: "Product not found or unauthorized" });
    }

    res.json({ success: true });
  });

  app.put("/api/products/:id/stock", authenticate, (req: any, res) => {
    if (req.user.role !== "vendor") return res.status(403).json({ error: "Only vendors can update stock" });
    const vendor = db.prepare("SELECT id FROM vendors WHERE user_id = ?").get(req.user.id) as any;
    if (!vendor) return res.status(400).json({ error: "Vendor profile not found" });

    const { stock_quantity } = req.body;
    db.prepare("UPDATE products SET stock_quantity = ? WHERE id = ? AND vendor_id = ?")
      .run(stock_quantity, req.params.id, vendor.id);
    res.json({ success: true });
  });

  // Loyalty API Endpoints
  app.get("/api/loyalty/vendor/:vendorId", authenticate, (req: any, res) => {
    const vendorId = Number(req.params.vendorId);
    const vendor = db.prepare("SELECT id, business_name, enable_loyalty, loyalty_points_per_dollar, loyalty_points_per_discount, promo_code, promo_discount_percent FROM vendors WHERE id = ?").get(vendorId) as any;
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });

    const record = db.prepare("SELECT points FROM customer_loyalty WHERE customer_id = ? AND vendor_id = ?").get(req.user.id, vendorId) as any;
    const points = record ? record.points : 0;

    res.json({
      vendor,
      points
    });
  });

  app.get("/api/loyalty/my-points", authenticate, (req: any, res) => {
    const list = db.prepare(`
      SELECT cl.points, v.id as vendor_id, v.business_name, v.logo_url, v.enable_loyalty, v.loyalty_points_per_dollar, v.loyalty_points_per_discount
      FROM customer_loyalty cl
      JOIN vendors v ON cl.vendor_id = v.id
      WHERE cl.customer_id = ? AND cl.points > 0
    `).all(req.user.id);
    res.json(list);
  });

  // Orders
  app.post("/api/orders", authenticate, (req: any, res) => {
    const { vendor_id, items, payment_method, customer_phone, initial_status, discount_percent, points_redeemed, promo_code } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Order must contain at least one item." });
    }

    const vendor = db.prepare("SELECT * FROM vendors WHERE id = ?").get(vendor_id) as any;

    if (customer_phone) {
      try {
        db.prepare("UPDATE users SET phone = ? WHERE id = ?").run(customer_phone, req.user.id);
      } catch (e) {}
    }

    // Step 1: Pre-check stock for all requested items
    for (const item of items) {
      const product = db.prepare("SELECT * FROM products WHERE id = ?").get(item.product_id) as any;
      if (!product) {
        return res.status(400).json({ error: `Product ID ${item.product_id} not found.` });
      }
      if (product.stock_quantity < item.quantity) {
        return res.status(400).json({ 
          error: `Insufficient stock for "${product.name}". Available stock: ${product.stock_quantity}, requested: ${item.quantity}.` 
        });
      }
    }

    // Step 2: Atomic Transaction for order creation & stock deduction
    const createOrderTx = db.transaction(() => {
      let subtotalWithoutVat = 0;
      let vat_total = 0;
      const orderItems = [];

      for (const item of items) {
        const product = db.prepare("SELECT * FROM products WHERE id = ?").get(item.product_id) as any;
        const itemDiscPercent = product.discount_percent || 0;
        const discountedPrice = product.price * (1 - itemDiscPercent / 100);
        const itemTotalBase = discountedPrice * item.quantity;
        const itemVat = itemTotalBase * (product.vat_percent / 100);

        subtotalWithoutVat += itemTotalBase;
        vat_total += itemVat;

        orderItems.push({
          product_id: product.id,
          product_name: product.name,
          quantity: item.quantity,
          price: product.price,
          vat_percent: product.vat_percent,
          discount_percent: itemDiscPercent
        });

        // Decrement product stock in database
        db.prepare("UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?").run(item.quantity, product.id);
      }

      // Calculate percentage discount
      let appliedDiscountPercent = Number(discount_percent) || 0;
      if (vendor && vendor.promo_code && promo_code && promo_code.trim().toUpperCase() === vendor.promo_code.toUpperCase()) {
        appliedDiscountPercent = Math.max(appliedDiscountPercent, vendor.promo_discount_percent || 0);
      }

      const percentageDiscountAmount = subtotalWithoutVat * (appliedDiscountPercent / 100);

      // Calculate points redemption discount
      let redeemedPointsUsed = Number(points_redeemed) || 0;
      let pointsDiscountAmount = 0;

      if (vendor && vendor.enable_loyalty && redeemedPointsUsed > 0) {
        const currentLoyalty = db.prepare("SELECT points FROM customer_loyalty WHERE customer_id = ? AND vendor_id = ?").get(req.user.id, vendor_id) as any;
        const availablePoints = currentLoyalty ? currentLoyalty.points : 0;
        redeemedPointsUsed = Math.min(redeemedPointsUsed, availablePoints);

        const pointsPerDiscount = vendor.loyalty_points_per_discount || 100;
        pointsDiscountAmount = redeemedPointsUsed / pointsPerDiscount;

        if (redeemedPointsUsed > 0) {
          db.prepare(`
            INSERT INTO customer_loyalty (customer_id, vendor_id, points) VALUES (?, ?, 0)
            ON CONFLICT(customer_id, vendor_id) DO UPDATE SET points = points - ?
          `).run(req.user.id, vendor_id, redeemedPointsUsed);
        }
      }

      const totalDiscount = percentageDiscountAmount + pointsDiscountAmount;
      const netSubtotal = Math.max(0, subtotalWithoutVat - totalDiscount);
      const total = netSubtotal + vat_total;

      // Calculate earned points if loyalty is enabled
      let points_earned = 0;
      if (vendor && vendor.enable_loyalty) {
        const pointsRate = vendor.loyalty_points_per_dollar || 1;
        points_earned = Math.round(total * pointsRate);

        db.prepare(`
          INSERT INTO customer_loyalty (customer_id, vendor_id, points) VALUES (?, ?, ?)
          ON CONFLICT(customer_id, vendor_id) DO UPDATE SET points = points + ?
        `).run(req.user.id, vendor_id, points_earned, points_earned);
      }

      const payment_status = payment_method === 'Online' ? 'paid' : 'pending';
      const orderStatus = initial_status || 'quote_pending';

      const insertOrder = db.prepare(`
        INSERT INTO orders (customer_id, vendor_id, status, total, vat_total, discount_percent, discount_amount, points_earned, points_redeemed, payment_method, payment_status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      const info = insertOrder.run(
        req.user.id, vendor_id, orderStatus, total, vat_total, appliedDiscountPercent, totalDiscount, points_earned, redeemedPointsUsed, payment_method, payment_status
      );
      const orderId = info.lastInsertRowid;

      const insertItem = db.prepare(`
        INSERT INTO order_items (order_id, product_id, product_name, quantity, price, vat_percent, discount_percent)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `);
      for (const item of orderItems) {
        insertItem.run(orderId, item.product_id, item.product_name, item.quantity, item.price, item.vat_percent, item.discount_percent);
      }

      return { id: orderId, total, status: orderStatus, payment_status, points_earned, points_redeemed: redeemedPointsUsed, totalDiscount };
    });

    try {
      const result = createOrderTx();
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || "Failed to process order." });
    }
  });

  app.get("/api/orders", authenticate, (req: any, res) => {
    let orders;
    if (req.user.role === "customer") {
      orders = db.prepare(`
        SELECT o.*, 
               u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
               v.user_id as vendor_user_id,
               v.business_name as vendor_name, v.logo_url, v.address as vendor_address, v.phone as vendor_phone, v.tax_id as vendor_tax_id,
               v.website as vendor_website, v.facebook_url as vendor_facebook, v.instagram_url as vendor_instagram, v.linkedin_url as vendor_linkedin
        FROM orders o 
        JOIN users u ON o.customer_id = u.id
        JOIN vendors v ON o.vendor_id = v.id 
        WHERE o.customer_id = ?
        ORDER BY o.created_at DESC
      `).all(req.user.id);
    } else if (req.user.role === "vendor") {
      const vendor = db.prepare("SELECT id FROM vendors WHERE user_id = ?").get(req.user.id) as any;
      if (!vendor) return res.json([]);
      orders = db.prepare(`
        SELECT o.*, 
               u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
               v.user_id as vendor_user_id,
               v.business_name as vendor_name, v.logo_url, v.address as vendor_address, v.phone as vendor_phone, v.tax_id as vendor_tax_id,
               v.website as vendor_website, v.facebook_url as vendor_facebook, v.instagram_url as vendor_instagram, v.linkedin_url as vendor_linkedin
        FROM orders o 
        JOIN users u ON o.customer_id = u.id 
        JOIN vendors v ON o.vendor_id = v.id
        WHERE o.vendor_id = ?
        ORDER BY o.created_at DESC
      `).all(vendor.id);
    } else {
      orders = db.prepare(`
        SELECT o.*, 
               u.name as customer_name, u.email as customer_email, u.phone as customer_phone,
               v.user_id as vendor_user_id,
               v.business_name as vendor_name, v.logo_url, v.address as vendor_address, v.phone as vendor_phone, v.tax_id as vendor_tax_id,
               v.website as vendor_website, v.facebook_url as vendor_facebook, v.instagram_url as vendor_instagram, v.linkedin_url as vendor_linkedin
        FROM orders o 
        JOIN users u ON o.customer_id = u.id 
        JOIN vendors v ON o.vendor_id = v.id
        ORDER BY o.created_at DESC
      `).all();
    }

    // Fetch items for each order
    for (const order of orders as any[]) {
      order.items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order.id);
    }

    res.json(orders);
  });

  app.put("/api/orders/:id/quote-action", authenticate, (req: any, res) => {
    const { action } = req.body; // 'approve' | 'decline'
    const order = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id) as any;
    if (!order) return res.status(404).json({ error: "Order/Quote not found" });

    if (req.user.role === 'customer' && order.customer_id !== req.user.id) {
      return res.status(403).json({ error: "Unauthorized to manage this quote" });
    }

    const newStatus = action === 'approve' ? 'quote_approved' : 'quote_declined';
    db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(newStatus, req.params.id);
    res.json({ success: true, status: newStatus });
  });

  app.put("/api/orders/:id/status", authenticate, (req: any, res) => {
    if (req.user.role !== "vendor") return res.status(403).json({ error: "Only vendors can update status" });
    const { status, payment_status } = req.body;
    
    const currentOrder = db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id) as any;
    if (!currentOrder) return res.status(404).json({ error: "Order not found" });

    if (status && (status === 'processing' || status === 'completed' || status === 'shipped')) {
      if (currentOrder.status === 'quote_pending' || currentOrder.status === 'pending') {
        return res.status(400).json({ error: "Customer must approve quote before process can move forward." });
      }
    }
    
    if (status) {
      db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, req.params.id);
    }
    if (payment_status) {
      db.prepare("UPDATE orders SET payment_status = ? WHERE id = ?").run(payment_status, req.params.id);
    }
    res.json({ success: true });
  });

  // --- Secure Messaging Routes ---
  app.get("/api/messages/conversations", authenticate, (req: any, res) => {
    const userId = req.user.id;
    const partners = db.prepare(`
      SELECT DISTINCT 
        u.id as user_id, 
        u.name, 
        u.email, 
        u.role,
        v.id as vendor_id,
        v.business_name,
        v.logo_url
      FROM users u
      LEFT JOIN vendors v ON v.user_id = u.id
      WHERE u.id IN (
        SELECT CASE WHEN sender_id = ? THEN receiver_id ELSE sender_id END
        FROM messages
        WHERE sender_id = ? OR receiver_id = ?
        UNION
        SELECT CASE WHEN o.customer_id = ? THEN v.user_id ELSE o.customer_id END
        FROM orders o
        JOIN vendors v ON o.vendor_id = v.id
        WHERE o.customer_id = ? OR v.user_id = ?
      ) AND u.id != ?
    `).all(userId, userId, userId, userId, userId, userId, userId);

    const conversations = partners.map((partner: any) => {
      const lastMsg = db.prepare(`
        SELECT * FROM messages
        WHERE (sender_id = ? AND receiver_id = ?) OR (sender_id = ? AND receiver_id = ?)
        ORDER BY created_at DESC LIMIT 1
      `).get(userId, partner.user_id, partner.user_id, userId) as any;

      const unread = db.prepare(`
        SELECT COUNT(*) as count FROM messages
        WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
      `).get(partner.user_id, userId) as any;

      return {
        partner,
        last_message: lastMsg || null,
        unread_count: unread ? unread.count : 0
      };
    });

    conversations.sort((a, b) => {
      const timeA = a.last_message ? new Date(a.last_message.created_at).getTime() : 0;
      const timeB = b.last_message ? new Date(b.last_message.created_at).getTime() : 0;
      return timeB - timeA;
    });

    res.json(conversations);
  });

  app.get("/api/messages/unread-count", authenticate, (req: any, res) => {
    const result = db.prepare(`
      SELECT COUNT(*) as count FROM messages
      WHERE receiver_id = ? AND is_read = 0
    `).get(req.user.id) as any;
    res.json({ unread_count: result ? result.count : 0 });
  });

  app.get("/api/messages/user/:otherUserId", authenticate, (req: any, res) => {
    const userId = req.user.id;
    const otherUserId = Number(req.params.otherUserId);

    // Mark messages from this sender to current user as read
    db.prepare(`
      UPDATE messages SET is_read = 1
      WHERE sender_id = ? AND receiver_id = ? AND is_read = 0
    `).run(otherUserId, userId);

    const partner = db.prepare(`
      SELECT u.id as user_id, u.name, u.email, u.role, v.id as vendor_id, v.business_name, v.logo_url
      FROM users u
      LEFT JOIN vendors v ON v.user_id = u.id
      WHERE u.id = ?
    `).get(otherUserId);

    const messages = db.prepare(`
      SELECT m.*, s.name as sender_name
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?) OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
    `).all(userId, otherUserId, otherUserId, userId);

    res.json({ partner, messages });
  });

  app.post("/api/messages", authenticate, (req: any, res) => {
    const { receiver_id, message, order_id } = req.body;
    if (!receiver_id || !message || !message.trim()) {
      return res.status(400).json({ error: "Receiver ID and message content are required" });
    }

    const info = db.prepare(`
      INSERT INTO messages (sender_id, receiver_id, order_id, message)
      VALUES (?, ?, ?, ?)
    `).run(req.user.id, Number(receiver_id), order_id ? Number(order_id) : null, message.trim());

    const newMessage = db.prepare(`
      SELECT m.*, s.name as sender_name
      FROM messages m
      JOIN users s ON m.sender_id = s.id
      WHERE m.id = ?
    `).get(info.lastInsertRowid);

    res.json(newMessage);
  });

  // --- Vite Middleware ---
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
