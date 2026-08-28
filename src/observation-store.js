const fs = require('fs');
const path = require('path');

class ObservationStore {
  constructor(file = path.join(process.cwd(), 'data', 'observations.jsonl')) {
    this.file = file;
    fs.mkdirSync(path.dirname(file), { recursive: true });
  }

  append(event) {
    const record = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      timestamp: new Date().toISOString(),
      ...event
    };
    fs.appendFileSync(this.file, JSON.stringify(record) + '\n', 'utf8');
    return record;
  }
}

module.exports = { ObservationStore };
