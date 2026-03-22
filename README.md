# 🍱 FoodShare — Server

![License](https://img.shields.io/badge/license-MIT-green?style=flat-square)
![Node](https://img.shields.io/badge/Node.js-18-339933?style=flat-square&logo=nodedotjs)
![Express](https://img.shields.io/badge/Express-4-000000?style=flat-square&logo=express)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)
![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?style=flat-square&logo=socketdotio)
![Stripe](https://img.shields.io/badge/Stripe-Payment-635BFF?style=flat-square&logo=stripe)

> REST API + Real-time WebSocket server for the FoodShare platform.

This is the backend for FoodShare — a community food sharing and local food marketplace app. It handles authentication, food listings, real-time notifications, live chat, payment processing, and admin management.

---

## 🔗 Related Repository

- 🖥️ **Client:** [food-waste-client](https://github.com/rahman2220510189/food-waste-client)
- 🌐 **Live Site:** [https://food-waste-client-one.vercel.app](https://food-waste-client-one.vercel.app)
- 🎥 **Demo Video:** [Watch on Google Drive](https://drive.google.com/file/d/1a1vPxLpbj7Uwqtwl0L_E9UHFZIC59ibG/view?usp=drive_link)

---

## 🎯 Problem Solved

FoodShare Server powers a platform that:
- Connects people with surplus food to those who need it nearby
- Gives home cooks and local sellers a marketplace to sell meals
- Enables real-time communication between buyers and sellers
- Processes secure online payments via Stripe

---

## ✨ Features

### 🍱 Food Management
- Upload food posts with image, price, location, quantity
- Location-based distance calculation (Haversine formula)
- Search by title, restaurant name, or address
- Book free food / Order paid food

### 🔔 Notifications & Requests
- Real-time notifications via Socket.io when someone requests food
- Accept or cancel incoming requests
- Auto-create chat session on acceptance

### 💬 Real-time Chat
- Socket.io powered live messaging
- Chat rooms per food transaction
- Message read status tracking
- Typing indicators

### 💳 Payment
- Stripe Payment Intent creation
- Payment confirmation & verification
- Paid order notification flow

### 📊 Dashboard & Analytics
- Seller dashboard — earnings, order stats, post performance
- Admin panel — all users, foods, orders, revenue overview
- Order history tracking

### 🛡️ Admin System
- Role-based access (`role: "admin"`)
- Promote / demote users to admin
- Delete users and food listings
- Full order & payment monitoring

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|-----------|
| Runtime | Node.js 18 |
| Framework | Express.js 4 |
| Database | MongoDB Atlas |
| Real-time | Socket.io 4 |
| Payment | Stripe |
| File Upload | Multer |
| Environment | dotenv |

---

## 📁 Folder Structure

```
food-waste-server/
├── controllers/
│   ├── adminController.js        # Admin: users, foods, payments, roles
│   ├── dashboardController.js    # Seller dashboard stats
│   ├── historyController.js      # Order/booking history
│   ├── messagesController.js     # Chat messages
│   ├── notificationsController.js # Request accept/cancel
│   ├── paymentController.js      # Stripe payment intent & confirm
│   └── userController.js         # User profile management
├── models/
│   ├── History.js
│   ├── Message.js
│   ├── Notification.js
│   └── User.js
├── routes/
│   ├── admin.js
│   ├── dashboard.js
│   ├── history.js
│   ├── messages.js
│   ├── notifications.js
│   ├── payment.js
│   └── users.js
├── uploads/                      # Uploaded food images
├── .env
├── index.js                      # Main server entry point
└── package.json
```

---

## ⚙️ Installation

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- Stripe account
- npm or yarn

### Steps

```bash
# 1. Clone the repository
git clone https://github.com/rahman2220510189/food-waste-server.git

# 2. Navigate to project directory
cd food-waste-server

# 3. Install dependencies
npm install

# 4. Create environment file
cp .env.example .env

# 5. Add your environment variables (see below)

# 6. Start development server
npm run dev

# OR start production server
npm start
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory:

```env
# MongoDB
DB_USER=your_mongodb_username
DB_PASS=your_mongodb_password

# Stripe
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key

# Server
PORT=5000
```

---

## 📡 API Reference

### 🍱 Food Posts
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/posts` | Get all available posts (with distance) |
| POST | `/api/posts` | Create new food post |
| GET | `/api/posts/search` | Search posts |
| GET | `/api/posts/:id` | Get single post |
| PUT | `/api/posts/:id/book` | Book free food |
| PUT | `/api/posts/:id/order` | Order paid food |

### 🔔 Notifications
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/notifications` | Get user notifications |
| PUT | `/api/notifications/:id/accept` | Accept request → create chat |
| PUT | `/api/notifications/:id/cancel` | Cancel request |
| DELETE | `/api/notifications/:id` | Delete notification |

### 💬 Messages
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/chats` | Get all chats for user |
| GET | `/api/messages/:chatId` | Get messages in a chat |
| POST | `/api/messages/send` | Send a message |
| PUT | `/api/messages/:chatId/read` | Mark messages as read |

### 💳 Payment
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/payment/create-intent` | Create Stripe payment intent |
| POST | `/api/payment/confirm` | Confirm payment & create order |

### 📊 Dashboard
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/dashboard/:uid/stats` | Get seller dashboard stats |
| GET | `/api/dashboard/:uid/history` | Get detailed history |

### 🛡️ Admin
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/stats` | Overview stats |
| GET | `/api/admin/users` | All users |
| PUT | `/api/admin/users/:id/make-admin` | Promote to admin |
| PUT | `/api/admin/users/:id/remove-admin` | Remove admin role |
| DELETE | `/api/admin/users/:id` | Delete user |
| GET | `/api/admin/foods` | All food listings |
| DELETE | `/api/admin/foods/:id` | Delete food |
| GET | `/api/admin/payments` | All orders & payments |

---

## ⚡ Socket.io Events

### Client → Server
| Event | Payload | Description |
|-------|---------|-------------|
| `join-user` | `userId` | Join personal room for notifications |
| `join-chat` | `chatId` | Join a chat room |
| `send-message` | `{ chatId, senderId, text }` | Send a message |
| `typing` | `{ chatId, userId }` | Typing indicator |

### Server → Client
| Event | Payload | Description |
|-------|---------|-------------|
| `receive-message` | message object | New message in chat |
| `new-message` | message object | Navbar badge update |
| `new-notification` | `{ foodTitle, type }` | New request received |
| `user-typing` | `{ chatId, userId }` | Someone is typing |

---

## 🚀 Usage Guide

```bash
# Development (with nodemon)
npm run dev

# Production
npm start
```

Server runs on: `http://localhost:5000`

---

## 🤝 Contributing

```bash
# Fork the repo, then:
git checkout -b feature/your-feature-name
git commit -m "Add: your feature description"
git push origin feature/your-feature-name
# Open a Pull Request
```

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 👨‍💻 Author

**MD. Naymur Rahman**
- 🐙 GitHub: [@rahman2220510189](https://github.com/rahman2220510189)
- 🌐 Live: [food-waste-client-one.vercel.app](https://food-waste-client-one.vercel.app)

---

<p align="center">Made with ❤️ to reduce food waste and empower local cooks</p>