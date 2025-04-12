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
    const dbPath = path.join(__dirname, 'src/db/database.json');
    if (fs.existsSync(dbPath)) {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      res.json(data.gameStatus || { isOpen: true, closureReason: '', lastUpdated: Date.now() });
    } else {
      if (ensureDatabaseExists()) {
        const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
        res.json(data.gameStatus);
      } else {
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
    const dbPath = path.join(__dirname, 'src/db/database.json');
    
    if (typeof isOpen !== 'boolean') {
      return res.status(400).json({ error: 'isOpen must be a boolean' });
    }
    
    ensureDatabaseExists();
    
    let data = {};
    if (fs.existsSync(dbPath)) {
      data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    }
    
    data.gameStatus = {
      isOpen,
      closureReason: isOpen ? '' : (closureReason || ''),
      lastUpdated: Date.now()
    };
    
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    
    console.log(`Game status updated: isOpen=${isOpen}, reason=${closureReason || 'none'}`);
    res.json(data.gameStatus);
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
