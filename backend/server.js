require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

if (!process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET missing in backend/.env');
  process.exit(1);
}

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth'));
app.get('/api/health', (req, res) => res.json({ ok: true }));

app.use(express.static(path.join(__dirname, '..', 'frontend')));
app.use('/api', (req, res) => res.status(404).json({ message: 'Route not found' }));

connectDB().then(() => {
  const port = process.env.PORT || 5000;
  app.listen(port, () => console.log('SkillSwap running on http://localhost:' + port));
});
