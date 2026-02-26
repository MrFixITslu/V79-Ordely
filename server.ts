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
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS vendors (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER UNIQUE NOT NULL,
    business_name TEXT NOT NULL,
    description TEXT,
    logo_url TEXT,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    vendor_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    vat_percent REAL DEFAULT 15,
    image_url TEXT,
    FOREIGN KEY(vendor_id) REFERENCES vendors(id)
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    customer_id INTEGER NOT NULL,
    vendor_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    total REAL NOT NULL,
    vat_total REAL NOT NULL,
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
    FOREIGN KEY(order_id) REFERENCES orders(id),
    FOREIGN KEY(product_id) REFERENCES products(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

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
    const { name, email, password, role, business_name } = req.body;
    try {
      const hash = await bcrypt.hash(password, 10);
      const insertUser = db.prepare("INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)");
      const info = insertUser.run(name, email, hash, role);
      const userId = info.lastInsertRowid;

      if (role === "vendor" && business_name) {
        db.prepare("INSERT INTO vendors (user_id, business_name) VALUES (?, ?)").run(userId, business_name);
      }

      const token = jwt.sign({ id: userId, role }, JWT_SECRET, { expiresIn: "7d" });
      res.json({ token, user: { id: userId, name, email, role } });
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
    res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
  });

  app.get("/api/auth/me", authenticate, (req: any, res) => {
    const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(req.user.id);
    res.json({ user });
  });

  // Vendors
  app.get("/api/vendors", (req, res) => {
    const vendors = db.prepare("SELECT v.id, v.business_name, v.description, v.logo_url, u.name as owner_name FROM vendors v JOIN users u ON v.user_id = u.id").all();
    res.json(vendors);
  });

  app.get("/api/vendors/:id", (req, res) => {
    const vendor = db.prepare("SELECT * FROM vendors WHERE id = ?").get(req.params.id);
    if (!vendor) return res.status(404).json({ error: "Vendor not found" });
    res.json(vendor);
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

    const { name, description, price, vat_percent, image_url } = req.body;
    const info = db.prepare("INSERT INTO products (vendor_id, name, description, price, vat_percent, image_url) VALUES (?, ?, ?, ?, ?, ?)").run(vendor.id, name, description, price, vat_percent || 15, image_url);
    res.json({ id: info.lastInsertRowid });
  });

  // Orders
  app.post("/api/orders", authenticate, (req: any, res) => {
    const { vendor_id, items, payment_method } = req.body;
    // items: [{ product_id, quantity }]
    
    let total = 0;
    let vat_total = 0;
    const orderItems = [];

    for (const item of items) {
      const product = db.prepare("SELECT * FROM products WHERE id = ?").get(item.product_id) as any;
      if (!product) return res.status(400).json({ error: `Product ${item.product_id} not found` });
      
      const itemTotal = product.price * item.quantity;
      const itemVat = itemTotal * (product.vat_percent / 100);
      
      total += itemTotal + itemVat;
      vat_total += itemVat;
      
      orderItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity: item.quantity,
        price: product.price,
        vat_percent: product.vat_percent
      });
    }

    const payment_status = payment_method === 'Online' ? 'paid' : 'pending';

    const insertOrder = db.prepare("INSERT INTO orders (customer_id, vendor_id, total, vat_total, payment_method, payment_status) VALUES (?, ?, ?, ?, ?, ?)");
    const info = insertOrder.run(req.user.id, vendor_id, total, vat_total, payment_method, payment_status);
    const orderId = info.lastInsertRowid;

    const insertItem = db.prepare("INSERT INTO order_items (order_id, product_id, product_name, quantity, price, vat_percent) VALUES (?, ?, ?, ?, ?, ?)");
    for (const item of orderItems) {
      insertItem.run(orderId, item.product_id, item.product_name, item.quantity, item.price, item.vat_percent);
    }

    res.json({ id: orderId, total, payment_status });
  });

  app.get("/api/orders", authenticate, (req: any, res) => {
    let orders;
    if (req.user.role === "customer") {
      orders = db.prepare(`
        SELECT o.*, v.business_name as vendor_name 
        FROM orders o 
        JOIN vendors v ON o.vendor_id = v.id 
        WHERE o.customer_id = ?
        ORDER BY o.created_at DESC
      `).all(req.user.id);
    } else if (req.user.role === "vendor") {
      const vendor = db.prepare("SELECT id FROM vendors WHERE user_id = ?").get(req.user.id) as any;
      if (!vendor) return res.json([]);
      orders = db.prepare(`
        SELECT o.*, u.name as customer_name 
        FROM orders o 
        JOIN users u ON o.customer_id = u.id 
        WHERE o.vendor_id = ?
        ORDER BY o.created_at DESC
      `).all(vendor.id);
    } else {
      orders = db.prepare("SELECT * FROM orders").all();
    }

    // Fetch items for each order
    for (const order of orders as any[]) {
      order.items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(order.id);
    }

    res.json(orders);
  });

  app.put("/api/orders/:id/status", authenticate, (req: any, res) => {
    if (req.user.role !== "vendor") return res.status(403).json({ error: "Only vendors can update status" });
    const { status, payment_status } = req.body;
    
    if (status) {
      db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, req.params.id);
    }
    if (payment_status) {
      db.prepare("UPDATE orders SET payment_status = ? WHERE id = ?").run(payment_status, req.params.id);
    }
    res.json({ success: true });
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
