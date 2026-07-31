const express = require("express");
const router = express.Router();
const printerController = require("../controllers/printerController");

// Printer Connection & Config Status
router.get("/status", printerController.getStatus);
router.get("/settings", printerController.getSettings);
router.post("/settings", printerController.updateSettings);
router.post("/connect", printerController.connect);
router.post("/disconnect", printerController.disconnect);
router.post("/scan", printerController.scanNetwork);
router.post("/connect-discovered", printerController.connectDiscovered);

// Printing Commands
router.post("/test", printerController.testPrint);
router.post("/text", printerController.printText);
router.post("/receipt", printerController.printReceipt);
router.post("/qrcode", printerController.printQRCode);
router.post("/barcode", printerController.printBarcode);
router.post("/image", printerController.printImage);
router.post("/cash-drawer", printerController.openCashDrawer);
router.post("/cut", printerController.cutPaper);

// Diagnostic Logs
router.get("/logs", printerController.getLogs);
router.post("/logs/clear", printerController.clearLogs);

module.exports = router;
