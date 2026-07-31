import React from "react";
import { usePrinter } from "../context/PrinterContext";

export const PrinterStatus: React.FC = () => {
  const {
    connected,
    error,
    settings,
    queueLength,
    currentJob,
    isPrinting,
    connectPrinter,
    disconnectPrinter,
    printTestPage,
    openCashDrawer,
    cutPaper
  } = usePrinter();

  return (
    <div className="printer-status-card card">
      <div className="status-header">
        <h2>Printer Connection Status</h2>
        <div className={`status-indicator ${connected ? "connected" : "disconnected"}`}>
          <span className="pulse-dot"></span>
          {connected ? "Connected" : "Offline"}
        </div>
      </div>

      {/* Error alert box */}
      {!connected && error && (
        <div className="status-error-alert">
          <svg className="alert-icon" viewBox="0 0 24 24" width="20" height="20">
            <path
              fill="currentColor"
              d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z"
            />
          </svg>
          <div className="alert-content">
            <div className="alert-title">Connection Error</div>
            <div className="alert-msg">{error}</div>
          </div>
        </div>
      )}

      {/* Active Job Alert */}
      {currentJob && (
        <div className="active-job-alert">
          <span className="spinner spinner-sm"></span>
          <span>Printing: <strong>{currentJob}</strong></span>
        </div>
      )}

      {/* Profile Details */}
      <div className="status-details">
        <div className="detail-row">
          <span className="detail-label">Printer Profile Name:</span>
          <span className="detail-value">{settings?.name || "N/A"}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Hardware Type:</span>
          <span className="detail-value">{settings?.type || "N/A"}</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Connection Profile:</span>
          <span className="detail-value capitalize">
            {settings?.interfaceType === "tcp"
              ? `TCP/IP (${settings.ip}:${settings.port})`
              : settings?.interfaceType === "serial"
              ? `Serial Interface (${settings.devicePath})`
              : settings?.interfaceType === "system"
              ? `System OS Driver (${settings.driverName})`
              : "Not Configured"}
          </span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Paper Specification:</span>
          <span className="detail-value">{settings?.width || "N/A"} width</span>
        </div>
        <div className="detail-row">
          <span className="detail-label">Active Print Queue:</span>
          <span className="detail-value">
            {queueLength > 0 ? `${queueLength} pending job(s)` : "Idle / Empty"}
          </span>
        </div>
      </div>

      {/* Action Buttons Deck */}
      <div className="status-actions-deck">
        <div className="action-row-split">
          {connected ? (
            <button
              type="button"
              className="btn btn-secondary btn-full-width"
              onClick={disconnectPrinter}
              disabled={isPrinting}
            >
              Disconnect
            </button>
          ) : (
            <button
              type="button"
              className="btn btn-primary btn-full-width"
              onClick={connectPrinter}
              disabled={isPrinting}
            >
              Connect
            </button>
          )}
          <button
            type="button"
            className="btn btn-primary btn-full-width"
            onClick={printTestPage}
            disabled={isPrinting || !connected}
          >
            Print Test Page
          </button>
        </div>

        <div className="action-row-split gap-sm">
          <button
            type="button"
            className="btn btn-outline btn-sm btn-full-width"
            onClick={openCashDrawer}
            disabled={isPrinting || !connected}
            title="Kicks the cash drawer standard drawer pin pulse"
          >
            💰 Open Cash Drawer
          </button>
          <button
            type="button"
            className="btn btn-outline btn-sm btn-full-width"
            onClick={cutPaper}
            disabled={isPrinting || !connected}
            title="Triggers physical blade cut command"
          >
            ✂️ Manual Paper Cut
          </button>
        </div>
      </div>
    </div>
  );
};
