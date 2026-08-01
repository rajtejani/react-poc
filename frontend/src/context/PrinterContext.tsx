import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import { printerApi } from "../api/printerApi";
import type {
  PrinterSettings,
  LogEntry,
  ReceiptData,
  PrintTextParams,
  PrintQRCodeParams,
  PrintBarcodeParams,
  PrintImageParams,
  DiscoveredPrinter
} from "../api/printerApi";

export interface Notification {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface PrinterContextType {
  connected: boolean;
  error: string | null;
  settings: PrinterSettings | null;
  queueLength: number;
  currentJob: string | null;
  logs: LogEntry[];
  isPrinting: boolean;
  notifications: Notification[];
  showNotification: (type: "success" | "error" | "info", message: string) => void;
  dismissNotification: (id: string) => void;

  // Service controls
  connectPrinter: () => Promise<void>;
  disconnectPrinter: () => Promise<void>;
  updateSettings: (newSettings: PrinterSettings) => Promise<void>;

  // Printing methods
  printTestPage: () => Promise<void>;
  printRawText: (params: PrintTextParams) => Promise<void>;
  printReceipt: (receipt: ReceiptData) => Promise<void>;
  printQRCode: (params: PrintQRCodeParams) => Promise<void>;
  printBarcode: (params: PrintBarcodeParams) => Promise<void>;
  printImage: (params: PrintImageParams) => Promise<void>;
  openCashDrawer: () => Promise<void>;
  cutPaper: () => Promise<void>;
  clearLogs: () => Promise<void>;

  // Scanning details
  discoveredPrinters: DiscoveredPrinter[];
  isScanning: boolean;
  scanProgress: number;
  scanCurrentIp: string;
  scanSubnet: string;
  scanNetwork: () => Promise<void>;
  connectDiscovered: (ip: string, port: number) => Promise<void>;

  // WebSocket server reachability (separate from printer connection)
  wsServerConnected: boolean;
}

const PrinterContext = createContext<PrinterContextType | undefined>(undefined);

export const PrinterProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [connected, setConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<PrinterSettings | null>(null);
  const [queueLength, setQueueLength] = useState<number>(0);
  const [currentJob, setCurrentJob] = useState<string | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isPrinting, setIsPrinting] = useState<boolean>(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Scanning states
  const [discoveredPrinters, setDiscoveredPrinters] = useState<DiscoveredPrinter[]>([]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanProgress, setScanProgress] = useState<number>(0);
  const [scanCurrentIp, setScanCurrentIp] = useState<string>("");
  const [scanSubnet, setScanSubnet] = useState<string>("");

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  // Flag to suppress onclose-triggered reconnect when WE intentionally closed the socket
  const intentionalCloseRef = useRef<boolean>(false);
  // Track how many consecutive reconnect attempts have been made (for backoff)
  const reconnectAttemptsRef = useRef<number>(0);

  // Separate state: is the backend *server* reachable via WebSocket?
  const [wsServerConnected, setWsServerConnected] = useState<boolean>(false);

  // Helper: clear any pending reconnect timer
  const clearReconnectTimer = () => {
    if (reconnectTimeoutRef.current !== null) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  // Helper: schedule a reconnect with simple backoff (2s → 4s → 8s, max 8s)
  const scheduleReconnect = () => {
    clearReconnectTimer();
    const delay = Math.min(2000 * Math.pow(2, reconnectAttemptsRef.current), 8000);
    reconnectAttemptsRef.current += 1;
    reconnectTimeoutRef.current = window.setTimeout(() => {
      intentionalCloseRef.current = false;
      connectWebSocket();
    }, delay);
  };

  // Notification Helpers
  const showNotification = (type: "success" | "error" | "info", message: string) => {
    const id = Math.random().toString(36).substring(7);
    setNotifications((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      dismissNotification(id);
    }, 4000);
  };

  const dismissNotification = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // WebSocket connection logic
  const connectWebSocket = () => {
    // Close any existing socket that is still open/connecting.
    // Only mark intentional if the socket is actually open or connecting —
    // calling close() on an already-CLOSED socket triggers onerror again
    // which was the root cause of the reconnect loop.
    if (wsRef.current) {
      const state = wsRef.current.readyState;
      if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) {
        intentionalCloseRef.current = true;
        wsRef.current.close();
      }
      wsRef.current = null;
    }

    const wsUrl =
      import.meta.env.VITE_WS_URL ?? `ws://${window.location.hostname}:5000`;

    let socket: WebSocket;
    try {
      socket = new WebSocket(wsUrl);
      console.log("[WS] Attempting connection to", wsUrl);
    } catch (err) {
      console.error("[WS] Failed to create WebSocket:", err);
      scheduleReconnect();
      return;
    }

    wsRef.current = socket;
    intentionalCloseRef.current = false;

    socket.onopen = () => {
      console.log("[WS] Connected.");
      reconnectAttemptsRef.current = 0; // reset backoff counter on success
      clearReconnectTimer();
      setWsServerConnected(true);
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        const { type, data } = message;

        if (type === "status") {
          setConnected(data.connected);
          setError(data.error);
          setSettings(data.settings);
          setQueueLength(data.queueLength);
          setCurrentJob(data.currentJob);
        } else if (type === "logs") {
          setLogs(data.reverse());
        } else if (type === "log") {
          setLogs((prev) => [data, ...prev].slice(0, 100));
        } else if (type === "scan_progress") {
          setScanProgress(data.progress);
          setScanCurrentIp(data.currentIp);
        }
      } catch (err) {
        console.error("[WS] Failed to parse message:", err);
      }
    };

    socket.onclose = (event) => {
      console.log(`[WS] Closed (code=${event.code}, intentional=${intentionalCloseRef.current}).`);
      setWsServerConnected(false);
      // Only schedule a reconnect if this close was NOT triggered by our own code
      if (!intentionalCloseRef.current) {
        scheduleReconnect();
      }
    };

    socket.onerror = (err) => {
      console.warn("[WS] Error — will reconnect:", err);
      // Suppress the onclose handler's reconnect attempt since we handle it here.
      // onclose ALWAYS fires right after onerror.
      intentionalCloseRef.current = true;
      setWsServerConnected(false);
      // Nullify ref immediately so connectWebSocket won't try to close a broken socket
      wsRef.current = null;
      scheduleReconnect();
    };
  };

