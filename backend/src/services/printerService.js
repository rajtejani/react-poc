const { printer: Printer, types: PrinterTypes } = require("node-thermal-printer");
const WebSocket = require("ws");
const { loadSettings, getPrinterInterfaceString } = require("../config/printerConfig");
const logger = require("../utils/logger");

class PrinterService {
  constructor() {
    this.printer = null;
    this.connected = false;
    this.error = null;
    this.settings = null;
    this.wss = null;
    
    // Asynchronous queue management
    this.queue = [];
    this.currentJob = null;
    this.isProcessingQueue = false;
    
    // Polling handles
    this.pollingInterval = null;
    this.isPolling = false;
  }

  /**
   * Initializes the printer service, loads configuration,
   * establishes initial connection, and starts status polling.
   */
  async init() {
    logger.info("Initializing Printer Service...");
    this.settings = loadSettings();
    
    // Setup log listener to stream logs to WebSocket clients
    logger.setListener((log) => {
      this.broadcast({ type: "log", data: log });
    });

    await this.setupPrinterInstance();
    this.startPolling();
  }

  /**
   * Builds the node-thermal-printer client using saved settings
   */
  async setupPrinterInstance() {
    try {
      const interfaceStr = getPrinterInterfaceString(this.settings);
      const isStar = this.settings.type === "STAR";
      
      logger.info(`Setting up printer: Name="${this.settings.name}", Interface="${interfaceStr}", Type="${this.settings.type}"`);

      // Determine width in characters (80mm: 48, 58mm: 32)
      const charWidth = this.settings.width === "58mm" ? 32 : 48;

      this.printer = new Printer({
        type: isStar ? PrinterTypes.STAR : PrinterTypes.EPSON,
        interface: interfaceStr,
        width: charWidth,
        characterSet: this.settings.characterSet || "PC437_USA",
        options: {
          timeout: 4000
        }
      });

      // Attempt initial connection test
      await this.checkConnection();
    } catch (err) {
      this.connected = false;
      this.error = err.message;
      logger.error(`Error configuring printer instance: ${err.message}`);
      this.broadcastStatus();
    }
  }

  /**
   * Connects or re-connects by reloading settings from disk
   */
  async reconnect() {
    logger.info("Reconnecting printer with fresh configuration...");
    this.settings = loadSettings();
    await this.setupPrinterInstance();
  }

  /**
   * Disconnects the printer service (stops polling, resets state)
   */
  async disconnect() {
    logger.info("Manually disconnecting printer...");
    this.stopPolling();
    this.connected = false;
    this.error = "Manually disconnected";
    this.broadcastStatus();
  }

  /**
   * Checks the connection status of the physical printer
   */
  async checkConnection() {
    if (!this.printer) {
      this.connected = false;
      this.error = "Printer not initialized";
      return false;
    }

    try {
      // isPrinterConnected returns a promise resolving to a boolean
      const isConnected = await this.printer.isPrinterConnected();
      
      const prevConnected = this.connected;
      const prevError = this.error;

      if (isConnected) {
        this.connected = true;
        this.error = null;
        if (!prevConnected) {
          logger.info("Printer successfully connected!");
        }
      } else {
        this.connected = false;
        this.error = "Printer offline or unreachable";
        if (prevConnected || prevError !== this.error) {
          logger.warn("Printer is offline or unreachable.");
        }
      }

      // If status changed, broadcast updates
      if (prevConnected !== this.connected || prevError !== this.error) {
        this.broadcastStatus();
      }

      return isConnected;
    } catch (err) {
      const prevConnected = this.connected;
      const prevError = this.error;

      this.connected = false;
      this.error = err.message || "Connection check failed";
      
      if (prevConnected || prevError !== this.error) {
        logger.error(`Connection check failed: ${this.error}`);
        this.broadcastStatus();
      }
      return false;
    }
  }

  /**
   * Starts periodic polling of connection status
   */
  startPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    
    logger.info("Starting connection polling...");
    this.pollingInterval = setInterval(async () => {
      if (this.isPolling) return; // Prevent overlapping runs
      this.isPolling = true;
      await this.checkConnection();
      this.isPolling = false;
    }, 15000); // Poll every 15 seconds
  }

  /**
   * Stops periodic polling
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
      logger.info("Stopped connection polling.");
    }
  }

  /**
   * Registers a WebSocket Server instance for real-time broadcasts
   */
  registerWss(wss) {
    this.wss = wss;
    logger.info("WebSocket Server registered to Printer Service.");
  }

  /**
   * Broadcasts a JSON message to all active WebSocket clients
   */
  broadcast(data) {
    if (!this.wss) return;
    
    const messageStr = JSON.stringify(data);
    this.wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(messageStr);
        } catch (err) {
          console.error("WS send error:", err);
        }
      }
    });
  }

  /**
   * Broadcasts current connection and settings status
   */
  broadcastStatus() {
    this.broadcast({
      type: "status",
      data: {
        connected: this.connected,
        error: this.error,
        settings: this.settings,
        queueLength: this.queue.length,
        currentJob: this.currentJob
      }
    });
  }

  /**
   * Enqueues a printer operation task to maintain serialization
   * @param {string} jobName - Descriptive name of the print job
   * @param {function} printFn - Asynchronous function containing printer operations
   */
  enqueueJob(jobName, printFn) {
    return new Promise((resolve, reject) => {
      const task = {
        name: jobName,
        fn: printFn,
        resolve,
        reject,
        id: Math.random().toString(36).substring(7),
        timestamp: new Date().toISOString()
      };

      this.queue.push(task);
      logger.info(`Enqueued job: "${jobName}" (Queue size: ${this.queue.length})`);
      this.broadcastStatus();

      this.processQueue();
    });
  }

  /**
   * Processes queue tasks sequentially
   */
  async processQueue() {
    if (this.isProcessingQueue) return;
    this.isProcessingQueue = true;

    while (this.queue.length > 0) {
      const task = this.queue.shift();
      this.currentJob = task.name;
      logger.info(`Processing job: "${task.name}"`);
      this.broadcastStatus();

      try {
        // Clear buffer before beginning operations
        this.printer.clear();
        
        // Execute printer builder commands
        await task.fn(this.printer);
        
        // Send buffer to physical device
        await this.printer.execute();
        
        logger.info(`Job completed successfully: "${task.name}"`);
        task.resolve({ success: true, jobId: task.id });
      } catch (err) {
        logger.error(`Job failed: "${task.name}" - Error: ${err.message}`);
        task.reject(new Error(`Printing failed: ${err.message}`));
      }

      this.currentJob = null;
      this.broadcastStatus();
    }

    this.isProcessingQueue = false;
  }
}

// Export singleton instance
module.exports = new PrinterService();
