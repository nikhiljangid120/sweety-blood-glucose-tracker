# Sweety — Blood Glucose Tracker

A full-stack web application designed for diabetes patients to log up to 4 blood glucose readings a day and view clinical daily, month-to-date, and monthly analytical reports.

Built with **Node.js, Express, PostgreSQL, and React**, strictly following **SOLID principles** and clean code architecture.

---

## 📑 Table of Contents
- [Architecture & SOLID Principles](#-architecture--solid-principles)
- [Features](#-features)
  - [Core Features](#1-core-features)
  - [Bonus Features Implemented](#2-bonus-features-implemented)
- [Validation Rules & Error Messages](#-validation-rules--error-messages)
- [Tech Stack](#-tech-stack)
- [Quick Start Guide](#-quick-start-guide)
  - [Prerequisites](#prerequisites)
  - [Installation](#1-installation)
  - [Database Setup](#2-database-setup)
  - [Running Migrations & Seeding](#3-running-migrations--seeding)
  - [Running the Application](#4-running-the-application)
- [Running Automated Tests](#-running-automated-tests)
- [Docker Setup](#-docker-setup)
- [API Reference](#-api-reference)
- [Notes & Assumptions](#-notes--assumptions)

---

## 🏛 Architecture & SOLID Principles

The backend is organized in a layered architecture where each layer has a single responsibility and dependencies are injected rather than hardcoded:

```
server/
├── src/
│   ├── config/          # Database connection pool & environment config
│   ├── controllers/     # HTTP Request/Response handling (Interface Adapters)
│   ├── services/        # Domain business logic & calculation rules (Use Cases)
│   ├── repositories/    # Data Access Layer / SQL queries (Gateway)
│   ├── validators/      # Input validation & error messaging
│   ├── middlewares/     # JWT authentication, centralized error handling
│   ├── routes/          # Express route declarations
│   └── scripts/         # Database migrations and seed script
└── tests/               # Unit and integration test suites
```

### Applied SOLID Principles:
1. **Single Responsibility Principle (SRP)**:
   - `ReadingValidators`: Sole responsibility is payload validation and user-friendly error formatting.
   - `UserRepository` & `ReadingRepository`: Sole responsibility is executing parameterized SQL queries.
   - `ReadingService`: Handles business logic (e.g., verifying maximum 4 readings per day, slot collisions).
   - `ReportService`: Handles statistical analysis (highest, lowest, average rounded to 1 decimal).
   - `Controllers`: Solely translate HTTP requests to service calls and format JSON responses.
2. **Open / Closed Principle (OCP)**:
   - Report statistics computation and strategy interfaces can be extended for additional periods (e.g. quarterly or yearly) without modifying existing calculation engines.
3. **Liskov Substitution Principle (LSP)**:
   - Repository interfaces can be replaced seamlessly with mock repositories or alternative storage engines without breaking services or controllers.
4. **Interface Segregation Principle (ISP)**:
   - Clean, segregated repository and service contracts; consumers only access the methods relevant to their operations.
5. **Dependency Inversion Principle (DIP)**:
   - High-level modules (`AuthService`, `ReadingService`, `ReportService`) do not depend on concrete low-level database drivers; repositories are injected via constructor arguments, enabling isolated unit testing.

---

## ✨ Features

### 1. Core Features
- **User Authentication**:
  - Secure registration and login using email and password.
  - Passwords hashed using `bcrypt` (10 salt rounds); plain text is never stored.
  - JWT token-based authentication.
  - **Data Isolation**: Patients can only view, edit, or delete their own readings.
- **Reading Management (CRUD)**:
  - Supports 4 clinical time slots:
    1. `Morning (fasting)`
    2. `After breakfast`
    3. `After lunch`
    4. `After dinner`
  - Values recorded in `mg/dl`.
  - Optional personal clinical notes (e.g., meals eaten, symptoms).
- **Reports**:
  - **Daily Report**: For the selected date (e.g. 15 Oct 2026). Lists each reading alongside its slot, value, and status badge.
  - **Month-to-Date (MTD) Report**: From the 1st of the month to the selected date.
  - **Monthly Report**: The whole previous month (e.g., for October 2026, 1 Sep – 30 Sep 2026).
  - Each report calculates:
    - **Highest reading**
    - **Lowest reading**
    - **Average reading** (rounded to 1 decimal place)
    - **Total number of readings**
  - Friendly empty state when no readings exist for a period.

### 2. Bonus Features Implemented
- 📈 **Interactive Charts**: Interactive trend curve using **Recharts** with a highlighted green Target Zone (70–140 mg/dl).
- 📄 **Pagination**: Built-in support on `GET /api/readings?page=1&limit=20` with total pages and records.
- 🐳 **Docker & Docker Compose**: Automated containerization with `docker-compose.yml` for PostgreSQL and the server.
- 🧪 **Comprehensive Automated Tests**: Unit & Integration tests using Jest covering validation rules, business logic, report computations, and authentication.

---

## 🛡 Validation Rules & Error Messages

| Validation Rule | Example Error Message |
| :--- | :--- |
| **Value is required** | `"Please enter a glucose value."` |
| **Value must be a whole number between 40 and 600** | `"Value must be between 40 and 600 mg/dl."` |
| **Only one reading per slot per day** | `"You already have an {slot} reading for this date."` |
| **Maximum 4 readings per day** | `"You can add only 4 readings per day."` |
| **Date cannot be in the future** | `"Date cannot be in the future."` |

---

## 🛠 Tech Stack

- **Backend**: Node.js, Express.js, PostgreSQL (`pg` pool), `bcryptjs`, `jsonwebtoken`, `helmet`, `cors`, `morgan`
- **Frontend**: React 18, Vite, Tailwind CSS, Lucide React (Icons), Recharts (Visualizations), `date-fns`
- **Testing**: Jest, Supertest

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js (v18 or v20+)
- PostgreSQL (or Docker to run PostgreSQL)

### 1. Installation
Install root, server, and client dependencies:
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install

# Return to root
cd ..
```

### 2. Database Setup
Create a PostgreSQL database (e.g., named `sweety_db`).

Create a `.env` file in `server/` (copy from `server/.env.example`):
```env
PORT=5000
NODE_ENV=development

# PostgreSQL connection string
DATABASE_URL=postgres://postgres:postgres@localhost:5432/sweety_db

# Or discrete variables:
DB_HOST=localhost
DB_PORT=5432
DB_USER=postgres
DB_PASSWORD=postgres
DB_NAME=sweety_db

JWT_SECRET=super_secret_jwt_key_change_in_production
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

### 3. Running Migrations & Seeding
Run the database migrations and seed realistic sample data:
```bash
# Run migrations (creates users & readings tables with constraints)
cd server
npm run migrate

# Run seed script (creates demo user & sample readings for current & previous months)
npm run seed
```

#### Demo User Credentials:
- **Email**: `demo@sweety.app`
- **Password**: `Password123!`

*(The login screen also provides a convenient 1-click "Auto-fill" button for assessors).*

### 4. Running the Application

In terminal 1 (Backend):
```bash
cd server
npm run dev
# Server starts on http://localhost:5000
```

In terminal 2 (Frontend):
```bash
cd client
npm run dev
# Frontend starts on http://localhost:5173
```

---

## 🧪 Running Automated Tests

Run the backend unit and service business logic tests:
```bash
cd server
npm test
```

All 21 test suites execute in isolation with zero external database dependencies:
- ✅ **ReadingValidators**: Checks missing values, value ranges (40–600), whole numbers, future dates, slot validation.
- ✅ **ReadingService**: Checks 4 readings limit, slot conflict prevention, reading updates without self-collision.
- ✅ **ReportService**: Checks statistical aggregation (highest, lowest, average rounded to 1 decimal), friendly empty states, date range calculations.
- ✅ **AuthService**: Checks password hashing with bcrypt, unique email enforcement, token generation.

---

## 🐳 Docker Setup

To run PostgreSQL with Docker Compose:
```bash
docker compose up -d postgres
```
Then run migrations and start the server:
```bash
cd server
npm run migrate
npm run seed
npm run dev
```

---

## 📡 API Reference

### Authentication
- `POST /api/auth/register` — Register new user (`name`, `email`, `password`)
- `POST /api/auth/login` — Sign in (`email`, `password`)
- `GET /api/auth/me` — Get current logged-in user profile (Requires Bearer token)

### Readings
- `GET /api/readings` — List readings (Query params: `page`, `limit`, `date`)
- `GET /api/readings/:id` — Get single reading
- `POST /api/readings` — Create reading (`date`, `slot`, `value`, `notes`)
- `PUT /api/readings/:id` — Update reading (`date`, `slot`, `value`, `notes`)
- `DELETE /api/readings/:id` — Delete reading

### Reports
- `GET /api/reports?date=YYYY-MM-DD` — Get all 3 reports (Daily, Month-to-Date, Monthly)
- `GET /api/reports/daily?date=YYYY-MM-DD` — Daily report with slot-by-slot list
- `GET /api/reports/month-to-date?date=YYYY-MM-DD` — Month-to-date statistics
- `GET /api/reports/monthly?date=YYYY-MM-DD` — Previous month statistics

---

## 📝 Notes & Assumptions

1. **Date Representation & Boundaries**:
   - Dates are stored as `DATE` (`YYYY-MM-DD`) in PostgreSQL to avoid timezone drift issues across local patient devices.
   - For Monthly reports, "the whole previous month" is calculated relative to the chosen reference date. For instance, if the selected date is `15 Oct 2026`, the monthly report spans `1 Sep 2026` to `30 Sep 2026`, accurately accounting for variable month lengths.
2. **Clinical Target Bands**:
   - The UI follows standard clinical diabetes guidelines for visual indicator badges:
     - **Low**: `< 70 mg/dl`
     - **Normal**: `70 – 140 mg/dl`
     - **Elevated**: `141 – 180 mg/dl`
     - **High**: `> 180 mg/dl`
3. **What I would improve with more time**:
   - **Redis Caching**: Cache report statistics with automatic cache invalidation on reading additions or mutations.
   - **Background Job with BullMQ**: Automated evening notification for users who have recorded fewer than 4 readings for the day.
   - **Doctor Portal / Role-based Access**: A dedicated doctor account with capability to view patient trend charts and export PDF summaries.
   - **CSV / PDF Export**: 1-click export of daily or monthly glucose logbooks for physician visits.
