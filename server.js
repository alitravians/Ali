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

app.get('/api/gameStatus', (req, res) => {
  try {
    const dbPath = path.join(__dirname, 'src/db/database.json');
    if (fs.existsSync(dbPath)) {
      const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
      res.json(data.gameStatus || { isOpen: true, closureReason: '' });
    } else {
      res.json({ isOpen: true, closureReason: '' });
    }
  } catch (error) {
    console.error('Error reading game status:', error);
    res.json({ isOpen: true, closureReason: '' });
  }
});

app.use(express.static(path.join(__dirname, 'dist')));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
