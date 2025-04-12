import express from 'express';
import bodyParser from 'body-parser';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DB_PATH = path.join(__dirname, 'src', 'db', 'database.json');

app.use(cors());
app.use(bodyParser.json());

const dbDir = path.dirname(DB_PATH);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`Created database directory: ${dbDir}`);
}

if (!fs.existsSync(DB_PATH)) {
  const initialData = {
    gameStatus: {
      isOpen: true,
      closureReason: '',
      lastUpdated: Date.now()
    },
    announcements: [],
    updates: []
  };
  
  fs.writeFileSync(DB_PATH, JSON.stringify(initialData, null, 2));
  console.log(`Initialized database at: ${DB_PATH}`);
}

const readDatabase = () => {
  try {
    const data = fs.readFileSync(DB_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading database:', error);
    return null;
  }
};

const writeDatabase = (data) => {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error writing to database:', error);
    return false;
  }
};

app.get('/api/gameStatus', (req, res) => {
  console.log('GET /api/gameStatus - Fetching game status');
  const data = readDatabase();
  
  if (data && data.gameStatus) {
    console.log('Returning game status:', data.gameStatus.isOpen ? 'Open' : 'Closed');
    return res.json(data.gameStatus);
  }
  
  console.error('Game status not found in database');
  return res.status(404).json({ error: 'Game status not found' });
});

app.post('/api/gameStatus', (req, res) => {
  console.log('POST /api/gameStatus - Updating game status');
  const { isOpen, closureReason, lastUpdated } = req.body;
  
  if (typeof isOpen !== 'boolean') {
    console.error('Invalid game status update request - isOpen must be a boolean');
    return res.status(400).json({ error: 'isOpen must be a boolean' });
  }
  
  const data = readDatabase();
  if (!data) {
    console.error('Failed to read database for game status update');
    return res.status(500).json({ error: 'Failed to read database' });
  }
  
  data.gameStatus = {
    isOpen,
    closureReason: closureReason || '',
    lastUpdated: lastUpdated || Date.now()
  };
  
  console.log('Updating game status to:', isOpen ? 'Open' : 'Closed');
  
  if (writeDatabase(data)) {
    console.log('Game status updated successfully');
    return res.json({ success: true, gameStatus: data.gameStatus });
  }
  
  console.error('Failed to write updated game status to database');
  return res.status(500).json({ error: 'Failed to update game status' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Database path: ${DB_PATH}`);
});
