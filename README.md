# 🚢 ShipTrack — Sea Freight LCL Tracking System
### China → Jordan | نظام تتبع شحنات LCL

A complete, production-ready shipment tracking platform for LCL sea freight from China to Jordan. Built with React (Vite) + Node.js/Express + MySQL.

---

## 📦 Features

### Customer Portal
- 🔍 Track shipments by tracking number or QR scan
- 📍 Live status timeline (6 stages from Ningbo to delivery)
- 🖼️ Image gallery with lightbox (container / cargo / port photos)
- 🌐 Arabic RTL + English bilingual
- 📱 Fully mobile-responsive
- 💬 WhatsApp support button

### Admin Dashboard
- 🔐 Secure JWT authentication
- 📊 Dashboard with live statistics
- 📦 Full CRUD for shipments
- 📍 Status update with history log
- 🖼️ Multi-image upload with drag & drop
- 🔢 Auto-generated tracking numbers & QR codes
- 🔗 Shareable tracking links

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 18+
- MySQL 8.0
- npm

### 1. Clone & Setup

```bash
git clone <your-repo>
cd shiptrack
```

### 2. Database

```bash
mysql -u root -p < database/schema.sql
```

### 3. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your MySQL credentials and JWT secret
npm install
npm run dev
# Runs on http://localhost:5000
```

### 4. Frontend

```bash
cd frontend
# Create .env.local:
echo "VITE_WHATSAPP=962791234567" > .env.local
npm install
npm run dev
# Runs on http://localhost:5173
```

### 5. Default Admin Login
- **Email:** admin@shiptrack.jo
- **Password:** Admin@1234
- ⚠️ Change this immediately in production!

---

## 🐳 Docker Deployment

```bash
# Copy and configure env
cp .env.example .env
# Edit .env:
#   DB_PASSWORD=yourSecurePassword
#   JWT_SECRET=yourLong64CharRandomSecret
#   FRONTEND_URL=https://yourdomain.com
#   TRACKING_BASE_URL=https://yourdomain.com/track
#   WHATSAPP_NUMBER=962791234567

docker-compose up -d
```

The app will be available at `http://localhost`.

---

## 🌐 Production Deployment (VPS)

### Recommended: Ubuntu 22.04 + Nginx

```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install MySQL
sudo apt-get install -y mysql-server
sudo mysql_secure_installation

# Setup database
sudo mysql < database/schema.sql

# Backend
cd backend
npm ci --only=production
# Use PM2 for process management:
npm install -g pm2
pm2 start server.js --name shiptrack-api
pm2 save && pm2 startup

# Frontend
cd frontend
npm ci
npm run build
# Copy dist/ to nginx web root
```

### Nginx Config

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    
    root /var/www/shiptrack;
    index index.html;
    
    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /uploads/ {
        proxy_pass http://localhost:5000;
    }
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

```bash
# SSL with Let's Encrypt
sudo certbot --nginx -d yourdomain.com
```

---

## 📡 API Endpoints

### Public (no auth)
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/track/:tracking_number` | Get shipment by tracking number |
| GET | `/api/health` | Health check |

### Admin (requires Bearer token)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/shipments` | List shipments (search, filter, paginate) |
| POST | `/api/shipments` | Create shipment |
| GET | `/api/shipments/:id` | Get shipment details |
| PUT | `/api/shipments/:id` | Update shipment info |
| PATCH | `/api/shipments/:id/status` | Update status |
| DELETE | `/api/shipments/:id` | Delete shipment |
| POST | `/api/images/:shipmentId` | Upload images |
| DELETE | `/api/images/:imageId` | Delete image |
| PATCH | `/api/images/reorder` | Reorder images |
| GET | `/api/stats` | Dashboard statistics |

---

## 🗂️ Project Structure

```
shiptrack/
├── database/
│   └── schema.sql          # MySQL schema + seed data
├── backend/
│   ├── server.js            # Express entry point
│   ├── config/db.js         # MySQL connection pool
│   ├── middleware/
│   │   ├── auth.js          # JWT middleware
│   │   └── upload.js        # Multer config
│   ├── routes/
│   │   ├── auth.js
│   │   ├── shipments.js
│   │   ├── tracking.js      # Public tracking
│   │   ├── images.js
│   │   └── stats.js
│   └── uploads/             # Uploaded images (gitignored)
├── frontend/
│   ├── src/
│   │   ├── App.jsx          # Router setup
│   │   ├── index.css        # Design system
│   │   ├── context/
│   │   │   ├── LangContext.jsx   # AR/EN translations
│   │   │   └── AuthContext.jsx   # Auth state
│   │   ├── pages/
│   │   │   ├── TrackingHome.jsx  # Landing / search
│   │   │   ├── TrackingPage.jsx  # Public tracking page
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── AdminLayout.jsx   # Sidebar layout
│   │   │   ├── AdminDashboard.jsx
│   │   │   ├── AdminShipments.jsx
│   │   │   └── AdminShipmentDetail.jsx
│   │   └── utils/
│   │       ├── api.js       # Axios instance
│   │       └── status.js    # Status helpers
│   └── index.html
└── docker-compose.yml
```

---

## 🔒 Security Notes

1. **Change the default admin password** immediately after first login
2. Set a strong `JWT_SECRET` (64+ random characters)
3. Keep `uploads/` directory outside web root in production
4. Enable HTTPS with a valid SSL certificate
5. Restrict MySQL access to localhost only
6. Consider rate limiting on the tracking endpoint

---

## 📱 QR Code Usage

Each shipment automatically gets:
- A unique tracking URL: `https://yourdomain.com/track/AB12345`
- A QR code PNG at `/uploads/qr/qr-AB12345.png`
- Downloadable directly from the admin detail page

Customers scan the QR code → lands directly on the tracking page.

---

## 🌍 Language Support

The system supports **Arabic (RTL)** as primary and **English (LTR)** as secondary. The language switcher is available on both the customer portal and admin panel. Language preference is saved in localStorage.

---

## 📞 Support

Configure the WhatsApp number in `.env`:
```
WHATSAPP_NUMBER=962791234567
```
Replace with your company's WhatsApp business number. The sticky FAB button and header contact link will use this number.
