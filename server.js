import dotenv from 'dotenv';
import { startServer } from './app.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

startServer(PORT);