import { Router } from 'express';
import { config } from '../../config';
import { PrismaClient } from '@prisma/client';

export const adminRouter = Router();
const prisma = new PrismaClient();

// Auth Middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (req.cookies.auth === config.ADMIN_SECRET) {
    next();
  } else {
    res.redirect('/admin/login');
  }
};

// Login GET
adminRouter.get('/login', (req, res) => {
  if (req.cookies.auth === config.ADMIN_SECRET) {
    return res.redirect('/admin');
  }
  res.render('login', { error: null });
});

// Login POST
adminRouter.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === config.ADMIN_SECRET) {
    res.cookie('auth', password, { httpOnly: true, maxAge: 24 * 60 * 60 * 1000 }); // 24 hours
    res.redirect('/admin');
  } else {
    res.render('login', { error: 'پسورد وارد شده اشتباه است.' });
  }
});

// Logout
adminRouter.get('/logout', (req, res) => {
  res.clearCookie('auth');
  res.redirect('/admin/login');
});

// Dashboard
adminRouter.get('/', requireAuth, async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const totalResumes = await prisma.resume.count();
    const recentResumes = await prisma.resume.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    });

    res.render('dashboard', { totalUsers, totalResumes, recentResumes, path: '/' });
  } catch (error) {
    res.status(500).send('Database Error');
  }
});

// Users List
adminRouter.get('/users', requireAuth, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { resumes: true } } }
    });
    res.render('users', { users, path: '/users' });
  } catch (error) {
    res.status(500).send('Database Error');
  }
});

// Resumes List
adminRouter.get('/resumes', requireAuth, async (req, res) => {
  try {
    const resumes = await prisma.resume.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: true }
    });
    res.render('resumes', { resumes, path: '/resumes' });
  } catch (error) {
    res.status(500).send('Database Error');
  }
});