  useEffect(() => {
    connectWebSocket();

    // Initial data fetch in case WebSocket has delay
    const fetchInitialData = async () => {
      try {
        const status = await printerApi.getPrinterStatus();
        setConnected(status.connected);
        setError(status.error);
        setSettings(status.settings);
        setQueueLength(status.queueLength);
        setCurrentJob(status.currentJob);

        const logsData = await printerApi.getPrinterLogs();
        setLogs(logsData.logs.reverse());
      } catch (err) {
        // Backend not yet up — will receive initial state from WebSocket once it connects
        console.warn("Unable to fetch initial REST printer status:", err);
      }
    };

    fetchInitialData();

    return () => {
      // Clean teardown — suppress reconnect scheduling on component unmount
      intentionalCloseRef.current = true;
      clearReconnectTimer();
      if (wsRef.current) {
        const state = wsRef.current.readyState;
        if (state === WebSocket.OPEN || state === WebSocket.CONNECTING) {
          wsRef.current.close();
        }
        wsRef.current = null;
      }
    };
  }, []);

  // API Call Wrapper with Loading indicators
  const performAction = async (
    actionName: string,
    apiCall: () => Promise<any>,
    successMessage?: string
  ) => {
    setIsPrinting(true);
    try {
      const response = await apiCall();
      if (response && response.success) {
        showNotification("success", successMessage || `${actionName} succeeded!`);
      } else {
        showNotification("error", response.error || `${actionName} failed.`);
      }
    } catch (err: any) {
      console.error(`${actionName} failed:`, err);
      showNotification(
        "error",
        err.response?.data?.error || err.message || `${actionName} failed due to network error.`
      );
    } finally {
      setIsPrinting(false);
    }
  };

  // Connection controls
  const connectPrinter = async () => {
    await performAction("Connection Attempt", () => printerApi.connectPrinter(), "Printer connection refreshed.");
  };

  const disconnectPrinter = async () => {
    await performAction("Disconnection Request", () => printerApi.disconnectPrinter(), "Printer disconnected successfully.");
  };

