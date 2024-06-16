const winston = require('winston');
const { combine, timestamp, printf } = winston.format;
const fs = require('fs');
const path = require('path');

const logDirectory = path.join(__dirname, 'logs');
fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

const logFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${message}`;
});

function getCurrentTimestamp() {
  const date = new Date();
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}-${date.getMinutes().toString().padStart(2, '0')}-${date.getSeconds().toString().padStart(2, '0')}`;
}

const logger = winston.createLogger({
  level: 'info', 
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    logFormat
  ),
  transports: [
    new winston.transports.File({ filename: path.join(logDirectory, `app-${getCurrentTimestamp()}.log`) })
  ]
});

module.exports = logger;
