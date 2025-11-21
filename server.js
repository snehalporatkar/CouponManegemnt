const express = require("express");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

const SECRET_KEY = "mySecretKey";

// Hard-coded admin user
const users = [
  { id: 1, email: "hire-me@anshumat.org", password: "HireMe@2025!" }
];

// In-memory storage
let coupons = [];
let usedCoupons = []; // Track usage per user

// ================= Login API =================
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  const user = users.find(u => u.email === email && u.password === password);

  if (!user) return res.status(401).json({ message: "Invalid email or password" });

  const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: "1h" });
  console.log("GENERATED TOKEN:", token);

  res.json({ message: "Login successful", token });
});

// ================= Auth Middleware =================
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  if (!authHeader) return res.status(403).json({ message: "Token required" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
}

// ================= Create Coupon =================
app.post("/api/coupons", authenticateToken, (req, res) => {
  const {
    code, description, discountType, discountValue,
    maxDiscountAmount, startDate, endDate,
    usageLimitPerUser, eligibility
  } = req.body;

  if (!code || !description || !discountType || !discountValue || !startDate || !endDate) {
    return res.status(400).json({ message: "Required fields missing" });
  }

  if (coupons.some(c => c.code === code)) {
    return res.status(400).json({ message: "Coupon code already exists" });
  }

  coupons.push({
    id: coupons.length + 1,
    code,
    description,
    discountType,
    discountValue,
    maxDiscountAmount: maxDiscountAmount || null,
    startDate,
    endDate,
    usageLimitPerUser: usageLimitPerUser || null,
    eligibility: eligibility || {}
  });

  res.json({ message: "Coupon created successfully" });
});

// ================= Get All Coupons =================
app.get("/api/coupons", authenticateToken, (req, res) => {
  res.json(coupons);
});

// ================= GET Coupon by Code =================
app.get('/api/coupons/:code', authenticateToken, (req, res) => {
  const code = req.params.code.toUpperCase();
  const coupon = coupons.find(c => c.code.toUpperCase() === code);

  if (!coupon) {
    return res.status(404).json({ error: "Coupon Not Found" });
  }

  res.json(coupon);
});

// ================= UPDATE Coupon =================
app.put('/api/coupons/:code', authenticateToken, (req, res) => {
  const code = req.params.code.toUpperCase();
  const index = coupons.findIndex(c => c.code.toUpperCase() === code);

  if (index === -1) {
    return res.status(404).json({ error: "Coupon Not Found" });
  }

  coupons[index] = { ...coupons[index], ...req.body };
  res.json({ message: "Coupon Updated Successfully", data: coupons[index] });
});

// ================= DELETE Coupon =================
app.delete('/api/coupons/:code', authenticateToken, (req, res) => {
  const code = req.params.code.toUpperCase();
  const index = coupons.findIndex(c => c.code.toUpperCase() === code);

  if (index === -1) {
    return res.status(404).json({ error: "Coupon Not Found" });
  }

  const removed = coupons.splice(index, 1);
  res.json({ message: "Coupon Deleted Successfully", data: removed });
});

// ================= Best Coupon API =================
app.post("/api/best-coupon", authenticateToken, (req, res) => {
  const { user, cart } = req.body;

  if (!user || !cart || !cart.items) {
    return res.status(400).json({ message: "User and cart information required" });
  }

  const now = new Date();

  let eligibleCoupons = coupons.filter(c => {
    // Validity Check
    if (new Date(c.startDate) > now || new Date(c.endDate) < now) return false;

    // Usage Limit Check
    if (c.usageLimitPerUser) {
      const usedCount = usedCoupons.filter(uc => uc.code === c.code && uc.userId === user.userId).length;
      if (usedCount >= c.usageLimitPerUser) return false;
    }

    const e = c.eligibility || {};

    const cartValue = cart.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    const itemsCount = cart.items.reduce((sum, i) => sum + i.quantity, 0);

    // Eligibility Check
    if (e.allowedUserTiers && !e.allowedUserTiers.includes(user.userTier)) return false;
    if (e.minLifetimeSpend && user.lifetimeSpend < e.minLifetimeSpend) return false;
    if (e.minOrdersPlaced && user.ordersPlaced < e.minOrdersPlaced) return false;
    if (e.firstOrderOnly && user.ordersPlaced > 0) return false;
    if (e.allowedCountries && !e.allowedCountries.includes(user.country)) return false;
    if (e.minCartValue && cartValue < e.minCartValue) return false;
    if (e.minItemsCount && itemsCount < e.minItemsCount) return false;

    if (e.applicableCategories) {
      const found = cart.items.some(i => e.applicableCategories.includes(i.category));
      if (!found) return false;
    }

    if (e.excludedCategories) {
      const found = cart.items.some(i => e.excludedCategories.includes(i.category));
      if (found) return false;
    }

    return true;
  });

  if (eligibleCoupons.length === 0) {
    return res.json({ message: "No coupon applicable", coupon: null });
  }

  eligibleCoupons = eligibleCoupons.map(c => {
    const cartValue = cart.items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);
    let discountAmount = 0;

    if (c.discountType === "FLAT") discountAmount = c.discountValue;
    else if (c.discountType === "PERCENT") {
      discountAmount = (cartValue * c.discountValue) / 100;
      if (c.maxDiscountAmount) discountAmount = Math.min(discountAmount, c.maxDiscountAmount);
    }

    return { ...c, discountAmount };
  });

  eligibleCoupons.sort((a, b) => {
    if (b.discountAmount !== a.discountAmount) return b.discountAmount - a.discountAmount;
    return new Date(a.endDate) - new Date(b.endDate); // earliest end
  });

  const bestCoupon = eligibleCoupons[0];

  usedCoupons.push({ code: bestCoupon.code, userId: user.userId, usedOn: now });

  res.json({ message: "Best coupon applied", coupon: bestCoupon });
});

// ================= Default 404 =================
app.use((req, res) => {
  res.status(404).json({ message: "Route Not Found", path: req.originalUrl, method: req.method });
});

// ================= Server Start =================
const PORT = 5000;
app.listen(PORT, () => console.log(`Server running at http://localhost:${PORT}`));
