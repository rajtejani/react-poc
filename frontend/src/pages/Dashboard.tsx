import React, { useState } from "react";
import { usePrinter } from "../context/PrinterContext";
import { PrinterStatus } from "../components/PrinterStatus";

export const Dashboard: React.FC = () => {
  const {
    connected,
    settings,
    connectPrinter,
    isPrinting,
    discoveredPrinters,
    isScanning,
    scanProgress,
    scanCurrentIp,
    scanSubnet,
    scanNetwork,
    connectDiscovered
  } = usePrinter();

  const [hasScanned, setHasScanned] = useState(false);

  const handleScanSubnet = async () => {
    setHasScanned(true);
    await scanNetwork();
  };

  return (
    <div className="dashboard-view-wrapper">
      {/* Top Welcome Title */}
      <div className="view-title-block">
        <h2>Thermal Printers</h2>
        <p className="view-subtitle">
          Discover and connect POS thermal printer hardware over local network (LAN) or direct interfaces.
        </p>
      </div>

      {/* LAN Auto-Discovery Card */}
      <div className="dashboard-card card">
        <div className="discovery-header">
          <div className="discovery-title-area">
            <span className="discovery-icon">🔍</span>
            <div>
              <h3>LAN Auto-Discovery</h3>
              <p className="discovery-desc">
                Scan your local subnet for ESC/POS thermal printers listening on standard port 9100.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn btn-danger"
            onClick={handleScanSubnet}
            disabled={isScanning}
          >
            {isScanning ? (
              <>
                <span className="spinner spinner-sm"></span> Scanning Subnet...
              </>
            ) : (
              "Scan Subnet"
            )}
          </button>
        </div>

        {isScanning && (
          <div className="scanner-status-area">
            <div className="scanner-progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${scanProgress}%` }}
              ></div>
            </div>
            <div className="scanner-details-row">
              <span className="scanner-details-ip">
                {scanCurrentIp ? `Pinging target: ${scanCurrentIp}` : "Initializing scan..."}
              </span>
              <span className="scanner-details-percent">{scanProgress}% Completed</span>
            </div>
          </div>
        )}

        {/* Scan Results */}
        {hasScanned && !isScanning && (
          <div className="scan-results-container">
            {discoveredPrinters.length > 0 ? (
              <div className="scan-results-list">
                <div className="scan-results-summary-text">
                  Discovered <strong>{discoveredPrinters.length}</strong> active device(s) on subnet {scanSubnet || "9100"}
                </div>
                <div className="printer-cards-grid">
                  {discoveredPrinters.map((printer, idx) => {
                    const isCurrentlyTarget =
                      settings?.interfaceType === "tcp" &&
                      settings.ip === printer.ip &&
                      settings.port === printer.port;

                    return (
                      <div
                        key={idx}
                        className={`printer-discovery-card ${
                          isCurrentlyTarget ? "active-target" : ""
                        }`}
                      >
                        <div className="printer-discovery-icon">🖨️</div>
                        <div className="printer-discovery-details">
                          <span className="printer-ip-label">IP Address</span>
                          <span className="printer-ip-value">{printer.ip}</span>
                          <div className="printer-meta-badges">
                            <span className="badge-port">Port {printer.port}</span>
                            <span
                              className={`badge-latency ${
                                printer.responseTime < 100
                                  ? "fast"
                                  : printer.responseTime < 300
                                  ? "medium"
                                  : "slow"
                              }`}
                            >
                              ⚡ {printer.responseTime}ms
                            </span>
                          </div>
                        </div>
                        <div className="printer-discovery-actions">
                          {isCurrentlyTarget && connected ? (
                            <span className="badge-connected-status">Active Connection</span>
                          ) : (
                            <button
                              type="button"
                              className="btn btn-success btn-sm"
                              onClick={() => connectDiscovered(printer.ip, printer.port)}
                              disabled={isPrinting}
                            >
                              Connect
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="scan-result-panel warning">
                No active printers detected on port 9100. Make sure your thermal printer is turned on, connected to the same LAN/Wi-Fi router, and configured to obtain an IP.
              </div>
            )}
          </div>
        )}

        {!isScanning && !hasScanned && (
          <div className="scanner-placeholder">
            Subnet scanner ready. Make sure your printer is turned on and connected to the same Wi-Fi network.
          </div>
        )}
      </div>

      {/* Connected Devices Setup Card */}
      <div className="dashboard-card card">
        <div className="card-header-row">
          <h3>Connected Devices Setup</h3>
          <button
            type="button"
            className="btn btn-outline btn-sm"
            onClick={connectPrinter}
            disabled={isPrinting}
          >
            🔄 Refresh Status
          </button>
        </div>

        <div className="setup-device-content">
          {connected ? (
            <div className="active-device-summary">
              <PrinterStatus />
            </div>
          ) : (
            <div className="no-device-placeholder">
              <div className="no-device-icon">🖨️</div>
              <h4>No printer active right now</h4>
              <p>Verify your connection settings or check the "Printer Setup" tab to adjust profiles manually.</p>
            </div>
          )}
        </div>
      </div>

      {/* Subnet Presets Information Card */}
      <div className="dashboard-card card">
        <div className="presets-header">
          <span className="presets-icon">⚙️</span>
          <h3>Thermal Printing Presets</h3>
        </div>
        <p className="presets-intro">
          POS printers connect directly to a router using Ethernet or Wi-Fi. They listen for raw stream data on TCP Port 9100.
        </p>

        <div className="presets-grid">
          <div className="preset-item-card">
            <h4>58mm Presets</h4>
            <p>Used on handheld POS terminals or small mobile billing systems. Layout wraps to 32 characters.</p>
          </div>
          <div className="preset-item-card">
            <h4>80mm Presets</h4>
            <p>Industry standard desktop billing/restaurant receipt size. Layout wraps to 48 characters.</p>
          </div>
          <div className="preset-item-card">
            <h4>110mm Presets</h4>
            <p>Wide labels or medical print hardware layout. Layout wraps to 64 characters.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
