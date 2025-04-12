import express from 'express';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import bodyParser from 'body-parser';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());

app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'dist')));

const dbFilePath = path.join(__dirname, 'src', 'db', 'database.json');

if (!fs.existsSync(path.dirname(dbFilePath))) {
  fs.mkdirSync(path.dirname(dbFilePath), { recursive: true });
}

if (!fs.existsSync(dbFilePath)) {
  const initialData = {
    gameStatus: {
      isOpen: true,
      closureReason: "",
      lastUpdated: Date.now()
    }
  };
  fs.writeFileSync(dbFilePath, JSON.stringify(initialData, null, 2));
}

app.get('/api/gameStatus', (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
    res.json(data.gameStatus);
  } catch (error) {
    console.error('Error reading database:', error);
    res.status(500).json({ error: 'Failed to read game status' });
  }
});

app.post('/api/gameStatus', (req, res) => {
  try {
    const { isOpen, closureReason, lastUpdated } = req.body;
    
    const data = JSON.parse(fs.readFileSync(dbFilePath, 'utf8'));
    
    data.gameStatus = {
      isOpen,
      closureReason,
      lastUpdated
    };
    
    fs.writeFileSync(dbFilePath, JSON.stringify(data, null, 2));
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error updating database:', error);
    res.status(500).json({ error: 'Failed to update game status' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
