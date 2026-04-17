import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// MongoDB Setup
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://bhairocky221:Aravind21081999@agenticai.zum19he.mongodb.net/NetraArogya/";

// Define History Schema
const historySchema = new mongoose.Schema({
  timestamp: { type: Number, default: () => Date.now() },
  type: { type: String, required: true }, // 'scan' or 'search'
  query: String,
  image: String,
  result: {
    name: { type: String, default: "" },
    composition: { type: String, default: "" },
    purpose: { type: String, default: "" },
    howItWorks: { type: String, default: "" },
    componentRoles: { type: String, default: "" },
    diseases: { type: [String], default: [] },
    symptoms: { type: [String], default: [] },
    extraUseCases: { type: [String], default: [] },
    dosageInfo: { type: String, default: "" },
    warnings: { type: String, default: "" },
    sideEffects: { type: String, default: "" },
    simpleUnderstanding: { type: String, default: "" }
  },
  language: { type: String, required: true }
}, {
  toJSON: {
    transform: (doc, ret: any) => {
      ret.id = ret._id.toString();
      delete ret._id;
      delete ret.__v;
    }
  }
});

const History = mongoose.model('History', historySchema);

async function connectDB() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB successfully');
  } catch (err) {
    console.error('MongoDB connection error:', err);
  }
}

connectDB();

// API Routes
app.get('/api/history', async (req, res) => {
  try {
    const history = await History.find().sort({ timestamp: -1 }).limit(50);
    res.json(history);
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: 'Failed to fetch history' });
  }
});

app.post('/api/history', async (req, res) => {
  try {
    console.log('Saving to history:', req.body.type);
    const historyItem = new History(req.body);
    const savedItem = await historyItem.save();
    res.status(201).json(savedItem);
  } catch (err) {
    console.error('Error saving history:', err);
    res.status(500).json({ error: 'Failed to save history' });
  }
});

app.delete('/api/history', async (req, res) => {
  try {
    await History.deleteMany({});
    res.json({ message: 'History cleared' });
  } catch (err) {
    console.error('Error clearing history:', err);
    res.status(500).json({ error: 'Failed to clear history' });
  }
});

app.get('/api/health', async (req, res) => {
  let mongoStatus = 'unknown';
  try {
    mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  } catch (e) {
    mongoStatus = 'error';
  }
  
  res.json({
    status: 'ok',
    mongodb: mongoStatus,
    database: mongoose.connection.name,
    collection: 'histories' // Default collection name for model 'History'
  });
});

// Vite Integration
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware integrated');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
