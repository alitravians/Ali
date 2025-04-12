import express from 'express';
import path from 'path';
import fs from 'fs';
import cors from 'cors';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());

app.use(express.json());

const ensureDatabaseExists = () => {
  const dbDir = path.join(__dirname, 'src/db');
  const dbPath = path.join(dbDir, 'database.json');
  
  try {
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
      console.log('Created database directory');
    }
    
    if (!fs.existsSync(dbPath)) {
      const defaultData = {
        gameStatus: {
          isOpen: true,
          closureReason: '',
          lastUpdated: Date.now()
        },
        announcements: [],
        updates: []
      };
      
      fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2), 'utf8');
      console.log('Created database file with default structure');
    }
    
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    if (!data.gameStatus) {
      data.gameStatus = {
        isOpen: true,
        closureReason: '',
        lastUpdated: Date.now()
      };
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
      console.log('Added missing gameStatus to database');
    }
    
    return true;
  } catch (error) {
    console.error('Error ensuring database exists:', error);
    return false;
  }
};

ensureDatabaseExists();

app.get('/api/gameStatus', (req, res) => {
  try {
    console.log('GET /api/gameStatus - Retrieving game status');
    const dbPath = path.join(__dirname, 'src/db/database.json');
    if (fs.existsSync(dbPath)) {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      console.log('Game status retrieved:', data.gameStatus);
      res.json(data.gameStatus || { isOpen: true, closureReason: '', lastUpdated: Date.now() });
    } else {
      console.warn('Database file not found, creating with default values');
      if (ensureDatabaseExists()) {
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        console.log('Game status created and retrieved:', data.gameStatus);
        res.json(data.gameStatus);
      } else {
        console.error('Failed to create database, returning default values');
        res.json({ isOpen: true, closureReason: '', lastUpdated: Date.now() });
      }
    }
  } catch (error) {
    console.error('Error reading game status:', error);
    res.json({ isOpen: true, closureReason: '', lastUpdated: Date.now() });
  }
});

app.post('/api/gameStatus', (req, res) => {
  try {
    const { isOpen, closureReason } = req.body;
    console.log(`POST /api/gameStatus - Updating game status: isOpen=${isOpen}, reason=${closureReason || 'none'}`);
    
    const dbPath = path.join(__dirname, 'src/db/database.json');
    
    if (typeof isOpen !== 'boolean') {
      console.error('Invalid request: isOpen must be a boolean, received:', typeof isOpen);
      return res.status(400).json({ error: 'isOpen must be a boolean' });
    }
    
    if (!ensureDatabaseExists()) {
      console.error('Failed to ensure database exists');
      return res.status(500).json({ error: 'Failed to ensure database exists' });
    }
    
    let data = {};
    if (fs.existsSync(dbPath)) {
      try {
        const fileContent = fs.readFileSync(dbPath, 'utf8');
        data = JSON.parse(fileContent);
        console.log('Current database content loaded successfully');
      } catch (readError) {
        console.error('Error reading database file:', readError);
        data = {}; // Reset to empty object if file is corrupted
      }
    }
    
    const updatedStatus = {
      isOpen,
      closureReason: isOpen ? '' : (closureReason || ''),
      lastUpdated: Date.now()
    };
    
    data.gameStatus = updatedStatus;
    
    try {
      fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
      console.log('Game status updated successfully:', updatedStatus);
      res.json(updatedStatus);
    } catch (writeError) {
      console.error('Error writing to database file:', writeError);
      res.status(500).json({ error: 'Failed to write updated game status' });
    }
  } catch (error) {
    console.error('Error updating game status:', error);
    res.status(500).json({ error: 'Failed to update game status' });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
  console.log(`API available at http://localhost:${port}/api/gameStatus`);
});
