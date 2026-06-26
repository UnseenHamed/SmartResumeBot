import express from 'express';
import * as path from 'path';
import cookieParser from 'cookie-parser';
import { adminRouter } from './routes/admin.routes';
import { config } from '../config';

export const app = express();

// View engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/admin', adminRouter);

// Root redirect
app.get('/', (req, res) => {
  res.redirect('/admin');
});

// Start function
export function startServer() {
  app.listen(config.PORT, () => {
    console.log(`🚀 Admin Panel is running on http://localhost:${config.PORT}/admin`);
  });
}
