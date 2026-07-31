# 🖨️ Thermal Print Manager — Backend

A Node.js + Express REST API server with WebSocket support for managing thermal printer communication, receipt rendering, and real-time printer status broadcasting.

---

## 🛠️ Tech Stack

| Tool | Version |
|------|---------|
| Node.js | ≥ 18.x |
| Express | 5.x |
| node-thermal-printer | 4.x |
| ws (WebSocket) | 8.x |
| dotenv | 17.x |
| nodemon | 3.x (dev) |

---

## 📋 Prerequisites

Make sure you have the following installed before getting started:

- **Node.js** ≥ 18.x — [Download](https://nodejs.org/)
- **npm** ≥ 9.x (comes with Node.js)
- A **thermal printer** accessible over the network (`tcp://`) or via serial/USB port

---

## ⚙️ Setup & Installation

### 1. Navigate to the backend directory

```bash
cd backend
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
# Server port
PORT=5000

# Printer type: EPSON | STAR
PRINTER_TYPE=EPSON

# Printer interface — choose one that matches your setup:
#   Network (TCP):  tcp://192.168.1.100
#   Serial (Linux): /dev/ttyUSB0
#   Serial (macOS): /dev/tty.usbserial-XXXX
#   Serial (Win):   COM3
#   System driver:  printer:My_Printer_Name
PRINTER_INTERFACE=tcp://192.168.1.100

# Paper width (80mm or 58mm are most common)
PRINTER_WIDTH=80mm

# Character set (PC437_USA is the default for most Epson printers)
PRINTER_CHARACTER_SET=PC437_USA

# Allowed origin for CORS (frontend URL)
CORS_ORIGIN=http://localhost:5173
```

---

## 🚀 Running the Project

### Development server (with hot reload via nodemon)

```bash
npm run dev
```

### Production server

```bash
npm start
```

The API will be available at **http://localhost:5000**

WebSocket will be available at **ws://localhost:5000**

---

## 📁 Folder Structure

```
backend/
├── src/
│   ├── config/
│   │   ├── printer-settings.json   # Persisted printer settings storage
│   │   └── printerConfig.js        # Printer configuration loader & validator
│   ├── controllers/
│   │   └── printerController.js    # Route handler logic for all printer endpoints
│   ├── printer/
│   │   └── printer.js              # Thermal printer instance factory
│   ├── routes/
│   │   ├── print.js                # POST /print route definition
│   │   └── printerRoutes.js        # All printer API route definitions
│   ├── services/
│   │   ├── networkScanner.js       # Network IP scanner for printer discovery
│   │   └── printerService.js       # Core print job processing service
│   ├── utils/
│   │   └── logger.js               # Structured console/file logger utility
│   ├── app.js                      # Express app setup (middleware, routes, CORS)
│   └── server.js                   # HTTP + WebSocket server entry point
├── .env                            # Local environment variables (git-ignored)
├── .env.example                    # Environment variable template
├── .gitignore
└── package.json
```

---

## 🔌 API Endpoints

All endpoints are prefixed with `/api/printer`.

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/printer/status` | Get current printer connection status |
| `GET` | `/api/printer/settings` | Retrieve saved printer settings |
| `POST` | `/api/printer/settings` | Update printer settings |
| `POST` | `/api/printer/connect` | Connect to the configured printer |
| `POST` | `/api/printer/disconnect` | Disconnect from the printer |
| `POST` | `/api/printer/print` | Send a print job to the printer |
| `POST` | `/api/printer/test` | Send a test print to verify connectivity |
| `GET` | `/api/printer/scan` | Scan local network for thermal printers |

### WebSocket Events

Connect to `ws://localhost:5000` for real-time events:

| Event | Direction | Description |
|-------|-----------|-------------|
| `printer_status` | Server → Client | Printer connectivity state updates |
| `print_job` | Server → Client | Print job progress/completion events |

---

## 🔌 Environment Variables Reference

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | HTTP server port | `5000` |
| `PRINTER_TYPE` | Thermal printer brand (`EPSON` or `STAR`) | `EPSON` |
| `PRINTER_INTERFACE` | Printer connection string (TCP, serial, driver) | `tcp://192.168.1.100` |
| `PRINTER_WIDTH` | Paper width (`80mm` or `58mm`) | `80mm` |
| `PRINTER_CHARACTER_SET` | Character encoding set | `PC437_USA` |
| `CORS_ORIGIN` | Allowed frontend origin for CORS | `http://localhost:5173` |

---

## 🧩 Key Features

- 🔗 **Multi-interface Support** — Connect via TCP/IP, serial (USB), or system printer driver
- 📡 **Network Scanner** — Auto-discover thermal printers on your local network
- 🖨️ **Receipt Rendering** — Full ESC/POS command support via `node-thermal-printer`
- 🔴 **Real-time Status** — WebSocket broadcasts live printer connectivity state
- ⚙️ **Persistent Settings** — Printer configuration saved to `printer-settings.json`
- 📝 **Structured Logging** — Request/error logging via the logger utility

---

## 🤝 Related

- [Frontend README](../frontend/README.md) — React + TypeScript dashboard
