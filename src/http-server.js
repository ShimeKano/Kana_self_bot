const express = require('express');
const { start: monitorStart, stop: monitorStop, status: monitorStatus } = require('./monitor');
const config = require('../config');

const app = express();
app.use(express.json());

// Trang chủ - kiểm tra trạng thái
app.get('/', (req, res) => {
  res.json({
    service: 'Discord TLT Controller',
    status: 'online',
    monitor: monitorStatus(),
    endpoints: {
      GET: ['/', '/status'],
      POST: ['/start', '/stop']
    }
  });
});

// Lấy trạng thái
app.get('/status', (req, res) => {
  res.json(monitorStatus());
});

// Bắt đầu
app.post('/start', (req, res) => {
  const result = monitorStart();
  res.json(result);
});

// Dừng
app.post('/stop', (req, res) => {
  const result = monitorStop();
  res.json(result);
});

function startServer() {
  app.listen(config.server.port, () => {
    console.log(`[HTTP Server] 🚀 Đang chạy tại http://localhost:${config.server.port}`);
    console.log(`[HTTP Server]    GET  http://localhost:${config.server.port}/status`);
    console.log(`[HTTP Server]   POST  http://localhost:${config.server.port}/start`);
    console.log(`[HTTP Server]   POST  http://localhost:${config.server.port}/stop`);
  });
}

module.exports = { startServer };
