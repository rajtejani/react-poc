import axios from "axios";

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000/api/printer";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json"
  }
});

export interface PrinterSettings {
  name: string;
  type: "EPSON" | "STAR";
  interfaceType: "tcp" | "serial" | "system";
  ip: string;
  port: number;
  devicePath: string;
  driverName: string;
  characterSet: string;
  width: "80mm" | "58mm";
}

export interface PrinterStatusResponse {
  success: boolean;
  connected: boolean;
  error: string | null;
  settings: PrinterSettings;
  queueLength: number;
  currentJob: string | null;
}

export interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  message: string;
}

export interface ReceiptItem {
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface ReceiptData {
  storeName?: string;
  address?: string;
  phone?: string;
  invoiceNumber?: string;
  date?: string;
  cashier?: string;
  customerName?: string;
  items: ReceiptItem[];
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  footer?: string;
  qrCode?: string;
  barcode?: string;
}

export interface PrintTextParams {
  text: string;
  align?: "left" | "center" | "right";
  bold?: boolean;
  underline?: boolean;
  newLine?: boolean;
}

export interface PrintQRCodeParams {
  data: string;
  cellSize?: number;
  correction?: "L" | "M" | "Q" | "H";
  model?: number;
}

export interface PrintBarcodeParams {
  data: string;
  type?: number;
  settings?: {
    hriPos?: number;
    hriFont?: number;
    width?: number;
    height?: number;
  };
}

export interface PrintImageParams {
  imageBase64?: string;
  imagePath?: string;
}

export const printerApi = {
  getPrinterStatus: async () => {
    const response = await api.get<PrinterStatusResponse>("/status");
    return response.data;
  },

  getPrinterSettings: async () => {
    const response = await api.get<{ success: boolean; settings: PrinterSettings }>("/settings");
    return response.data;
  },

  updatePrinterSettings: async (settings: PrinterSettings) => {
    const response = await api.post<PrinterStatusResponse>("/settings", settings);
    return response.data;
  },

  connectPrinter: async () => {
    const response = await api.post<PrinterStatusResponse>("/connect");
    return response.data;
  },

  disconnectPrinter: async () => {
    const response = await api.post<{ success: boolean }>("/disconnect");
    return response.data;
  },

  printTestPage: async () => {
    const response = await api.post<{ success: boolean; message: string }>("/test");
    return response.data;
  },

  printRawText: async (params: PrintTextParams) => {
    const response = await api.post<{ success: boolean; message: string }>("/text", params);
    return response.data;
  },

  printReceipt: async (receipt: ReceiptData) => {
    const response = await api.post<{ success: boolean; message: string }>("/receipt", receipt);
    return response.data;
  },

  printQRCode: async (params: PrintQRCodeParams) => {
    const response = await api.post<{ success: boolean; message: string }>("/qrcode", params);
    return response.data;
  },

  printBarcode: async (params: PrintBarcodeParams) => {
    const response = await api.post<{ success: boolean; message: string }>("/barcode", params);
    return response.data;
  },

  printImage: async (params: PrintImageParams) => {
    const response = await api.post<{ success: boolean; message: string }>("/image", params);
    return response.data;
  },

  openCashDrawer: async () => {
    const response = await api.post<{ success: boolean; message: string }>("/cash-drawer");
    return response.data;
  },

  cutPaper: async () => {
    const response = await api.post<{ success: boolean; message: string }>("/cut");
    return response.data;
  },

  getPrinterLogs: async () => {
    const response = await api.get<{ success: boolean; logs: LogEntry[] }>("/logs");
    return response.data;
  },

  clearPrinterLogs: async () => {
    const response = await api.post<{ success: boolean }>("/logs/clear");
    return response.data;
  },

  scanNetwork: async () => {
    const response = await api.post<ScanResponse>("/scan");
    return response.data;
  },

  connectDiscovered: async (ip: string, port: number) => {
    const response = await api.post<PrinterStatusResponse>("/connect-discovered", { ip, port });
    return response.data;
  },
};

export interface DiscoveredPrinter {
  ip: string;
  port: number;
  responseTime: number;
}

export interface ScanResponse {
  success: boolean;
  subnet: string;
  localIP: string;
  printers: DiscoveredPrinter[];
}
