🎉 Zab E-Fest 2025 – Event Management Platform

Zab E-Fest is a comprehensive event management system designed for ZABIST University to manage its annual E-Fest competition.
It enables Admins, Module Heads, Module Leaders, and Participants to collaborate seamlessly through a unified web and mobile platform.

📁 Project Structure
ZabEFest/
│
├── backend/ # Node.js + Express + MongoDB backend
│ ├── models/ # Mongoose schemas (User, Module, Event, Participant, Notification)
│ ├── routes/ # Express routes for API endpoints
│ ├── controllers/ # Business logic for each route
│ ├── middlewares/ # Auth and role-based middleware
│ ├── config/ # Database & email configuration
│ ├── server.js # Server entry point
│ └── .env # Environment variables
│
├── frontend/ # React.js Admin Dashboard
│ ├── src/components/ # Reusable UI components
│ ├── src/pages/ # Admin pages (Events, Modules, Participants, Notifications)
│ ├── src/services/ # API integrations
│ └── src/App.js # App routing and entry
│
└── mobile_app/ # Flutter App for Participants
├── lib/screens/ # Screens (Login, Signup, Home, Modules, Payment)
├── lib/services/ # API connections to backend
├── lib/main.dart # App entry point
└── pubspec.yaml # Flutter dependencies

🚀 Features
🖥️ Admin Dashboard (Web)

Role-based login (Admin, Module Head, Module Leader)

Create and manage events, modules, and participants

Send notifications to all roles

Update and delete notifications

Track applications and payment statuses

View statistics and module performance

📱 Participant Mobile App (Flutter)

Register, log in, and manage profile

Apply for modules directly from the app

View module summaries and payment status

Receive notifications from admin

Track event updates and announcements in real-time

⚙️ Backend (Node.js + Express + MongoDB)

RESTful API design

Secure JWT-based authentication

Role-based access control (Admin / Module Head / Participant)

Mongoose-based database models

Image upload & email integration

Firebase Cloud Messaging (optional) for notifications

🛠️ Tech Stack
Layer Technologies
Frontend (Web) React.js, Redux Toolkit, Material UI
Mobile App Flutter, Dart, SharedPreferences
Backend Node.js, Express.js, MongoDB, Mongoose
Authentication JWT (JSON Web Tokens)
Notifications Firebase Cloud Messaging (FCM), Email
Storage MongoDB Atlas
Hosting (optional) Render / Vercel / Firebase Hosting
⚙️ Setup Instructions
🧩 1. Backend Setup
cd backend
npm install

Create a .env file in backend/ with:

MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
PORT=5000

Then start the server:

npm run dev

🧠 2. Frontend (Admin Dashboard)
cd frontend
npm install
npm start

App runs on 👉 http://localhost:3000

📱 3. Mobile App (Flutter)
cd mobile_app
flutter pub get
flutter run

Make sure to update your baseUrl in lib/services/api.dart:

const String baseUrl = "http://192.168.xx.xx:5000/api"; // Replace with your local IP

🔐 Environment Variables Summary
Variable Description
MONGO_URI MongoDB connection string
JWT_SECRET Secret key for authentication
EMAIL_USER Email used for notification delivery
EMAIL_PASS Password or App password for email
PORT Backend port (default: 5000)
📊 Database Models

User – Admin, ModuleHead, ModuleLeader, Participant

Module – Title, Fee, Capacity, Description

Event – Event-level details

Participant – Linked user and module data

ModuleApplication – Tracks module applications and payment status

Notification – Stores system-wide announcements

🧩 API Overview
Method Endpoint Description
POST /api/auth/login Login user
POST /api/auth/register Register participant
GET /api/modules Fetch all modules
POST /api/participant/modules/apply Apply for a module
GET /api/participant/modules Get participant’s applied modules
PUT /api/applications/:id/status Update payment/enrollment status
POST /api/notifications/send Admin send notification
GET /api/notifications/role/:role Get notifications by role
🧠 Contributors



🧑‍💼 Team Zab E-Fest 2025 – ZABIST Karachi Campus

🎓 Supervisor: Ali Zaman And Ayesha Ghayas && Wali Khubaib

🌍 Deployment

To deploy the backend:

npm run start

Deploy frontend (React) on Vercel or Netlify
Deploy mobile app via Flutter APK build:

flutter build apk --release

📸 Screenshots 


Admin Dashboard

Mobile App Home Screen

Notification View
