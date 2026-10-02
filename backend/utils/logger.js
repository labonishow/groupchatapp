const fs = require("fs");
const path = require("path");

const logDir = path.join(__dirname, "..", "logs");
const logFile = path.join(logDir, "archive.log");

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

function logToFile(message) {
    const timestamp = new Date().toISOString();
    const line = `[${timestamp}] ${message}\n`;

    fs.appendFile(logFile, line, (error) => {
        if (error) {
            console.error("Failed to write to log file:", error.message);
        }
    });

    console.log(message);
}

module.exports = { logToFile };