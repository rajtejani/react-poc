# 🖨️ Thermal Print Manager — Frontend

A modern React + TypeScript dashboard for managing thermal printers, building receipts, and monitoring print jobs in real time via WebSocket.

---

## 🛠️ Tech Stack

| Tool | Version |
|------|---------|
| React | 19.x |
| TypeScript | 6.x |
| Vite | 8.x |
| React Router DOM | 7.x |
| Axios | 1.x |

---

## 📋 Prerequisites

Make sure you have the following installed before getting started:

- **Node.js** ≥ 18.x — [Download](https://nodejs.org/)
- **npm** ≥ 9.x (comes with Node.js)
- The **backend server** running at `http://localhost:5000` (see [Backend README](../backend/README.md))

---

## ⚙️ Setup & Installation

### 1. Navigate to the frontend directory

```bash
cd frontend
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example env file and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# API base URL pointing to the backend
VITE_API_BASE_URL=http://localhost:5000/api/printer

# WebSocket URL for real-time printer status
VITE_WS_URL=ws://localhost:5000

# App metadata
VITE_APP_NAME=Thermal Print Manager
VITE_APP_VERSION=1.0.0
```

---

## 🚀 Running the Project

### Development server

```bash
npm run dev
```

The app will be available at **http://localhost:5173**

### Build for production

```bash
npm run build
```

### Preview production build locally

```bash
npm run preview
```

### Run linter

```bash
npm run lint
```

---

## 📁 Folder Structure

```
frontend/
├── public/                     # Static assets served as-is
├── src/
│   ├── api/
│   │   └── printerApi.ts       # Axios API client for all printer endpoints
│   ├── assets/                 # Images, icons, and other static assets
│   ├── components/
│   │   ├── PrintHistory.tsx    # Print job history list component
│   │   ├── PrinterSettings.tsx # Printer configuration form component
│   │   ├── PrinterStatus.tsx   # Live printer status indicator component
│   │   ├── ReceiptBuilder.tsx  # Drag-and-drop receipt builder component
│   │   └── ReceiptPreview.tsx  # Live preview of the receipt layout
│   ├── context/
│   │   └── PrinterContext.tsx  # Global printer state & WebSocket context
│   ├── pages/
│   │   └── Dashboard.tsx       # Main dashboard page
│   ├── services/               # Additional service utilities (reserved)
│   ├── App.css                 # Global component styles
│   ├── App.tsx                 # Root app component with routing
│   ├── index.css               # Base CSS reset and design tokens
│   └── main.tsx                # Application entry point
├── .env                        # Local environment variables (git-ignored)
├── .env.example                # Environment variable template
├── .gitignore
├── eslint.config.js            # ESLint configuration
├── index.html                  # HTML entry point
├── package.json
├── tsconfig.json               # Root TypeScript config
├── tsconfig.app.json           # App-specific TypeScript config
├── tsconfig.node.json          # Node/Vite TypeScript config
└── vite.config.ts              # Vite bundler configuration
```

---

## 🔌 Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend REST API base URL | `http://localhost:5000/api/printer` |
| `VITE_WS_URL` | WebSocket server URL for real-time updates | `ws://localhost:5000` |
| `VITE_APP_NAME` | Application display name | `Thermal Print Manager` |
| `VITE_APP_VERSION` | Application version | `1.0.0` |

> ⚠️ All variables exposed to the browser **must** be prefixed with `VITE_`.

---

## 🧩 Key Features

- 📊 **Dashboard** — Unified view of printer status, settings, and recent jobs
- 🏗️ **Receipt Builder** — Interactively compose receipt layouts
- 👁️ **Receipt Preview** — Real-time visual preview before printing
- ⚙️ **Printer Settings** — Configure printer type, interface, and paper width
- 📡 **Live Status** — WebSocket-powered real-time printer connectivity status
- 🗂️ **Print History** — Browse and review past print jobs

---

## 🤝 Related

- [Backend README](../backend/README.md) — Node.js Express API server
