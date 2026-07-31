const fs = require("fs");
const path = require("path");
const printerService = require("../services/printerService");
const { saveSettings } = require("../config/printerConfig");
const logger = require("../utils/logger");
const networkScanner = require("../services/networkScanner");

// Helper to clean up temporary files
function deleteTempFile(filePath) {
  if (fs.existsSync(filePath)) {
    try {
      fs.unlinkSync(filePath);
    } catch (err) {
      logger.warn(`Failed to delete temp file ${filePath}: ${err.message}`);
    }
  }
}

/**
 * Controller methods for thermal printer operations
 */
const printerController = {
  // GET /api/printer/status
  getStatus: (req, res) => {
    res.json({
      success: true,
      connected: printerService.connected,
      error: printerService.error,
      settings: printerService.settings,
      queueLength: printerService.queue.length,
      currentJob: printerService.currentJob
    });
  },

  // GET /api/printer/settings
  getSettings: (req, res) => {
    res.json({
      success: true,
      settings: printerService.settings
    });
  },

  // POST /api/printer/settings
  updateSettings: async (req, res) => {
    try {
      const newSettings = req.body;
      
      // Basic Validation
      if (!newSettings.type || !newSettings.interfaceType || !newSettings.width) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: type, interfaceType, width"
        });
      }

      logger.info("Saving new printer configuration settings...");
      const saved = saveSettings(newSettings);
      
      if (!saved) {
        throw new Error("Unable to write configuration to file system");
      }

      // Reconnect printer with new config
      await printerService.reconnect();

      res.json({
        success: true,
        settings: printerService.settings,
        connected: printerService.connected,
        error: printerService.error
      });
    } catch (err) {
      logger.error(`Failed to update printer settings: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // POST /api/printer/connect
  connect: async (req, res) => {
    try {
      logger.info("Manual connect request received.");
      await printerService.reconnect();
      res.json({
        success: true,
        connected: printerService.connected,
        error: printerService.error
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // POST /api/printer/disconnect
  disconnect: async (req, res) => {
    try {
      logger.info("Manual disconnect request received.");
      await printerService.disconnect();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // POST /api/printer/text
  printText: async (req, res) => {
    const { text, align = "left", bold = false, underline = false, newLine = true } = req.body;
    
    if (text === undefined) {
      return res.status(400).json({ success: false, error: "Text field is required" });
    }

    try {
      await printerService.enqueueJob("Print Raw Text", async (p) => {
        // Alignment
        if (align === "center") p.alignCenter();
        else if (align === "right") p.alignRight();
        else p.alignLeft();

        // Styles
        if (bold) p.bold(true);
        if (underline) p.underline(true);

        // Printing
        if (newLine) p.println(text);
        else p.print(text);

        // Revert styles
        if (bold) p.bold(false);
        if (underline) p.underline(false);
      });

      res.json({ success: true, message: "Print job completed" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // POST /api/printer/qrcode
  printQRCode: async (req, res) => {
    const { data, cellSize = 6, correction = "M", model = 2 } = req.body;

    if (!data) {
      return res.status(400).json({ success: false, error: "QR Data is required" });
    }

    try {
      await printerService.enqueueJob("Print QR Code", async (p) => {
        p.alignCenter();
        p.printQR(data, { cellSize, correction, model });
        p.newLine();
      });

      res.json({ success: true, message: "QR print job completed" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // POST /api/printer/barcode
  printBarcode: async (req, res) => {
    const { data, type = 4, settings = { hriPos: 2, height: 80, width: 3 } } = req.body;

    if (!data) {
      return res.status(400).json({ success: false, error: "Barcode data is required" });
    }

    try {
      await printerService.enqueueJob("Print Barcode", async (p) => {
        p.alignCenter();
        p.printBarcode(data, type, settings);
        p.newLine();
      });

      res.json({ success: true, message: "Barcode print job completed" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // POST /api/printer/image
  printImage: async (req, res) => {
    const { imageBase64, imagePath } = req.body;

    if (!imageBase64 && !imagePath) {
      return res.status(400).json({ success: false, error: "imageBase64 or imagePath is required" });
    }

    let localPath = "";
    let isTemp = false;

    try {
      if (imageBase64) {
        // Base64 decoding
        const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
        const buffer = Buffer.from(base64Data, "base64");
        
        // Define directory inside src for temp files
        const tempDir = path.join(__dirname, "../temp");
        if (!fs.existsSync(tempDir)) {
          fs.mkdirSync(tempDir, { recursive: true });
        }
        
        localPath = path.join(tempDir, `print_${Date.now()}.png`);
        fs.writeFileSync(localPath, buffer);
        isTemp = true;
      } else {
        // Use path directly
        localPath = imagePath;
      }

      await printerService.enqueueJob("Print Image", async (p) => {
        p.alignCenter();
        await p.printImage(localPath);
        p.newLine();
      });

      res.json({ success: true, message: "Image print job completed" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    } finally {
      if (isTemp && localPath) {
        deleteTempFile(localPath);
      }
    }
  },

  // POST /api/printer/receipt
  printReceipt: async (req, res) => {
    const receipt = req.body;

    // Validation
    if (!receipt.items || !Array.isArray(receipt.items)) {
      return res.status(400).json({ success: false, error: "Receipt items are required" });
    }

    try {
      await printerService.enqueueJob("Print Receipt", async (p) => {
        // Check character length limit based on settings
        const charWidth = printerService.settings.width === "58mm" ? 32 : 48;

        // Function to create custom padded rows for key-value styling (e.g. Item       $10.00)
        const formatRow = (leftText, rightText) => {
          const spacing = charWidth - leftText.length - rightText.length;
          if (spacing <= 0) {
            // If text is too long, crop leftText or wrap
            const truncatedLeft = leftText.substring(0, charWidth - rightText.length - 3) + "...";
            const newSpacing = charWidth - truncatedLeft.length - rightText.length;
            return truncatedLeft + " ".repeat(Math.max(1, newSpacing)) + rightText;
          }
          return leftText + " ".repeat(spacing) + rightText;
        };

        p.alignCenter();
        
        // Store Header Info
        if (receipt.storeName) {
          p.bold(true);
          p.println(receipt.storeName.toUpperCase());
          p.bold(false);
        }
        if (receipt.address) p.println(receipt.address);
        if (receipt.phone) p.println(`Tel: ${receipt.phone}`);
        p.newLine();

        p.alignLeft();
        // Metadata details
        if (receipt.invoiceNumber) p.println(`Invoice: ${receipt.invoiceNumber}`);
        if (receipt.date) p.println(`Date: ${receipt.date}`);
        if (receipt.cashier) p.println(`Cashier: ${receipt.cashier}`);
        if (receipt.customerName) p.println(`Customer: ${receipt.customerName}`);
        
        // Print horizontal rule
        p.drawLine();

        // Print table header
        p.bold(true);
        if (charWidth === 32) {
          p.println(formatRow("Item (Qty)", "Total"));
        } else {
          p.println(formatRow("Description (Qty)", "Amount"));
        }
        p.bold(false);
        p.drawLine();

        // Print items
        receipt.items.forEach((item) => {
          const qtyText = item.quantity > 1 ? ` x${item.quantity}` : "";
          const name = `${item.name}${qtyText}`;
          const price = parseFloat(item.total).toFixed(2);
          p.println(formatRow(name, price));
        });

        p.drawLine();

        // Print totals
        if (receipt.subtotal !== undefined) {
          p.println(formatRow("Subtotal", parseFloat(receipt.subtotal).toFixed(2)));
        }
        if (receipt.discount !== undefined && parseFloat(receipt.discount) > 0) {
          p.println(formatRow("Discount", `-${parseFloat(receipt.discount).toFixed(2)}`));
        }
        if (receipt.tax !== undefined) {
          p.println(formatRow("Tax", parseFloat(receipt.tax).toFixed(2)));
        }
        p.drawLine();
        
        // Grand total in bold
        p.bold(true);
        p.println(formatRow("TOTAL", parseFloat(receipt.total).toFixed(2)));
        p.bold(false);
        p.drawLine();

        // QR Code or Barcode if configured
        if (receipt.qrCode) {
          p.alignCenter();
          p.newLine();
          p.printQR(receipt.qrCode, { cellSize: 4 });
          p.newLine();
        }

        if (receipt.barcode) {
          p.alignCenter();
          p.newLine();
          // Code 128 / Code 39
          p.printBarcode(receipt.barcode, 4, { hriPos: 2, height: 50 });
          p.newLine();
        }

        // Thank you footer
        p.alignCenter();
        if (receipt.footer) {
          p.println(receipt.footer);
        } else {
          p.println("Thank you for your business!");
        }
        p.newLine();
        p.newLine();
        
        // Automatic paper cut
        p.cut();
      });

      res.json({ success: true, message: "Receipt print job completed" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // POST /api/printer/test
  testPrint: async (req, res) => {
    try {
      await printerService.enqueueJob("Test Page", async (p) => {
        p.alignCenter();
        p.bold(true);
        p.println("TEST PRINT SUCCESS");
        p.bold(false);
        p.println("Thermal Printer Manager System");
        p.drawLine();
        
        p.alignLeft();
        p.println("System Configurations:");
        p.println(`* Model: ${printerService.settings.type}`);
        p.println(`* Width: ${printerService.settings.width}`);
        p.println(`* Encoding: ${printerService.settings.characterSet}`);
        p.drawLine();
        
        p.alignCenter();
        p.println("Alignments Demo:");
        p.alignLeft();
        p.println("Left aligned text");
        p.alignCenter();
        p.println("Center aligned text");
        p.alignRight();
        p.println("Right aligned text");
        
        p.alignCenter();
        p.drawLine();
        p.println("Barcodes Demo:");
        p.printBarcode("TEST1234", 4, { hriPos: 2, height: 60 });
        p.newLine();
        
        p.println("QR Codes Demo:");
        p.printQR("https://github.com/epson", { cellSize: 3 });
        p.newLine();
        
        p.println("Finished test print.");
        p.newLine();
        p.newLine();
        p.cut();
      });

      res.json({ success: true, message: "Test page printed successfully" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // POST /api/printer/cash-drawer
  openCashDrawer: async (req, res) => {
    try {
      await printerService.enqueueJob("Open Cash Drawer", async (p) => {
        p.openCashDrawer();
      });
      res.json({ success: true, message: "Cash drawer opened" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // POST /api/printer/cut
  cutPaper: async (req, res) => {
    try {
      await printerService.enqueueJob("Cut Paper", async (p) => {
        p.cut();
      });
      res.json({ success: true, message: "Paper cut successfully" });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // GET /api/printer/logs
  getLogs: (req, res) => {
    res.json({
      success: true,
      logs: logger.getLogs()
    });
  },

  // POST /api/printer/logs/clear
  clearLogs: (req, res) => {
    logger.clearLogs();
    res.json({ success: true });
  },

  // POST /api/printer/scan
  scanNetwork: async (req, res) => {
    try {
      logger.info("Subnet scan requested.");
      
      const result = await networkScanner.scan(9100, (progressData) => {
        printerService.broadcast({
          type: "scan_progress",
          data: progressData
        });
      });

      res.json({
        success: true,
        subnet: result.subnet,
        localIP: result.localIP,
        printers: result.printers
      });
    } catch (err) {
      logger.error(`Network scan endpoint failed: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  },

  // POST /api/printer/connect-discovered
  connectDiscovered: async (req, res) => {
    try {
      const { ip, port } = req.body;
      if (!ip || !port) {
        return res.status(400).json({
          success: false,
          error: "IP address and Port are required."
        });
      }

      logger.info(`Connecting to discovered printer: ${ip}:${port}`);

      const currentSettings = printerService.settings || {};
      const newSettings = {
        ...currentSettings,
        interfaceType: "tcp",
        ip: ip,
        port: parseInt(port, 10),
        type: currentSettings.type || "EPSON"
      };

      const saved = saveSettings(newSettings);
      if (!saved) {
        throw new Error("Unable to save settings to disk.");
      }

      await printerService.reconnect();

      res.json({
        success: true,
        settings: printerService.settings,
        connected: printerService.connected,
        error: printerService.error
      });
    } catch (err) {
      logger.error(`Failed to connect to discovered printer: ${err.message}`);
      res.status(500).json({ success: false, error: err.message });
    }
  }
};

module.exports = printerController;
