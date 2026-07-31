const fs = require("fs");
const path = require("path");
require("dotenv").config();

const SETTINGS_FILE_PATH = path.join(__dirname, "printer-settings.json");

const DEFAULT_SETTINGS = {
  name: "Default Thermal Printer",
  type: "EPSON", // EPSON or STAR
  interfaceType: "tcp", // tcp, serial, or system (driver)
  ip: "192.168.1.100",
  port: 9100,
  devicePath: "/dev/ttyUSB0",
  driverName: "Thermal_Printer",
  characterSet: "PC437_USA",
  width: "80mm"
};

// Helper to parse environmental interface variable
function parseEnvInterface(envInterface) {
  if (!envInterface) return {};

  if (envInterface.startsWith("tcp://")) {
    const withoutScheme = envInterface.substring(6);
    const parts = withoutScheme.split(":");
    return {
      interfaceType: "tcp",
      ip: parts[0],
      port: parts[1] ? parseInt(parts[1], 10) : 9100
    };
  } else if (envInterface.startsWith("printer:")) {
    return {
      interfaceType: "system",
      driverName: envInterface.substring(8)
    };
  } else {
    return {
      interfaceType: "serial",
      devicePath: envInterface
    };
  }
}

// Loads settings from disk, falls back to env, then defaults
function loadSettings() {
  try {
    if (fs.existsSync(SETTINGS_FILE_PATH)) {
      const fileData = fs.readFileSync(SETTINGS_FILE_PATH, "utf8");
      return { ...DEFAULT_SETTINGS, ...JSON.parse(fileData) };
    }
  } catch (error) {
    console.error("Failed to read printer-settings.json, falling back to env/defaults:", error);
  }

  // Load from Env
  const envType = process.env.PRINTER_TYPE || DEFAULT_SETTINGS.type;
  const envInterfaceStr = process.env.PRINTER_INTERFACE;
  const parsedEnvInterface = parseEnvInterface(envInterfaceStr);

  const envSettings = {
    ...DEFAULT_SETTINGS,
    type: envType.toUpperCase(),
    ...parsedEnvInterface
  };

  // Save the environment-derived settings to disk for future consistency
  saveSettings(envSettings);
  return envSettings;
}

// Saves settings to disk
function saveSettings(settings) {
  try {
    const dir = path.dirname(SETTINGS_FILE_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(SETTINGS_FILE_PATH, JSON.stringify(settings, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error("Failed to save printer-settings.json:", error);
    return false;
  }
}

// Formats settings into a node-thermal-printer config connection string
function getPrinterInterfaceString(settings) {
  if (settings.interfaceType === "tcp") {
    return `tcp://${settings.ip}:${settings.port}`;
  } else if (settings.interfaceType === "system") {
    // node-thermal-printer expects local drivers under format 'printer:driver_name'
    return `printer:${settings.driverName}`;
  } else {
    // serial / dev path direct interface
    return settings.devicePath;
  }
}

module.exports = {
  loadSettings,
  saveSettings,
  getPrinterInterfaceString,
  DEFAULT_SETTINGS
};
