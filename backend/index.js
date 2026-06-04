require('dotenv').config();
const express = require('express');
const cors    = require('cors');

const authRoutes  = require('./src/routes/auth');
const todosRoutes = require('./src/routes/todos');
const usersRoutes = require('./src/routes/users');

const app  = express();
const PORT = process.env.PORT || 3000;

const allowedOrigins = [
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:3000',
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
];
app.use(cors({
  origin: (origin, cb) => cb(null, !origin || allowedOrigins.includes(origin)),
  credentials: true,
}));
app.use(express.json());
app.use((req, _res, next) => { console.log(`${req.method} ${req.path}`); next(); });

app.use('/api/auth',  authRoutes);
app.use('/api/todos', todosRoutes);
app.use('/api/users', usersRoutes);

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
