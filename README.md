Here’s a clean setup for both `.gitignore` and `README.md` for your backend project.

---

### ✅ `.gitignore`

```gitignore
# Dependencies
node_modules/

# Environment variables
.env

# Build outputs
dist/
build/

# Logs
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*

# IDE/editor stuff
.vscode/
.idea/
.DS_Store

# Coverage
coverage/
```

---

### ✅ `README.md`

````markdown
# CloudFlix Backend API

A scalable backend for the CloudFlix project, built with **Node.js**, **Express**, **TypeScript**, **MySQL (Azure Database for MySQL)**, and **Azure Blob Storage**.

---

## 🚀 Features
- Modular API structure with Express + TypeScript
- MySQL database hosted on Azure
- Blob storage integration for file uploads
- Structured logging using Pino
- Centralized error handling
- Environment-based configuration

---

## 🛠️ Setup Instructions

### 1. Clone the repo
```bash
git clone https://github.com/your-username/cloudflix-backend.git
cd cloudflix-backend
````

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env` file in the root directory:

```env
# MySQL Database
MYSQL_HOST=rg-cloudflix.mysql.database.azure.com
MYSQL_PORT=3306
MYSQL_USER=dbadmin
MYSQL_PASSWORD=yourStrongPassword!
MYSQL_DB=appdb
MYSQL_SSL=true

# Azure Blob Storage
AZURE_STORAGE_CONNECTION_STRING=your-blob-connection-string
AZURE_BLOB_CONTAINER=uploads

# App
PORT=4000
LOG_LEVEL=debug
NODE_ENV=development
```

⚠️ Never commit your `.env` file to GitHub.

---

### 4. Run the server in dev mode

```bash
npm run dev
```

This uses `ts-node-dev` for hot reload.

---

### 5. Build & run in production

```bash
npm run build
npm start
```

---

## 📂 Project Structure

```
src/
 ┣ middleware/     # Logging, errors, auth middleware
 ┣ routes/         # Express route definitions
 ┣ storage/        # Azure Blob helpers
 ┣ db/             # MySQL connection & migrations
 ┣ app.ts          # Express app setup
 ┣ index.ts        # Entry point
```

---

## 📡 API Endpoints (so far)

* `GET /api` → Base API check
* `GET /api/v1/health` → Health check endpoint

More modules (Auth, Users, Videos, etc.) coming soon.

---

## 🧪 Testing the DB Connection

Quick script to check DB connection:

```bash
npx tsx src/test-mysql.ts
```


