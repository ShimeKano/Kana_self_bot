const express = require('express');
const config = require('../config');

const app = express();
app.use(express.json());

let runtime = null;

app.get('/', (req, res) => {
  res.json({ service: 'Kana Automation Core', status: 'online', endpoints: ['GET /status', 'POST /start', 'POST /stop', 'POST /tasks/:id'] });
});

app.get('/status', (req, res) => {
  if (!runtime) return res.status(503).json({ error: 'runtime not initialized' });
  res.json({ tasks: runtime.scheduler.status(), tlt: runtime.tlt.status() });
});

app.post('/start', (req, res) => {
  if (!runtime) return res.status(503).json({ error: 'runtime not initialized' });
  runtime.scheduler.start();
  res.json({ ok: true, tasks: runtime.scheduler.status() });
});

app.post('/stop', (req, res) => {
  if (!runtime) return res.status(503).json({ error: 'runtime not initialized' });
  runtime.scheduler.stop();
  res.json({ ok: true });
});

app.post('/tasks/:id', (req, res) => {
  if (!runtime) return res.status(503).json({ error: 'runtime not initialized' });
  const enabled = Boolean(req.body?.enabled);
  const ok = runtime.scheduler.setEnabled(req.params.id, enabled);
  if (!ok) return res.status(404).json({ ok: false, error: 'unknown task' });
  res.json({ ok: true, task: runtime.scheduler.status().find(task => task.id === req.params.id) });
});

function startServer(nextRuntime) {
  runtime = nextRuntime;
  app.listen(config.server.port, () => {
    console.log(`[HTTP Server] 🚀 http://localhost:${config.server.port}`);
  });
}

module.exports = { startServer };
