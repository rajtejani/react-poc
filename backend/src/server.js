const http = require("http");
const WebSocket = require("ws");
const app = require("./app");
const printerService = require("./services/printerService");
const logger = require("./utils/logger");

const PORT = process.env.PORT || 5000;

// Create HTTP server
const server = http.createServer(app);

// Bind WebSocket server to the HTTP server
const wss = new WebSocket.Server({ server });

// Bind WebSocket to printer service
printerService.registerWss(wss);

// WebSocket connection lifecycle
wss.on("connection", (ws) => {
  logger.info("New WebSocket client connected.");

  // Send initial printer state
  ws.send(
    JSON.stringify({
      type: "status",
      data: {
        connected: printerService.connected,
        error: printerService.error,
        settings: printerService.settings,
        queueLength: printerService.queue.length,
        currentJob: printerService.currentJob
      }
    })
  );

  // Send recent logs history
  ws.send(
    JSON.stringify({
      type: "logs",
      data: logger.getLogs()
    })
  );

  ws.on("close", () => {
    logger.info("WebSocket client disconnected.");
  });
});

// Start application
server.listen(PORT, async () => {
  logger.info(`Server running on http://localhost:${PORT}`);
  
  try {
    await printerService.init();
  } catch (err) {
    logger.error(`Failed to start Printer Service during server boot: ${err.message}`);
  }
});