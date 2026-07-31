# 🖨️ Thermal Print Manager

A full-stack proof-of-concept for managing thermal printers from a browser. The **React + TypeScript** frontend connects to a **Node.js + Express** backend that communicates with ESC/POS thermal printers over TCP, serial, or system driver interfaces, with real-time status updates via WebSocket.

---

## 📦 Monorepo Structure

```
react-poc/
├── frontend/           # React + TypeScript + Vite dashboard
│   ├── src/
│   │   ├── api/        # Axios API client
│   │   ├── components/ # UI components (Builder, Preview, Settings, Status, History)
│   │   ├── context/    # Global printer state & WebSocket context
│   │   └── pages/      # Dashboard page
│   └── README.md       # Frontend setup guide ➜ see below
│
├── backend/            # Node.js + Express REST API + WebSocket server
│   ├── src/
│   │   ├── config/     # Printer configuration & persistent settings
│   │   ├── controllers/# Route handler logic
│   │   ├── printer/    # Thermal printer instance factory
│   │   ├── routes/     # API route definitions
│   │   ├── services/   # Print job processing & network scanner
│   │   └── utils/      # Logger utility
│   └── README.md       # Backend setup guide ➜ see below
│
└── README.md           # ← You are here
```

---

## ⚡ Quick Start

> Run these commands from the **root** of the repository.

### 1. Clone the repository

```bash
git clone <repository-url>
cd react-poc
```

### 2. Set up and start the Backend

```bash
cd backend
npm install
cp .env.example .env    # then edit .env with your printer details
npm run dev
```

Backend API → **http://localhost:5000**
WebSocket   → **ws://localhost:5000**

### 3. Set up and start the Frontend (new terminal)

```bash
cd frontend
npm install
cp .env.example .env    # verify VITE_API_BASE_URL & VITE_WS_URL
npm run dev
```

Frontend UI → **http://localhost:5173**

---

## 📖 Detailed Setup Guides

| Project | README |
|---------|--------|
| Frontend | [frontend/README.md](./frontend/README.md) |
| Backend  | [backend/README.md](./backend/README.md)   |

---

## 🔑 Environment Variables Summary

### Backend (`backend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | API server port | `5000` |
| `PRINTER_TYPE` | Printer brand | `EPSON` |
| `PRINTER_INTERFACE` | Connection string | `tcp://192.168.1.100` |
| `PRINTER_WIDTH` | Paper width | `80mm` |
| `PRINTER_CHARACTER_SET` | Character encoding | `PC437_USA` |
| `CORS_ORIGIN` | Allowed frontend origin | `http://localhost:5173` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_BASE_URL` | Backend API URL | `http://localhost:5000/api/printer` |
| `VITE_WS_URL` | WebSocket URL | `ws://localhost:5000` |
| `VITE_APP_NAME` | App display name | `Thermal Print Manager` |
| `VITE_APP_VERSION` | App version | `1.0.0` |

---

## 🧩 Features

- 🏗️ **Receipt Builder** — Compose custom receipt layouts interactively
- 👁️ **Live Preview** — See the receipt layout before sending to the printer
- ⚙️ **Printer Settings** — Configure type, interface, and paper width via the UI
- 📡 **Real-time Status** — WebSocket-powered live printer connectivity updates
- 🔍 **Network Scanner** — Auto-discover printers on the local network
- 🗂️ **Print History** — Review past print jobs

---

## 📋 Prerequisites

- **Node.js** ≥ 18.x — [Download](https://nodejs.org/)
- **npm** ≥ 9.x
- A thermal printer (Epson/Star) accessible via TCP, USB/serial, or system driver