  const updateSettings = async (newSettings: PrinterSettings) => {
    await performAction(
      "Configuration Update",
      () => printerApi.updatePrinterSettings(newSettings),
      "Printer configuration updated."
    );
  };

  // Printing commands
  const printTestPage = async () => {
    await performAction("Test Print", () => printerApi.printTestPage(), "Test print job dispatched.");
  };

  const printRawText = async (params: PrintTextParams) => {
    await performAction("Text Print", () => printerApi.printRawText(params), "Text printed successfully.");
  };

  const printReceipt = async (receipt: ReceiptData) => {
    await performAction("Receipt Print", () => printerApi.printReceipt(receipt), "Receipt printed successfully.");
  };

  const printQRCode = async (params: PrintQRCodeParams) => {
    await performAction("QR Code Print", () => printerApi.printQRCode(params), "QR Code printed successfully.");
  };

  const printBarcode = async (params: PrintBarcodeParams) => {
    await performAction("Barcode Print", () => printerApi.printBarcode(params), "Barcode printed successfully.");
  };

  const printImage = async (params: PrintImageParams) => {
    await performAction("Image Print", () => printerApi.printImage(params), "Image printed successfully.");
  };

  const openCashDrawer = async () => {
    await performAction("Open Cash Drawer", () => printerApi.openCashDrawer(), "Cash drawer trigger dispatched.");
  };

  const cutPaper = async () => {
    await performAction("Paper Cut", () => printerApi.cutPaper(), "Paper cut trigger dispatched.");
  };

  const clearLogs = async () => {
    try {
      await printerApi.clearPrinterLogs();
      setLogs([]);
      showNotification("info", "Activity logs cleared.");
    } catch (err: any) {
      showNotification("error", "Failed to clear logs.");
    }
  };

  // Subnet Scanning Actions
  const scanNetwork = async () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanCurrentIp("");
    setDiscoveredPrinters([]);
    showNotification("info", "Initiating LAN scanner on Port 9100...");
    try {
      const response = await printerApi.scanNetwork();
      if (response && response.success) {
        setDiscoveredPrinters(response.printers);
        setScanSubnet(response.subnet);
        showNotification(
          "success",
          `Subnet scan finished. Discovered ${response.printers.length} online printer(s).`
        );
      } else {
        showNotification("error", "Failed to complete LAN discovery scan.");
      }
    } catch (err: any) {
      showNotification(
        "error",
        err.response?.data?.error || err.message || "Failed to scan network."
      );
    } finally {
      setIsScanning(false);
    }
  };

  const connectDiscovered = async (ip: string, port: number) => {
    setIsPrinting(true);
    showNotification("info", `Connecting to discovered printer at ${ip}:${port}...`);
    try {
      const response = await printerApi.connectDiscovered(ip, port);
      if (response && response.success) {
        setConnected(response.connected);
        setError(response.error);
        setSettings(response.settings);
        showNotification("success", `Printer connected successfully at tcp://${ip}:${port}`);
      } else {
        showNotification("error", response.error || "Connection to discovered printer failed.");
      }
    } catch (err: any) {
      showNotification(
        "error",
        err.response?.data?.error || err.message || "Error connecting to discovered printer."
      );
    } finally {
      setIsPrinting(false);
    }
  };

  return (
    <PrinterContext.Provider
      value={{
        connected,
        error,
        settings,
        queueLength,
        currentJob,
        logs,
        isPrinting,
        notifications,
        showNotification,
        dismissNotification,
        connectPrinter,
        disconnectPrinter,
        updateSettings,
        printTestPage,
        printRawText,
        printReceipt,
        printQRCode,
        printBarcode,
        printImage,
        openCashDrawer,
        cutPaper,
        clearLogs,
        discoveredPrinters,
        isScanning,
        scanProgress,
        scanCurrentIp,
        scanSubnet,
        scanNetwork,
        connectDiscovered,
        wsServerConnected
      }}
    >
      {children}
    </PrinterContext.Provider>
  );
};

export const usePrinter = () => {
  const context = useContext(PrinterContext);
  if (context === undefined) {
    throw new Error("usePrinter must be used within a PrinterProvider");
  }
  return context;
};
