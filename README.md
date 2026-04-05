# 🏥 SmartSaathi – AI-Powered Voice Healthcare Assistant

> **Designed for elderly users** | Built with Node.js + Express + MongoDB + Vanilla JS

[![Node.js](https://img.shields.io/badge/Node.js-18+-green)](https://nodejs.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-green)](https://mongodb.com)
[![License](https://img.shields.io/badge/License-MIT-blue)](LICENSE)

---

## 📋 Project Structure

```
smartsaathi/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   │   └── auth.js          # JWT middleware
│   ├── models/
│   │   ├── User.js          # User schema
│   │   ├── Medicine.js      # Medicine + reminders schema
│   │   ├── OTP.js           # OTP schema with TTL
│   │   └── SOS.js           # SOS alert logs
│   ├── routes/
│   │   ├── auth.js          # Send OTP, Login, Register
│   │   ├── users.js         # Profile, contacts, conditions
│   │   ├── medicines.js     # CRUD + mark taken
│   │   ├── reminders.js     # Upcoming reminders
│   │   ├── sos.js           # SOS trigger + history
│   │   ├── disease.js       # Disease prediction (ML logic)
│   │   └── chatbot.js       # AI chatbot responses
│   ├── utils/
│   │   ├── otp.js           # OTP generate/verify/send
│   │   └── seed.js          # Sample data seeder
│   ├── .env.example
│   ├── package.json
│   └── server.js            # Express app entry point
│
└── frontend/
    ├── css/
    │   ├── main.css         # Global styles, utilities
    │   ├── auth.css         # Landing + auth styles
    │   └── dashboard.css    # Dashboard + all pages
    ├── js/
    │   ├── config.js        # API config
    │   ├── utils.js         # Toast, API helper, formatters
    │   ├── auth.js          # OTP login/register flow
    │   ├── dashboard.js     # Main dashboard logic
    │   ├── medicines.js     # Medicines CRUD
    │   ├── reminders.js     # Today's reminders
    │   ├── disease.js       # Disease check UI
    │   ├── sos.js           # SOS trigger UI
    │   ├── music.js         # Music player
    │   ├── chatbot.js       # Chat interface
    │   ├── voice.js         # Web Speech API
    │   └── profile.js       # Profile management
    ├── pages/
    │   └── dashboard.html   # Main dashboard
    └── index.html           # Landing + Auth page
```

---

## ⚡ Quick Setup

### Prerequisites
- Node.js v18+
- MongoDB (local) OR MongoDB Atlas (cloud)
- npm or yarn

### Step 1: Clone & Install

```bash
cd smartsaathi/backend
npm install
```

### Step 2: Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smartsaathi
JWT_SECRET=your_super_secret_key_change_this_2024_production

# Optional: Twilio for real SMS OTP
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token
TWILIO_PHONE_NUMBER=+1234567890

# Optional: Email for SOS alerts
EMAIL_USER=your@gmail.com
EMAIL_PASS=your_app_password

OTP_EXPIRE_MINUTES=10
NODE_ENV=development
```

### Step 3: Seed Sample Data (Optional)

```bash
cd backend
npm run seed
```

This creates:
- Sample user: **Ramesh Kumar**, Phone: **9876543210**
- 4 sample medicines (Metformin, Amlodipine, Vitamin D3, Atorvastatin)

### Step 4: Start Server

```bash
npm start
# OR for development with auto-reload:
npm run dev
```

### Step 5: Open App

```
http://localhost:5000
```

---

## 🔐 OTP Login Flow

### Development Mode (No Twilio):
1. Enter phone number → Click "Send OTP"
2. **OTP appears in the browser** (yellow box) AND in terminal console
3. Enter OTP → Login/Register

### Production Mode (With Twilio):
1. Enter phone number → Click "Send OTP"
2. OTP sent via SMS to the number
3. Enter OTP → Login/Register

---

## 🧪 Testing with Sample Data

After seeding, use these credentials:
```
Phone: 9876543210
→ Click "Send OTP"
→ OTP will appear on screen (dev mode)
→ Enter it to login as Ramesh Kumar
```

---

## 🌟 Feature Explanations

### 1. OTP Authentication
- Phone number + OTP based login (no passwords needed!)
- OTPs hashed with bcrypt before storage
- Auto-expire with MongoDB TTL index
- Max 3 wrong attempts before OTP invalidation
- 10-minute expiry with countdown timer

### 2. Dashboard
- Real-time stats: total medicines, taken today, upcoming
- Welcome banner with time-based greeting
- Quick action buttons
- Today's medicine reminder preview

### 3. Medicine Reminders
- Add medicines with name, dosage, frequency, multiple times
- Frequency presets: Once/Twice/Thrice/Four times daily
- Mark doses as taken with one tap
- Visual status: taken (green), missed (red), upcoming (yellow)
- Browser reminders check every minute

### 4. Voice Assistant (Web Speech API)
- Uses `SpeechRecognition` API (Chrome/Edge)
- Text-to-speech feedback via `SpeechSynthesis`
- Commands: "Add medicine", "Check disease", "Play music", "Call SOS", "Show reminders", "Open chatbot"
- Falls back gracefully on unsupported browsers

### 5. Disease Prediction (ML-Inspired)
- 15 disease dataset with symptom arrays
- Weighted scoring: exact match (1.0) + partial word match (0.5)
- Confidence = (matchRatio × 0.6) + (coverageRatio × 0.4) × 100
- Returns top 3 matches with urgency levels
- Emergency warning for critical conditions (Dengue, COVID)

### 6. SOS Emergency
- One-tap SOS with location capture
- Sends SMS alerts via Twilio to all emergency contacts
- Dev mode: simulates sending (logs to console)
- SOS history with status tracking
- Emergency numbers displayed prominently

### 7. AI Chatbot (Saathi)
- Keyword-based intent matching (no external AI API needed)
- Context-aware responses (checks user's medicine list)
- Medicine schedule awareness
- Handles: health tips, BP, diabetes, mental health, food, sleep, exercise
- Suggests actions and opens relevant pages

### 8. Music Player
- 8-track wellness playlist with simulated playback
- Progress tracking, skip, loop, volume control
- Disc animation while playing
- Controlled via UI and voice commands

---

## 📱 Voice Commands Reference

| Command | Action |
|---------|--------|
| "Add medicine" | Opens Add Medicine modal |
| "Show my medicines" | Opens Medicines page |
| "Check reminders" | Opens Reminders page |
| "Check disease" | Opens Disease Check |
| "Play music" | Opens Music Player & plays |
| "Call SOS" / "Emergency" | Triggers SOS Alert |
| "Open chatbot" | Opens AI Chatbot |
| "Go home" | Dashboard home |

---

## 🔌 API Reference

### Auth Endpoints
```
POST /api/auth/send-otp     { phone, purpose }
POST /api/auth/register     { phone, otp, name, age, gender }
POST /api/auth/login        { phone, otp }
GET  /api/auth/me           (Bearer token)
POST /api/auth/logout       (Bearer token)
```

### Medicines
```
GET    /api/medicines
POST   /api/medicines
GET    /api/medicines/:id
PUT    /api/medicines/:id
DELETE /api/medicines/:id
GET    /api/medicines/reminders/today
PATCH  /api/medicines/:id/taken       { time }
```

### User Profile
```
GET  /api/users/profile
PUT  /api/users/profile
POST /api/users/emergency-contacts
DEL  /api/users/emergency-contacts/:id
POST /api/users/medical-conditions
DEL  /api/users/medical-conditions/:id
```

### SOS
```
POST /api/sos/trigger        { latitude, longitude, message }
GET  /api/sos/history
PATCH /api/sos/:id/resolve
```

### Disease
```
POST /api/disease/predict    { symptoms: [] }
GET  /api/disease/symptoms-list
```

### Chatbot
```
POST /api/chatbot/message    { message }
```

---

## 🚀 Deployment Guide

### Frontend + Backend on Render

1. Push code to GitHub
2. Create new **Web Service** on [render.com](https://render.com)
3. Set root directory: `backend`
4. Build command: `npm install`
5. Start command: `node server.js`
6. Add environment variables from `.env`
7. Set `NODE_ENV=production`
8. Set `MONGODB_URI` to MongoDB Atlas URI
9. Set `FRONTEND_URL` to your Render URL

### MongoDB Atlas

1. Create account at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create free M0 cluster
3. Add database user
4. Whitelist IP: `0.0.0.0/0` (all IPs)
5. Get connection string → set as `MONGODB_URI`

### Twilio (Real SMS OTP)

1. Sign up at [twilio.com](https://twilio.com)
2. Get Account SID, Auth Token, Phone Number
3. Add to `.env` variables
4. Verify phone numbers in trial mode

---

## 🎯 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JS |
| Backend | Node.js + Express.js |
| Database | MongoDB + Mongoose ODM |
| Auth | JWT + bcrypt + OTP |
| SMS | Twilio (optional) |
| Email | Nodemailer (optional) |
| Voice | Web Speech API |
| Security | Helmet, CORS, Rate Limiting |

---

## ♿ Accessibility Features

- Large text (16px+ base) for elderly users
- High contrast blue/green color scheme
- Large tap targets (44px+ buttons)
- ARIA labels on interactive elements
- Voice feedback via Text-to-Speech
- Keyboard navigation support
- Simple, single-task navigation

---

## 📄 License

MIT License – Free to use for educational and portfolio purposes.

---

*Built with ❤️ for elderly healthcare – SmartSaathi 2024*
