const logHistory = [];
const MAX_LOGS = 100;
let logListener = null;

function addLog(level, message) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    level,
    message
  };

  // Add to console
  const consoleMsg = `[${logEntry.timestamp}] [${level}] ${message}`;
  if (level === "ERROR") {
    console.error(consoleMsg);
  } else if (level === "WARN") {
    console.warn(consoleMsg);
  } else {
    console.log(consoleMsg);
  }

  // Store in memory
  logHistory.push(logEntry);
  if (logHistory.length > MAX_LOGS) {
    logHistory.shift();
  }

  // Notify listener (WebSocket broadcast)
  if (logListener) {
    logListener(logEntry);
  }
}

const logger = {
  info: (msg) => addLog("INFO", msg),
  warn: (msg) => addLog("WARN", msg),
  error: (msg) => addLog("ERROR", msg),
  debug: (msg) => addLog("DEBUG", msg),
  
  getLogs: () => [...logHistory],
  
  clearLogs: () => {
    logHistory.length = 0;
    addLog("INFO", "Log history cleared.");
  },
  
  setListener: (callback) => {
    logListener = callback;
  }
};

module.exports = logger;
