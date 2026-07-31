import React, { useState, useEffect } from "react";
import { usePrinter } from "../context/PrinterContext";
import { type PrinterSettings as SettingsType } from "../api/printerApi";

export const PrinterSettings: React.FC = () => {
  const { settings, isPrinting, updateSettings } = usePrinter();

  // Local form state
  const [name, setName] = useState("My Shop Printer");
  const [type, setType] = useState<"EPSON" | "STAR">("EPSON");
  const [interfaceType, setInterfaceType] = useState<"tcp" | "serial" | "system">("tcp");
  const [ip, setIp] = useState("192.168.1.100");
  const [port, setPort] = useState(9100);
  const [devicePath, setDevicePath] = useState("/dev/ttyUSB0");
  const [driverName, setDriverName] = useState("Thermal_Printer");
  const [characterSet, setCharacterSet] = useState("PC437_USA");
  const [width, setWidth] = useState<"80mm" | "58mm">("80mm");

  // Sync with context settings when loaded
  useEffect(() => {
    if (settings) {
      setName(settings.name);
      setType(settings.type);
      setInterfaceType(settings.interfaceType);
      setIp(settings.ip);
      setPort(settings.port);
      setDevicePath(settings.devicePath);
      setDriverName(settings.driverName);
      setCharacterSet(settings.characterSet);
      setWidth(settings.width);
    }
  }, [settings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newSettings: SettingsType = {
      name,
      type,
      interfaceType,
      ip,
      port: Number(port),
      devicePath,
      driverName,
      characterSet,
      width
    };
    await updateSettings(newSettings);
  };

  return (
    <div className="printer-settings-container card">
      <div className="settings-header">
        <h2>Hardware & Connection Settings</h2>
        <p className="settings-subtitle">
          Configure how the Node.js backend connects to the physical printer.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="settings-form">
        <div className="settings-grid">
          {/* Left Column: Printer details */}
          <div className="settings-section">
            <h3>Printer Specification</h3>

            <div className="input-group">
              <label>Printer Name / Alias</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Kitchen Printer"
              />
            </div>

            <div className="input-group">
              <label>Printer Command Protocol</label>
              <select value={type} onChange={(e) => setType(e.target.value as "EPSON" | "STAR")}>
                <option value="EPSON">Epson (ESC/POS) - Most Common</option>
                <option value="STAR">Star (Line/Star Mode)</option>
              </select>
            </div>

            <div className="input-group">
              <label>Paper Roll Size</label>
              <select value={width} onChange={(e) => setWidth(e.target.value as "80mm" | "58mm")}>
                <option value="80mm">80mm Paper width (48 chars/line)</option>
                <option value="58mm">58mm Paper width (32 chars/line)</option>
              </select>
            </div>

            <div className="input-group">
              <label>Character Set Code Page</label>
              <input
                type="text"
                value={characterSet}
                onChange={(e) => setCharacterSet(e.target.value)}
                placeholder="e.g. PC437_USA or PC852_LATIN2"
              />
              <span className="input-helper">
                Defines the font rendering encoding code page (default: PC437_USA).
              </span>
            </div>
          </div>

          {/* Right Column: Connection settings */}
          <div className="settings-section">
            <h3>Connection Profile</h3>

            <div className="input-group">
              <label>Interface Type</label>
              <select
                value={interfaceType}
                onChange={(e) => setInterfaceType(e.target.value as "tcp" | "serial" | "system")}
              >
                <option value="tcp">Network (TCP/IP LAN Socket)</option>
                <option value="serial">Serial Port (USB-to-Serial / RS232 Path)</option>
                <option value="system">System Spooler (Local Printer Driver)</option>
              </select>
            </div>

            {/* Conditionally render based on interfaceType */}
            {interfaceType === "tcp" && (
              <div className="animated-fade">
                <div className="form-row-split">
                  <div className="input-group">
                    <label>IP Address</label>
                    <input
                      type="text"
                      required
                      value={ip}
                      onChange={(e) => setIp(e.target.value)}
                      placeholder="e.g. 192.168.1.150"
                    />
                  </div>
                  <div className="input-group w-30">
                    <label>TCP Port</label>
                    <input
                      type="number"
                      required
                      value={port}
                      onChange={(e) => setPort(Number(e.target.value))}
                      placeholder="9100"
                    />
                  </div>
                </div>
                <div className="settings-tip">
                  Ensure the printer is connected to the same LAN (router) and has a static IP address. Standard TCP print port is <strong>9100</strong>.
                </div>
              </div>
            )}

            {interfaceType === "serial" && (
              <div className="animated-fade">
                <div className="input-group">
                  <label>Device Node Path</label>
                  <input
                    type="text"
                    required
                    value={devicePath}
                    onChange={(e) => setDevicePath(e.target.value)}
                    placeholder="e.g. /dev/ttyUSB0 or COM3"
                  />
                </div>
                <div className="settings-tip">
                  Use <strong>COM1, COM2, COM3, etc.</strong> on Windows, or <strong>/dev/ttyUSB0, /dev/ttyS0, /dev/usb/lp0</strong> on Linux/macOS. Make sure permissions allow write access.
                </div>
              </div>
            )}

            {interfaceType === "system" && (
              <div className="animated-fade">
                <div className="input-group">
                  <label>Driver Queue Name</label>
                  <input
                    type="text"
                    required
                    value={driverName}
                    onChange={(e) => setDriverName(e.target.value)}
                    placeholder="e.g. POS-80"
                  />
                </div>
                <div className="settings-tip">
                  Enter the exact name of the printer as it appears in your Operating System settings (e.g. Windows Printers & Scanners or macOS CUPS). Requires OS printer spooler drivers.
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="settings-footer-actions">
          <button
            type="submit"
            className="btn btn-success btn-large"
            disabled={isPrinting}
          >
            {isPrinting ? (
              <>
                <span className="spinner spinner-sm"></span> Reconnecting...
              </>
            ) : (
              "Save and Reconnect Printer"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
