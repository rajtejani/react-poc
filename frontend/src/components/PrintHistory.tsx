import React from "react";
import { usePrinter } from "../context/PrinterContext";

export const PrintHistory: React.FC = () => {
  const { logs, clearLogs } = usePrinter();

  // Helper to format timestamps to local clock time
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("en-IN", { hour12: false });
    } catch {
      return "00:00:00";
    }
  };

  return (
    <div className="print-history-card card">
      <div className="history-header">
        <div className="header-title-row">
          <h2>Printer Logs & Activity</h2>
          <span className="log-count-badge">{logs.length} logs</span>
        </div>
        <button
          type="button"
          className="btn btn-danger btn-xs"
          onClick={clearLogs}
          disabled={logs.length === 0}
        >
          Clear Logs
        </button>
      </div>

      <div className="terminal-console">
        <div className="terminal-scroll-container">
          {logs.length === 0 ? (
            <div className="terminal-empty-msg">
              No printer events recorded. Performing connection updates or printing receipts will stream logs here in real-time.
            </div>
          ) : (
            logs.map((log, index) => {
              const levelClass = `log-level-${log.level.toLowerCase()}`;
              return (
                <div key={index} className="terminal-line">
                  <span className="terminal-time">[{formatTime(log.timestamp)}]</span>
                  <span className={`terminal-level ${levelClass}`}>{log.level}</span>
                  <span className="terminal-message">{log.message}</span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
