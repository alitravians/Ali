import express from 'express';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import { fileURLToPath } from 'url';

const app = express();
const PORT = 3001;

app.use(cors());

app.use(bodyParser.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, 'src', 'db', 'database.json');

const ensureDbFile = () => {
  const dbDir = path.join(__dirname, 'src', 'db');
  
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  
  if (!fs.existsSync(DB_FILE)) {
    fs.writeFileSync(DB_FILE, JSON.stringify({ 
      gameStatus: { isOpen: true, closureReason: '' },
      announcements: [],
      updates: []
    }));
  }
};

ensureDbFile();

const readData = () => {
  try {
    const data = fs.readFileSync(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database file:', error);
    return { 
      gameStatus: { isOpen: true, closureReason: '' },
      announcements: [],
      updates: []
    };
  }
};

const writeData = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing to database file:', error);
    return false;
  }
};

app.get('/api/gameStatus', (req, res) => {
  const data = readData();
  res.json(data.gameStatus);
});

app.post('/api/gameStatus', (req, res) => {
  const { isOpen, closureReason, lastUpdated } = req.body;
  const data = readData();
  
  data.gameStatus = { isOpen, closureReason, lastUpdated };
  
  if (writeData(data)) {
    res.status(200).json({ success: true });
  } else {
    res.status(500).json({ success: false, error: 'Failed to update game status' });
  }
});

app.get('/api/announcements', (req, res) => {
  const data = readData();
  res.json(data.announcements || []);
});

app.post('/api/announcements', (req, res) => {
  const announcements = req.body;
  const data = readData();
  
  data.announcements = announcements;
  
  if (writeData(data)) {
    res.status(200).json({ success: true });
  } else {
    res.status(500).json({ success: false, error: 'Failed to update announcements' });
  }
});

app.get('/api/updates', (req, res) => {
  const data = readData();
  res.json(data.updates || []);
});

app.post('/api/updates', (req, res) => {
  const updates = req.body;
  const data = readData();
  
  data.updates = updates;
  
  if (writeData(data)) {
    res.status(200).json({ success: true });
  } else {
    res.status(500).json({ success: false, error: 'Failed to update updates' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
