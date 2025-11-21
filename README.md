# 📌 Coupon Management System – REST API

### 📍 Submitted By: **Snehal Bhagwate**

**College:** KDK College of Engineering
**Project Type:** Internship Assignment
**Tech Stack:** Node.js, Express.js, JSON Web Token (JWT), Hoppscotch

---

## 📘 Project Overview

This project is a backend REST API for managing discount coupons for an e-commerce platform.
Only authorized users (Admin) can perform CRUD operations on coupons.

**Key Features:**

* Admin authentication via JWT
* Add, view, update, and delete coupons
* Evaluate and select the best coupon for a user and their cart based on eligibility rules

---

## 🔑 Admin Credentials

| Field        | Value                                               |
| ------------ | --------------------------------------------------- |
| **Email**    | [hire-me@anshumat.org](mailto:hire-me@anshumat.org) |
| **Password** | HireMe@2025!                                        |

---

## 🚀 Features & Endpoints

| Feature            | Endpoint             | Method | Description                                                  |
| ------------------ | -------------------- | ------ | ------------------------------------------------------------ |
| Admin Login        | `/api/login`         | POST   | Validates credentials & returns JWT token                    |
| Add Coupon         | `/api/coupons`       | POST   | Create a new coupon with eligibility rules                   |
| Get All Coupons    | `/api/coupons`       | GET    | Fetch all stored coupons                                     |
| Get Coupon by Code | `/api/coupons/:code` | GET    | Search coupon by coupon code                                 |
| Update Coupon      | `/api/coupons/:code` | PUT    | Update coupon details                                        |
| Delete Coupon      | `/api/coupons/:code` | DELETE | Remove a coupon by code                                      |
| **Best Coupon**    | `/api/coupons/best`  | POST   | Evaluate user & cart data, return the best applicable coupon |

---

## 💡 Best Coupon API Details

**Description:**

* Evaluates all stored coupons against a given **user** and **cart**.
* Filters coupons by eligibility:

  * Validity dates (`startDate` & `endDate`)
  * Usage limits per user (`usageLimitPerUser`)
  * User attributes (`userTier`, `lifetimeSpend`, `ordersPlaced`, `firstOrderOnly`, `allowedCountries`)
  * Cart attributes (`minCartValue`, `applicableCategories`, `excludedCategories`, `minItemsCount`)
* Computes discount:

  * **FLAT:** fixed discount amount
  * **PERCENT:** percentage of cart value, capped by `maxDiscountAmount` if provided
* Returns the **best coupon** based on:

  1. Highest discount
  2. Earliest expiry date in case of tie
  3. Lexicographically smaller code if still tied

**Request Example:**

```json
{
  "user": {
    "userId": "u123",
    "userTier": "NEW",
    "country": "IN",
    "lifetimeSpend": 1200,
    "ordersPlaced": 2
  },
  "cart": {
    "items": [
      {"productId": "p1", "category": "electronics", "unitPrice": 1500, "quantity": 1},
      {"productId": "p2", "category": "fashion", "unitPrice": 500, "quantity": 2}
    ]
  }
}
```

**Response Example:**

```json
{
  "bestCoupon": {
    "code": "WELCOME100",
    "description": "₹100 off for new users",
    "discountType": "FLAT",
    "discountValue": 100,
    "appliedDiscount": 100
  }
}
```

---

## 🏗️ Technologies Used

* Node.js
* Express.js
* bcryptjs (Password Hashing)
* jsonwebtoken (JWT Authentication)
* Postman (API Testing)

---

## 📁 Project Setup Instructions

```sh
# Clone the repository
git clone [Your Repo Link]

# Navigate to project folder
cd coupon-management

# Install dependencies
npm install

# Start server
node server.js

# The server will run on http://localhost:5000 by default
```

---

## 📝 Notes for Reviewer

* All APIs are tested with simulated user and cart data.
* Demo includes hard-coded login for evaluation:

  * Email: [hire-me@anshumat.org](mailto:hire-me@anshumat.org)
  * Password: HireMe@2025!
* The Best Coupon API evaluates multiple eligibility criteria and selects the optimal coupon.
* README includes project overview, setup instructions, and API usage examples.

---

