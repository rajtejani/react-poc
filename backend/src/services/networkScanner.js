const net = require("net");
const os = require("os");
const printerService = require("./printerService");
const logger = require("../utils/logger");

class NetworkScanner {
  constructor() {
    this.isScanning = false;
  }

  /**
   * Get the active local IP address and subnet details.
   * Returns { ip, subnet } (e.g., { ip: "192.168.1.15", subnet: "192.168.1" })
   */
  getLocalSubnet() {
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      for (const netInterface of interfaces[name]) {
        // Find non-internal IPv4 address
        if (netInterface.family === "IPv4" && !netInterface.internal) {
          const ip = netInterface.address;
          // Extract the first 3 octets for a /24 network
          const parts = ip.split(".");
          if (parts.length === 4) {
            const subnet = `${parts[0]}.${parts[1]}.${parts[2]}`;
            return { ip, subnet };
          }
        }
      }
    }
    // Fallback if no network interface is found
    return { ip: "127.0.0.1", subnet: "127.0.0" };
  }

  /**
   * Tests a single IP and Port connection.
   * Resolves to { ip, port, open: true/false, responseTime }
   */
  scanIP(ip, port, timeout = 600) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const socket = new net.Socket();
      let resolved = false;

      const finish = (open) => {
        if (resolved) return;
        resolved = true;
        socket.destroy();
        const responseTime = Date.now() - startTime;
        resolve({ ip, port, open, responseTime });
      };

      socket.setTimeout(timeout);

      socket.connect(port, ip, () => {
        finish(true);
      });

      socket.on("error", () => {
        finish(false);
      });

      socket.on("timeout", () => {
        finish(false);
      });
    });
  }

  /**
   * Scans the subnet on port 9100.
   * Broadcasts progress in real-time.
   */
  async scan(port = 9100, progressCallback) {
    if (this.isScanning) {
      throw new Error("A subnet scan is already in progress.");
    }

    this.isScanning = true;
    const { ip: localIP, subnet } = this.getLocalSubnet();
    logger.info(`Starting subnet scan on ${subnet}.x for port ${port}...`);

    const discoveredPrinters = [];
    const totalHosts = 254; // 1 to 254
    const batchSize = 35; // Balance speed and socket limit

    try {
      // Create list of IPs to scan
      const targets = [];
      for (let host = 1; host <= 254; host++) {
        targets.push(`${subnet}.${host}`);
      }

      let completedCount = 0;

      // Scan in batches
      for (let i = 0; i < targets.length; i += batchSize) {
        const batch = targets.slice(i, i + batchSize);
        
        // Execute batch concurrently
        const results = await Promise.all(
          batch.map(async (ip) => {
            const res = await this.scanIP(ip, port);
            completedCount++;
            
            // Send progress update
            const progress = Math.min(100, Math.round((completedCount / totalHosts) * 100));
            if (progressCallback) {
              progressCallback({
                progress,
                currentIp: ip,
                discoveredCount: discoveredPrinters.length + (res.open ? 1 : 0)
              });
            }

            return res;
          })
        );

        // Collect found open ports
        for (const res of results) {
          if (res.open) {
            logger.info(`Found open port ${port} at ${res.ip}`);
            discoveredPrinters.push({
              ip: res.ip,
              port: res.port,
              responseTime: res.responseTime
            });
          }
        }
      }
    } catch (err) {
      logger.error(`Subnet scan error: ${err.message}`);
    } finally {
      this.isScanning = false;
    }

    logger.info(`Subnet scan completed. Found ${discoveredPrinters.length} printer(s).`);
    return {
      subnet: `${subnet}.0/24`,
      localIP,
      printers: discoveredPrinters
    };
  }
}

module.exports = new NetworkScanner();
