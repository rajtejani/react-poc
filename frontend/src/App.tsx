import { useState } from "react";
import { PrinterProvider, usePrinter } from "./context/PrinterContext";
import { Dashboard } from "./pages/Dashboard";
import { PrinterSettings } from "./components/PrinterSettings";
import { ReceiptBuilder } from "./components/ReceiptBuilder";
import { PrintHistory } from "./components/PrintHistory";
import "./App.css";

function AppContent() {
  const [activeTab, setActiveTab] = useState<"dashboard" | "setup" | "builder" | "logs">("dashboard");
  const { connected, error, notifications, dismissNotification, wsServerConnected } = usePrinter();

  return (
    <div className="app-layout-wrapper">
      {/* Toast Notification Deck */}
      <div className="toast-container">
        {notifications.map((n) => (
          <div key={n.id} className={`toast-card toast-${n.type} animated-slide-in`}>
            <div className="toast-content">
              {n.type === "success" && <span className="toast-icon">✓</span>}
              {n.type === "error" && <span className="toast-icon">✕</span>}
              {n.type === "info" && <span className="toast-icon">ℹ</span>}
              <span className="toast-message">{n.message}</span>
            </div>
            <button
              type="button"
              className="toast-close-btn"
              onClick={() => dismissNotification(n.id)}
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      {/* Left Sidebar Navigation */}
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon-wrapper">🖨️</div>
          <div className="brand-meta">
            <span className="brand-name">Offline Hub</span>
            <span className="brand-tagline">Primary Device</span>
          </div>
        </div>

        <div className="sidebar-server-status">
          <div className="status-indicator-badge">
            <span className="server-label">Server Status</span>
            {wsServerConnected ? (
              <span className="badge-online">● Online</span>
            ) : (
              <span className="badge-server-offline">● Offline</span>
            )}
          </div>
          <div className="server-ip">127.0.0.1:5000</div>
        </div>

        <nav className="sidebar-menu">
          <button
            type="button"
            className={`menu-item-btn ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            <span className="menu-icon">📊</span> Dashboard
          </button>
          
          <button
            type="button"
            className={`menu-item-btn ${activeTab === "setup" ? "active" : ""}`}
            onClick={() => setActiveTab("setup")}
          >
            <span className="menu-icon">🖨️</span> Printer Setup
          </button>

          <button
            type="button"
            className={`menu-item-btn ${activeTab === "builder" ? "active" : ""}`}
            onClick={() => setActiveTab("builder")}
          >
            <span className="menu-icon">🧾</span> Print Station
          </button>

          <button
            type="button"
            className={`menu-item-btn ${activeTab === "logs" ? "active" : ""}`}
            onClick={() => setActiveTab("logs")}
          >
            <span className="menu-icon">📋</span> Event Log
          </button>
        </nav>

        <div className="sidebar-footer">
          <span className="footer-version">v1.0.0 POC</span>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="app-main-viewport">
        {/* Top Header Bar */}
        <header className="viewport-header">
          <div className="header-breadcrumbs">
            <span className="breadcrumb-parent">Printers</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current capitalize">{activeTab}</span>
          </div>

          <div className="header-actions">
            {!wsServerConnected ? (
              <div className="status-pill pill-server-down">
                <span className="pill-dot"></span>
                Server Unreachable
              </div>
            ) : connected ? (
              <div className="status-pill pill-connected">
                <span className="pill-dot"></span>
                Printer Connected
              </div>
            ) : (
              <div className="status-pill pill-disconnected">
                <span className="pill-dot"></span>
                {error ? "Printer Offline" : "Printer Offline"}
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Inner Tab Router */}
        <div className="viewport-content">
          {activeTab === "dashboard" && <Dashboard />}
          {activeTab === "setup" && <PrinterSettings />}
          {activeTab === "builder" && <ReceiptBuilder />}
          {activeTab === "logs" && <PrintHistory />}
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <PrinterProvider>
      <AppContent />
    </PrinterProvider>
  );
}

export default App;


